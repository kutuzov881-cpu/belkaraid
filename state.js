// ============================================================
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ (все данные в одном месте)
// ============================================================

let state = {
    // Список исследований (КТ)
    studies: [],
    // Шаблоны исследований (для лаборанта)
    templates: [],
    // Контрастные препараты
    drugs: DEFAULT_DRUGS,
    // Расходные материалы
    consumables: DEFAULT_CONSUMABLES,
    // Шаблоны описаний (для врача)
    descTemplates: DEFAULT_DESC_TEMPLATES,
    // Журнал операций склада
    operations: [],
    // Заявки от отделений
    requests: [],
    // Настройки приложения
    settings: {
        doctors: ['Иванов И.И.', 'Петров П.П.'],
        labs: ['Сидорова А.А.'],
        depts: ['Хирургия', 'Терапия', 'Онкология', 'Травматология'],
        referringDoctors: [], // ← ВРАЧИ-НАПРАВИТЕЛИ (для заявок от отделений)
        lastDoctor: '',
        lastLab: '',
        customICD: [],
        customNativeZones: [],
        customContrastZones: [],
        passwords: { lab: 'lab', doctor: 'doctor', admin: 'admin', dept: 'dept' }
    },
    // Редактируемые ID (для разных сущностей)
    editingId: null,
    editingDrugId: null,
    editingConsumableId: null,
    editingDescTemplateId: null,
    editingTemplateId: null,
    editingRequestId: null,
    // Текущие зоны в форме создания исследования
    currentZones: { native: [], contrast: [] },
    // Зоны в шаблоне исследования
    templateZones: { native: [], contrast: [] },
    // Зоны в форме заявки
    currentRequestZones: { native: [], contrast: [] },
    // Режим выбора зон
    zonePickerMode: null,
    // Выбранный диагноз МКБ-10
    selectedICD: null,
    // Выбранный диагноз МКБ-10 в заявке
    selectedRequestICD: null,
    // Подтверждение шагов в форме
    stepConfirmed: { native: false, contrast: false, supplies: false },
    // ID текущего исследования в рабочем месте врача
    currentDoctorStudyId: null,
    // Индекс выбранной зоны в рабочем месте врача
    currentSelectedZoneIndex: 0,
    // Текущий пользователь
    currentUser: null,
    // Тип операции склада (in / out)
    currentOpType: null,
    // ID исследования для удаления
    deleteStudyId: null,
    // Флаг: подписанное ли исследование для удаления
    deleteStudySigned: false,
    // Фильтр статуса заявок
    requestFilterStatus: '',
    // ID заявки, которую сейчас принимают в работу
    currentRequestFromId: null
};

// Текущая роль (lab / doctor / admin / dept)
let currentRole = null;

// Отделение текущего пользователя (для роли dept)
let currentDept = null;

// Экземпляры графиков Chart.js
let doctorsChartInstance = null;
let labsChartInstance = null;

// Состояние конструктора протокола (глобальное, для constructor.js)
let currentConstructorState = {};

// Таймер проверки новых заявок
let requestsCheckTimer = null;