// ============================================================
// ЗАЯВКИ ОТ ОТДЕЛЕНИЙ
// Обновлённая версия: сохранение на сервер через API
// ============================================================

// Палитра для отделений
const DEPT_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

function getDeptColorIndex(dept) {
    if (!dept) return -1;
    const list = state.settings.depts || [];
    const idx = list.indexOf(dept);
    return idx >= 0 ? idx : -1;
}

function getDeptColor(dept) {
    const idx = getDeptColorIndex(dept);
    if (idx < 0) return '#94a3b8';
    return DEPT_COLORS[idx % DEPT_COLORS.length];
}

function getDeptColorClass(dept) {
    const idx = getDeptColorIndex(dept);
    if (idx < 0 || idx >= 10) return 'dept-other';
    return 'dept-' + idx;
}

// ============================================================
// ФИЛЬТР ПО ОТДЕЛЕНИЮ — ЗАПОЛНЕНИЕ
// ============================================================
function populateRequestDeptFilter() {
    const sel = document.getElementById('requestFilterDept');
    if (!sel) return;

    const list = state.settings.depts || [];
    sel.innerHTML = '<option value="">Все отделения</option>' +
        list.map(d => '<option value="' + d + '">' + d + '</option>').join('');
}

// ============================================================
// КЛИК ПО ЗНАЧКУ 📨 — ОТКРЫТЬ ВКЛАДКУ С ФИЛЬТРОМ «НОВЫЕ»
// ============================================================
function onRequestsBadgeClick() {
    const tab = document.querySelector('.tab[data-tab="requests"]');
    if (tab) tab.click();

    const statusEl = document.getElementById('requestFilterStatus');
    if (statusEl) statusEl.value = 'new';

    const deptEl = document.getElementById('requestFilterDept');
    if (deptEl) deptEl.value = '';

    renderRequests();
}

// ============================================================
// АВТОДОПОЛНЕНИЕ ВРАЧА-НАПРАВИТЕЛЯ
// ============================================================
function onRefDoctorInput() {
    const input = document.getElementById('reqReferringDoctor');
    const listEl = document.getElementById('reqReferringDoctorAutocomplete');
    if (!input || !listEl) return;

    const v = input.value.trim().toLowerCase();
    if (v.length < 2) { listEl.classList.remove('show'); return; }

    const all = state.settings.referringDoctors || [];
    const m = all.filter(name => name.toLowerCase().includes(v));

    m.sort((a, b) =>
        (a.toLowerCase().startsWith(v) ? 0 : 1) - (b.toLowerCase().startsWith(v) ? 0 : 1)
    );

    if (!m.length) { listEl.classList.remove('show'); return; }

    listEl.innerHTML = m.slice(0, 10).map(x => {
        const i = x.toLowerCase().indexOf(v);
        const h = i >= 0
            ? x.slice(0, i) + '<span class="autocomplete-highlight">' + x.slice(i, i + v.length) + '</span>' + x.slice(i + v.length)
            : x;
        return '<div class="autocomplete-item" onclick="selectRefDoctor(\'' + x.replace(/'/g, "\\'") + '\')"><div class="autocomplete-name">' + h + '</div></div>';
    }).join('');
    listEl.classList.add('show');
}

function selectRefDoctor(name) {
    const el = document.getElementById('reqReferringDoctor');
    if (el) el.value = name;
    const listEl = document.getElementById('reqReferringDoctorAutocomplete');
    if (listEl) listEl.classList.remove('show');
    const errEl = document.getElementById('reqReferringDoctorError');
    if (errEl) errEl.classList.remove('show');
}

function onRefDoctorBlur() {
    setTimeout(() => {
        const listEl = document.getElementById('reqReferringDoctorAutocomplete');
        if (listEl) listEl.classList.remove('show');
    }, 200);
}

document.addEventListener('click', e => {
    const listEl = document.getElementById('reqReferringDoctorAutocomplete');
    const inputEl = document.getElementById('reqReferringDoctor');
    if (!listEl || !inputEl) return;
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) {
        listEl.classList.remove('show');
    }
});

// ============================================================
// ОБРАБОТЧИКИ МКБ В ЗАЯВКЕ
// ============================================================
function onReqIcdInput(el) {
    const v = el.value.trim();
    if (!v) { state.selectedRequestICD = null; return; }

    const parsed = parseIcdString(v);
    if (parsed && parsed.code) {
        const found = findIcdByCode(parsed.code);
        if (found) state.selectedRequestICD = { code: found.code, name: found.name };
        else state.selectedRequestICD = { code: parsed.code, name: parsed.name };
    }
}

function onReqIcdBlur(el) {
    const v = el.value.trim();
    if (!v) { state.selectedRequestICD = null; return; }

    const parsed = parseIcdString(v);
    if (!parsed) return;

    const code = parsed.code;
    const typedName = parsed.name;

    if (!code) {
        const foundByName = getAllICD().find(i => i.name.toLowerCase() === typedName.toLowerCase());
        if (foundByName) {
            state.selectedRequestICD = { code: foundByName.code, name: foundByName.name };
            el.value = foundByName.code + ' — ' + foundByName.name;
        } else {
            state.selectedRequestICD = { code: '', name: typedName };
        }
        return;
    }

    const found = findIcdByCode(code);
    if (found) {
        state.selectedRequestICD = { code: found.code, name: found.name };
        el.value = found.code + ' — ' + found.name;
        return;
    }

    state.selectedRequestICD = { code: code, name: typedName };
    window._icdMode = 'request';
    openAddIcdModal(code, typedName);
}

function onReqIcdPaste(e, el) {
    setTimeout(() => {
        const v = el.value.trim();
        if (!v) return;
        const parsed = parseIcdString(v);
        if (parsed && parsed.code) {
            const found = findIcdByCode(parsed.code);
            if (found) {
                state.selectedRequestICD = { code: found.code, name: found.name };
                el.value = found.code + ' — ' + found.name;
            } else {
                state.selectedRequestICD = { code: parsed.code, name: parsed.name };
                window._icdMode = 'request';
                openAddIcdModal(parsed.code, parsed.name);
            }
        }
    }, 10);
}

// ============================================================
// ОТКРЫТИЕ ФОРМЫ — НОВАЯ ЗАЯВКА
// ============================================================
function openNewRequest() {
    if (currentRole !== 'dept') {
        toast('Создавать заявки может только отделение', 'error');
        return;
    }

    state.editingRequestId = null;
    state.currentRequestZones = { native: [], contrast: [] };
    state.selectedRequestICD = null;

    const titleEl = document.getElementById('requestModalTitle');
    if (titleEl) titleEl.textContent = '📨 Новая заявка на КТ';

    const submitBtn = document.getElementById('requestSubmitBtn');
    if (submitBtn) { submitBtn.textContent = '📨 Отправить заявку'; submitBtn.disabled = false; }

    const fioEl = document.getElementById('reqFio'); if (fioEl) fioEl.value = '';
    const birthEl = document.getElementById('reqBirthDate'); if (birthEl) setDateInput(birthEl, '');
    const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = '';
    const histEl = document.getElementById('reqHistoryNum'); if (histEl) histEl.value = '';
    const deptEl = document.getElementById('reqDeptDisplay'); if (deptEl) deptEl.value = currentDept || '—';
    const admitDateEl = document.getElementById('reqAdmitDate'); if (admitDateEl) setDateInput(admitDateEl, todayISO());
    const admitTimeEl = document.getElementById('reqAdmitTime'); if (admitTimeEl) admitTimeEl.value = nowTime();
    const icdEl = document.getElementById('reqIcdDisplay'); if (icdEl) icdEl.value = '';
    const purposeEl = document.getElementById('reqPurpose'); if (purposeEl) purposeEl.value = '';
    const urgentEl = document.getElementById('reqUrgent'); if (urgentEl) urgentEl.checked = false;

    const refDocEl = document.getElementById('reqReferringDoctor'); if (refDocEl) refDocEl.value = '';
    const refDocAutoEl = document.getElementById('reqReferringDoctorAutocomplete'); if (refDocAutoEl) refDocAutoEl.classList.remove('show');
    const refDocErrEl = document.getElementById('reqReferringDoctorError'); if (refDocErrEl) refDocErrEl.classList.remove('show');

    const deptSpanEl = document.getElementById('reqDeptDisplaySpan');
    if (deptSpanEl) deptSpanEl.textContent = currentDept || '—';

    const fioAutoEl = document.getElementById('reqFioAutocomplete'); if (fioAutoEl) fioAutoEl.classList.remove('show');
    const fioErrEl = document.getElementById('reqFioError'); if (fioErrEl) fioErrEl.classList.remove('show');
    const birthErrEl = document.getElementById('reqBirthDateError'); if (birthErrEl) birthErrEl.classList.remove('show');
    const purposeErrEl = document.getElementById('reqPurposeError'); if (purposeErrEl) purposeErrEl.classList.remove('show');

    renderRequestZones('native');
    renderRequestZones('contrast');

    openModal('requestModal');
}

// ============================================================
// ОТКРЫТИЕ ФОРМЫ — РЕДАКТИРОВАНИЕ ЗАЯВКИ
// ============================================================
function openEditRequest(id) {
    if (currentRole !== 'dept') {
        toast('Редактировать заявку может только отделение', 'error');
        return;
    }

    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    if (r.status !== 'new') {
        toast('Редактировать можно только заявки в статусе «Новая»', 'error');
        return;
    }

    if (r.dept !== currentDept) {
        toast('Это не ваша заявка', 'error');
        return;
    }

    state.editingRequestId = id;
    state.currentRequestZones = {
        native: [...(r.zonesNative || [])],
        contrast: [...(r.zonesContrast || [])]
    };
    state.selectedRequestICD = r.icdCode ? { code: r.icdCode, name: r.icdName } : null;

    const titleEl = document.getElementById('requestModalTitle');
    if (titleEl) titleEl.textContent = '✏️ Редактирование заявки';

    const submitBtn = document.getElementById('requestSubmitBtn');
    if (submitBtn) { submitBtn.textContent = '💾 Сохранить изменения'; submitBtn.disabled = false; }

    const fioEl = document.getElementById('reqFio'); if (fioEl) fioEl.value = r.fio || '';
    const birthEl = document.getElementById('reqBirthDate'); if (birthEl) setDateInput(birthEl, r.birthDate || '');
    const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = r.age || '';
    const histEl = document.getElementById('reqHistoryNum'); if (histEl) histEl.value = r.historyNum || '';
    const deptEl = document.getElementById('reqDeptDisplay'); if (deptEl) deptEl.value = r.dept || currentDept || '—';
    const admitDateEl = document.getElementById('reqAdmitDate'); if (admitDateEl) setDateInput(admitDateEl, r.admitDate || todayISO());
    const admitTimeEl = document.getElementById('reqAdmitTime'); if (admitTimeEl) admitTimeEl.value = r.admitTime || nowTime();
    const icdEl = document.getElementById('reqIcdDisplay'); if (icdEl) icdEl.value = r.icdDisplay || '';
    const purposeEl = document.getElementById('reqPurpose'); if (purposeEl) purposeEl.value = r.purpose || '';
    const urgentEl = document.getElementById('reqUrgent'); if (urgentEl) urgentEl.checked = !!r.urgent;

    const refDocEl = document.getElementById('reqReferringDoctor'); if (refDocEl) refDocEl.value = r.referringDoctor || '';
    const refDocAutoEl = document.getElementById('reqReferringDoctorAutocomplete'); if (refDocAutoEl) refDocAutoEl.classList.remove('show');
    const refDocErrEl = document.getElementById('reqReferringDoctorError'); if (refDocErrEl) refDocErrEl.classList.remove('show');

    const deptSpanEl = document.getElementById('reqDeptDisplaySpan');
    if (deptSpanEl) deptSpanEl.textContent = r.dept || currentDept || '—';

    const fioAutoEl = document.getElementById('reqFioAutocomplete'); if (fioAutoEl) fioAutoEl.classList.remove('show');
    const fioErrEl = document.getElementById('reqFioError'); if (fioErrEl) fioErrEl.classList.remove('show');
    const birthErrEl = document.getElementById('reqBirthDateError'); if (birthErrEl) birthErrEl.classList.remove('show');
    const purposeErrEl = document.getElementById('reqPurposeError'); if (purposeErrEl) purposeErrEl.classList.remove('show');

    renderRequestZones('native');
    renderRequestZones('contrast');

    openModal('requestModal');
}

// ============================================================
// АВТОДОПОЛНЕНИЕ ФИО
// ============================================================
function onReqFioInput() {
    const input = document.getElementById('reqFio');
    const listEl = document.getElementById('reqFioAutocomplete');
    if (!input || !listEl) return;

    const cleaned = input.value.replace(/[^а-яА-ЯёЁ\s\-\.]/g, '');
    if (cleaned !== input.value) input.value = cleaned;

    const v = input.value.trim().toLowerCase();
    if (v.length < 2) { listEl.classList.remove('show'); return; }

    const u = new Map();
    state.studies.forEach(s => {
        if (s.fio && !u.has(s.fio)) u.set(s.fio, { fio: s.fio, birthDate: s.birthDate, historyNum: s.historyNum, dept: s.dept });
    });
    state.requests.forEach(r => {
        if (r.fio && !u.has(r.fio)) u.set(r.fio, { fio: r.fio, birthDate: r.birthDate, historyNum: r.historyNum, dept: r.dept });
    });

    const m = [];
    u.forEach((d, f) => { if (f.toLowerCase().includes(v)) m.push(d); });
    m.sort((a, b) => (a.fio.toLowerCase().startsWith(v) ? 0 : 1) - (b.fio.toLowerCase().startsWith(v) ? 0 : 1));

    if (!m.length) { listEl.classList.remove('show'); return; }

    listEl.innerHTML = m.slice(0, 10).map(x => {
        const i = x.fio.toLowerCase().indexOf(v);
        const h = i >= 0 ? x.fio.slice(0, i) + '<span class="autocomplete-highlight">' + x.fio.slice(i, i + v.length) + '</span>' + x.fio.slice(i + v.length) : x.fio;
        const d = [];
        if (x.birthDate) d.push('Д.р.: ' + formatDate(x.birthDate));
        if (x.historyNum) d.push('№ ' + x.historyNum);
        if (x.dept) d.push(x.dept);
        return '<div class="autocomplete-item" onclick="selectReqAutocomplete(\'' + x.fio.replace(/'/g, "\\'") + '\',\'' + (x.birthDate || '') + '\',\'' + (x.historyNum || '') + '\')"><div class="autocomplete-name">' + h + '</div>' + (d.length ? '<div class="autocomplete-details">' + d.join(' • ') + '</div>' : '') + '</div>';
    }).join('');
    listEl.classList.add('show');
}

function selectReqAutocomplete(f, b, h) {
    const fioEl = document.getElementById('reqFio'); if (fioEl) fioEl.value = f;
    if (b) {
        const bEl = document.getElementById('reqBirthDate');
        if (bEl) { setDateInput(bEl, b); const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = calcAgeFromDate(b); }
    }
    if (h) { const hEl = document.getElementById('reqHistoryNum'); if (hEl) hEl.value = h; }
    const listEl = document.getElementById('reqFioAutocomplete'); if (listEl) listEl.classList.remove('show');
}

document.addEventListener('click', e => {
    const listEl = document.getElementById('reqFioAutocomplete');
    const inputEl = document.getElementById('reqFio');
    if (!listEl || !inputEl) return;
    if (!inputEl.contains(e.target) && !listEl.contains(e.target)) listEl.classList.remove('show');
});

function onReqBirthDateInput() {
    const input = document.getElementById('reqBirthDate');
    if (!input) return;
    const iso = handleDateInput(input);
    if (iso) {
        const ageEl = document.getElementById('reqAge');
        if (ageEl) { const age = calcAgeFromDate(iso); ageEl.value = age !== '' ? age : ''; }
    }
}

function onReqBirthDateBlur() {
    const input = document.getElementById('reqBirthDate');
    if (!input) return;
    const iso = normalizeDateInput(input);
    const errEl = document.getElementById('reqBirthDateError');

    if (!iso) {
        if (input.value.trim() === '') {
            const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = '';
            if (errEl) errEl.classList.remove('show');
        }
        return;
    }

    const a = calcAgeFromDate(iso);
    if (a !== '' && (a > 120 || a < 0)) {
        if (errEl) errEl.classList.add('show');
        input.classList.add('invalid');
        const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = '';
        setTimeout(() => errEl && errEl.classList.remove('show'), 3000);
        return;
    }

    if (errEl) errEl.classList.remove('show');
    input.classList.remove('invalid');
    const ageEl = document.getElementById('reqAge'); if (ageEl) ageEl.value = a !== '' ? a : '';
}

function openReqICD() {
    window._icdMode = 'request';
    const searchEl = document.getElementById('icdSearch'); if (searchEl) searchEl.value = '';
    renderICD();
    openModal('icdModal');
    setTimeout(() => { const s = document.getElementById('icdSearch'); if (s) s.focus(); }, 100);
}

function clearReqICD() {
    state.selectedRequestICD = null;
    const el = document.getElementById('reqIcdDisplay'); if (el) el.value = '';
}

function renderRequestZones(type) {
    const c = document.getElementById(type === 'native' ? 'reqNativeZones' : 'reqContrastZones');
    if (!c) return;
    const z = state.currentRequestZones[type];

    c.innerHTML = z.length ?
        z.map((n, i) => '<div class="zone-chip ' + (type === 'contrast' ? 'contrast' : '') + '">' + n + '<span class="remove" onclick="removeRequestZone(\'' + type + '\',' + i + ')">✕</span></div>').join('') :
        '<div class="zone-empty">Зоны не выбраны</div>';

    const cnt = document.getElementById(type === 'native' ? 'reqNativeCount' : 'reqContrastCount');
    if (cnt) cnt.textContent = z.length;
}

function removeRequestZone(type, idx) {
    state.currentRequestZones[type].splice(idx, 1);
    renderRequestZones(type);
}

function clearRequestZones(type) {
    state.currentRequestZones[type] = [];
    renderRequestZones(type);
}

// ============================================================
// СОХРАНЕНИЕ ЗАЯВКИ — ОБНОВЛЕНО (async + сохранение на сервер)
// ============================================================
async function saveRequest() {
    if (currentRole !== 'dept') {
        toast('Только отделение может создавать заявки', 'error');
        return;
    }

    const fioEl = document.getElementById('reqFio');
    const birthEl = document.getElementById('reqBirthDate');
    const histEl = document.getElementById('reqHistoryNum');
    const admitDateEl = document.getElementById('reqAdmitDate');
    const admitTimeEl = document.getElementById('reqAdmitTime');
    const icdEl = document.getElementById('reqIcdDisplay');
    const purposeEl = document.getElementById('reqPurpose');
    const urgentEl = document.getElementById('reqUrgent');
    const purposeErrEl = document.getElementById('reqPurposeError');

    const refDocEl = document.getElementById('reqReferringDoctor');
    const refDocErrEl = document.getElementById('reqReferringDoctorError');

    const fio = fioEl ? fioEl.value.trim() : '';
    const birthDate = birthEl ? getDateFromInput(birthEl) : '';
    const historyNum = histEl ? histEl.value.trim() : '';
    const admitDate = admitDateEl ? getDateFromInput(admitDateEl) : '';
    const admitTime = admitTimeEl ? admitTimeEl.value : '';
    const icdDisplay = icdEl ? icdEl.value.trim() : '';
    const purpose = purposeEl ? purposeEl.value.trim() : '';
    const urgent = urgentEl ? urgentEl.checked : false;
    const referringDoctor = refDocEl ? refDocEl.value.trim() : '';

    const errors = [];

    if (!fio) errors.push('<strong>ФИО</strong>');
    if (fio && !/^[а-яА-ЯёЁ\s\-\.]+$/.test(fio)) errors.push('<strong>ФИО</strong> — только русские буквы');
    if (!birthDate) errors.push('<strong>Дата рождения</strong>');
    if (!historyNum) errors.push('<strong>№ истории</strong>');
    if (!admitDate) errors.push('<strong>Дата поступления</strong>');
    if (!admitTime) errors.push('<strong>Время поступления</strong>');
    if (!icdDisplay) errors.push('<strong>Диагноз МКБ-10</strong>');

    if (!referringDoctor) {
        errors.push('<strong>Врач, направивший на исследование</strong> — обязательно');
        if (refDocErrEl) refDocErrEl.classList.add('show');
    } else {
        if (refDocErrEl) refDocErrEl.classList.remove('show');
    }

    if (!purpose) {
        errors.push('<strong>Цель исследования</strong> — обязательно');
        if (purposeErrEl) purposeErrEl.classList.add('show');
    } else {
        if (purposeErrEl) purposeErrEl.classList.remove('show');
    }

    const hasN = state.currentRequestZones.native.length > 0;
    const hasC = state.currentRequestZones.contrast.length > 0;
    if (!hasN && !hasC) errors.push('<strong>Хотя бы одна зона</strong>');

    if (errors.length > 0) { showErrorModal(errors); return; }

    if (!state.editingRequestId) {
        const dupInRequests = state.requests.find(r =>
            r.fio === fio && r.birthDate === birthDate && (r.status === 'new' || r.status === 'accepted')
        );
        if (dupInRequests) {
            toast('⚠️ Пациент уже в очереди', 'error');
            return;
        }
    }

    if (icdDisplay) {
        const parsed = parseIcdString(icdDisplay);
        if (parsed) {
            if (parsed.code) {
                const found = findIcdByCode(parsed.code);
                state.selectedRequestICD = found ? { code: found.code, name: found.name } : { code: parsed.code, name: parsed.name };
            } else {
                state.selectedRequestICD = { code: '', name: parsed.name };
            }
        }
    }

    const requestData = {
        id: state.editingRequestId || uid(),
        createdDate: state.editingRequestId
            ? (state.requests.find(r => r.id === state.editingRequestId)?.createdDate || todayISO())
            : todayISO(),
        createdTime: state.editingRequestId
            ? (state.requests.find(r => r.id === state.editingRequestId)?.createdTime || nowTime())
            : nowTime(),
        createdAt: state.editingRequestId
            ? (state.requests.find(r => r.id === state.editingRequestId)?.createdAt || Date.now())
            : Date.now(),
        createdBy: currentDept,
        status: 'new',
        urgent: urgent,

        fio: fio, birthDate: birthDate, age: calcAgeFromDate(birthDate),
        historyNum: historyNum, dept: currentDept,
        admitDate: admitDate, admitTime: admitTime,

        referringDoctor: referringDoctor,

        icdCode: state.selectedRequestICD?.code || '',
        icdName: state.selectedRequestICD?.name || '',
        icdDisplay: icdDisplay,
        purpose: purpose,

        zonesNative: [...state.currentRequestZones.native],
        zonesContrast: [...state.currentRequestZones.contrast],

        acceptedBy: '', acceptedAt: '', rejectReason: '', studyId: ''
    };

    if (state.editingRequestId) {
        const idx = state.requests.findIndex(r => r.id === state.editingRequestId);
        if (idx === -1) { toast('Заявка не найдена', 'error'); return; }
        state.requests[idx] = requestData;
        toast('✅ Изменения сохранены', 'success');
    } else {
        state.requests.unshift(requestData);
        toast('✅ Заявка отправлена', 'success');
    }

    // === СОХРАНЕНИЕ НА СЕРВЕР ===
    try {
        await saveRequestToServer(requestData);
        console.log('✅ Заявка сохранена на сервер:', requestData.id);
    } catch (err) {
        console.error('❌ Ошибка сохранения заявки:', err);
        toast('⚠️ Сохранено локально, но не на сервер', 'error');
    }

    state.editingRequestId = null;
    saveState();
    closeModal('requestModal');
    renderRequests();
    updateRequestsBadge();
}

// ============================================================
// СПИСОК ЗАЯВОК
// ============================================================
function renderRequests() {
    const body = document.getElementById('requestsBody');
    const empty = document.getElementById('requestsEmpty');
    if (!body) return;

    let list = [...state.requests];
    if (currentRole === 'dept') {
        list = list.filter(r => r.dept === currentDept);
    }

    const filterStatusEl = document.getElementById('requestFilterStatus');
    const filterStatus = filterStatusEl ? filterStatusEl.value : '';
    if (filterStatus) list = list.filter(r => r.status === filterStatus);

    const filterDeptEl = document.getElementById('requestFilterDept');
    const filterDept = filterDeptEl ? filterDeptEl.value : '';
    if (filterDept && (currentRole === 'lab' || currentRole === 'admin')) {
        list = list.filter(r => r.dept === filterDept);
    }

    list.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    renderRequestStats();

    if (!list.length) {
        body.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    const statusPills = {
        new: '<span class="status-pill req-new">🟡 Новая</span>',
        accepted: '<span class="status-pill req-accepted">🟠 Принята</span>',
        done: '<span class="status-pill req-done">🟢 Выполнена</span>',
        rejected: '<span class="status-pill req-rejected">🔴 Отклонена</span>'
    };

    body.innerHTML = list.map(r => {
        const urgentMark = r.urgent ? '<span class="urgent-marker">🔥 СРОЧНО</span>' : '';
        const zonesNative = r.zonesNative || [];
        const zonesContrast = r.zonesContrast || [];
        const zonesInfo = [];
        if (zonesNative.length) zonesInfo.push('🦴 ' + zonesNative.length);
        if (zonesContrast.length) zonesInfo.push('💉 ' + zonesContrast.length);
        const zonesStr = zonesInfo.join(' • ') || '—';

        let actions = '';
        if (currentRole === 'dept') {
            if (r.status === 'new') {
                actions = '<button class="btn btn-info" style="padding:4px 8px;font-size:11px;margin-right:4px" onclick="event.stopPropagation();openEditRequest(\'' + r.id + '\')">✏️</button>' +
                          '<button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();cancelRequest(\'' + r.id + '\')">✖</button>';
            } else if (r.status === 'rejected') {
                actions = '<button class="btn btn-warning" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();reopenRequest(\'' + r.id + '\')">🔄</button>';
            }
        } else {
            if (r.status === 'new') {
                actions = '<button class="btn btn-success" style="padding:4px 8px;font-size:11px;margin-right:4px" onclick="event.stopPropagation();acceptRequest(\'' + r.id + '\')">✅</button>' +
                          '<button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();openRejectModal(\'' + r.id + '\')">❌</button>';
            } else if (r.status === 'accepted') {
                actions = '<button class="btn btn-warning" style="padding:4px 8px;font-size:11px;margin-right:4px" onclick="event.stopPropagation();returnRequestToQueue(\'' + r.id + '\')" title="Вернуть в очередь">↩️</button>' +
                          '<button class="btn btn-success" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();openStudyFromRequest(\'' + r.id + '\')">📋</button>';
            } else if (r.status === 'rejected') {
                actions = '<button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();deleteRequest(\'' + r.id + '\')">🗑️</button>';
            } else if (r.status === 'done') {
                actions = '<span style="font-size:11px;color:var(--text-muted)">✅</span>';
            }
        }

        const rejectInfo = r.status === 'rejected' && r.rejectReason
            ? '<div style="font-size:10px;color:var(--danger);margin-top:2px">❌ ' + r.rejectReason + '</div>' : '';

        const deptClass = getDeptColorClass(r.dept);
        const deptColor = getDeptColor(r.dept);

        const deptCell = '<span class="req-dept-dot" style="background:' + deptColor + '"></span>' + (r.dept || '—');

        const refDoctorCell = r.referringDoctor || '—';

        return '<tr class="req-row ' + deptClass + '" onclick="openRequestDetail(\'' + r.id + '\')">' +
            '<td>' + formatDate(r.createdDate) + '<br><span style="font-size:10px;color:var(--text-muted)">' + (r.createdTime || '') + '</span></td>' +
            '<td>' + (statusPills[r.status] || '') + '</td>' +
            '<td>' + urgentMark + '</td>' +
            '<td><strong>' + r.fio + '</strong></td>' +
            '<td>' + formatDate(r.birthDate) + '<br><span style="font-size:11px;color:var(--text-muted)">' + r.age + ' лет</span></td>' +
            '<td>' + (r.historyNum || '—') + '</td>' +
            '<td>' + deptCell + '</td>' +
            '<td style="font-size:11px">' + refDoctorCell + '</td>' +
            '<td style="font-size:11px">' + (r.icdDisplay || '—') + '</td>' +
            '<td style="font-size:11px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + (r.purpose || '').replace(/"/g, '&quot;') + '">' + (r.purpose || '—') + '</td>' +
            '<td>' + zonesStr + '</td>' +
            '<td>' + actions + '</td>' +
            '</tr>' + (rejectInfo ? '<tr><td colspan="12" style="padding:0">' + rejectInfo + '</td></tr>' : '');
    }).join('');
}

function renderRequestStats() {
    const stats = document.getElementById('requestsStats');
    if (!stats) return;

    let list = [...state.requests];
    if (currentRole === 'dept') list = list.filter(r => r.dept === currentDept);

    const filterDeptEl = document.getElementById('requestFilterDept');
    const filterDept = filterDeptEl ? filterDeptEl.value : '';
    if (filterDept && (currentRole === 'lab' || currentRole === 'admin')) {
        list = list.filter(r => r.dept === filterDept);
    }

    const total = list.length;
    const newCount = list.filter(r => r.status === 'new').length;
    const acceptedCount = list.filter(r => r.status === 'accepted').length;
    const doneCount = list.filter(r => r.status === 'done').length;
    const urgentCount = list.filter(r => r.urgent && (r.status === 'new' || r.status === 'accepted')).length;

    stats.innerHTML =
        '<div class="stat-card"><div class="stat-label">📨 Всего</div><div class="stat-value">' + total + '</div></div>' +
        '<div class="stat-card warning"><div class="stat-label">🟡 Новые</div><div class="stat-value">' + newCount + '</div></div>' +
        '<div class="stat-card accent"><div class="stat-label">🟠 Принятые</div><div class="stat-value">' + acceptedCount + '</div></div>' +
        '<div class="stat-card success"><div class="stat-label">🟢 Выполненные</div><div class="stat-value">' + doneCount + '</div></div>' +
        '<div class="stat-card danger"><div class="stat-label">🔥 Срочные</div><div class="stat-value">' + urgentCount + '</div></div>';
}

function openRequestDetail(id) {
    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    const nativeList = (r.zonesNative || []).map(z => '• ' + z).join('<br>') || '—';
    const contrastList = (r.zonesContrast || []).map(z => '• ' + z).join('<br>') || '—';

    const statusLabels = {
        new: '🟡 Новая', accepted: '🟠 Принята в работу',
        done: '🟢 Выполнена', rejected: '🔴 Отклонена'
    };

    const deptColor = getDeptColor(r.dept);

    const rejectBlock = r.status === 'rejected' && r.rejectReason
        ? '<div style="margin-top:12px;background:rgba(239,68,68,.15);border-left:4px solid var(--danger);padding:10px 12px;border-radius:var(--radius-sm);font-size:12px;color:var(--text)"><strong>❌ Причина отклонения:</strong><br>' + r.rejectReason + '</div>'
        : '';

    const bodyEl = document.getElementById('requestDetailBody');
    if (bodyEl) {
        bodyEl.innerHTML = `
            <div style="background:var(--surface-2);padding:14px;border-radius:var(--radius-sm);font-size:13px;line-height:1.8;color:var(--text);border-left:4px solid ${deptColor}">
                <div><strong>Дата заявки:</strong> ${formatDate(r.createdDate)} ${r.createdTime || ''}</div>
                <div><strong>Статус:</strong> ${statusLabels[r.status] || r.status} ${r.urgent ? '<span class="urgent-marker">🔥 СРОЧНО</span>' : ''}</div>
                <div><strong>Отделение:</strong> <span style="color:${deptColor};font-weight:700">${r.dept || '—'}</span></div>
                <div><strong>Врач, направивший на исследование:</strong> ${r.referringDoctor || '—'}</div>
            </div>
            <div style="margin-top:12px;background:var(--surface-2);padding:14px;border-radius:var(--radius-sm);font-size:13px;line-height:1.8;color:var(--text)">
                <div style="font-weight:700;margin-bottom:6px">👤 Пациент</div>
                <div><strong>ФИО:</strong> ${r.fio}</div>
                <div><strong>Дата рождения:</strong> ${formatDate(r.birthDate)} (${r.age} лет)</div>
                <div><strong>№ истории:</strong> ${r.historyNum || '—'}</div>
                <div><strong>Поступил:</strong> ${formatDate(r.admitDate)} ${r.admitTime || ''}</div>
            </div>
            <div style="margin-top:12px;background:var(--surface-2);padding:14px;border-radius:var(--radius-sm);font-size:13px;line-height:1.8;color:var(--text)">
                <div style="font-weight:700;margin-bottom:6px">🩺 Клинические данные</div>
                <div><strong>Диагноз:</strong> ${r.icdDisplay || '—'}</div>
                <div><strong>Цель исследования:</strong> ${r.purpose || '—'}</div>
            </div>
            <div style="margin-top:12px;background:var(--surface-2);padding:14px;border-radius:var(--radius-sm);font-size:13px;line-height:1.8;color:var(--text)">
                <div style="font-weight:700;margin-bottom:6px">🦴 Зоны исследования</div>
                <div><strong>Нативные:</strong><br>${nativeList}</div>
                <div style="margin-top:8px"><strong>С контрастом:</strong><br>${contrastList}</div>
            </div>
            ${rejectBlock}
        `;
    }

    const footerEl = document.getElementById('requestDetailFooter');
    if (footerEl) footerEl.innerHTML = buildRequestDetailFooter(r);

    openModal('requestDetailModal');
}

// ============================================================
// FOOTER МОДАЛКИ ДЕТАЛЕЙ ЗАЯВКИ
// ============================================================
function buildRequestDetailFooter(r) {
    const closeBtn = '<button class="btn btn-secondary" onclick="closeModal(\'requestDetailModal\')">Закрыть</button>';

    let printBtn = '';
    if (r.status === 'accepted' || r.status === 'done') {
        printBtn = '<button class="btn btn-info" onclick="printRequest(\'' + r.id + '\')">🖨️ Печать заявки</button>';
    }

    if (currentRole === 'dept') {
        if (r.status === 'new') {
            return closeBtn + printBtn +
                '<button class="btn btn-info" onclick="closeModal(\'requestDetailModal\');openEditRequest(\'' + r.id + '\')">✏️ Редактировать</button>' +
                '<button class="btn btn-danger" onclick="closeModal(\'requestDetailModal\');cancelRequest(\'' + r.id + '\')">✖ Отменить</button>';
        }
        if (r.status === 'rejected') {
            return closeBtn + printBtn +
                '<button class="btn btn-warning" onclick="closeModal(\'requestDetailModal\');reopenRequest(\'' + r.id + '\')">🔄 Исправить</button>';
        }
        return closeBtn + printBtn;
    }

    if (r.status === 'new') {
        return closeBtn + printBtn +
            '<button class="btn btn-danger" onclick="closeModal(\'requestDetailModal\');openRejectModal(\'' + r.id + '\')">❌ Отклонить</button>' +
            '<button class="btn btn-success" onclick="closeModal(\'requestDetailModal\');acceptRequest(\'' + r.id + '\')">✅ Принять</button>';
    }
    if (r.status === 'accepted') {
        return closeBtn + printBtn +
            '<button class="btn btn-warning" onclick="closeModal(\'requestDetailModal\');returnRequestToQueue(\'' + r.id + '\')">↩️ Вернуть в очередь</button>' +
            '<button class="btn btn-success" onclick="closeModal(\'requestDetailModal\');openStudyFromRequest(\'' + r.id + '\')">📋 Продолжить</button>';
    }
    if (r.status === 'rejected') {
        return closeBtn + printBtn +
            '<button class="btn btn-danger" onclick="closeModal(\'requestDetailModal\');deleteRequest(\'' + r.id + '\')">🗑️ Удалить</button>';
    }

    return closeBtn + printBtn;
}

// ============================================================
// ПРИЁМ / ОТКЛОНЕНИЕ / ВОЗВРАТ — ОБНОВЛЕНО (async + сервер)
// ============================================================
async function acceptRequest(id) {
    if (currentRole !== 'lab' && currentRole !== 'admin') {
        toast('Принять заявку может только лаборант или админ', 'error');
        return;
    }

    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    if (r.status !== 'new') {
        toast('Заявка уже не новая', 'error');
        return;
    }

    const pastStudies = state.studies.filter(s =>
        s.fio === r.fio && s.birthDate === r.birthDate
    ).sort((a, b) =>
        ((b.studyDate || '') + ' ' + (b.studyTime || '')).localeCompare(
            (a.studyDate || '') + ' ' + (a.studyTime || '')
        )
    );

    if (pastStudies.length) {
        const last = pastStudies[0];
        const msg = '⚠️ Пациент уже проходил КТ: ' + formatDate(last.studyDate) +
            (last.studyTime ? ' ' + last.studyTime : '') + '.\nПродолжить?';
        if (!confirm(msg)) return;
    }

    r.status = 'accepted';
    r.acceptedBy = state.currentUser ? state.currentUser.name : '';
    r.acceptedAt = nowISO();

    // Сохраняем на сервер
    try {
        await saveRequestToServer(r);
        console.log('✅ Заявка принята и сохранена:', id);
    } catch (err) {
        console.error('❌ Ошибка сохранения:', err);
    }

    state.currentRequestFromId = r.id;
    saveState();
    renderRequests();
    updateRequestsBadge();

    openStudyFromRequestData(r);
}

async function returnRequestToQueue(id) {
    if (currentRole !== 'lab' && currentRole !== 'admin') {
        toast('Вернуть в очередь может только лаборант или админ', 'error');
        return;
    }

    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    if (r.status !== 'accepted') {
        toast('Вернуть в очередь можно только принятую заявку', 'error');
        return;
    }

    if (!confirm('Вернуть заявку в очередь «Новые»?\nОтделение сможет её исправить.')) return;

    r.status = 'new';
    r.acceptedBy = '';
    r.acceptedAt = '';

    try {
        await saveRequestToServer(r);
    } catch (err) {
        console.error('Ошибка:', err);
    }

    saveState();
    renderRequests();
    updateRequestsBadge();

    toast('↩️ Заявка возвращена в очередь «Новые»', 'success');
}

function openRejectModal(id) {
    state.currentRequestFromId = id;
    const el = document.getElementById('rejectReason');
    if (el) el.value = '';
    openModal('rejectModal');
}

async function confirmRejectRequest() {
    const id = state.currentRequestFromId;
    if (!id) return;
    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    const reason = document.getElementById('rejectReason')?.value.trim() || '';
    if (!reason) { toast('Укажите причину', 'error'); return; }

    r.status = 'rejected';
    r.rejectReason = reason;
    r.acceptedBy = state.currentUser ? state.currentUser.name : '';
    r.acceptedAt = nowISO();

    try {
        await saveRequestToServer(r);
    } catch (err) {
        console.error('Ошибка:', err);
    }

    state.currentRequestFromId = null;
    saveState();
    closeModal('rejectModal');
    renderRequests();
    updateRequestsBadge();

    toast('Заявка отклонена', 'success');
}

async function cancelRequest(id) {
    if (!confirm('Отменить заявку?')) return;

    try {
        await deleteRequestFromServer(id);
    } catch (err) {
        console.error('Ошибка удаления:', err);
    }

    state.requests = state.requests.filter(r => r.id !== id);
    saveState();
    renderRequests();
    updateRequestsBadge();
    toast('Заявка отменена', 'success');
}

async function reopenRequest(id) {
    const r = state.requests.find(x => x.id === id);
    if (!r) return;

    r.status = 'new';
    r.rejectReason = '';
    r.acceptedBy = '';
    r.acceptedAt = '';

    try {
        await saveRequestToServer(r);
    } catch (err) {
        console.error('Ошибка:', err);
    }

    saveState();
    renderRequests();
    updateRequestsBadge();
    toast('Заявка снова в очереди', 'success');
}

async function deleteRequest(id) {
    if (!confirm('Удалить заявку?')) return;

    try {
        await deleteRequestFromServer(id);
    } catch (err) {
        console.error('Ошибка удаления:', err);
    }

    state.requests = state.requests.filter(r => r.id !== id);
    saveState();
    renderRequests();
    updateRequestsBadge();
    toast('Заявка удалена', 'success');
}

function openStudyFromRequest(id) {
    const r = state.requests.find(x => x.id === id);
    if (!r) return;
    if (r.status !== 'accepted') {
        toast('Сначала примите заявку', 'error');
        return;
    }
    state.currentRequestFromId = r.id;
    openStudyFromRequestData(r);
}

function updateRequestsBadge() {
    const badge = document.getElementById('requestsBadge');
    const count = document.getElementById('requestsCount');
    if (!badge || !count) return;

    let list = [...state.requests];
    if (currentRole === 'dept') {
        list = list.filter(r => r.dept === currentDept);
    }

    const newCount = list.filter(r => r.status === 'new').length;
    if (newCount > 0) {
        count.textContent = newCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ============================================================
// ПЕЧАТЬ ЗАЯВКИ
// ============================================================
function printRequest(requestId) {
    const r = state.requests.find(x => x.id === requestId);
    if (!r) {
        toast('Заявка не найдена', 'error');
        return;
    }

    if (r.status !== 'accepted' && r.status !== 'done') {
        toast('Печать доступна только для принятых/выполненных заявок', 'error');
        return;
    }

    if (!r.fio || !r.icdDisplay || (!(r.zonesNative || []).length && !(r.zonesContrast || []).length)) {
        toast('Заявка заполнена не полностью', 'error');
        return;
    }

    const nativeList = (r.zonesNative || []).map(z => '• ' + z).join('<br>') || '—';
    const contrastList = (r.zonesContrast || []).map(z => '• ' + z).join('<br>') || '—';

    const statusLabels = {
        new: '🟡 Новая',
        accepted: '🟠 Принята в работу',
        done: '🟢 Выполнена',
        rejected: '🔴 Отклонена'
    };
    const statusText = statusLabels[r.status] || r.status;

    const urgentBlock = r.urgent
        ? '<div class="urgent">🔥 СРОЧНО — ВНЕ ОЧЕРЕДИ</div>'
        : '';

    const html = '<!DOCTYPE html>' +
'<html lang="ru">' +
'<head>' +
'<meta charset="UTF-8">' +
'<title>Заявка на КТ — ' + r.fio + '</title>' +
'<style>' +
'@page { size: A4; margin: 15mm 12mm; }' +
'* { box-sizing: border-box; }' +
'body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 0; }' +
'.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }' +
'.hospital-name { font-size: 10pt; font-weight: bold; line-height: 1.3; }' +
'.hospital-subtitle { font-size: 9pt; color: #444; margin-top: 2px; }' +
'.doc-title { font-size: 14pt; font-weight: bold; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }' +
'.doc-number { font-size: 11pt; margin-top: 4px; }' +
'.info-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }' +
'.info-table td { padding: 5px 8px; vertical-align: top; border: 1px solid #999; }' +
'.info-table .label { font-weight: bold; width: 30%; background: #f5f5f5; }' +
'.info-table .value { width: 70%; }' +
'.section-title { font-size: 11pt; font-weight: bold; margin: 16px 0 8px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; }' +
'.zones-block { border: 1px solid #999; padding: 10px 12px; margin: 8px 0; background: #f9fafb; }' +
'.zones-block strong { display: block; margin-bottom: 4px; }' +
'.urgent { background: #fee2e2; border: 2px solid #dc2626; padding: 8px 12px; margin: 10px 0; text-align: center; font-weight: bold; color: #991b1b; }' +
'.signature-block { margin-top: 40px; font-size: 11pt; }' +
'.signature-line { display: inline-block; width: 250px; border-bottom: 1px solid #000; margin: 0 8px; }' +
'.footer { margin-top: 30px; font-size: 8pt; color: #888; text-align: center; border-top: 1px solid #ccc; padding-top: 8px; }' +
'@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' +
'</style>' +
'</head>' +
'<body>' +

'<div class="header">' +
'<div class="hospital-name">МИНИСТЕРСТВО ЗДРАВООХРАНЕНИЯ МОСКОВСКОЙ ОБЛАСТИ<br>ГБУЗ МО «Жуковская областная клиническая больница»</div>' +
'<div class="hospital-subtitle">140186, Московская область, г. Жуковский</div>' +
'<div class="doc-title">Заявка на КТ-исследование</div>' +
'<div class="doc-number">№ ' + (r.historyNum || 'б/н') + ' от ' + formatDate(r.createdDate) + '</div>' +
'</div>' +

urgentBlock +

'<table class="info-table">' +
'<tr><td class="label">Статус заявки:</td><td class="value"><strong>' + statusText + '</strong></td></tr>' +
'<tr><td class="label">Отделение:</td><td class="value"><strong>' + (r.dept || '—') + '</strong></td></tr>' +
'<tr><td class="label">Врач, направивший на исследование:</td><td class="value"><strong>' + (r.referringDoctor || '—') + '</strong></td></tr>' +
'</table>' +

'<div class="section-title">Данные пациента</div>' +
'<table class="info-table">' +
'<tr><td class="label">ФИО:</td><td class="value"><strong>' + r.fio + '</strong></td></tr>' +
'<tr><td class="label">Дата рождения:</td><td class="value">' + formatDate(r.birthDate) + ' (' + r.age + ' лет)</td></tr>' +
'<tr><td class="label">№ истории:</td><td class="value">' + (r.historyNum || '—') + '</td></tr>' +
'<tr><td class="label">Дата поступления:</td><td class="value">' + formatDate(r.admitDate) + ' ' + (r.admitTime || '') + '</td></tr>' +
'</table>' +

'<div class="section-title">Клинические данные</div>' +
'<table class="info-table">' +
'<tr><td class="label">Диагноз МКБ-10:</td><td class="value"><strong>' + (r.icdDisplay || '—') + '</strong></td></tr>' +
'<tr><td class="label">Цель исследования:</td><td class="value">' + (r.purpose || '—') + '</td></tr>' +
'</table>' +

'<div class="section-title">Зоны исследования</div>' +
'<div class="zones-block"><strong>🦴 Нативные зоны:</strong>' + nativeList + '</div>' +
'<div class="zones-block"><strong>💉 Зоны с контрастом (КУ):</strong>' + contrastList + '</div>' +

'<div class="section-title">Подписи</div>' +
'<div class="signature-block">' +
'<div>Врач-рентгенолог: <span class="signature-line"></span></div>' +
'<div style="margin-top:20px">Заведующий отделением: <span class="signature-line"></span></div>' +
'</div>' +

'<div class="footer">' +
'Документ сформирован автоматически • КТ-Журнал Pro v24 • ' + formatDate(todayISO()) + ' ' + nowTime() +
'</div>' +

'<script>' +
'window.onload = function() {' +
'  setTimeout(function() { window.print(); }, 300);' +
'};' +
'<\/script>' +
'</body>' +
'</html>';

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
        toast('Разрешите всплывающие окна для печати', 'error');
        return;
    }
    w.document.write(html);
    w.document.close();
}