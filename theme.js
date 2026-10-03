// ============================================================
// УПРАВЛЕНИЕ ТЕМОЙ (упрощённая версия)
// ============================================================

const THEME_KEY = 'themeMode';

// Инициализация при загрузке
function initThemeSettings() {
    loadThemeMode();
    preloadThemeImages();
}

// Предзагрузка картинки (чтобы не мигало)
function preloadThemeImages() {
    const img = new Image();
    img.src = 'img/theme-light.jpg';
}

// Применить тему
function applyThemePreset(mode) {
    localStorage.setItem(THEME_KEY, mode);

    let actual = mode;
    if (mode === 'auto') {
        actual = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', actual);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = actual === 'dark' ? '☀️' : '🌙';

    document.querySelectorAll('.theme-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themePreset === mode);
    });
}

// Загрузить тему при старте
function loadThemeMode() {
    const mode = localStorage.getItem(THEME_KEY) || 'light';

    let actual = mode;
    if (mode === 'auto') {
        actual = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', actual);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = actual === 'dark' ? '☀️' : '🌙';

    document.querySelectorAll('.theme-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themePreset === mode);
    });

    // Следим за системной темой
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem(THEME_KEY) === 'auto') {
            applyThemePreset('auto');
        }
    });
}

// Обёртка для кнопки в шапке (🌙/☀️)
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyThemePreset(current === 'dark' ? 'light' : 'dark');
}

// Сброс
function resetThemeSettings() {
    if (!confirm('Сбросить тему на светлую?')) return;
    applyThemePreset('light');
    toast('Тема сброшена на светлую', 'success');
}