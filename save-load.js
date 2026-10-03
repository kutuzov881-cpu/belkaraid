// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ
// v2.1 — с оптимизацией и правильной инициализацией
// ============================================================

// ============================================================
// ЗАГРУЗКА С СЕРВЕРА (все модули + умная инициализация)
// ============================================================
async function loadStateFromServer() {
    try {
        console.log('📥 Загрузка данных с сервера...');

        // ==========================================
        // ИССЛЕДОВАНИЯ
        // ==========================================
        const studies = await StudiesAPI.getAll();
        state.studies = (studies || []).map(migrateStudy);
        console.log('✅ Исследований:', state.studies.length);

        // ==========================================
        // ЗАЯВКИ
        // ==========================================
        const requests = await RequestsAPI.getAll();
        state.requests = requests || [];
        console.log('✅ Заявок:', state.requests.length);

        // ==========================================
        // ШАБЛОНЫ ИССЛЕДОВАНИЙ
        // ==========================================
        const templates = await apiGet('/templates');
        if (templates && templates.length > 0) {
            state.templates = templates;
        } else {
            state.templates = [];
        }
        console.log('✅ Шаблонов исследований:', state.templates.length);

        // ==========================================
        // ШАБЛОНЫ ОПИСАНИЙ — с инициализацией
        // ==========================================
        const descTemplates = await apiGet('/desc-templates');
        if (descTemplates && descTemplates.length > 0) {
            state.descTemplates = descTemplates;
            console.log('✅ Шаблонов описаний (с сервера):', state.descTemplates.length);
        } else {
            // Первый запуск — сохраняем стандартные на сервер
            console.log('📤 Первый запуск: сохраняем стандартные шаблоны описаний на сервер...');
            state.descTemplates = DEFAULT_DESC_TEMPLATES;
            for (const t of DEFAULT_DESC_TEMPLATES) {
                await saveDescTemplateToServer(t);
            }
            console.log('✅ Шаблонов описаний (создано):', state.descTemplates.length);
        }

        // ==========================================
        // ПРЕПАРАТЫ — с инициализацией
        // ==========================================
        const drugs = await apiGet('/drugs');
        if (drugs && drugs.length > 0) {
            state.drugs = drugs;
            console.log('✅ Препаратов (с сервера):', state.drugs.length);
        } else {
            console.log('📤 Первый запуск: сохраняем стандартные препараты на сервер...');
            state.drugs = DEFAULT_DRUGS;
            for (const d of DEFAULT_DRUGS) {
                await saveDrugToServer(d);
            }
            console.log('✅ Препаратов (создано):', state.drugs.length);
        }

        // ==========================================
        // РАСХОДНИКИ — с инициализацией
        // ==========================================
        const consumables = await apiGet('/consumables');
        if (consumables && consumables.length > 0) {
            state.consumables = consumables;
            console.log('✅ Расходников (с сервера):', state.consumables.length);
        } else {
            console.log('📤 Первый запуск: сохраняем стандартные расходники на сервер...');
            state.consumables = DEFAULT_CONSUMABLES;
            for (const c of DEFAULT_CONSUMABLES) {
                await saveConsumableToServer(c);
            }
            console.log('✅ Расходников (создано):', state.consumables.length);
        }

        // ==========================================
        // ОПЕРАЦИИ СКЛАДА
        // ==========================================
        const operations = await apiGet('/operations');
        state.operations = operations || [];
        console.log('✅ Операций склада:', state.operations.length);

        // ==========================================
        // НАСТРОЙКИ — с инициализацией
        // ==========================================
        const settings = await apiGet('/settings');
        if (settings && Object.keys(settings).length > 0) {
            const defaultPasswords = state.settings.passwords;
            state.settings = { ...state.settings, ...settings };
            state.settings.passwords = {
                lab:    (settings.passwords && settings.passwords.lab)    || defaultPasswords.lab    || 'lab',
                doctor: (settings.passwords && settings.passwords.doctor) || defaultPasswords.doctor || 'doctor',
                admin:  (settings.passwords && settings.passwords.admin)  || defaultPasswords.admin  || 'admin',
                dept:   (settings.passwords && settings.passwords.dept)   || defaultPasswords.dept   || 'dept'
            };
            if (!Array.isArray(state.settings.referringDoctors)) {
                state.settings.referringDoctors = [];
            }
            console.log('✅ Настройки (с сервера)');
        } else {
            // Первый запуск — сохраняем стандартные настройки
            console.log('📤 Первый запуск: сохраняем настройки по умолчанию на сервер...');
            await saveSettingsToServer();
            console.log('✅ Настройки (создано)');
        }

        console.log('📥 Загрузка с сервера завершена');
        return true;

    } catch (err) {
        console.error('❌ Ошибка загрузки с сервера:', err);
        if (typeof toast === 'function') {
            toast('⚠️ Нет связи с сервером. Загружаю локальные данные.', 'error');
        }
        loadStateFromLocalStorage();
        return false;
    }
}

// ============================================================
// FALLBACK — загрузка из localStorage
// ============================================================
function loadStateFromLocalStorage() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
            const p = JSON.parse(s);
            state.studies = (p.studies || []).map(migrateStudy);
            state.templates = p.templates || [];
            state.drugs = p.drugs || DEFAULT_DRUGS;
            state.consumables = p.consumables || DEFAULT_CONSUMABLES;
            state.descTemplates = (p.descTemplates || DEFAULT_DESC_TEMPLATES).map(t => {
                if (!t.zone) t.zone = '';
                return t;
            });
            state.operations = p.operations || [];
            state.requests = p.requests || [];
        }

        const st = localStorage.getItem(SETTINGS_KEY);
        if (st) {
            const saved = JSON.parse(st);
            const defaultPasswords = state.settings.passwords;
            state.settings = { ...state.settings, ...saved };
            state.settings.passwords = {
                lab:    (saved.passwords && saved.passwords.lab)    || defaultPasswords.lab    || 'lab',
                doctor: (saved.passwords && saved.passwords.doctor) || defaultPasswords.doctor || 'doctor',
                admin:  (saved.passwords && saved.passwords.admin)  || defaultPasswords.admin  || 'admin',
                dept:   (saved.passwords && saved.passwords.dept)   || defaultPasswords.dept   || 'dept'
            };
            if (!Array.isArray(state.settings.referringDoctors)) {
                state.settings.referringDoctors = [];
            }
        }
        console.log('📥 Загрузка из localStorage завершена');
    } catch (e) {
        console.warn('Ошибка загрузки из localStorage:', e);
    }
}

// ============================================================
// СОХРАНЕНИЕ (локально, как кэш)
// ============================================================
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            studies: state.studies,
            templates: state.templates,
            drugs: state.drugs,
            consumables: state.consumables,
            descTemplates: state.descTemplates,
            operations: state.operations,
            requests: state.requests
        }));
    } catch (e) {
        if (typeof toast === 'function') {
            toast('Ошибка сохранения', 'error');
        }
    }
}

function saveSettingsToStorage() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (e) {}
}

// ============================================================
// ФУНКЦИИ СОХРАНЕНИЯ НА СЕРВЕР
// ============================================================

// Исследования
async function saveStudyToServer(study) {
    try {
        await StudiesAPI.save(study);
        console.log('✅ Исследование на сервер:', study.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        if (typeof toast === 'function') toast('⚠️ Не сохранилось на сервер', 'error');
        return false;
    }
}

async function deleteStudyFromServer(id) {
    try {
        await StudiesAPI.delete(id);
        console.log('✅ Исследование удалено:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Заявки
async function saveRequestToServer(request) {
    try {
        await RequestsAPI.save(request);
        console.log('✅ Заявка на сервер:', request.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteRequestFromServer(id) {
    try {
        await RequestsAPI.delete(id);
        console.log('✅ Заявка удалена:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Шаблоны исследований
async function saveTemplateToServer(template) {
    try {
        await apiPost('/templates', template);
        console.log('✅ Шаблон на сервер:', template.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteTemplateFromServer(id) {
    try {
        await apiDelete('/templates/' + id);
        console.log('✅ Шаблон удалён:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Шаблоны описаний
async function saveDescTemplateToServer(template) {
    try {
        await apiPost('/desc-templates', template);
        console.log('✅ Шаблон описания на сервер:', template.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteDescTemplateFromServer(id) {
    try {
        await apiDelete('/desc-templates/' + id);
        console.log('✅ Шаблон описания удалён:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Препараты
async function saveDrugToServer(drug) {
    try {
        await apiPost('/drugs', drug);
        console.log('✅ Препарат на сервер:', drug.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteDrugFromServer(id) {
    try {
        await apiDelete('/drugs/' + id);
        console.log('✅ Препарат удалён:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Расходники
async function saveConsumableToServer(consumable) {
    try {
        await apiPost('/consumables', consumable);
        console.log('✅ Расходник на сервер:', consumable.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteConsumableFromServer(id) {
    try {
        await apiDelete('/consumables/' + id);
        console.log('✅ Расходник удалён:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Операции склада
async function saveOperationToServer(operation) {
    try {
        await apiPost('/operations', operation);
        console.log('✅ Операция на сервер:', operation.id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

async function deleteOperationFromServer(id) {
    try {
        await apiDelete('/operations/' + id);
        console.log('✅ Операция удалена:', id);
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// Настройки
async function saveSettingsToServer() {
    try {
        await apiPost('/settings', state.settings);
        console.log('✅ Настройки на сервер');
        return true;
    } catch (err) {
        console.error('❌ Ошибка:', err);
        return false;
    }
}

// ============================================================
// ЭКСПОРТ/ИМПОРТ JSON
// ============================================================
function exportJSON() {
    const d = {
        version: 24,
        exportedAt: new Date().toISOString(),
        studies: state.studies,
        templates: state.templates,
        drugs: state.drugs,
        consumables: state.consumables,
        descTemplates: state.descTemplates,
        operations: state.operations,
        requests: state.requests,
        settings: state.settings
    };

    const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(b);

    const a = document.createElement('a');
    a.href = u;
    a.download = 'ct-journal-' + todayISO() + '.json';
    a.click();

    URL.revokeObjectURL(u);

    toast('JSON сохранён', 'success');
}

function importJSON(event) {
    const f = event.target.files[0];
    if (!f) return;

    const r = new FileReader();
    r.onload = async e => {
        try {
            const d = JSON.parse(e.target.result);

            if (!confirm('Импортировать?\n• Исследований: ' + (d.studies?.length || 0) + '\n• Заявок: ' + (d.requests?.length || 0))) return;

            state.studies = (d.studies || []).map(migrateStudy);
            state.templates = d.templates || [];
            state.drugs = d.drugs || DEFAULT_DRUGS;
            state.consumables = d.consumables || DEFAULT_CONSUMABLES;
            state.descTemplates = (d.descTemplates || DEFAULT_DESC_TEMPLATES).map(t => {
                if (!t.zone) t.zone = '';
                return t;
            });
            state.operations = d.operations || [];
            state.requests = d.requests || [];

            if (d.settings) {
                state.settings = { ...state.settings, ...d.settings };
                if (!Array.isArray(state.settings.referringDoctors)) {
                    state.settings.referringDoctors = [];
                }
            }

            console.log('📤 Импорт — сохраняем на сервер...');

            for (const s of state.studies) await saveStudyToServer(s);
            for (const r of state.requests) await saveRequestToServer(r);
            for (const t of state.templates) await saveTemplateToServer(t);
            for (const dt of state.descTemplates) await saveDescTemplateToServer(dt);
            for (const d of state.drugs) await saveDrugToServer(d);
            for (const c of state.consumables) await saveConsumableToServer(c);
            for (const o of state.operations) await saveOperationToServer(o);
            await saveSettingsToServer();

            saveState();
            saveSettingsToStorage();
            initApp();

            toast('Импорт выполнен', 'success');

        } catch (err) {
            console.error(err);
            toast('Ошибка', 'error');
        }
    };
    r.readAsText(f);

    event.target.value = '';
}

// ============================================================
// ЭКСПОРТ CSV
// ============================================================
function exportCSV() {
    const headers = [
        '№', '№ смена', 'Статус', 'Дата', 'Время', 'ФИО',
        'Д.р.', 'Возраст', '№ истории', 'Отделение', 'Шаблон',
        'МКБ-10', 'Поступил', 'Зоны', 'Общая доза', 'Контраст',
        'Врач', 'Лаборант', 'Подписан', 'Дата подписи'
    ];

    const numMap = calculateNumbers();
    const statusNames = { pending: 'Ожидает', described: 'Описано', signed: 'Подписано' };

    const rows = state.studies.map(s => {
        const n = numMap[s.id] || { global: '-', shift: '-' };
        const zonesStr = (s.zones || []).map(z => z.name + ' (' + z.type + ')').join('; ');

        return [
            n.global, n.shift, statusNames[s.status || 'pending'],
            s.studyDate, s.studyTime, s.fio, s.birthDate, s.age,
            s.historyNum, s.dept, s.templateName, s.icdDisplay,
            (s.admitDate || '') + ' ' + (s.admitTime || ''),
            zonesStr, s.totalDose, s.contrast, s.doctor, s.lab,
            s.signedBy || '', s.signedAt || ''
        ];
    });

    const csv = [headers, ...rows].map(r =>
        r.map(c => '"' + (c || '').toString().replace(/"/g, '""') + '"').join(';')
    ).join('\n');

    const b = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const u = URL.createObjectURL(b);

    const a = document.createElement('a');
    a.href = u;
    a.download = 'ct-journal-' + todayISO() + '.csv';
    a.click();

    URL.revokeObjectURL(u);

    toast('CSV сохранён', 'success');
}