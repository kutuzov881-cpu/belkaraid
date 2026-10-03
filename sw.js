// ============================================================
// SERVICE WORKER — офлайн-режим для КТ-Журнала
// ============================================================

const CACHE_VERSION = 'kt-journal-v24-1';
const CACHE_STATIC = CACHE_VERSION + '-static';

// Файлы для кэширования (обязательные)
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './img/logo.png',
    './img/logo-192.png',
    './img/logo-512.png',
    './img/theme-light.jpg',
    './img/theme-dark.jpg'
];

// JS-файлы (кэшируются отдельно — можно обновлять)
const JS_FILES = [
    './js/config.js',
    './js/state.js',
    './js/utils.js',
    './js/save-load.js',
    './js/auth.js',
    './js/journal.js',
    './js/study.js',
    './js/templates.js',
    './js/descTemplates.js',
    './js/doctorWorkspace.js',
    './js/constructor.js',
    './js/stock.js',
    './js/requests.js',
    './js/stats.js',
    './js/settings.js',
    './js/scroll.js',
    './js/export.js',
    './js/theme.js',
    './js/print.js',
    './js/app.js'
];

// ============================================================
// УСТАНОВКА
// ============================================================
self.addEventListener('install', event => {
    console.log('🔧 SW: установка');
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => cache.addAll([...STATIC_FILES, ...JS_FILES]))
            .then(() => self.skipWaiting())
            .catch(err => console.warn('⚠️ SW: ошибка установки', err))
    );
});

// ============================================================
// АКТИВАЦИЯ — удаляем старые кэши
// ============================================================
self.addEventListener('activate', event => {
    console.log('🔧 SW: активация');
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(n => n.startsWith('kt-journal-') && n !== CACHE_STATIC)
                    .map(n => {
                        console.log('🗑️ SW: удаляю старый кэш', n);
                        return caches.delete(n);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ============================================================
// ПЕРЕХВАТ ЗАПРОСОВ
// ============================================================
self.addEventListener('fetch', event => {
    const req = event.request;

    // Только GET
    if (req.method !== 'GET') return;

    // Не трогаем внешние запросы (CDN Chart.js, XLSX)
    if (!req.url.startsWith(self.location.origin)) return;

    // Стратегия: сначала кэш, потом сеть (для скорости)
    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) {
                // Обновляем кэш в фоне
                fetch(req).then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_STATIC).then(cache => cache.put(req, response));
                    }
                }).catch(() => {});
                return cached;
            }

            // Нет в кэше — идём в сеть
            return fetch(req).then(response => {
                if (!response || response.status !== 200) return response;

                // Кэшируем успешные ответы
                const clone = response.clone();
                caches.open(CACHE_STATIC).then(cache => cache.put(req, clone));
                return response;
            }).catch(() => {
                // Офлайн — показываем index.html для навигации
                if (req.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// ============================================================
// СООБЩЕНИЯ ОТ СТРАНИЦЫ
// ============================================================
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data === 'CLEAR_CACHE') {
        caches.keys().then(names =>
            Promise.all(names.map(n => caches.delete(n)))
        ).then(() => {
            event.source.postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

console.log('✅ SW: загружен');