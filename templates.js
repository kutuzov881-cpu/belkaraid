// ============================================================
// ШАБЛОНЫ ИССЛЕДОВАНИЙ (ДЛЯ ЛАБОРАНТА)
// v2.0 — сохранение на сервер
// ============================================================

// Отрисовка списка шаблонов
function renderTemplates() {
    const c = document.getElementById('templatesList');

    if (!state.templates.length) {
        c.innerHTML =
            '<div class="empty" style="text-align:center;padding:40px;color:var(--text-muted)">' +
            '<div style="font-size:48px;margin-bottom:12px;opacity:.5">📭</div>' +
            '<div>Пока нет шаблонов</div>' +
            '</div>';
        return;
    }

    c.innerHTML = state.templates.map(t =>
        '<div class="card" style="margin-bottom:8px;padding:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
        '<div style="font-weight:700">📑 ' + t.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted)">Нат: ' + (t.nativeZones?.length || 0) + ', КУ: ' + (t.contrastZones?.length || 0) + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
        '<button class="btn btn-secondary" onclick="editTemplate(\'' + t.id + '\')" style="padding:6px 10px;font-size:11px">✏️</button>' +
        '<button class="btn btn-danger" onclick="deleteTemplate(\'' + t.id + '\')" style="padding:6px 10px;font-size:11px">🗑️</button>' +
        '</div>' +
        '</div>' +
        '</div>'
    ).join('');
}

// Редактирование шаблона
function editTemplate(id) {
    const t = state.templates.find(x => x.id === id);
    if (!t) return;

    state.editingTemplateId = id;
    state.templateZones = {
        native: [...(t.nativeZones || [])],
        contrast: [...(t.contrastZones || [])]
    };

    document.getElementById('templateModalTitle').textContent = '✏️ Редактирование шаблона';
    document.getElementById('templateName').value = t.name;

    renderTemplateZones('native');
    renderTemplateZones('contrast');

    openModal('templateModal');
}

// Удаление шаблона — async + удаление с сервера
async function deleteTemplate(id) {
    if (!confirm('Удалить шаблон?')) return;

    // Удаляем с сервера
    try {
        await deleteTemplateFromServer(id);
        console.log('✅ Шаблон удалён с сервера:', id);
    } catch (err) {
        console.error('❌ Ошибка удаления с сервера:', err);
    }

    state.templates = state.templates.filter(t => t.id !== id);
    saveState();
    renderTemplates();

    toast('Удалён', 'success');
}

// Открыть форму создания шаблона
function openTemplateModal() {
    state.editingTemplateId = null;
    state.templateZones = { native: [], contrast: [] };

    document.getElementById('templateModalTitle').textContent = '📑 Шаблон исследования';
    document.getElementById('templateName').value = '';

    renderTemplateZones('native');
    renderTemplateZones('contrast');

    openModal('templateModal');
}

// Отрисовка зон в шаблоне
function renderTemplateZones(type) {
    const c = document.getElementById(type === 'native' ? 'templateNativeZones' : 'templateContrastZones');
    const z = state.templateZones[type];

    c.innerHTML = z.length ?
        z.map((n, i) =>
            '<div class="zone-chip ' + (type === 'contrast' ? 'contrast' : '') + '">' +
            n +
            '<span class="remove" onclick="removeTemplateZone(\'' + type + '\',' + i + ')">✕</span>' +
            '</div>'
        ).join('') :
        '<div class="zone-empty">Не выбрано</div>';
}

// Удаление зоны из шаблона
function removeTemplateZone(type, idx) {
    state.templateZones[type].splice(idx, 1);
    renderTemplateZones(type);
}

// Сохранение шаблона — async + сохранение на сервер
async function saveTemplate() {
    const n = document.getElementById('templateName').value.trim();

    if (!n) {
        toast('Введите название', 'error');
        return;
    }

    let template;

    if (state.editingTemplateId) {
        const idx = state.templates.findIndex(t => t.id === state.editingTemplateId);
        template = {
            ...state.templates[idx],
            name: n,
            nativeZones: [...state.templateZones.native],
            contrastZones: [...state.templateZones.contrast]
        };
        state.templates[idx] = template;
        toast('Шаблон обновлён', 'success');
    } else {
        template = {
            id: uid(),
            name: n,
            nativeZones: [...state.templateZones.native],
            contrastZones: [...state.templateZones.contrast]
        };
        state.templates.push(template);
        toast('Шаблон создан', 'success');
    }

    // Сохраняем на сервер
    try {
        await saveTemplateToServer(template);
        console.log('✅ Шаблон на сервер:', template.id);
    } catch (err) {
        console.error('❌ Ошибка сохранения на сервер:', err);
        toast('⚠️ Сохранено локально, но не на сервер', 'error');
    }

    saveState();
    closeModal('templateModal');
    renderTemplates();
    populateTemplateSelect();

    state.editingTemplateId = null;
}