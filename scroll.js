// ============================================================
// КНОПКА СКРОЛЛА (вверх / вниз)
// ============================================================

let _scrollListenerAttached = false;

function initScrollButton() {
    const btn = document.getElementById('scrollButton');
    if (!btn) return;

    if (!_scrollListenerAttached) {
        window.addEventListener('scroll', updateScrollButton);
        _scrollListenerAttached = true;
    }

    updateScrollButton();
}

function updateScrollButton() {
    const btn = document.getElementById('scrollButton');
    if (!btn) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Если страница короткая — не показываем
    if (scrollHeight <= clientHeight + 100) {
        btn.classList.remove('show');
        return;
    }

    // Показываем всегда, когда есть что скроллить
    btn.classList.add('show');

    // Определяем: внизу ли мы?
    const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 50);

    if (isAtBottom) {
        btn.textContent = '⬆️';
        btn.title = 'Наверх';
        btn.dataset.direction = 'up';
    } else {
        btn.textContent = '⬇️';
        btn.title = 'Вниз';
        btn.dataset.direction = 'down';
    }
}

function handleScrollClick() {
    const btn = document.getElementById('scrollButton');
    if (!btn) return;

    const dir = btn.dataset.direction || 'down';

    if (dir === 'up') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
}