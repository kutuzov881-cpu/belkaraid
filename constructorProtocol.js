// ============================================================
// КОНСТРУКТОР ПРОТОКОЛА (v25)
// Область → Органы → Норма / Патология → Виджет → Вставка в описание
// ============================================================

// ============================================================
// СТРУКТУРА ОРГАНОВ ПО ОБЛАСТЯМ
// ============================================================
const PROTOCOL_ORGANS = {

    // ============================================================
    // 🫃 ОРГАНЫ БРЮШНОЙ ПОЛОСТИ
    // ============================================================
    abdomen: {
        name: 'Органы брюшной полости',
        icon: '🫃',
        templateCategory: 'obp',
        organs: [
            {
                id: 'liver',
                name: 'Печень',
                widget: 'liver',
                normalText: 'Печень не увеличена, контуры ровные, чёткие. Паренхима однородной структуры, плотность не снижена (55–60 HU). Внутрипечёночные желчные протоки не расширены. Очаговых образований не выявлено.'
            },
            {
                id: 'gallbladder',
                name: 'Желчный пузырь',
                widget: 'bile',
                normalText: 'Желчный пузырь не увеличен, стенка не утолщена (до 3 мм). Паровизикальная клетчатка не изменена. В просвете — однородное содержимое, без рентген-контрастных камней.'
            },
            {
                id: 'bile_ducts',
                name: 'Желчевыводящие пути',
                widget: 'bile',
                normalText: 'Внутрипечёночные желчные протоки не расширены. Общий печёночный проток — до 6 мм. Общий желчный проток — до 6 мм. Пузырный проток проходим.'
            },
            {
                id: 'pancreas',
                name: 'Поджелудочная железа',
                widget: 'pancreas',
                normalText: 'Поджелудочная железа не увеличена, контуры ровные, чёткие. Паренхима однородной структуры, плотность не снижена. Вирсунгов проток не расширен (до 2 мм). Перипанкреатическая клетчатка не изменена.'
            },
            {
                id: 'spleen',
                name: 'Селезёнка',
                widget: 'spleen',
                normalText: 'Селезёнка обычных размеров (длина до 12 см, ширина до 7–8 см), контуры ровные, чёткие. Паренхима однородной структуры, плотность не снижена. Очаговых образований не выявлено.'
            },
            {
                id: 'adrenal',
                name: 'Надпочечники',
                widget: 'adrenal',
                normalText: 'Надпочечники обычной формы и размеров, без очаговых образований. Плотность паренхимы не изменена.'
            },
            {
                id: 'kidneys',
                name: 'Почки',
                widget: 'urinary',
                normalText: 'Почки расположены типично, размеры не увеличены. Паренхима однородной структуры, толщина сохранена. ЧЛС не расширена. Конкременты не выявлены.'
            },
            {
                id: 'stomach',
                name: 'Желудок',
                widget: null,
                normalText: 'Желудок обычной формы, стенки не утолщены, складки сохранены. Просвет не расширен.'
            },
            {
                id: 'intestines',
                name: 'Кишечник',
                widget: null,
                normalText: 'Петли тонкой и толстой кишки не расширены, стенки не утолщены. Пневматоз не выявлен.'
            },
            {
                id: 'mesentery',
                name: 'Брыжейка',
                widget: null,
                normalText: 'Брыжейка без признаков воспаления и объёмных образований. Сосуды проходимы.'
            },
            {
                id: 'peritoneum',
                name: 'Брюшина',
                widget: null,
                normalText: 'Брюшина не утолщена, свободная жидкость в брюшной полости не выявлена.'
            },
            {
                id: 'aorta_abdominal',
                name: 'Брюшная аорта и НПВ',
                widget: null,
                normalText: 'Брюшная аорта и нижняя полая вена не расширены, стенки ровные, без признаков аневризмы, расслоения и тромбоза.'
            },
            {
                id: 'lymph_abdominal',
                name: 'Лимфатические узлы',
                widget: null,
                normalText: 'Лимфатические узлы брюшной полости и забрюшинного пространства не увеличены.'
            },
            {
                id: 'fluid_abdominal',
                name: 'Свободная жидкость',
                widget: null,
                normalText: 'Свободная жидкость в брюшной полости не выявлена.'
            },
            {
                id: 'bones_abdominal',
                name: 'Костный скелет',
                widget: null,
                normalText: 'Костный скелет в зоне сканирования без костно-деструктивных изменений.'
            }
        ]
    },

    // ============================================================
    // 🫁 ОРГАНЫ ГРУДНОЙ КЛЕТКИ
    // ============================================================
    chest: {
        name: 'Органы грудной клетки',
        icon: '🫁',
        templateCategory: 'ogk',
        organs: [
            {
                id: 'lungs',
                name: 'Лёгкие',
                widget: null,
                normalText: 'Лёгочные поля прозрачны на всём протяжении, очаговых и инфильтративных изменений не выявлено. Лёгочный рисунок не усилен.'
            },
            {
                id: 'pleura',
                name: 'Плевральные полости',
                widget: null,
                normalText: 'Плевральные полости свободны, без признаков жидкости и воздуха. Листки плевры не утолщены.'
            },
            {
                id: 'mediastinum',
                name: 'Средостение',
                widget: null,
                normalText: 'Средостение обычной конфигурации, не смещено. Тень средостения не расширена. Внутригрудные лимфатические узлы не увеличены.'
            },
            {
                id: 'heart',
                name: 'Сердце и перикард',
                widget: null,
                normalText: 'Размеры сердца не увеличены. Перикард не утолщён, жидкость в полости перикарда не выявлена.'
            },
            {
                id: 'aorta_chest',
                name: 'Аорта и лёгочная артерия',
                widget: null,
                normalText: 'Аорта и лёгочная артерия не расширены, стенки ровные, без признаков расслоения и аневризмы.'
            },
            {
                id: 'thoracic_aorta',
                name: 'Грудная аорта',
                widget: null,
                normalText: 'Грудная аорта не расширена, стенки ровные, без признаков аневризмы и расслоения.'
            },
            {
                id: 'trachea',
                name: 'Трахея и бронхи',
                widget: null,
                normalText: 'Трахея и главные бронхи проходимы, просветы свободны.'
            },
            {
                id: 'esophagus',
                name: 'Пищевод',
                widget: null,
                normalText: 'Пищевод не расширен, стенки не утолщены.'
            },
            {
                id: 'thymus',
                name: 'Вилочковая железа',
                widget: null,
                normalText: 'Вилочковая железа не увеличена, структура однородна. Объёмных образований не выявлено.'
            },
            {
                id: 'lymph_chest',
                name: 'Внутригрудные лимфоузлы',
                widget: null,
                normalText: 'Внутригрудные лимфатические узлы не увеличены.'
            },
            {
                id: 'bones_chest',
                name: 'Костный каркас',
                widget: null,
                normalText: 'Костный каркас грудной клетки без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'soft_chest',
                name: 'Мягкие ткани',
                widget: null,
                normalText: 'Мягкие ткани грудной стенки без особенностей.'
            }
        ]
    },

    // ============================================================
    // 🧠 ГОЛОВНОЙ МОЗГ
    // ============================================================
    brain: {
        name: 'Головной мозг',
        icon: '🧠',
        templateCategory: 'gm',
        organs: [
            {
                id: 'brain_parenchyma',
                name: 'Паренхима мозга',
                widget: 'aspects',
                normalText: 'Паренхима мозга обычной плотности, дифференциация серого и белого вещества сохранена. Очаговых изменений не выявлено.'
            },
            {
                id: 'brain_ventricles',
                name: 'Желудочковая система',
                widget: null,
                normalText: 'Желудочковая система симметрична, не расширена. Ликворные пространства не изменены.'
            },
            {
                id: 'brain_midline',
                name: 'Срединные структуры',
                widget: null,
                normalText: 'Срединные структуры не смещены.'
            },
            {
                id: 'brain_cisterns',
                name: 'Базальные цистерны',
                widget: null,
                normalText: 'Базальные цистерны не расширены, без признаков САК.'
            },
            {
                id: 'brain_vessels',
                name: 'Интракраниальные сосуды',
                widget: null,
                normalText: 'Интракраниальные сосуды обычного хода, без признаков аневризм, стенозов и окклюзий.'
            },
            {
                id: 'brain_cerebellum',
                name: 'Мозжечок',
                widget: null,
                normalText: 'Мозжечок обычной формы и размеров, структура не изменена. Очаговых образований не выявлено.'
            },
            {
                id: 'brain_stem',
                name: 'Ствол мозга',
                widget: null,
                normalText: 'Ствол мозга без признаков патологических изменений, структура не изменена.'
            },
            {
                id: 'brain_vessels_extra',
                name: 'Экстракраниальные сосуды',
                widget: null,
                normalText: 'Экстракраниальные сосуды проходимы, стенки не утолщены, без признаков стеноза.'
            },
            {
                id: 'brain_sinuses',
                name: 'Околоносовые пазухи',
                widget: null,
                normalText: 'Околоносовые пазухи и клетки сосцевидного отростка воздушны, без патологического содержимого.'
            },
            {
                id: 'brain_bones',
                name: 'Кости черепа',
                widget: null,
                normalText: 'Кости свода и основания черепа без костно-деструктивных изменений.'
            },
            {
                id: 'brain_soft',
                name: 'Мягкие ткани головы',
                widget: null,
                normalText: 'Мягкие ткани головы без особенностей.'
            }
        ]
    },

    // ============================================================
    // 🦴 МАЛЫЙ ТАЗ
    // ============================================================
    pelvis: {
        name: 'Малый таз',
        icon: '🦴',
        templateCategory: 'mt',
        organs: [
            {
                id: 'bladder',
                name: 'Мочевой пузырь',
                widget: 'urinary',
                normalText: 'Мочевой пузырь не увеличен, стенки не утолщены, содержимое однородное, конкременты не выявлены.'
            },
            {
                id: 'rectum',
                name: 'Прямая кишка',
                widget: null,
                normalText: 'Прямая кишка не расширена, стенки не утолщены, просвет не сужен.'
            },
            {
                id: 'uterus',
                name: 'Матка и придатки',
                widget: null,
                normalText: 'Матка и придатки без патологических изменений, размеры обычные.'
            },
            {
                id: 'ovaries',
                name: 'Яичники',
                widget: null,
                normalText: 'Яичники обычных размеров, без кистозных и объёмных образований.'
            },
            {
                id: 'vagina',
                name: 'Влагалище',
                widget: null,
                normalText: 'Влагалище не расширено, стенки не утолщены.'
            },
            {
                id: 'prostate',
                name: 'Предстательная железа',
                widget: null,
                normalText: 'Предстательная железа обычных размеров, контуры ровные, без очаговых изменений.'
            },
            {
                id: 'seminal_vesicles',
                name: 'Семенные пузырьки',
                widget: null,
                normalText: 'Семенные пузырьки обычных размеров, структура не изменена.'
            },
            {
                id: 'lymph_pelvis',
                name: 'Тазовые лимфоузлы',
                widget: null,
                normalText: 'Тазовые лимфатические узлы не увеличены.'
            },
            {
                id: 'fluid_pelvis',
                name: 'Свободная жидкость',
                widget: null,
                normalText: 'Свободная жидкость в полости малого таза не выявлена.'
            },
            {
                id: 'bones_pelvis',
                name: 'Кости таза',
                widget: null,
                normalText: 'Кости таза без костно-деструктивных изменений и травм.'
            }
        ]
    },

    // ============================================================
    // 🦴 ПОЗВОНОЧНИК
    // ============================================================
    spine: {
        name: 'Позвоночник',
        icon: '🦴',
        templateCategory: 'spine',
        organs: [
            {
                id: 'cervical',
                name: 'Шейный отдел',
                widget: null,
                normalText: 'Шейный отдел позвоночника: высота межпозвонковых дисков сохранена, грыж и протрузий не выявлено. Спинномозговой канал не сужен.'
            },
            {
                id: 'thoracic',
                name: 'Грудной отдел',
                widget: null,
                normalText: 'Грудной отдел позвоночника: высота межпозвонковых дисков сохранена, грыж и протрузий не выявлено. Спинномозговой канал не сужен.'
            },
            {
                id: 'lumbar',
                name: 'Поясничный отдел',
                widget: null,
                normalText: 'Поясничный отдел позвоночника: высота межпозвонковых дисков сохранена, грыж и протрузий не выявлено. Спинномозговой канал не сужен.'
            },
            {
                id: 'sacral',
                name: 'Крестцово-копчиковый отдел',
                widget: null,
                normalText: 'Крестцово-копчиковый отдел без костно-деструктивных изменений.'
            },
            {
                id: 'spinal_canal',
                name: 'Спинномозговой канал',
                widget: null,
                normalText: 'Спинномозговой канал не сужен, объёмных образований не выявлено.'
            },
            {
                id: 'paravertebral',
                name: 'Паравертебральные ткани',
                widget: null,
                normalText: 'Паравертебральные мягкие ткани без признаков воспаления и объёмных образований.'
            }
        ]
    },

    // ============================================================
    // 🔙 ЗАБРЮШИННОЕ ПРОСТРАНСТВО
    // ============================================================
    retroperitoneum: {
        name: 'Забрюшинное пространство',
        icon: '🔙',
        templateCategory: 'obp',
        organs: [
            {
                id: 'adrenal_retro',
                name: 'Надпочечники',
                widget: 'adrenal',
                normalText: 'Надпочечники расположены типично, форма не изменена, без очаговых образований.'
            },
            {
                id: 'kidneys_retro',
                name: 'Почки',
                widget: 'urinary',
                normalText: 'Почки типично расположены, размеры не увеличены, паренхима однородна, ЧЛС не расширена.'
            },
            {
                id: 'ureters',
                name: 'Мочеточники',
                widget: null,
                normalText: 'Мочеточники не расширены, конкременты не выявлены.'
            },
            {
                id: 'aorta_retro',
                name: 'Аорта и НПВ',
                widget: null,
                normalText: 'Брюшная аорта и нижняя полая вена не расширены, стенки ровные.'
            },
            {
                id: 'lymph_retro',
                name: 'Забрюшинные лимфоузлы',
                widget: null,
                normalText: 'Забрюшинные лимфатические узлы не увеличены.'
            },
            {
                id: 'soft_retro',
                name: 'Забрюшинная клетчатка',
                widget: null,
                normalText: 'Забрюшинная клетчатка без патологических изменений.'
            }
        ]
    },

    // ============================================================
    // 🔹 ШЕЯ
    // ============================================================
    neck: {
        name: 'Шея',
        icon: '🔹',
        templateCategory: 'neck',
        organs: [
            {
                id: 'neck_lymph',
                name: 'Лимфоузлы шеи',
                widget: null,
                normalText: 'Лимфатические узлы шеи не увеличены, структура не изменена.'
            },
            {
                id: 'neck_vessels',
                name: 'Сосуды шеи',
                widget: null,
                normalText: 'Сонные артерии и яремные вены проходимы, стенки не утолщены, без признаков стеноза.'
            },
            {
                id: 'neck_thyroid',
                name: 'Щитовидная железа',
                widget: null,
                normalText: 'Щитовидная железа обычных размеров, структура однородна, объёмных образований не выявлено.'
            },
            {
                id: 'neck_salivary',
                name: 'Слюнные железы',
                widget: null,
                normalText: 'Слюнные железы обычной формы и размеров, без очаговых изменений.'
            },
            {
                id: 'neck_larynx',
                name: 'Гортань',
                widget: null,
                normalText: 'Гортань обычной формы, просвет не сужен, стенки не утолщены.'
            }
        ]
    },

    // ============================================================
    // 🦴 КОСТНО-МЫШЕЧНАЯ СИСТЕМА
    // ============================================================
    musculoskeletal: {
        name: 'Костно-мышечная система',
        icon: '🦴',
        templateCategory: 'other',
        organs: [
            {
                id: 'shoulder',
                name: 'Плечевой сустав',
                widget: null,
                normalText: 'Плечевой сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'elbow',
                name: 'Локтевой сустав',
                widget: null,
                normalText: 'Локтевой сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'wrist',
                name: 'Лучезапястный сустав',
                widget: null,
                normalText: 'Лучезапястный сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'hip',
                name: 'Тазобедренный сустав',
                widget: null,
                normalText: 'Тазобедренный сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'knee',
                name: 'Коленный сустав',
                widget: null,
                normalText: 'Коленный сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'ankle',
                name: 'Голеностопный сустав',
                widget: null,
                normalText: 'Голеностопный сустав: суставные поверхности конгруэнтны, суставная щель не сужена, выпота нет.'
            },
            {
                id: 'hand',
                name: 'Кисть',
                widget: null,
                normalText: 'Кости кисти без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'forearm',
                name: 'Предплечье',
                widget: null,
                normalText: 'Кости предплечья без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'thigh',
                name: 'Бедро',
                widget: null,
                normalText: 'Кости бедра без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'shin',
                name: 'Голень',
                widget: null,
                normalText: 'Кости голени без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'foot',
                name: 'Стопа',
                widget: null,
                normalText: 'Кости стопы без костно-деструктивных и травматических изменений.'
            },
            {
                id: 'soft_tissue',
                name: 'Мягкие ткани',
                widget: null,
                normalText: 'Мягкие ткани в зоне сканирования без патологических изменений.'
            }
        ]
    }
};

// ============================================================
// СОСТОЯНИЕ КОНСТРУКТОРА
// ============================================================
let protocolConstructorState = {
    currentRegion: 'abdomen',
    organs: {},
    openGroups: new Set(),
    zoneType: 'native',
    zoneName: ''
};

// ============================================================
// КОНСТАНТА: ФРАЗА ПРО КОНТРАСТИРОВАНИЕ
// ============================================================
const CONTRAST_PHRASE = ', гомогенного контрастирования на всём протяжении патологических образований не выявлено, в визуализированных отделах дифференцировка на слои не нарушена';

// ============================================================
// ПОЛУЧИТЬ ОТОБРАЖАЕМЫЙ ТЕКСТ ОРГАНА
// (с учётом типа зоны — натив/контраст)
// ============================================================
function getOrganDisplayText(organ, isNormal) {
    if (!isNormal) {
        const st = protocolConstructorState.organs[organ.id];
        return st ? st.text : '';
    }

    let text = organ.normalText;

    if (protocolConstructorState.zoneType === 'contrast' && text) {
        const lastDot = text.lastIndexOf('.');
        if (lastDot > 0) {
            text = text.slice(0, lastDot) + CONTRAST_PHRASE + text.slice(lastDot);
        } else {
            text += CONTRAST_PHRASE + '.';
        }
    }

    return text;
}

// ============================================================
// ОТКРЫТИЕ КОНСТРУКТОРА
// ============================================================
function openProtocolConstructor() {
    if (!state.currentDoctorStudyId) {
        toast('Сначала откройте исследование', 'error');
        return;
    }

    const study = state.studies.find(s => s.id === state.currentDoctorStudyId);
    if (study && study.zones && study.zones.length) {
        const idx = state.currentSelectedZoneIndex || 0;
        const zone = study.zones[idx];
        if (zone) {
            protocolConstructorState.zoneType = zone.type || 'native';
            protocolConstructorState.zoneName = zone.name || '';
        } else {
            protocolConstructorState.zoneType = 'native';
            protocolConstructorState.zoneName = '';
        }
    } else {
        protocolConstructorState.zoneType = 'native';
        protocolConstructorState.zoneName = '';
    }

    protocolConstructorState.currentRegion = 'abdomen';
    protocolConstructorState.organs = {};
    protocolConstructorState.openGroups = new Set();

    Object.keys(PROTOCOL_ORGANS).forEach(regionKey => {
        PROTOCOL_ORGANS[regionKey].organs.forEach(organ => {
            protocolConstructorState.organs[organ.id] = {
                mode: 'normal',
                text: ''
            };
        });
    });

    renderProtocolConstructor();
    openModal('protocolConstructorModal');
}

// ============================================================
// СМЕНА ОБЛАСТИ
// ============================================================
function setProtocolRegion(regionKey) {
    protocolConstructorState.currentRegion = regionKey;
    protocolConstructorState.openGroups = new Set();
    renderProtocolConstructor();
}

// ============================================================
// УСТАНОВКА РЕЖИМА ОРГАНА (норма/патология)
// ============================================================
function setOrganMode(organId, mode) {
    if (!protocolConstructorState.organs[organId]) {
        protocolConstructorState.organs[organId] = { mode: 'normal', text: '' };
    }
    protocolConstructorState.organs[organId].mode = mode;
    if (mode === 'normal') {
        protocolConstructorState.organs[organId].text = '';
    }
    if (mode === 'pathology') {
        protocolConstructorState.openGroups.add(organId);
    }
    renderProtocolConstructor();
}

// ============================================================
// РЕДАКТИРОВАНИЕ ТЕКСТА ОРГАНА
// ============================================================
function setOrganText(organId, text) {
    if (!protocolConstructorState.organs[organId]) {
        protocolConstructorState.organs[organId] = { mode: 'pathology', text: '' };
    }
    protocolConstructorState.organs[organId].text = text;
}

// ============================================================
// ВЫБРАТЬ ВСЁ КАК НОРМУ
// ============================================================
function setAllOrgansNormal() {
    Object.keys(protocolConstructorState.organs).forEach(organId => {
        protocolConstructorState.organs[organId].mode = 'normal';
        protocolConstructorState.organs[organId].text = '';
    });
    protocolConstructorState.openGroups = new Set();
    renderProtocolConstructor();
    toast('✅ Все органы установлены как «Норма»', 'success');
}

// ============================================================
// ПЕРЕКЛЮЧЕНИЕ ТИПА ИССЛЕДОВАНИЯ (натив ↔ контраст)
// ============================================================
function toggleZoneType() {
    if (protocolConstructorState.zoneType === 'contrast') {
        protocolConstructorState.zoneType = 'native';
        toast('🔄 Переключено на нативную методику', 'success');
    } else {
        protocolConstructorState.zoneType = 'contrast';
        toast('🔄 Переключено на контрастную методику', 'success');
    }
    renderProtocolConstructor();
}

// ============================================================
// ОТКРЫТИЕ ВИДЖЕТА ДЛЯ ОРГАНА
// ============================================================
function openOrganWidget(organId, widgetId) {
    if (!widgetId) {
        toast('Для этого органа нет виджета', 'error');
        return;
    }

    window._widgetTargetOrganId = organId;

    if (typeof openWidget === 'function') {
        openWidget(widgetId);
    } else {
        toast('Виджет не найден: ' + widgetId, 'error');
        window._widgetTargetOrganId = null;
    }
}

// ============================================================
// ОТРИСОВКА ИНДИКАТОРА ТИПА
// ============================================================
function renderProtocolTypeIndicator() {
    const el = document.getElementById('protocolTypeIndicator');
    if (!el) return;

    const isContrast = protocolConstructorState.zoneType === 'contrast';
    const zoneName = protocolConstructorState.zoneName || '—';

    const bgGradient = isContrast
        ? 'linear-gradient(135deg,#f59e0b,#d97706)'
        : 'linear-gradient(135deg,#3b82f6,#2563eb)';

    const typeLabel = isContrast
        ? '💉 С внутривенным контрастированием'
        : '🦴 Нативное исследование';

    const nextTypeLabel = isContrast ? 'натив' : 'контраст';

    el.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 14px;background:' + bgGradient + ';border-radius:10px;margin-bottom:14px;color:#fff">' +
            '<div>' +
                '<div style="font-size:11px;opacity:.9;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Текущий тип исследования</div>' +
                '<div style="font-size:14px;font-weight:700">' + typeLabel + '</div>' +
                '<div style="font-size:11px;opacity:.85;margin-top:2px">Зона: <strong>' + zoneName + '</strong></div>' +
            '</div>' +
            '<button onclick="toggleZoneType()" style="padding:6px 14px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;transition:all .2s" onmouseover="this.style.background=\'rgba(255,255,255,.25)\'" onmouseout="this.style.background=\'rgba(255,255,255,.15)\'">' +
                '🔄 Переключить на ' + nextTypeLabel +
            '</button>' +
        '</div>';
}

// ============================================================
// ОТРИСОВКА КОНСТРУКТОРА
// ============================================================
function renderProtocolConstructor() {
    const region = PROTOCOL_ORGANS[protocolConstructorState.currentRegion];
    if (!region) return;

    const titleEl = document.getElementById('protocolConstructorTitle');
    if (titleEl) {
        titleEl.textContent = region.icon + ' Конструктор протокола — ' + region.name;
    }

    renderProtocolTypeIndicator();

    const selectEl = document.getElementById('protocolRegionSelect');
    if (selectEl) {
        selectEl.innerHTML = Object.entries(PROTOCOL_ORGANS)
            .map(([key, r]) => '<option value="' + key + '" ' + (key === protocolConstructorState.currentRegion ? 'selected' : '') + '>' + r.icon + ' ' + r.name + '</option>')
            .join('');
    }

    const panelEl = document.getElementById('protocolConstructorPanel');
    if (!panelEl) return;

    let html = '';

    region.organs.forEach(organ => {
        const st = protocolConstructorState.organs[organ.id] || { mode: 'normal', text: '' };
        const isNormal = st.mode === 'normal';
        const displayText = getOrganDisplayText(organ, isNormal);
        const isOpen = protocolConstructorState.openGroups.has(organ.id);

        const escapedText = (displayText || '').replace(/</g, '&lt;');
        const arrow = isOpen ? '▼' : '▶';
        const collapsedClass = isOpen ? '' : 'collapsed';
        const readonlyAttr = isNormal ? 'readonly' : '';
        const placeholder = isNormal ? 'Нормальное описание' : 'Опишите патологию или откройте конструктор...';

        html += '<div class="organ-group">';
        html +=   '<div class="organ-group-header" onclick="toggleOrganGroup(\'' + organ.id + '\')">';
        html +=     '<span>' + organ.name + '</span>';
        html +=     '<span id="organ-arrow-' + organ.id + '">' + arrow + '</span>';
        html +=   '</div>';
        html +=   '<div class="organ-group-body ' + collapsedClass + '" id="organ-body-' + organ.id + '">';
        html +=     '<div class="organ-row">';
        html +=       '<div class="organ-name">Состояние:</div>';
        html +=       '<div class="organ-status">';
        html +=         '<button class="organ-status-btn ' + (isNormal ? 'normal' : '') + '" onclick="setOrganMode(\'' + organ.id + '\', \'normal\')">✓ Норма</button>';
        html +=         '<button class="organ-status-btn ' + (!isNormal ? 'pathology' : '') + '" onclick="setOrganMode(\'' + organ.id + '\', \'pathology\')">⚠ Патология</button>';
        html +=       '</div>';
        html +=     '</div>';
        html +=     '<div class="organ-row" style="flex-direction:column;align-items:stretch">';
        html +=       '<textarea class="organ-textarea" ' + readonlyAttr + ' placeholder="' + placeholder + '" oninput="setOrganText(\'' + organ.id + '\', this.value)">' + escapedText + '</textarea>';
        html +=     '</div>';

        if (!isNormal && organ.widget) {
            html += '<div class="organ-row">';
            html +=   '<button class="btn btn-add organ-widget-btn" onclick="openOrganWidget(\'' + organ.id + '\', \'' + organ.widget + '\')">';
            html +=     '🔧 Открыть конструктор «' + organ.name + '»';
            html +=   '</button>';
            html += '</div>';
        }

        if (!isNormal && !organ.widget) {
            html += '<div class="organ-row">';
            html +=   '<div style="font-size:11px;color:var(--text-muted);padding:6px;background:var(--surface-2);border-radius:6px;width:100%">';
            html +=     '💡 Для этого органа нет виджета — опишите патологию вручную в поле выше.';
            html +=   '</div>';
            html += '</div>';
        }

        html +=   '</div>';
        html += '</div>';
    });

    panelEl.innerHTML = html;
}

// ============================================================
// СВОРАЧИВАНИЕ/РАЗВОРАЧИВАНИЕ ГРУППЫ ОРГАНА
// ============================================================
function toggleOrganGroup(organId) {
    const body = document.getElementById('organ-body-' + organId);
    const arrow = document.getElementById('organ-arrow-' + organId);
    if (!body || !arrow) return;

    const isNowCollapsed = body.classList.toggle('collapsed');
    arrow.textContent = isNowCollapsed ? '▶' : '▼';

    if (isNowCollapsed) {
        protocolConstructorState.openGroups.delete(organId);
    } else {
        protocolConstructorState.openGroups.add(organId);
    }
}

// ============================================================
// МЕТОДИКА (для вставки)
// ============================================================
function buildMetodika() {
    const isContrast = protocolConstructorState.zoneType === 'contrast';
    const zoneName = protocolConstructorState.zoneName || '_____';

    if (isContrast) {
        return 'Методика:\n' +
            'Мультиспиральная компьютерная томография с внутривенным болюсным контрастированием. ' +
            'Выполнены нативная, артериальная, венозная и отсроченная фазы сканирования ' +
            'с последующей мультипланарной (MPR) и 3D-реконструкцией.\n\n';
    } else {
        return 'Методика:\n' +
            'Мультиспиральная компьютерная томография органов ' + zoneName + '. ' +
            'Выполнены аксиальные, корональные и сагиттальные срезы ' +
            'с мультипланарной (MPR) и 3D-реконструкцией.\n\n';
    }
}

// ============================================================
// ВСТАВКА ПРОТОКОЛА В ОПИСАНИЕ ЗОНЫ
// ============================================================
function insertProtocolConstructorToDescription() {
    const region = PROTOCOL_ORGANS[protocolConstructorState.currentRegion];
    if (!region) return;

    const metodika = buildMetodika();

    let body = '';

    region.organs.forEach(organ => {
        const st = protocolConstructorState.organs[organ.id];
        if (!st) return;

        if (st.mode === 'normal') {
            const normalText = getOrganDisplayText(organ, true);
            body += organ.name + ': ' + normalText + '\n';
        } else {
            const t = st.text;
            if (t && t.trim()) {
                body += organ.name + ': ' + t.trim() + '\n';
            }
        }
    });

    if (!body.trim()) {
        toast('Нет данных для вставки', 'error');
        return;
    }

    const fullText = metodika + body.trim();

    const ta = document.getElementById('doctorDescription');
    if (!ta) {
        toast('Не найдено поле описания зоны', 'error');
        return;
    }

    const cur = ta.value.trim();
    const separator = cur ? '\n\n' : '';
    ta.value = cur + separator + fullText;
    ta.scrollTop = ta.scrollHeight;

    closeModal('protocolConstructorModal');
    toast('✅ Протокол вставлен в описание', 'success');
}

// ============================================================
// СОХРАНЕНИЕ ШАБЛОНА
// ============================================================
function saveProtocolConstructorAsTemplate() {
    const name = prompt('Название шаблона:');
    if (!name || !name.trim()) return;

    const region = PROTOCOL_ORGANS[protocolConstructorState.currentRegion];
    if (!region) return;

    const metodika = buildMetodika();

    let body = '';
    region.organs.forEach(organ => {
        const st = protocolConstructorState.organs[organ.id];
        if (!st) return;

        if (st.mode === 'normal') {
            const normalText = getOrganDisplayText(organ, true);
            body += organ.name + ': ' + normalText + '\n';
        } else {
            const t = st.text;
            if (t && t.trim()) {
                body += organ.name + ': ' + t.trim() + '\n';
            }
        }
    });

    if (!body.trim()) {
        toast('Нет данных для сохранения', 'error');
        return;
    }

    const fullText = metodika + body.trim();

    state.descTemplates.push({
        id: uid(),
        name: name.trim(),
        category: region.templateCategory || 'other',
        zone: '',
        text: fullText
    });

    saveState();
    if (typeof renderDescTemplatesList === 'function') {
        renderDescTemplatesList('descTemplatesList', true);
    }
    if (typeof renderGroupedTemplates === 'function') {
        renderGroupedTemplates(null);
    }

    toast('✅ Шаблон сохранён: ' + name.trim(), 'success');
}