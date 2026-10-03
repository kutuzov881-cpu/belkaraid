// ============================================================
// НАСТРОЙКИ
// v2.0 — сохранение на сервер
// ============================================================

function loadSettingsToForm() {
    const doctorsEl = document.getElementById('doctorsList');
    if (doctorsEl) doctorsEl.value = state.settings.doctors.join('\n');

    const labEl = document.getElementById('labList');
    if (labEl) labEl.value = state.settings.labs.join('\n');

    const deptsEl = document.getElementById('deptsList');
    if (deptsEl) deptsEl.value = state.settings.depts.join('\n');

    const icdEl = document.getElementById('customICDList');
    if (icdEl) {
        icdEl.value = (state.settings.customICD || [])
            .map(d => d.code + ' - ' + d.name).join('\n');
    }

    const refDoctorsEl = document.getElementById('referringDoctorsList');
    if (refDoctorsEl) {
        refDoctorsEl.value = (state.settings.referringDoctors || []).join('\n');
    }
}

// Сохранение сотрудников — async
async function saveSettings() {
    const doctorsEl = document.getElementById('doctorsList');
    if (doctorsEl) {
        state.settings.doctors = doctorsEl.value
            .split('\n').map(s => s.trim()).filter(Boolean);
    }

    const labEl = document.getElementById('labList');
    if (labEl) {
        state.settings.labs = labEl.value
            .split('\n').map(s => s.trim()).filter(Boolean);
    }

    const deptsEl = document.getElementById('deptsList');
    if (deptsEl) {
        state.settings.depts = deptsEl.value
            .split('\n').map(s => s.trim()).filter(Boolean);
    }

    saveSettingsToStorage();
    await saveSettingsToServer();
    populateFilterSelects();

    toast('Сохранено', 'success');
}

// Сохранение врачей-направителей — async
async function saveReferringDoctors() {
    const el = document.getElementById('referringDoctorsList');
    if (!el) return;

    const lines = el.value.split('\n').map(s => s.trim()).filter(Boolean);
    state.settings.referringDoctors = lines;

    saveSettingsToStorage();
    await saveSettingsToServer();

    toast('Сохранено врачей-направителей: ' + lines.length, 'success');
}

// Сохранение паролей — async
async function savePasswords() {
    state.settings.passwords = {
        lab: document.getElementById('pwdLab').value || 'lab',
        doctor: document.getElementById('pwdDoctor').value || 'doctor',
        admin: document.getElementById('pwdAdmin').value || 'admin',
        dept: document.getElementById('pwdDept').value || 'dept'
    };

    saveSettingsToStorage();
    await saveSettingsToServer();

    toast('Пароли сохранены', 'success');
}

// Сохранение пользовательских МКБ — async
async function saveCustomICD() {
    const text = document.getElementById('customICDList').value;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const parsed = [];
    lines.forEach(line => {
        const match = line.match(/^([A-Za-zА-Яа-я0-9\.]+)\s*[-–—]\s*(.+)$/);
        if (match) {
            parsed.push({
                code: match[1].toUpperCase().trim(),
                name: match[2].trim()
            });
        }
    });

    state.settings.customICD = parsed;
    saveSettingsToStorage();
    await saveSettingsToServer();

    toast('Сохранено ' + parsed.length + ' диагнозов', 'success');
}

// Сохранение пользовательских зон — async
async function saveCustomZones() {
    const natText = document.getElementById('customNativeZones').value;
    const conText = document.getElementById('customContrastZones').value;

    const parseZones = (text) => {
        return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
            const match = line.match(/^(.+?)\s*[-–—]\s*([\d.]+)$/);
            if (match) {
                return { name: match[1].trim(), dose: parseFloat(match[2]) };
            }
            return null;
        }).filter(Boolean);
    };

    state.settings.customNativeZones = parseZones(natText);
    state.settings.customContrastZones = parseZones(conText);

    saveSettingsToStorage();
    await saveSettingsToServer();

    toast('Сохранено зон: нативных ' + state.settings.customNativeZones.length +
        ', с КУ ' + state.settings.customContrastZones.length, 'success');
}

// ============================================================
// ОПАСНАЯ ЗОНА
// ============================================================
function openConfirmDeleteModal() {
    const studiesCount = state.studies.length;
    const templatesCount = state.templates.length;
    const descTemplatesCount = state.descTemplates.length;
    const operationsCount = state.operations.length;
    const drugsCount = state.drugs.length;
    const consumablesCount = state.consumables.length;
    const requestsCount = state.requests.length;

    const list = document.getElementById('confirmDeleteList');
    list.innerHTML = `
        <div>🩻 Исследований: <strong>${studiesCount}</strong></div>
        <div>📨 Заявок: <strong>${requestsCount}</strong></div>
        <div>📑 Шаблонов исследований: <strong>${templatesCount}</strong></div>
        <div>📝 Шаблонов описаний: <strong>${descTemplatesCount}</strong></div>
        <div>📜 Операций склада: <strong>${operationsCount}</strong></div>
        <div>💉 Контрастных препаратов: <strong>${drugsCount}</strong></div>
        <div>🔧 Расходных материалов: <strong>${consumablesCount}</strong></div>
    `;

    openModal('confirmDeleteModal');
}

// Полная очистка — async
async function confirmClearAllData() {
    // Удаляем всё с сервера
    try {
        // Исследования
        for (const s of state.studies) {
            await deleteStudyFromServer(s.id);
        }
        // Заявки
        for (const r of state.requests) {
            await deleteRequestFromServer(r.id);
        }
        // Шаблоны
        for (const t of state.templates) {
            await deleteTemplateFromServer(t.id);
        }
        // Шаблоны описаний
        for (const dt of state.descTemplates) {
            await deleteDescTemplateFromServer(dt.id);
        }
        // Операции
        for (const o of state.operations) {
            await deleteOperationFromServer(o.id);
        }
        // Препараты — оставляем стандартные
        for (const d of state.drugs) {
            await deleteDrugFromServer(d.id);
        }
        for (const c of state.consumables) {
            await deleteConsumableFromServer(c.id);
        }
    } catch (err) {
        console.error('Ошибка очистки на сервере:', err);
    }

    // Обнуляем state
    state.studies = [];
    state.templates = [];
    state.descTemplates = DEFAULT_DESC_TEMPLATES.slice();
    state.drugs = DEFAULT_DRUGS.map(d => ({ ...d }));
    state.consumables = DEFAULT_CONSUMABLES.map(c => ({ ...c }));
    state.operations = [];
    state.requests = [];

    state.settings.referringDoctors = [...DEFAULT_REFERRING_DOCTORS];

    // Сбрасываем флаги
    state.editingId = null;
    state.editingDrugId = null;
    state.editingConsumableId = null;
    state.editingDescTemplateId = null;
    state.editingTemplateId = null;
    state.currentZones = { native: [], contrast: [] };
    state.templateZones = { native: [], contrast: [] };
    state.currentRequestZones = { native: [], contrast: [] };
    state.zonePickerMode = null;
    state.selectedICD = null;
    state.selectedRequestICD = null;
    state.stepConfirmed = { native: false, contrast: false, supplies: false };
    state.currentDoctorStudyId = null;
    state.currentSelectedZoneIndex = 0;
    state.currentOpType = null;
    state.currentRequestFromId = null;

    // Восстанавливаем стандартные данные на сервере
    for (const dt of DEFAULT_DESC_TEMPLATES) {
        await saveDescTemplateToServer(dt);
    }
    for (const d of DEFAULT_DRUGS) {
        await saveDrugToServer(d);
    }
    for (const c of DEFAULT_CONSUMABLES) {
        await saveConsumableToServer(c);
    }
    await saveSettingsToServer();

    saveState();
    saveSettingsToStorage();

    renderJournal();
    renderQuickStats();
    renderStock();
    renderOperations();
    renderReport();
    renderTemplates();
    renderDescTemplatesList('descTemplatesList', true);
    renderRequests();
    updateRequestsBadge();

    closeModal('confirmDeleteModal');
    toast('Все данные удалены', 'success');
}