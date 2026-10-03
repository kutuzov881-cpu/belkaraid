// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

// Получить все нативные зоны (стандартные + пользовательские)
function getAllNativeZones() {
    return [...DEFAULT_ZONES.native, ...(state.settings.customNativeZones || [])];
}

// Получить все зоны с контрастом (стандартные + пользовательские)
function getAllContrastZones() {
    return [...DEFAULT_ZONES.contrast, ...(state.settings.customContrastZones || [])];
}

// Найти дозу для зоны по имени
function findZoneDose(name) {
    const z = [
        ...DEFAULT_ZONES.native,
        ...DEFAULT_ZONES.contrast,
        ...(state.settings.customNativeZones || []),
        ...(state.settings.customContrastZones || [])
    ].find(x => x.name === name);
    return z ? z.dose : 0;
}

// Генерация уникального ID
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Форматирование даты (YYYY-MM-DD → DD.MM.YYYY)
function formatDate(d) {
    if (!d) return '';
    const p = d.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : d;
}

// Форматирование даты и времени из ISO
function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return formatDate(d.toISOString().slice(0, 10)) + ' ' + d.toTimeString().slice(0, 5);
}

// Сегодня в формате YYYY-MM-DD
function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
}

// Текущее время HH:MM
function nowTime() {
    return new Date().toTimeString().slice(0, 5);
}

// Текущее время в ISO
function nowISO() {
    return new Date().toISOString();
}

// Вычислить возраст по дате рождения
function calcAgeFromDate(bd) {
    if (!bd) return '';
    const b = new Date(bd);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
}

// ============================================================
// ПРИБАВИТЬ N ДНЕЙ К ДАТЕ (ISO)
// addDays('2026-09-15', 1) → '2026-09-16'
// Без Date-часового пояса — чистая математика
// ============================================================
function addDays(isoDate, days) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Создаём дату в UTC (без локального времени)
    const d = new Date(Date.UTC(year, month - 1, day + days));

    // Читаем тоже в UTC
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');

    return y + '-' + m + '-' + dd;
}

// ============================================================
// ПАРСИНГ ДАТ (свободный ввод)
// Принимает: 13.09.2026, 13/09/2026, 13-09-2026, 2026-09-13, 13.9.26, 13/9/26
// Возвращает: "2026-09-13" или null, если не удалось распарсить
// ============================================================
function parseDate(str) {
    if (!str) return null;
    str = String(str).trim();

    // 1. Попробуем как ISO: YYYY-MM-DD
    let m = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (m) {
        const [_, y, mo, d] = m;
        return _buildISO(y, mo, d);
    }

    // 2. Попробуем как ДД.ММ.ГГГГ или ДД/ММ/ГГГГ или ДД-ММ-ГГГГ
    m = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/);
    if (m) {
        const [_, d, mo, y] = m;
        return _buildISO(y, mo, d);
    }

    // 3. Попробуем как ДДММГГГГ (без разделителей) — 8 цифр
    m = str.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) {
        const [_, d, mo, y] = m;
        return _buildISO(y, mo, d);
    }

    // 4. Попробуем как ГГГГММДД (без разделителей) — 8 цифр
    m = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) {
        const [_, y, mo, d] = m;
        return _buildISO(y, mo, d);
    }

    return null;
}

// Внутренняя: собирает ISO-строку из компонентов
function _buildISO(y, mo, d) {
    y = String(y);
    mo = String(mo).padStart(2, '0');
    d = String(d).padStart(2, '0');

    // Если год двузначный (26) — превращаем в 2026
    if (y.length === 2) {
        const yr = parseInt(y, 10);
        y = String(yr < 50 ? 2000 + yr : 1900 + yr);
    }
    if (y.length !== 4) return null;

    const year = parseInt(y, 10);
    const month = parseInt(mo, 10);
    const day = parseInt(d, 10);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;

    // Проверим, что дата реально существует (нет 31 февраля)
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(dt.getTime())) return null;
    if (dt.getUTCFullYear() !== year) return null;
    if (dt.getUTCMonth() + 1 !== month) return null;
    if (dt.getUTCDate() !== day) return null;

    return y + '-' + mo + '-' + d;
}

// Форматирует ISO-дату в ДД.ММ.ГГГГ для отображения в текстовом поле
function formatDateInput(iso) {
    if (!iso) return '';
    // Если это уже ISO (YYYY-MM-DD) — форматируем
    const p = iso.split('-');
    if (p.length === 3 && p[0].length === 4) {
        return p[2] + '.' + p[1] + '.' + p[0];
    }
    // Если не ISO — вернём как есть (не должно случаться)
    return iso;
}

// Обработчик blur для текстового поля даты:
// - принимает "13.09.2026", "13/9/26", "20260913" и т.п.
// - приводит к "13.09.2026" для отображения
function normalizeDateInput(input) {
    const raw = input.value.trim();
    if (!raw) {
        input.value = '';
        input.classList.remove('invalid');
        return null;
    }

    const iso = parseDate(raw);
    if (iso) {
        input.value = formatDateInput(iso);
        input.classList.remove('invalid');
        input.dataset.isoValue = iso;  // сохраняем ISO для чтения
        return iso;
    } else {
        input.classList.add('invalid');
        return null;
    }
}

// Обработчик input для текстового поля даты:
// - парсит на лету, если получилось — обновляет дату
// - для автообновления возраста при вводе
function handleDateInput(input) {
    const raw = input.value.trim();
    if (!raw) {
        input.dataset.isoValue = '';
        input.classList.remove('invalid');
        return null;
    }
    const iso = parseDate(raw);
    if (iso) {
        input.dataset.isoValue = iso;
        input.classList.remove('invalid');
    } else {
        // Не подсвечиваем ошибку, пока пользователь не закончил ввод
        input.dataset.isoValue = '';
    }
    return iso;
}

// Получить ISO-дату из текстового поля (для сохранения)
function getDateFromInput(input) {
    if (!input) return '';
    if (input.dataset.isoValue) return input.dataset.isoValue;
    const iso = parseDate(input.value.trim());
    return iso || '';
}

// Установить дату в текстовое поле (ISO → ДД.ММ.ГГГГ)
function setDateInput(input, iso) {
    if (!input) return;
    if (!iso) {
        input.value = '';
        input.dataset.isoValue = '';
        return;
    }
    input.value = formatDateInput(iso);
    input.dataset.isoValue = iso;
}

// Показать уведомление
function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast ' + type, 2500);
}

// Определить дату смены (если время до 8:00 — предыдущий день)
function getShiftDate(d, t) {
    if (!d) return d;
    const h = parseInt((t || '00:00').split(':')[0]);
    if (h < 8) {
        // Отнимаем 1 день через UTC (без сдвига часового пояса)
        const parts = d.split('-');
        if (parts.length !== 3) return d;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const dt = new Date(Date.UTC(year, month - 1, day - 1));
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        return y + '-' + m + '-' + dd;
    }
    return d;
}

// Открыть модальное окно
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

// Закрыть модальное окно
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

// ============================================================
// МИГРАЦИЯ СТАРЫХ ДАННЫХ (конвертация в новый формат с зонами)
// ============================================================
function migrateStudy(study) {
    if (study.zones && study.zones.length) return study;

    const zones = [];

    (study.nativeZones || []).forEach(name => {
        zones.push({
            name: name,
            type: 'native',
            dose: findZoneDose(name),
            description: '',
            status: 'pending',
            signedBy: '',
            signedAt: ''
        });
    });

    (study.contrastZones || []).forEach(name => {
        zones.push({
            name: name,
            type: 'contrast',
            dose: findZoneDose(name),
            description: '',
            status: 'pending',
            signedBy: '',
            signedAt: ''
        });
    });

    if (study.description && zones.length) {
        zones[0].description = study.description;
        if (zones[0].description.trim()) zones[0].status = 'described';
    }

    return { ...study, zones: zones };
}