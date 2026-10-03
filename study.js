// ============================================================
// РАБОТА С ИССЛЕДОВАНИЯМИ (ЛАБОРАНТ)
// Обновлённая версия: сохранение на сервер через API
// ============================================================

// ============================================================
// ПАРСИНГ СТРОКИ МКБ (вставка из МИСа)
// ============================================================
function parseIcdString(str) {
    if (!str) return null;
    str = String(str).trim();
    if (!str) return null;

    const codePattern = '([A-Za-zА-Яа-я][0-9]{2}(?:\\.[0-9]{1,2}){0,3})';
    const sepPattern = '\\s*[—–:;\\-]\\s*';

    let m = str.match(new RegExp('^' + codePattern + sepPattern + '(.+)$'));
    if (m) return { code: m[1].toUpperCase(), name: m[2].trim() };

    m = str.match(new RegExp('^' + codePattern + '\\s+(.+)$'));
    if (m) return { code: m[1].toUpperCase(), name: m[2].trim() };

    m = str.match(new RegExp('^' + codePattern + '$'));
    if (m) return { code: m[1].toUpperCase(), name: '' };

    if (!/^[A-Za-z][0-9]/.test(str)) {
        return { code: '', name: str };
    }

    return null;
}

function findIcdByCode(code) {
    if (!code) return null;
    const c = code.toUpperCase().trim();
    return getAllICD().find(i => i.code.toUpperCase() === c) || null;
}

// ============================================================
// ОБРАБОТЧИКИ ПОЛЯ ДИАГНОЗА
// ============================================================
function onIcdInput(el) {
    const v = el.value.trim();
    if (!v) {
        state.selectedICD = null;
        return;
    }
    const parsed = parseIcdString(v);
    if (parsed && parsed.code) {
        const found = findIcdByCode(parsed.code);
        if (found) {
            state.selectedICD = { code: found.code, name: found.name };
        } else {
            state.selectedICD = { code: parsed.code, name: parsed.name };
        }
    }
}

function onIcdBlur(el) {
    const v = el.value.trim();
    if (!v) {
        state.selectedICD = null;
        return;
    }

    const parsed = parseIcdString(v);
    if (!parsed) return;

    const code = parsed.code;
    const typedName = parsed.name;

    if (!code) {
        const foundByName = getAllICD().find(i =>
            i.name.toLowerCase() === typedName.toLowerCase()
        );
        if (foundByName) {
            state.selectedICD = { code: foundByName.code, name: foundByName.name };
            el.value = foundByName.code + ' — ' + foundByName.name;
        } else {
            state.selectedICD = { code: '', name: typedName };
        }
        return;
    }

    const found = findIcdByCode(code);
    if (found) {
        state.selectedICD = { code: found.code, name: found.name };
        el.value = found.code + ' — ' + found.name;
        return;
    }

    if (typedName) {
        openAddIcdModal(code, typedName);
    } else {
        openAddIcdModal(code, '');
    }
}

function onIcdPaste(e, el) {
    setTimeout(() => {
        const v = el.value.trim();
        if (!v) return;
        const parsed = parseIcdString(v);
        if (parsed && parsed.code) {
            const found = findIcdByCode(parsed.code);
            if (found) {
                state.selectedICD = { code: found.code, name: found.name };
                el.value = found.code + ' — ' + found.name;
            } else {
                state.selectedICD = { code: parsed.code, name: parsed.name };
                openAddIcdModal(parsed.code, parsed.name);
            }
        }
    }, 10);
}

// ============================================================
// МОДАЛКА ДОБАВЛЕНИЯ НОВОГО КОДА МКБ
// ============================================================
function openAddIcdModal(code, name) {
    const codeEl = document.getElementById('addIcdCode');
    const nameEl = document.getElementById('addIcdName');
    const catEl = document.getElementById('addIcdCategory');

    if (codeEl) codeEl.value = code || '';
    if (nameEl) nameEl.value = name || '';
    if (catEl) catEl.value = '';

    state._icdApplyTarget = window._icdMode === 'request' ? 'request' : 'study';

    openModal('addIcdModal');

    setTimeout(() => {
        if (nameEl) nameEl.focus();
    }, 100);
}

function saveNewIcd() {
    const codeEl = document.getElementById('addIcdCode');
    const nameEl = document.getElementById('addIcdName');
    const catEl = document.getElementById('addIcdCategory');

    const code = (codeEl ? codeEl.value : '').toUpperCase().trim();
    const name = (nameEl ? nameEl.value : '').trim();
    const category = catEl ? catEl.value : '';

    if (!code) { toast('Код не указан', 'error'); return; }
    if (!name) { toast('Введите название диагноза', 'error'); return; }

    const existing = findIcdByCode(code);
    if (existing) {
        toast('Код уже есть в справочнике: ' + existing.code + ' — ' + existing.name, 'error');
        return;
    }

    if (!state.settings.customICD) state.settings.customICD = [];
    state.settings.customICD.push({
        code: code,
        name: name,
        category: category
    });

    saveSettingsToStorage();
    closeModal('addIcdModal');

    const displayValue = code + ' — ' + name;

    if (state._icdApplyTarget === 'request') {
        const el = document.getElementById('reqIcdDisplay');
        if (el) el.value = displayValue;
        state.selectedRequestICD = { code: code, name: name };
    } else {
        const el = document.getElementById('icdDisplay');
        if (el) el.value = displayValue;
        state.selectedICD = { code: code, name: name };
    }

    if (typeof loadSettingsToForm === 'function') {
        const listEl = document.getElementById('customICDList');
        if (listEl) {
            listEl.value = (state.settings.customICD || [])
                .map(d => d.code + ' - ' + d.name).join('\n');
        }
    }

    toast('✅ Код ' + code + ' добавлен в справочник', 'success');
}

// ============================================================
// ОБРАБОТЧИКИ ДАТЫ РОЖДЕНИЯ
// ============================================================
function onBirthDateInput() {
    const input = document.getElementById('birthDate');
    const iso = handleDateInput(input);
    if (iso) {
        const age = calcAgeFromDate(iso);
        document.getElementById('age').value = age !== '' ? age : '';
    }
}

function onBirthDateBlur() {
    const input = document.getElementById('birthDate');
    const iso = normalizeDateInput(input);
    const errEl = document.getElementById('birthDateError');

    if (!iso) {
        if (input.value.trim() === '') {
            document.getElementById('age').value = '';
            errEl.classList.remove('show');
        }
        return;
    }

    const a = calcAgeFromDate(iso);
    if (a !== '' && (a > 120 || a < 0)) {
        errEl.classList.add('show');
        input.classList.add('invalid');
        document.getElementById('age').value = '';
        setTimeout(() => errEl.classList.remove('show'), 3000);
        return;
    }

    errEl.classList.remove('show');
    input.classList.remove('invalid');
    document.getElementById('age').value = a !== '' ? a : '';
}

// ============================================================
// ОТКРЫТИЕ ФОРМЫ
// ============================================================
function openNewStudy() {
    if (currentRole === 'doctor') {
        toast('Только лаборант может создавать исследования', 'error');
        return;
    }

    state.editingId = null;
    document.getElementById('studyModalTitle').textContent = '✨ Новое исследование';
    clearStudyForm();

    const bannerEl = document.getElementById('studyModalBanner');
    if (bannerEl) bannerEl.innerHTML = '';

    setDateInput(document.getElementById('studyDate'), todayISO());
    document.getElementById('studyTime').value = nowTime();
    setDateInput(document.getElementById('admitDate'), todayISO());
    document.getElementById('admitTime').value = nowTime();

    populateSelects();
    populateContrastDrugs();
    populateTemplateSelect();

    if (state.settings.lastDoctor) document.getElementById('doctor').value = state.settings.lastDoctor;
    if (state.settings.lastLab) document.getElementById('lab').value = state.settings.lastLab;

    if (state.settings.lastDoctor || state.settings.lastLab) {
        document.getElementById('rememberedHint').style.display = 'block';
    }

    updateStepUI();
    openModal('studyModal');
}

function openEditStudy(id) {
    if (currentRole === 'doctor') {
        toast('Только лаборант может редактировать', 'error');
        return;
    }

    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    if (s.status === 'signed') {
        toast('Нельзя редактировать подписанную запись', 'error');
        return;
    }

    state.editingId = id;
    document.getElementById('studyModalTitle').textContent = '✏️ Редактирование';

    const bannerEl = document.getElementById('studyModalBanner');
    if (bannerEl) bannerEl.innerHTML = '';

    populateSelects();
    populateContrastDrugs();
    populateTemplateSelect();

    document.getElementById('fio').value = s.fio || '';
    setDateInput(document.getElementById('birthDate'), s.birthDate || '');
    document.getElementById('age').value = s.age || '';
    document.getElementById('historyNum').value = s.historyNum || '';
    document.getElementById('dept').value = s.dept || '';
    document.getElementById('templateSelect').value = s.templateId || '';
    document.getElementById('icdDisplay').value = s.icdDisplay || '';
    state.selectedICD = s.icdCode ? { code: s.icdCode, name: s.icdName } : null;

    setDateInput(document.getElementById('admitDate'), s.admitDate || '');
    document.getElementById('admitTime').value = s.admitTime || '';
    setDateInput(document.getElementById('studyDate'), s.studyDate || '');
    document.getElementById('studyTime').value = s.studyTime || '';

    document.getElementById('contrastDrug').value = s.contrastDrugId || '';
    document.getElementById('contrastAmount').value = s.contrast || 0;
    document.getElementById('flasks').value = s.flasks || 0;
    document.getElementById('adapters').value = s.adapters || 0;
    document.getElementById('extenders').value = s.extenders || 0;

    document.getElementById('doctor').value = s.doctor || '';
    document.getElementById('lab').value = s.lab || '';

    if (s.zones && s.zones.length) {
        state.currentZones.native = s.zones.filter(z => z.type === 'native').map(z => z.name);
        state.currentZones.contrast = s.zones.filter(z => z.type === 'contrast').map(z => z.name);
    } else {
        state.currentZones.native = [...(s.nativeZones || [])];
        state.currentZones.contrast = [...(s.contrastZones || [])];
    }

    state.stepConfirmed = {
        native: true,
        contrast: (state.currentZones.contrast.length > 0),
        supplies: true
    };

    renderZones('native');
    renderZones('contrast');
    onContrastDrugChange();
    updateStepUI();

    document.getElementById('rememberedHint').style.display = 'none';
    openModal('studyModal');
}

function clearStudyForm() {
    ['fio', 'birthDate', 'age', 'historyNum', 'icdDisplay',
     'contrastAmount', 'flasks', 'adapters', 'extenders',
     'admitDate', 'admitTime', 'studyDate', 'studyTime'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            if (el.dataset) el.dataset.isoValue = '';
            el.classList.remove('invalid');
        }
    });

    document.getElementById('contrastAmount').value = 0;
    document.getElementById('flasks').value = 0;
    document.getElementById('adapters').value = 0;
    document.getElementById('extenders').value = 0;
    document.getElementById('contrastDrug').value = '';
    document.getElementById('templateSelect').value = '';
    document.getElementById('dept').value = '';
    document.getElementById('doctor').value = '';
    document.getElementById('lab').value = '';

    state.currentZones = { native: [], contrast: [] };
    state.selectedICD = null;
    state.stepConfirmed = { native: false, contrast: false, supplies: false };

    renderZones('native');
    renderZones('contrast');
    document.getElementById('drugStockHint').textContent = '';
    updateStepUI();
}

function populateSelects() {
    document.getElementById('dept').innerHTML =
        '<option value="">— выберите —</option>' +
        state.settings.depts.map(d => '<option>' + d + '</option>').join('');

    document.getElementById('doctor').innerHTML =
        '<option value="">— выберите —</option>' +
        state.settings.doctors.map(d => '<option>' + d + '</option>').join('');

    document.getElementById('lab').innerHTML =
        '<option value="">— выберите —</option>' +
        state.settings.labs.map(d => '<option>' + d + '</option>').join('');
}

function populateContrastDrugs() {
    document.getElementById('contrastDrug').innerHTML =
        '<option value="">— без контраста —</option>' +
        state.drugs.map(d => '<option value="' + d.id + '">' + d.name + ' (' + d.conc + ') — остаток: ' + d.stock + ' мл</option>').join('');
}

function populateTemplateSelect() {
    document.getElementById('templateSelect').innerHTML =
        '<option value="">— выберите шаблон —</option>' +
        state.templates.map(t => '<option value="' + t.id + '">' + t.name + '</option>').join('');
}

function calcAge() {
    const input = document.getElementById('birthDate');
    const errEl = document.getElementById('birthDateError');
    const iso = getDateFromInput(input);
    if (!iso) {
        document.getElementById('age').value = '';
        return;
    }
    const a = calcAgeFromDate(iso);
    if (a !== '' && (a > 120 || a < 0)) {
        errEl.classList.add('show');
        input.classList.add('invalid');
        document.getElementById('age').value = '';
        setTimeout(() => errEl.classList.remove('show'), 3000);
        return;
    }
    errEl.classList.remove('show');
    input.classList.remove('invalid');
    document.getElementById('age').value = a !== '' ? a : '';
}

function applyTemplateFromSelect() {
    const id = document.getElementById('templateSelect').value;
    if (!id) return;

    const t = state.templates.find(x => x.id === id);
    if (!t) return;

    state.currentZones.native = [...(t.nativeZones || [])];
    state.currentZones.contrast = [...(t.contrastZones || [])];

    renderZones('native');
    renderZones('contrast');
    calcDoses();

    toast('Шаблон применён', 'success');
}

function clearICD() {
    state.selectedICD = null;
    const el = document.getElementById('icdDisplay');
    if (el) el.value = '';
}

function rememberStaff() {
    const d = document.getElementById('doctor').value;
    const l = document.getElementById('lab').value;
    if (d) state.settings.lastDoctor = d;
    if (l) state.settings.lastLab = l;
    saveSettingsToStorage();
}

function onContrastDrugChange() {
    const id = document.getElementById('contrastDrug').value;
    const h = document.getElementById('drugStockHint');

    if (!id) { h.textContent = ''; return; }

    const d = state.drugs.find(x => x.id === id);
    if (!d) { h.textContent = ''; return; }

    h.textContent = '📦 Остаток: ' + d.stock + ' мл';
    h.style.color = d.stock <= 0 ? 'var(--danger)' : d.stock < d.minStock ? 'var(--warning)' : 'var(--text-muted)';
}

function renderZones(type) {
    const c = document.getElementById(type === 'native' ? 'nativeZones' : 'contrastZones');
    if (!c) return;
    const z = state.currentZones[type];

    c.innerHTML = z.length ?
        z.map((n, i) =>
            '<div class="zone-chip ' + (type === 'contrast' ? 'contrast' : '') + '">' +
            n +
            '<span class="remove" onclick="removeZone(\'' + type + '\',' + i + ')">✕</span>' +
            '</div>'
        ).join('') :
        '<div class="zone-empty">Зоны не выбраны</div>';

    document.getElementById(type === 'native' ? 'nativeCount' : 'contrastCount').textContent = z.length;
    calcDoses();
}

function removeZone(type, idx) {
    state.currentZones[type].splice(idx, 1);
    renderZones(type);
    calcDoses();
}

function clearZones(type) {
    state.currentZones[type] = [];
    renderZones(type);
    calcDoses();
    updateStepUI();
}

function toggleStep(n) {
    const b = document.getElementById('step' + n + 'Body');
    if (b) b.classList.toggle('collapsed');
}

function confirmStep(n) {
    if (n === 3) {
        state.stepConfirmed.supplies = true;

        document.getElementById('step4').classList.remove('locked');
        document.getElementById('step4LockMsg').style.display = 'none';
        document.getElementById('addContrastBtn').disabled = false;
        document.getElementById('step4Status').textContent = '';
        document.getElementById('step4Status').style.background = '';
        document.getElementById('step4Status').style.color = '';
        document.getElementById('step3').classList.add('confirmed');

        toast('Расходники подтверждены', 'success');
    }
    updateStepUI();
}

function updateStepUI() {
    const s3 = document.getElementById('step3');
    if (s3) state.stepConfirmed.supplies ? s3.classList.add('confirmed') : s3.classList.remove('confirmed');

    const s4 = document.getElementById('step4');
    if (!s4) return;

    if (!state.stepConfirmed.supplies) {
        s4.classList.add('locked');
        s4.classList.remove('confirmed');
        document.getElementById('step4LockMsg').style.display = 'block';
        document.getElementById('addContrastBtn').disabled = true;
        document.getElementById('step4Status').textContent = '🔒 Заблокировано';
        document.getElementById('step4Status').style.background = '#fee2e2';
        document.getElementById('step4Status').style.color = '#991b1b';
    } else {
        s4.classList.remove('locked');
        document.getElementById('step4LockMsg').style.display = 'none';
        document.getElementById('addContrastBtn').disabled = false;
    }
}

function calcDoses() {
    let nd = 0, cd = 0;
    state.currentZones.native.forEach(n => { nd += findZoneDose(n); });
    state.currentZones.contrast.forEach(n => { cd += findZoneDose(n); });

    const nEl = document.getElementById('nativeDose');
    const cEl = document.getElementById('contrastDose');
    if (nEl) nEl.textContent = nd.toFixed(1);
    if (cEl) cEl.textContent = cd.toFixed(1);
}

// ============================================================
// ВЫБОР ЗОН
// ============================================================
function getSelectedZones() {
    const m = state.zonePickerMode;
    if (m === 'native') return state.currentZones.native;
    if (m === 'contrast') return state.currentZones.contrast;
    if (m === 'templateNative') return state.templateZones.native;
    if (m === 'templateContrast') return state.templateZones.contrast;
    if (m === 'requestNative') return state.currentRequestZones.native;
    if (m === 'requestContrast') return state.currentRequestZones.contrast;
    return [];
}

function openZonePicker(mode) {
    state.zonePickerMode = mode;

    const titles = {
        native: '🦴 Нативные зоны',
        contrast: '💉 Зоны с КУ',
        templateNative: '🦴 Нативные (шаблон)',
        templateContrast: '💉 КУ (шаблон)',
        requestNative: '🦴 Нативные зоны (заявка)',
        requestContrast: '💉 Зоны с КУ (заявка)'
    };

    document.getElementById('zoneModalTitle').innerHTML =
        (titles[mode] || 'Выбор зон') + ' <span class="selected-counter" id="zoneSelectedCounter">0 выбрано</span>';

    document.getElementById('zoneSearch').value = '';
    renderZonePicker();
    updateZoneCounter();

    document.getElementById('zoneModal').classList.add('active');
}

function closeZonePicker() {
    document.getElementById('zoneModal').classList.remove('active');
    renderZones('native');
    renderZones('contrast');
    calcDoses();
    renderTemplateZones('native');
    renderTemplateZones('contrast');
    if (typeof renderRequestZones === 'function') {
        renderRequestZones('native');
        renderRequestZones('contrast');
    }
}

function updateZoneCounter() {
    const c = document.getElementById('zoneSelectedCounter');
    if (c) c.textContent = getSelectedZones().length + ' выбрано';
}

function renderZonePicker() {
    const mode = state.zonePickerMode;
    const search = document.getElementById('zoneSearch').value.toLowerCase();

    let list = (mode === 'native' || mode === 'templateNative' || mode === 'requestNative') ?
        getAllNativeZones() :
        getAllContrastZones();

    if (search) list = list.filter(z => z.name.toLowerCase().includes(search));

    const sel = getSelectedZones();
    const c = document.getElementById('zonePickerList');

    if (!list.length) {
        c.innerHTML = '<div class="empty">Не найдено</div>';
        return;
    }

    c.innerHTML = list.map(z => {
        const is = sel.includes(z.name);
        return '<div class="icd-item ' + (is ? 'selected' : '') + '" onclick="toggleZoneInPicker(\'' + z.name.replace(/'/g, "\\'") + '\')">' +
            '<div><strong>' + z.name + '</strong><div style="font-size:11px;color:var(--text-muted)">Доза: ' + z.dose + ' мЗв</div></div>' +
            (is ? '<span style="color:var(--success);font-size:20px">✅</span>' : '') +
            '</div>';
    }).join('');
}

function toggleZoneInPicker(name) {
    let t;
    if (state.zonePickerMode === 'native') t = state.currentZones.native;
    else if (state.zonePickerMode === 'contrast') t = state.currentZones.contrast;
    else if (state.zonePickerMode === 'templateNative') t = state.templateZones.native;
    else if (state.zonePickerMode === 'templateContrast') t = state.templateZones.contrast;
    else if (state.zonePickerMode === 'requestNative') t = state.currentRequestZones.native;
    else if (state.zonePickerMode === 'requestContrast') t = state.currentRequestZones.contrast;
    else return;

    const i = t.indexOf(name);
    if (i === -1) t.push(name);
    else t.splice(i, 1);

    renderZonePicker();
    updateZoneCounter();
}

// ============================================================
// МКБ-10 СПРАВОЧНИК
// ============================================================
function getAllICD() {
    const custom = (state.settings.customICD || []).map(d => ({ ...d, custom: true }));
    return [...DEFAULT_ICD, ...custom];
}

function openICD() {
    window._icdMode = 'study';
    document.getElementById('icdSearch').value = '';
    renderICD();
    openModal('icdModal');
    setTimeout(() => document.getElementById('icdSearch').focus(), 100);
}

function renderICD() {
    const s = document.getElementById('icdSearch').value.toLowerCase();
    const all = getAllICD();
    const list = all.filter(i => i.code.toLowerCase().includes(s) || i.name.toLowerCase().includes(s));

    const c = document.getElementById('icdList');

    c.innerHTML = list.length ?
        list.map(i =>
            '<div class="icd-item" onclick="selectICD(\'' + i.code + "','" + i.name.replace(/'/g, "\\'") + "')\">" +
            '<div><span class="icd-code">' + i.code + '</span>' + i.name +
            (i.custom ? '<span class="icd-custom-badge">ВАШ</span>' : '') +
            '</div></div>'
        ).join('') :
        '<div class="empty">Не найдено</div>';
}

function selectICD(c, n) {
    if (window._icdMode === 'request') {
        state.selectedRequestICD = { code: c, name: n };
        const el = document.getElementById('reqIcdDisplay');
        if (el) el.value = c + ' — ' + n;
        window._icdMode = null;
        closeModal('icdModal');
        return;
    }

    state.selectedICD = { code: c, name: n };
    const el = document.getElementById('icdDisplay');
    if (el) el.value = c + ' — ' + n;
    window._icdMode = null;
    closeModal('icdModal');
}

// ============================================================
// СОХРАНЕНИЕ — ОБНОВЛЕНО (async + сохранение на сервер)
// ============================================================
function showErrorModal(errors) {
    document.getElementById('errorList').innerHTML = errors.map(e => '<li>' + e + '</li>').join('');
    openModal('errorModal');
}

function validateDateTime() {
    const admitDate = getDateFromInput(document.getElementById('admitDate'));
    const admitTime = document.getElementById('admitTime').value;
    const studyDate = getDateFromInput(document.getElementById('studyDate'));
    const studyTime = document.getElementById('studyTime').value;

    if (!admitDate || !admitTime || !studyDate || !studyTime) return null;

    const admitDT = admitDate + 'T' + admitTime;
    const studyDT = studyDate + 'T' + studyTime;

    if (studyDT < admitDT) {
        return '⏰ Время исследования (' + formatDate(studyDate) + ' ' + studyTime +
            ') раньше времени поступления (' + formatDate(admitDate) + ' ' + admitTime + '). Исправьте даты!';
    }
    return null;
}

async function saveStudy() {
    const fio = document.getElementById('fio').value.trim();
    const birthDate = getDateFromInput(document.getElementById('birthDate'));
    const dept = document.getElementById('dept').value;
    const studyDate = getDateFromInput(document.getElementById('studyDate'));
    const doctor = document.getElementById('doctor').value;
    const lab = document.getElementById('lab').value;
    const contrastDrugId = document.getElementById('contrastDrug').value;
    const contrastAmount = parseFloat(document.getElementById('contrastAmount').value) || 0;
    const flasks = parseInt(document.getElementById('flasks').value) || 0;
    const adapters = parseInt(document.getElementById('adapters').value) || 0;
    const extenders = parseInt(document.getElementById('extenders').value) || 0;
    const templateId = document.getElementById('templateSelect').value;
    const templateName = templateId ? (state.templates.find(t => t.id === templateId)?.name || '') : '';
    const admitDate = getDateFromInput(document.getElementById('admitDate'));
    const admitTime = document.getElementById('admitTime').value;
    const studyTime = document.getElementById('studyTime').value;
    const icdDisplay = document.getElementById('icdDisplay').value.trim();

    const errors = [];

    if (!fio) errors.push('<strong>ФИО</strong>');
    if (fio && !/^[а-яА-ЯёЁ\s\-\.]+$/.test(fio)) errors.push('<strong>ФИО</strong> — только русские буквы');
    if (!birthDate) errors.push('<strong>Дата рождения</strong> — не распознана или пустая');
    if (!dept) errors.push('<strong>Отделение</strong>');
    if (!studyDate) errors.push('<strong>Дата исследования</strong> — не распознана или пустая');
    if (!doctor) errors.push('<strong>Врач</strong>');
    if (!lab) errors.push('<strong>Лаборант</strong>');
    if (!admitDate) errors.push('<strong>Дата поступления</strong> — не распознана или пустая');
    if (!admitTime) errors.push('<strong>Время поступления</strong>');
    if (!studyTime) errors.push('<strong>Время исследования</strong>');

    const hasN = state.currentZones.native.length > 0;
    const hasC = state.currentZones.contrast.length > 0;
    if (!hasN && !hasC) errors.push('<strong>Хотя бы одна зона</strong>');

    const dateError = validateDateTime();
    if (dateError) errors.push(dateError);

    if (errors.length > 0) {
        showErrorModal(errors);
        return;
    }

    if (contrastDrugId && contrastAmount > 0) {
        const drug = state.drugs.find(d => d.id === contrastDrugId);
        if (drug) {
            let cur = drug.stock;
            if (state.editingId) {
                const o = state.studies.find(s => s.id === state.editingId);
                if (o && o.contrastDrugId === contrastDrugId) cur += (o.contrast || 0);
            }
            if (contrastAmount > cur) {
                errors.push('<strong>Недостаточно контраста</strong> «' + drug.name + '» на складе (остаток: ' + cur + ' мл)');
                showErrorModal(errors);
                return;
            }
        }
    }

    if (flasks > 0) {
        const c = state.consumables.find(x => x.name === 'Колба для контраста');
        if (c && flasks > c.stock) {
            errors.push('<strong>Недостаточно колб</strong> на складе (остаток: ' + c.stock + ' шт)');
            showErrorModal(errors);
            return;
        }
    }

    if (adapters > 0) {
        const c = state.consumables.find(x => x.name === 'Переходник');
        if (c && adapters > c.stock) {
            errors.push('<strong>Недостаточно переходников</strong> на складе (остаток: ' + c.stock + ' шт)');
            showErrorModal(errors);
            return;
        }
    }

    if (extenders > 0) {
        const c = state.consumables.find(x => x.name === 'Удлинитель');
        if (c && extenders > c.stock) {
            errors.push('<strong>Недостаточно удлинителей</strong> на складе (остаток: ' + c.stock + ' шт)');
            showErrorModal(errors);
            return;
        }
    }

    let nd = 0, cd = 0;
    state.currentZones.native.forEach(n => { nd += findZoneDose(n); });
    state.currentZones.contrast.forEach(n => { cd += findZoneDose(n); });

    const zones = [];

    state.currentZones.native.forEach(name => {
        zones.push({
            name: name, type: 'native', dose: findZoneDose(name),
            description: '', status: 'pending', signedBy: '', signedAt: ''
        });
    });

    state.currentZones.contrast.forEach(name => {
        zones.push({
            name: name, type: 'contrast', dose: findZoneDose(name),
            description: '', status: 'pending', signedBy: '', signedAt: ''
        });
    });

    if (icdDisplay) {
        const parsed = parseIcdString(icdDisplay);
        if (parsed) {
            if (parsed.code) {
                const found = findIcdByCode(parsed.code);
                state.selectedICD = found ? { code: found.code, name: found.name } : { code: parsed.code, name: parsed.name };
            } else {
                state.selectedICD = { code: '', name: parsed.name };
            }
        }
    } else {
        state.selectedICD = null;
    }

    const data = {
        id: state.editingId || uid(),
        fio: fio,
        birthDate: birthDate,
        age: calcAgeFromDate(birthDate),
        historyNum: document.getElementById('historyNum').value.trim(),
        dept: dept,
        templateId: templateId,
        templateName: templateName,
        icdCode: state.selectedICD?.code || '',
        icdName: state.selectedICD?.name || '',
        icdDisplay: icdDisplay,
        admitDate: admitDate,
        admitTime: admitTime,
        studyDate: studyDate,
        studyTime: studyTime,
        zones: zones,
        nativeDose: nd,
        contrastDose: cd,
        totalDose: nd + cd,
        contrastDrugId: contrastDrugId,
        contrastDrugName: contrastDrugId ? (state.drugs.find(d => d.id === contrastDrugId)?.name || '') : '',
        contrast: contrastAmount,
        flasks: flasks, adapters: adapters, extenders: extenders,
        doctor: doctor, lab: lab,
        createdAt: state.editingId ? (state.studies.find(s => s.id === state.editingId)?.createdAt || Date.now()) : Date.now()
    };

    if (state.currentRequestFromId) {
        data.requestId = state.currentRequestFromId;
    }

    if (state.editingId) {
        const idx = state.studies.findIndex(s => s.id === state.editingId);
        const old = state.studies[idx];

        if (old.contrastDrugId && old.contrast > 0) {
            const od = state.drugs.find(d => d.id === old.contrastDrugId);
            if (od) od.stock += old.contrast;
        }
        if (old.flasks) { const c = state.consumables.find(x => x.name === 'Колба для контраста'); if (c) c.stock += old.flasks; }
        if (old.adapters) { const c = state.consumables.find(x => x.name === 'Переходник'); if (c) c.stock += old.adapters; }
        if (old.extenders) { const c = state.consumables.find(x => x.name === 'Удлинитель'); if (c) c.stock += old.extenders; }

        state.operations = state.operations.filter(op => op.studyId !== old.id);

        if (old.zones && old.zones.length) {
            data.zones = old.zones.map((oz, i) => {
                const newZone = zones[i] || { name: oz.name, type: oz.type, dose: oz.dose };
                return {
                    ...newZone,
                    description: oz.description || '',
                    status: oz.status || 'pending',
                    signedBy: oz.signedBy || '',
                    signedAt: oz.signedAt || ''
                };
            });
        }

        data.status = old.status || 'pending';
        data.signedBy = old.signedBy || '';
        data.signedAt = old.signedAt || '';
        data.requestId = old.requestId || '';

        state.studies[idx] = data;
    } else {
        data.status = 'pending';
        data.signedBy = '';
        data.signedAt = '';
        state.studies.unshift(data);
    }

    const opUser = state.currentUser ? state.currentUser.name :
        (currentRole === 'doctor' ? 'Врач' : currentRole === 'lab' ? 'Лаборант' : 'Администратор');

    if (contrastDrugId && contrastAmount > 0) {
        const drug = state.drugs.find(d => d.id === contrastDrugId);
        if (drug) {
            drug.stock -= contrastAmount;
            state.operations.unshift({
                id: uid(), type: 'auto', itemId: contrastDrugId, itemName: drug.name,
                itemType: 'drug', amount: contrastAmount, date: studyDate, time: studyTime,
                note: 'Исследование: ' + fio, studyId: data.id, user: opUser, createdAt: Date.now()
            });
        }
    }
    if (flasks > 0) {
        const c = state.consumables.find(x => x.name === 'Колба для контраста');
        if (c) {
            c.stock -= flasks;
            state.operations.unshift({
                id: uid(), type: 'auto', itemId: c.id, itemName: c.name,
                itemType: 'consumable', amount: flasks, date: studyDate, time: studyTime,
                note: 'Исследование: ' + fio, studyId: data.id, user: opUser, createdAt: Date.now()
            });
        }
    }
    if (adapters > 0) {
        const c = state.consumables.find(x => x.name === 'Переходник');
        if (c) {
            c.stock -= adapters;
            state.operations.unshift({
                id: uid(), type: 'auto', itemId: c.id, itemName: c.name,
                itemType: 'consumable', amount: adapters, date: studyDate, time: studyTime,
                note: 'Исследование: ' + fio, studyId: data.id, user: opUser, createdAt: Date.now()
            });
        }
    }
    if (extenders > 0) {
        const c = state.consumables.find(x => x.name === 'Удлинитель');
        if (c) {
            c.stock -= extenders;
            state.operations.unshift({
                id: uid(), type: 'auto', itemId: c.id, itemName: c.name,
                itemType: 'consumable', amount: extenders, date: studyDate, time: studyTime,
                note: 'Исследование: ' + fio, studyId: data.id, user: opUser, createdAt: Date.now()
            });
        }
    }

    if (state.currentRequestFromId) {
        const req = state.requests.find(r => r.id === state.currentRequestFromId);
        if (req) {
            req.status = 'done';
            req.studyId = data.id;
            req.acceptedBy = state.currentUser ? state.currentUser.name : '';

            // Сохраняем заявку на сервер
            if (typeof saveRequestToServer === 'function') {
                try {
                    await saveRequestToServer(req);
                } catch (err) {
                    console.error('Ошибка сохранения заявки на сервер:', err);
                }
            }
        }
        state.currentRequestFromId = null;
    }

    rememberStaff();

    // === СОХРАНЕНИЕ НА СЕРВЕР (async) ===
    try {
        await saveStudyToServer(data);
        console.log('✅ Исследование сохранено на сервер:', data.id);
    } catch (err) {
        console.error('❌ Ошибка сохранения на сервер:', err);
        toast('⚠️ Сохранено локально, но не на сервер', 'error');
    }

    // Локально — как кэш
    saveState();

    closeModal('studyModal');

    renderJournal();
    renderQuickStats();
    renderStock();
    renderOperations();
    renderReport();
    if (typeof renderRequests === 'function') renderRequests();
    if (typeof updateRequestsBadge === 'function') updateRequestsBadge();

    toast('✅ Сохранено', 'success');
}

function saveAsTemplate() {
    const n = prompt('Название шаблона:');
    if (!n) return;

    state.templates.push({
        id: uid(), name: n,
        nativeZones: [...state.currentZones.native],
        contrastZones: [...state.currentZones.contrast]
    });

    saveState();
    populateTemplateSelect();
    renderTemplates();
    toast('Шаблон сохранён', 'success');
}

// ============================================================
// УДАЛЕНИЕ ИССЛЕДОВАНИЯ — ОБНОВЛЕНО (async + удаление с сервера)
// ============================================================
function openDeleteStudyModal(id) {
    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    const isSigned = s.status === 'signed';
    const isAdmin = currentRole === 'admin';

    if (isSigned && !isAdmin) {
        toast('Подписанное исследование может удалить только администратор', 'error');
        return;
    }

    state.deleteStudyId = id;
    state.deleteStudySigned = isSigned;

    const returns = [];
    if (s.contrast > 0 && s.contrastDrugName) returns.push('💉 ' + s.contrast + ' мл ' + s.contrastDrugName);
    if (s.flasks > 0) returns.push('🧪 ' + s.flasks + ' шт колб');
    if (s.adapters > 0) returns.push('🔧 ' + s.adapters + ' шт переходников');
    if (s.extenders > 0) returns.push('🔧 ' + s.extenders + ' шт удлинителей');

    const opsCount = state.operations.filter(op => op.studyId === s.id).length;

    const warningBlock = isSigned ? `
        <div style="margin-top:12px;background:rgba(239,68,68,.15);border-left:4px solid var(--danger);padding:10px 12px;border-radius:var(--radius-sm);font-size:12px;color:var(--text)">
            ⚠️ <strong>Это ПОДПИСАННОЕ исследование.</strong> Удаление доступно только администратору.
        </div>` : '';

    document.getElementById('deleteStudyInfo').innerHTML = `
        <div style="font-size:14px;line-height:1.6;margin-bottom:12px;color:var(--text)">Удалить исследование?</div>
        <div style="background:var(--surface-2);padding:12px;border-radius:var(--radius-sm);font-size:13px;line-height:1.7;color:var(--text)">
            <div><strong>ФИО:</strong> ${s.fio}</div>
            <div><strong>Дата исследования:</strong> ${formatDate(s.studyDate)} ${s.studyTime || ''}</div>
            <div><strong>Отделение:</strong> ${s.dept || '—'}</div>
            <div><strong>Врач:</strong> ${s.doctor || '—'}</div>
            <div><strong>Лаборант:</strong> ${s.lab || '—'}</div>
            <div><strong>Зон:</strong> ${(s.zones || []).length}</div>
            <div><strong>Статус:</strong> ${s.status === 'signed' ? '🔵 Подписано' : s.status === 'described' ? '🟢 Описано' : '🟡 Ожидает'}</div>
        </div>
        <div style="margin-top:12px;background:rgba(245,158,11,.15);border-left:4px solid var(--warning);padding:10px 12px;border-radius:var(--radius-sm);font-size:12px;color:var(--text)">
            ↩️ <strong>Будет возвращено на склад:</strong>
            ${returns.length ? returns.map(r => '<div>• ' + r + '</div>').join('') : '<div>• ничего (расхода не было)</div>'}
        </div>
        ${opsCount > 0 ? `<div style="margin-top:12px;font-size:12px;color:var(--text)">📜 Связанных операций будет удалено: <strong>${opsCount}</strong></div>` : ''}
        ${warningBlock}
    `;

    const btn = document.getElementById('deleteStudyBtn');
    btn.textContent = isSigned ? '🗑️ Удалить подписанное (админ)' : '🗑️ Удалить';
    btn.className = 'btn btn-danger';

    openModal('deleteStudyModal');
}

async function confirmDeleteStudy() {
    const id = state.deleteStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) { closeModal('deleteStudyModal'); return; }

    const s = state.studies[idx];

    if (s.status === 'signed' && currentRole !== 'admin') {
        toast('Только администратор может удалить подписанное исследование', 'error');
        closeModal('deleteStudyModal');
        return;
    }

    if (s.contrastDrugId && s.contrast > 0) {
        const drug = state.drugs.find(d => d.id === s.contrastDrugId);
        if (drug) drug.stock += s.contrast;
    }
    if (s.flasks > 0) { const c = state.consumables.find(x => x.name === 'Колба для контраста'); if (c) c.stock += s.flasks; }
    if (s.adapters > 0) { const c = state.consumables.find(x => x.name === 'Переходник'); if (c) c.stock += s.adapters; }
    if (s.extenders > 0) { const c = state.consumables.find(x => x.name === 'Удлинитель'); if (c) c.stock += s.extenders; }

    const removedOps = state.operations.filter(op => op.studyId === s.id).length;
    state.operations = state.operations.filter(op => op.studyId !== s.id);

    // === УДАЛЯЕМ С СЕРВЕРА (async) ===
    try {
        await deleteStudyFromServer(id);
        console.log('✅ Исследование удалено с сервера:', id);
    } catch (err) {
        console.error('❌ Ошибка удаления с сервера:', err);
        toast('⚠️ Удалено локально, но не с сервера', 'error');
    }

    state.studies.splice(idx, 1);
    saveState();

    renderJournal();
    renderQuickStats();
    renderStock();
    renderOperations();
    renderReport();

    if (state.currentDoctorStudyId === s.id) {
        state.currentDoctorStudyId = null;
        closeModal('doctorWorkspace');
    }

    closeModal('deleteStudyModal');
    state.deleteStudyId = null;
    state.deleteStudySigned = false;

    let msg = '✅ Исследование удалено';
    const parts = [];
    if (s.contrast > 0) parts.push('контраст ' + s.contrast + ' мл');
    if (removedOps > 0) parts.push('операций: ' + removedOps);
    if (parts.length) msg += '. Возвращено: ' + parts.join(', ');

    toast(msg, 'success');
}

// ============================================================
// ОТКРЫТИЕ ИЗ ЗАЯВКИ
// ============================================================
function openStudyFromRequestData(r) {
    if (!r) return;

    state.editingId = null;
    document.getElementById('studyModalTitle').textContent = '✨ Новое исследование (из заявки)';
    clearStudyForm();

    const bannerEl = document.getElementById('studyModalBanner');
    if (bannerEl) {
        bannerEl.innerHTML = '<div class="request-banner">' +
    '📨 <strong>Из заявки от ' + (r.dept || '—') + '</strong>' +
    (r.urgent ? ' <span class="urgent-marker">🔥 СРОЧНО</span>' : '') +
    (r.referringDoctor ? '<div class="referring-doctor">🩺 <strong>Направил:</strong> ' + r.referringDoctor + '</div>' : '') +
    '<br><strong>Цель исследования:</strong> ' + (r.purpose || '—') +
    '</div>';
    }

    populateSelects();
    populateContrastDrugs();
    populateTemplateSelect();

    document.getElementById('fio').value = r.fio || '';
    setDateInput(document.getElementById('birthDate'), r.birthDate || '');
    document.getElementById('age').value = r.age || '';
    document.getElementById('historyNum').value = r.historyNum || '';
    document.getElementById('dept').value = r.dept || '';

    setDateInput(document.getElementById('admitDate'), r.admitDate || todayISO());
    document.getElementById('admitTime').value = r.admitTime || nowTime();
    setDateInput(document.getElementById('studyDate'), todayISO());
    document.getElementById('studyTime').value = nowTime();

    document.getElementById('icdDisplay').value = r.icdDisplay || '';
    state.selectedICD = r.icdCode ? { code: r.icdCode, name: r.icdName } : null;

    state.currentZones.native = [...(r.zonesNative || [])];
    state.currentZones.contrast = [...(r.zonesContrast || [])];

    state.stepConfirmed = { native: true, contrast: false, supplies: false };

    renderZones('native');
    renderZones('contrast');
    calcDoses();
    updateStepUI();

    document.getElementById('rememberedHint').style.display = 'none';

    if (state.settings.lastDoctor) document.getElementById('doctor').value = state.settings.lastDoctor;
    if (state.settings.lastLab) document.getElementById('lab').value = state.settings.lastLab;

    openModal('studyModal');
}