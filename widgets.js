// ============================================================
// КОНСТРУКТОРЫ ПРОТОКОЛОВ (виджеты для рабочего места врача)
// ============================================================

const WIDGET_URLS = {
    aspects:  'widgets/aspects.html',
    liver:    'widgets/liver.html',
    bile:     'widgets/bile.html',
    pancreas: 'widgets/pancreas.html',
    spleen:   'widgets/spleen.html',
    adrenal:  'widgets/adrenal.html',
    urinary:  'widgets/urinary.html'
};

const WIDGET_TITLES = {
    aspects:  '🧠 ASPECTS-10 — Головной мозг',
    liver:    '🫀 Печень — сегменты Couinaud',
    bile:     '💧 Желчевыводящая система',
    pancreas: '🫁 Поджелудочная железа',
    spleen:   '🩸 Селезёнка',
    adrenal:  '🫘 Надпочечники',
    urinary:  '🫘 Мочевая система'
};

// ============================================================
// Открыть меню выбора виджета (старая кнопка «🩺 Конструкторы по областям»)
// ============================================================
function openWidgetsMenu() {
    if (!state.currentDoctorStudyId) {
        toast('Сначала откройте исследование', 'error');
        return;
    }
    openModal('widgetsMenuModal');
}

// ============================================================
// Открыть конкретный виджет
// ============================================================
function openWidget(name) {
    const url = WIDGET_URLS[name];
    if (!url) {
        toast('Виджет не найден', 'error');
        return;
    }

    const titleEl = document.getElementById('widgetFrameTitle');
    if (titleEl) titleEl.textContent = WIDGET_TITLES[name] || 'Конструктор';

    const frame = document.getElementById('widgetFrame');
    if (frame) frame.src = url;

    closeModal('widgetsMenuModal');
    openModal('widgetFrameModal');
}

// ============================================================
// Закрыть виджет
// ============================================================
function closeWidget() {
    const frame = document.getElementById('widgetFrame');
    if (frame) frame.src = '';
    closeModal('widgetFrameModal');
    // Сбрасываем target, если виджет закрыли без вставки
    window._widgetTargetOrganId = null;
}

// ============================================================
// ПРИЁМ РЕЗУЛЬТАТА ОТ ВИДЖЕТА (postMessage)
// ============================================================
window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'widget-result') return;

    const text = event.data.text || '';
    if (!text.trim()) {
        toast('Виджет не сформировал текст', 'error');
        return;
    }

    // ============================================================
    // СЦЕНАРИЙ 1: Виджет открыт ИЗ КОНСТРУКТОРА ПРОТОКОЛА
    // Вставляем текст в конкретное поле органа
    // ============================================================
    if (window._widgetTargetOrganId) {
        const organId = window._widgetTargetOrganId;

        if (typeof protocolConstructorState !== 'undefined' && protocolConstructorState.organs[organId]) {
            protocolConstructorState.organs[organId].text = text.trim();
            protocolConstructorState.organs[organId].mode = 'pathology';

            // Перерисовываем конструктор
            if (typeof renderProtocolConstructor === 'function') {
                renderProtocolConstructor();
            }

            closeWidget();
            toast('✅ Патология вставлена в поле органа', 'success');
            window._widgetTargetOrganId = null;
            return;
        }
    }

    // ============================================================
    // СЦЕНАРИЙ 2: Виджет открыт напрямую (старая кнопка)
    // Вставляем текст в #doctorDescription
    // ============================================================
    const ta = document.getElementById('doctorDescription');
    if (!ta) {
        toast('Не найдено поле описания зоны', 'error');
        return;
    }

    const cur = ta.value.trim();
    const separator = cur ? '\n\n' : '';
    ta.value = cur + separator + text.trim();
    ta.scrollTop = ta.scrollHeight;

    closeWidget();
    toast('✅ Протокол вставлен в описание зоны', 'success');
});