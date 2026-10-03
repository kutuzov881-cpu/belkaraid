// ============================================================
// API-КЛИЕНТ ДЛЯ КТ-ЖУРНАЛА
// Обёртка для запросов к backend-серверу
// ============================================================

// Базовый URL API — текущий адрес (localhost:3000 или 192.168.0.10:3000)
const API_BASE = window.location.origin + '/api';

// ============================================================
// УНИВЕРСАЛЬНЫЙ ЗАПРОС
// ============================================================
async function apiRequest(method, path, data = null) {
    const url = API_BASE + path;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('HTTP ' + response.status + ': ' + errorText);
        }

        // Если ответ пустой (204) — вернуть null
        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (err) {
        console.error('API Error [' + method + ' ' + path + ']:', err);
        throw err;
    }
}

// ============================================================
// ОБЁРТКИ
// ============================================================
async function apiGet(path) {
    return apiRequest('GET', path);
}

async function apiPost(path, data) {
    return apiRequest('POST', path, data);
}

async function apiPut(path, data) {
    return apiRequest('PUT', path, data);
}

async function apiDelete(path) {
    return apiRequest('DELETE', path);
}

// ============================================================
// STUDIES — ИССЛЕДОВАНИЯ
// ============================================================
const StudiesAPI = {
    // Получить все исследования
    getAll: () => apiGet('/studies'),

    // Получить одно исследование
    getOne: (id) => apiGet('/studies/' + id),

    // Создать или обновить
    save: (study) => apiPost('/studies', study),

    // Удалить
    delete: (id) => apiDelete('/studies/' + id)
};

// ============================================================
// REQUESTS — ЗАЯВКИ
// ============================================================
const RequestsAPI = {
    getAll: () => apiGet('/requests'),
    save: (item) => apiPost('/requests', item),
    delete: (id) => apiDelete('/requests/' + id)
};

// ============================================================
// HEALTH CHECK — проверка сервера
// ============================================================
async function checkServerHealth() {
    try {
        const result = await apiGet('/health');
        return result.status === 'ok';
    } catch (err) {
        return false;
    }
}

// ============================================================
// ИНДИКАТОР СОСТОЯНИЯ СЕРВЕРА
// ============================================================
async function showServerStatus() {
    const ok = await checkServerHealth();

    if (ok) {
        console.log('✅ Сервер доступен:', API_BASE);
    } else {
        console.error('❌ Сервер НЕ доступен:', API_BASE);
        if (typeof toast === 'function') {
            toast('⚠️ Нет связи с сервером. Проверьте подключение.', 'error');
        }
    }

    return ok;
}

console.log('🌐 API-клиент загружен. Базовый URL:', API_BASE);