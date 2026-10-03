// ============================================================
// АВТОБЭКАПЫ — автоматическое резервное копирование
// ============================================================

const BACKUP_KEY = 'ct_journal_backups_v24';
const BACKUP_SETTINGS_KEY = 'ct_journal_backup_settings_v24';

// Настройки по умолчанию
let backupSettings = {
    enabled: true,
    intervalHours: 24,
    maxBackups: 7,
    lastBackupTime: 0
};

// ============================================================
// 1. ИНИЦИАЛИЗАЦИЯ
// ============================================================
function initBackupSystem() {
    // Загружаем настройки
    loadBackupSettings();

    // Проверяем, нужен ли новый бэкап
    checkAndCreateAutoBackup();

    // Обновляем UI + синхронизируем галочку
    renderBackupList();

    // Таймер — проверяем каждый час
    setInterval(checkAndCreateAutoBackup, 60 * 60 * 1000);

    console.log('✅ Система бэкапов запущена');
}

// ============================================================
// 2. НАСТРОЙКИ
// ============================================================
function loadBackupSettings() {
    try {
        const saved = localStorage.getItem(BACKUP_SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            backupSettings = { ...backupSettings, ...parsed };
        }
    } catch (e) {
        console.warn('Ошибка загрузки настроек бэкапа:', e);
    }
}

function saveBackupSettings() {
    try {
        localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(backupSettings));
    } catch (e) {
        console.warn('Ошибка сохранения настроек бэкапа:', e);
    }
}

// ============================================================
// 3. СОЗДАНИЕ БЭКАПА
// ============================================================
function checkAndCreateAutoBackup() {
    if (!backupSettings.enabled) return;

    const now = Date.now();
    const intervalMs = backupSettings.intervalHours * 60 * 60 * 1000;

    if (now - backupSettings.lastBackupTime >= intervalMs) {
        createBackup('Авто');
    }
}

function createBackup(type) {
    try {
        // Собираем данные
        const data = {
            version: 24,
            type: type || 'Ручной',
            createdAt: new Date().toISOString(),
            createdAtTimestamp: Date.now(),
            studies: state.studies,
            templates: state.templates,
            drugs: state.drugs,
            consumables: state.consumables,
            descTemplates: state.descTemplates,
            operations: state.operations,
            requests: state.requests,
            settings: state.settings
        };

        // Размер в KB
        const jsonStr = JSON.stringify(data);
        const sizeKB = (jsonStr.length / 1024).toFixed(1);

        // Читаем существующие бэкапы
        let backups = [];
        try {
            const saved = localStorage.getItem(BACKUP_KEY);
            if (saved) backups = JSON.parse(saved);
        } catch (e) { backups = []; }

        // Добавляем новый
        backups.unshift({
            id: 'bk_' + Date.now(),
            type: type || 'Ручной',
            createdAt: data.createdAt,
            sizeKB: sizeKB,
            data: data
        });

        // Ограничиваем количество
        if (backups.length > backupSettings.maxBackups) {
            backups = backups.slice(0, backupSettings.maxBackups);
        }

        // Сохраняем
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));

        // Обновляем время последнего бэкапа
        backupSettings.lastBackupTime = Date.now();
        saveBackupSettings();

        // Обновляем UI
        renderBackupList();

        console.log('✅ Бэкап создан: ' + type + ', размер ' + sizeKB + ' КБ, всего ' + backups.length);

        if (type === 'Ручной') {
            toast('Бэкап создан (' + sizeKB + ' КБ)', 'success');
        }

        return true;
    } catch (e) {
        console.error('Ошибка создания бэкапа:', e);
        if (e.name === 'QuotaExceededError') {
            toast('⚠️ Хранилище переполнено. Удалите старые бэкапы.', 'error');
        }
        return false;
    }
}

// ============================================================
// 4. ВОССТАНОВЛЕНИЕ ИЗ БЭКАПА
// ============================================================
function restoreFromBackup(backupId) {
    try {
        const saved = localStorage.getItem(BACKUP_KEY);
        if (!saved) {
            toast('Бэкапы не найдены', 'error');
            return;
        }
        const backups = JSON.parse(saved);
        const backup = backups.find(b => b.id === backupId);
        if (!backup) {
            toast('Бэкап не найден', 'error');
            return;
        }

        const dateStr = formatDateTime(backup.createdAt);
        if (!confirm('Восстановить данные из бэкапа от ' + dateStr + '?\n\nВНИМАНИЕ: текущие данные будут перезаписаны!')) {
            return;
        }

        // Сначала сохраняем текущее состояние в резервный бэкап
        createBackup('Перед восстановлением');

        // Восстанавливаем
        const d = backup.data;
        state.studies = (d.studies || []).map(migrateStudy);
        state.templates = d.templates || [];
        state.drugs = d.drugs || DEFAULT_DRUGS;
        state.consumables = d.consumables || DEFAULT_CONSUMABLES;
        state.descTemplates = d.descTemplates || DEFAULT_DESC_TEMPLATES;
        state.operations = d.operations || [];
        state.requests = d.requests || [];

        if (d.settings) {
            state.settings = { ...state.settings, ...d.settings };
        }

        // Сохраняем
        saveState();
        saveSettingsToStorage();

        // Перезагружаем UI
        if (typeof initApp === 'function') initApp();
        if (typeof renderJournal === 'function') renderJournal();
        if (typeof renderQuickStats === 'function') renderQuickStats();

        toast('✅ Данные восстановлены', 'success');
    } catch (e) {
        console.error('Ошибка восстановления:', e);
        toast('Ошибка восстановления: ' + e.message, 'error');
    }
}

// ============================================================
// 5. УДАЛЕНИЕ БЭКАПА
// ============================================================
function deleteBackup(backupId) {
    try {
        const saved = localStorage.getItem(BACKUP_KEY);
        if (!saved) return;
        let backups = JSON.parse(saved);

        if (!confirm('Удалить этот бэкап?')) return;

        backups = backups.filter(b => b.id !== backupId);
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));

        renderBackupList();
        toast('Бэкап удалён', 'success');
    } catch (e) {
        console.error('Ошибка удаления:', e);
    }
}

// ============================================================
// 6. ОЧИСТКА ВСЕХ БЭКАПОВ
// ============================================================
function clearAllBackups() {
    if (!confirm('Удалить ВСЕ бэкапы?\n\nЭто действие необратимо.')) return;

    localStorage.removeItem(BACKUP_KEY);
    backupSettings.lastBackupTime = 0;
    saveBackupSettings();

    renderBackupList();
    toast('Все бэкапы удалены', 'success');
}

// ============================================================
// 7. СИНХРОНИЗАЦИЯ UI С НАСТРОЙКАМИ
// ============================================================
function syncBackupUI() {
    const enabledEl = document.getElementById('backupEnabled');
    if (enabledEl) enabledEl.checked = backupSettings.enabled;

    const intervalEl = document.getElementById('backupInterval');
    if (intervalEl) intervalEl.value = String(backupSettings.intervalHours);

    const maxEl = document.getElementById('backupMax');
    if (maxEl) maxEl.value = String(backupSettings.maxBackups);
}

// ============================================================
// 8. ОТРИСОВКА СПИСКА БЭКАПОВ
// ============================================================
function renderBackupList() {
    const el = document.getElementById('backupList');
    if (!el) return;

    // Синхронизируем UI с настройками
    syncBackupUI();

    let backups = [];
    try {
        const saved = localStorage.getItem(BACKUP_KEY);
        if (saved) backups = JSON.parse(saved);
    } catch (e) { backups = []; }

    // Статистика
    const totalSizeKB = backups.reduce((sum, b) => sum + parseFloat(b.sizeKB || 0), 0).toFixed(1);
    const lastBackup = backups.length ? formatDateTime(backups[0].createdAt) : '—';

    // Инфо-блок
    let html =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">' +
            '<div class="stat-card">' +
                '<div class="stat-label">📦 Бэкапов</div>' +
                '<div class="stat-value">' + backups.length + ' / ' + backupSettings.maxBackups + '</div>' +
            '</div>' +
            '<div class="stat-card accent">' +
                '<div class="stat-label">💾 Размер</div>' +
                '<div class="stat-value">' + totalSizeKB + ' <span class="stat-unit">КБ</span></div>' +
            '</div>' +
            '<div class="stat-card success">' +
                '<div class="stat-label">🕐 Последний</div>' +
                '<div class="stat-value" style="font-size:14px">' + lastBackup + '</div>' +
            '</div>' +
        '</div>';

    // Кнопки
    html +=
        '<div class="btn-row" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-primary" onclick="createBackup(\'Ручной\')">💾 Создать бэкап сейчас</button>' +
        '<button class="btn btn-secondary" onclick="clearAllBackups()">🗑️ Очистить все</button>' +
    '</div>';

    // Список бэкапов
    if (!backups.length) {
        html += '<div style="text-align:center;padding:20px;color:var(--text-muted)">📭 Нет бэкапов</div>';
    } else {
        html += '<div style="font-weight:700;margin-bottom:8px;font-size:13px">📋 История:</div>';
        html += '<div style="max-height:300px;overflow-y:auto">';

        backups.forEach(b => {
            const dateStr = formatDateTime(b.createdAt);
            const typeColor = b.type === 'Авто' ? 'success'
                : b.type === 'Ручной' ? ''
                : 'warning';
            const typeBadge = '<span class="badge ' + typeColor + '">' + b.type + '</span>';

            html +=
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px">' +
                    '<div>' +
                        '<div style="font-weight:600;font-size:13px">' + dateStr + '</div>' +
                        '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' +
                            typeBadge +
                            '<span style="margin-left:6px">' + b.sizeKB + ' КБ</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:flex;gap:6px">' +
                        '<button class="btn btn-success" onclick="restoreFromBackup(\'' + b.id + '\')" style="padding:6px 12px;font-size:11px">📥 Восстановить</button>' +
                        '<button class="btn btn-danger" onclick="deleteBackup(\'' + b.id + '\')" style="padding:6px 10px;font-size:11px">🗑️</button>' +
                    '</div>' +
                '</div>';
        });

        html += '</div>';
    }

    el.innerHTML = html;
}

// ============================================================
// 9. УПРАВЛЕНИЕ НАСТРОЙКАМИ ЧЕРЕЗ UI
// ============================================================
function toggleBackupEnabled(checked) {
    backupSettings.enabled = checked;
    saveBackupSettings();
    toast('Автобэкап ' + (checked ? 'включён' : 'выключен'), 'success');
}

function updateBackupInterval(value) {
    backupSettings.intervalHours = parseInt(value, 10) || 24;
    saveBackupSettings();
    toast('Интервал: ' + backupSettings.intervalHours + ' ч', 'success');
}

function updateMaxBackups(value) {
    backupSettings.maxBackups = Math.max(1, Math.min(20, parseInt(value, 10) || 7));
    saveBackupSettings();
    renderBackupList();
}