// ============================================================
// ИНИЦИАЛИЗАЦИЯ И ЗАПУСК
// ============================================================

function initApp() {
    populateFilterSelects();
    loadSettingsToForm();

    renderJournal();
    renderQuickStats();
    renderStock();
    renderTemplates();
    renderDescTemplatesList('descTemplatesList', true);
    renderOperations();
    renderReport();

    if (typeof renderRequests === 'function') {
        renderRequests();
        updateRequestsBadge();
    }

    const pwdLab = document.getElementById('pwdLab');
    if (pwdLab) pwdLab.value = (state.settings.passwords && state.settings.passwords.lab) || 'lab';

    const pwdDoctor = document.getElementById('pwdDoctor');
    if (pwdDoctor) pwdDoctor.value = (state.settings.passwords && state.settings.passwords.doctor) || 'doctor';

    const pwdAdmin = document.getElementById('pwdAdmin');
    if (pwdAdmin) pwdAdmin.value = (state.settings.passwords && state.settings.passwords.admin) || 'admin';

    const pwdDept = document.getElementById('pwdDept');
    if (pwdDept) pwdDept.value = (state.settings.passwords && state.settings.passwords.dept) || 'dept';

    const customNativeEl = document.getElementById('customNativeZones');
    if (customNativeEl) {
        customNativeEl.value = (state.settings.customNativeZones || [])
            .map(z => z.name + ' - ' + z.dose).join('\n');
    }

    const customContrastEl = document.getElementById('customContrastZones');
    if (customContrastEl) {
        customContrastEl.value = (state.settings.customContrastZones || [])
            .map(z => z.name + ' - ' + z.dose).join('\n');
    }

    populateDescTemplateZoneSelect();

    if (typeof populateRequestDeptFilter === 'function') {
        populateRequestDeptFilter();
    }

    if (currentRole) {
        const doctorSection = document.getElementById('doctorTemplatesSection');
        if (doctorSection) {
            doctorSection.style.display =
                (currentRole === 'doctor' || currentRole === 'admin') ? 'block' : 'none';
        }
    }
}

function populateDescTemplateZoneSelect() {
    const sel = document.getElementById('descTemplateZone');
    if (!sel) return;

    const allZones = [...getAllNativeZones(), ...getAllContrastZones()];
    const unique = [...new Set(allZones.map(z => z.name))].sort();

    sel.innerHTML = '<option value="">— Для всех зон —</option>' +
        unique.map(z => '<option value="' + z + '">' + z + '</option>').join('');
}

// ============================================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panel = document.getElementById('tab-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');

            if (tab.dataset.tab === 'stats') {
                if (typeof renderStats === 'function') renderStats();
            }
            if (tab.dataset.tab === 'requests') {
                if (typeof renderRequests === 'function') renderRequests();
                if (typeof updateRequestsBadge === 'function') updateRequestsBadge();
            }
            if (tab.dataset.tab === 'templates') {
                if (typeof renderTemplates === 'function') renderTemplates();
                if (typeof renderDescTemplatesList === 'function') {
                    renderDescTemplatesList('descTemplatesList', true);
                }
            }
            if (tab.dataset.tab === 'stock') {
                if (typeof renderStock === 'function') renderStock();
                if (typeof renderOperations === 'function') renderOperations();
                if (typeof renderReport === 'function') renderReport();
            }
        });
    });
}

function initModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(ov => {
        ov.addEventListener('click', e => {
            const protectedIds = ['zoneModal', 'icdModal', 'addIcdModal', 'doctorWorkspace', 'shiftDetailsModal'];
            if (protectedIds.includes(ov.id)) return;
            if (e.target === ov) ov.classList.remove('active');
        });
    });
}

// ============================================================
// АВТОДОПОЛНЕНИЕ ФИО
// ============================================================
function validateFio() {
    const input = document.getElementById('fio');
    const err = document.getElementById('fioError');
    if (!input || !err) return;

    const cleaned = input.value.replace(/[^а-яА-ЯёЁ\s\-\.]/g, '');
    if (cleaned !== input.value) {
        input.value = cleaned;
        err.classList.add('show');
        input.classList.add('invalid');
        setTimeout(() => {
            err.classList.remove('show');
            input.classList.remove('invalid');
        }, 2500);
    }
}

function onFioInput() {
    const input = document.getElementById('fio');
    const listEl = document.getElementById('fioAutocomplete');
    if (!input || !listEl) return;

    const v = input.value.trim().toLowerCase();
    if (v.length < 2) { listEl.classList.remove('show'); return; }

    const u = new Map();
    state.studies.forEach(s => {
        if (s.fio && !u.has(s.fio)) {
            u.set(s.fio, {
                fio: s.fio, birthDate: s.birthDate,
                historyNum: s.historyNum, dept: s.dept
            });
        }
    });

    const m = [];
    u.forEach((d, f) => { if (f.toLowerCase().includes(v)) m.push(d); });
    m.sort((a, b) =>
        (a.fio.toLowerCase().startsWith(v) ? 0 : 1) -
        (b.fio.toLowerCase().startsWith(v) ? 0 : 1)
    );

    if (!m.length) { listEl.classList.remove('show'); return; }

    listEl.innerHTML = m.slice(0, 10).map(x => {
        const i = x.fio.toLowerCase().indexOf(v);
        const h = i >= 0
            ? x.fio.slice(0, i) + '<span class="autocomplete-highlight">' +
              x.fio.slice(i, i + v.length) + '</span>' + x.fio.slice(i + v.length)
            : x.fio;
        const d = [];
        if (x.birthDate) d.push('Д.р.: ' + formatDate(x.birthDate));
        if (x.historyNum) d.push('№ ' + x.historyNum);
        if (x.dept) d.push(x.dept);
        return '<div class="autocomplete-item" onclick="selectAutocomplete(\'' +
            x.fio.replace(/'/g, "\\'") + '\',\'' + (x.birthDate || '') + '\',\'' +
            (x.historyNum || '') + '\',\'' + (x.dept || '') + '\')">' +
            '<div class="autocomplete-name">' + h + '</div>' +
            (d.length ? '<div class="autocomplete-details">' + d.join(' • ') + '</div>' : '') +
            '</div>';
    }).join('');

    listEl.classList.add('show');
}

function selectAutocomplete(f, b, h, d) {
    const fioEl = document.getElementById('fio');
    if (fioEl) fioEl.value = f;

    if (b) {
        const bEl = document.getElementById('birthDate');
        if (bEl) setDateInput(bEl, b);
    }
    if (h) {
        const hEl = document.getElementById('historyNum');
        if (hEl) hEl.value = h;
    }
    if (d) {
        const dEl = document.getElementById('dept');
        if (dEl) dEl.value = d;
    }

    if (typeof calcAge === 'function') calcAge();

    const listEl = document.getElementById('fioAutocomplete');
    if (listEl) listEl.classList.remove('show');
}

// ============================================================
// СОХРАНЕНИЕ РЕДАКТИРУЕМЫХ ПОЛЕЙ ВРАЧА
// ============================================================
async function saveEditableFields() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) return;

    const sdEl = document.getElementById('editStudyDate');
    const stEl = document.getElementById('editStudyTime');
    const tdEl = document.getElementById('editTotalDose');
    const caEl = document.getElementById('editContrastAmount');

    const sd = sdEl ? getDateFromInput(sdEl) : '';
    const st = stEl ? stEl.value : '';
    const td = tdEl ? parseFloat(tdEl.value) : NaN;
    const ca = caEl ? parseFloat(caEl.value) : NaN;

    if (sd) state.studies[idx].studyDate = sd;
    if (st) state.studies[idx].studyTime = st;
    if (!isNaN(td)) state.studies[idx].totalDose = td;
    if (!isNaN(ca)) state.studies[idx].contrast = ca;

    // Сохраняем на сервер
    await saveStudyToServer(state.studies[idx]);

    // Локально тоже
    saveState();
    renderJournal();
    renderQuickStats();

    if (typeof loadDoctorStudyData === 'function') loadDoctorStudyData(id);

    const block = document.getElementById('editableFieldsBlock');
    if (block) block.style.display = 'none';

    toast('Изменения сохранены', 'success');
}

// ============================================================
// ОБРАБОТЧИК КЛАВИШИ ESCAPE
// ============================================================
function initEscapeHandler() {
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;

        const ws = document.getElementById('doctorWorkspace');
        if (ws && ws.classList.contains('active')) { closeModal('doctorWorkspace'); return; }

        const zm = document.getElementById('zoneModal');
        if (zm && zm.classList.contains('active')) {
            if (typeof closeZonePicker === 'function') closeZonePicker();
            return;
        }

        const cm = document.getElementById('constructorModal');
        if (cm && cm.classList.contains('active')) { closeModal('constructorModal'); return; }

        const dtm = document.getElementById('descTemplateModal');
        if (dtm && dtm.classList.contains('active')) { closeModal('descTemplateModal'); return; }

        const aim = document.getElementById('addIcdModal');
        if (aim && aim.classList.contains('active')) { closeModal('addIcdModal'); return; }

        const sdm = document.getElementById('shiftDetailsModal');
        if (sdm && sdm.classList.contains('active')) { closeModal('shiftDetailsModal'); return; }

        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    });
}

function initAutocompleteClose() {
    document.addEventListener('click', e => {
        const wrap = document.querySelector('.autocomplete-wrapper');
        const list = document.getElementById('fioAutocomplete');
        if (wrap && list && !wrap.contains(e.target)) list.classList.remove('show');
    });
}

// ============================================================
// ЗАПУСК
// ============================================================

// Загружаем сохранённую тему
if (typeof loadThemeMode === 'function') {
    loadThemeMode();
} else if (typeof loadTheme === 'function') {
    loadTheme();
}

initEscapeHandler();
initAutocompleteClose();

window.addEventListener('DOMContentLoaded', async () => {
    if (typeof initThemeSettings === 'function') initThemeSettings();
    if (typeof initScrollButton === 'function') initScrollButton();
    if (typeof initBackupSystem === 'function') initBackupSystem();
    initTabs();
    initModalOverlays();

    // === ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ===
    console.log('📥 Начинаю загрузку данных с сервера...');
    await loadStateFromServer();
    console.log('✅ Данные загружены с сервера');

    // Проверка здоровья сервера
    if (typeof checkServerHealth === 'function') {
        checkServerHealth().then(ok => {
            if (ok) {
                console.log('✅ Сервер доступен:', window.location.origin + '/api');
            } else {
                console.warn('⚠️ Сервер недоступен');
            }
        });
    }
});

// Если пользователь уже вошёл — инициализируем приложение
setTimeout(() => {
    if (state.studies.length || state.requests.length || (state.currentUser && state.currentUser.role)) {
        const loginScreen = document.getElementById('loginScreen');
        const isLoggedIn = loginScreen && loginScreen.style.display === 'none';
        if (isLoggedIn) initApp();
    }
}, 500);

console.log('%c✅ КТ-Журнал Pro v24 загружен', 'color:#10b981;font-weight:bold;font-size:14px');
console.log('📊 Исследований:', state.studies.length);
console.log('📨 Заявок:', state.requests.length);