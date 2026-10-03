// ============================================================
// ЖУРНАЛ ИССЛЕДОВАНИЙ
// ============================================================

// ============================================================
// 1. УПРАВЛЕНИЕ ФИЛЬТРАМИ
// ============================================================

// Переключение видимости фильтров
function toggleFilters() {
    const b = document.getElementById('filtersBody');
    const a = document.getElementById('filtersArrow');
    if (!b || !a) return;
    b.classList.toggle('collapsed');
    a.textContent = b.classList.contains('collapsed') ? '▶' : '▼';
}

// Сброс всех фильтров
function resetFilters() {
    ['filterSearch', 'filterDateFrom', 'filterDateTo',
     'filterAdmitTimeFrom', 'filterAdmitTimeTo',
     'filterStudyTimeFrom', 'filterStudyTimeTo',
     'filterDept', 'filterDoctor', 'filterLab', 'filterStatus'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    applyFilters();
}

// Подсчёт активных фильтров
function countActiveFilters() {
    let c = 0;
    ['filterSearch', 'filterDateFrom', 'filterDateTo',
     'filterAdmitTimeFrom', 'filterAdmitTimeTo',
     'filterStudyTimeFrom', 'filterStudyTimeTo',
     'filterDept', 'filterDoctor', 'filterLab', 'filterStatus'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) c++;
    });

    const b = document.getElementById('filtersCount');
    if (b) {
        if (c > 0) { b.textContent = c; b.style.display = 'inline-block'; }
        else b.style.display = 'none';
    }
}

// Применение фильтров
function applyFilters() {
    countActiveFilters();
    renderJournal();
}

// Заполнение выпадающих списков в фильтрах
function populateFilterSelects() {
    const deptEl = document.getElementById('filterDept');
    if (deptEl) {
        deptEl.innerHTML = '<option value="">Все</option>' +
            state.settings.depts.map(d => '<option>' + d + '</option>').join('');
    }

    const docEl = document.getElementById('filterDoctor');
    if (docEl) {
        docEl.innerHTML = '<option value="">Все</option>' +
            state.settings.doctors.map(d => '<option>' + d + '</option>').join('');
    }

    const labEl = document.getElementById('filterLab');
    if (labEl) {
        labEl.innerHTML = '<option value="">Все</option>' +
            state.settings.labs.map(d => '<option>' + d + '</option>').join('');
    }
}

// ============================================================
// 2. РАСЧЁТ НОМЕРОВ (глобальный и по смене)
// ============================================================
function calculateNumbers() {
    const sorted = [...state.studies].sort((a, b) =>
        ((a.studyDate || '') + ' ' + (a.studyTime || '')).localeCompare(
            (b.studyDate || '') + ' ' + (b.studyTime || '')
        )
    );

    const numMap = {};
    let g = 1;
    const sc = {};

    sorted.forEach(s => {
        const sd = getShiftDate(s.studyDate, s.studyTime);
        if (!sc[sd]) sc[sd] = 0;
        sc[sd]++;
        numMap[s.id] = { global: g, shift: sc[sd] };
        g++;
    });

    return numMap;
}

// ============================================================
// 3. ФИЛЬТРАЦИЯ — ДИАПАЗОН (дата + время вместе)
// ============================================================
// Логика:
//   «С 15.09 08:00 по 16.09 08:00» — берём эти две точки
//   и показываем всё, что между ними.
//
//   Если время не задано:
//     С  — время по умолчанию 00:00
//     ПО — время по умолчанию 23:59
//
//   Если задано только время (без даты) — фильтр по времени
//   Если задана только дата (без времени) — фильтр по дате
// ============================================================
function getFilteredStudies() {
    const search = document.getElementById('filterSearch').value.toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const admitTimeFrom = document.getElementById('filterAdmitTimeFrom').value;
    const admitTimeTo = document.getElementById('filterAdmitTimeTo').value;
    const studyTimeFrom = document.getElementById('filterStudyTimeFrom').value;
    const studyTimeTo = document.getElementById('filterStudyTimeTo').value;
    const dept = document.getElementById('filterDept').value;
    const doctor = document.getElementById('filterDoctor').value;
    const lab = document.getElementById('filterLab').value;
    const status = document.getElementById('filterStatus').value;

    // ============================================================
    // ФОРМИРУЕМ ГРАНИЦЫ ДИАПАЗОНА
    // ============================================================

    // ИССЛЕДОВАНИЕ — точка "С"
    let studyFromDT = null;
    if (dateFrom) {
        studyFromDT = dateFrom + 'T' + (studyTimeFrom || '00:00');
    }

    // ИССЛЕДОВАНИЕ — точка "ПО"
    let studyToDT = null;
    if (dateTo) {
        studyToDT = dateTo + 'T' + (studyTimeTo || '23:59');
    }

    // ПОСТУПЛЕНИЕ — точка "С"
    let admitFromDT = null;
    if (dateFrom && admitTimeFrom) {
        admitFromDT = dateFrom + 'T' + admitTimeFrom;
    }

    // ПОСТУПЛЕНИЕ — точка "ПО"
    let admitToDT = null;
    if (dateTo && admitTimeTo) {
        admitToDT = dateTo + 'T' + admitTimeTo;
    }

    return state.studies.filter(s => {
        // --- Поиск по ФИО / № истории ---
        if (search && !((s.fio || '') + ' ' + (s.historyNum || '')).toLowerCase().includes(search)) return false;

        // ============================================================
        // ФИЛЬТР ПО ИССЛЕДОВАНИЮ
        // ============================================================
        if (studyFromDT || studyToDT) {
            const studyDT = (s.studyDate || '') + 'T' + (s.studyTime || '00:00');
            if (studyFromDT && studyDT < studyFromDT) return false;
            if (studyToDT && studyDT > studyToDT) return false;
        } else {
            if (studyTimeFrom && s.studyTime && s.studyTime < studyTimeFrom) return false;
            if (studyTimeTo && s.studyTime && s.studyTime > studyTimeTo) return false;
        }

        // ============================================================
        // ФИЛЬТР ПО ПОСТУПЛЕНИЮ
        // ============================================================
        if (admitFromDT || admitToDT) {
            const admitDT = (s.admitDate || '') + 'T' + (s.admitTime || '00:00');
            if (admitFromDT && admitDT < admitFromDT) return false;
            if (admitToDT && admitDT > admitToDT) return false;
        } else {
            if (admitTimeFrom && s.admitTime && s.admitTime < admitTimeFrom) return false;
            if (admitTimeTo && s.admitTime && s.admitTime > admitTimeTo) return false;
        }

        // --- Остальные фильтры ---
        if (dept && s.dept !== dept) return false;
        if (doctor && s.doctor !== doctor) return false;
        if (lab && s.lab !== lab) return false;
        if (status && (s.status || 'pending') !== status) return false;

        return true;
    }).sort((a, b) =>
        ((a.studyDate || '') + ' ' + (a.studyTime || '')).localeCompare(
            (b.studyDate || '') + ' ' + (b.studyTime || '')
        )
    );
}

// ============================================================
// 4. ОТРИСОВКА ЖУРНАЛА
// ============================================================
function renderJournal() {
    const list = getFilteredStudies();
    const numMap = calculateNumbers();
    const body = document.getElementById('journalBody');
    const empty = document.getElementById('journalEmpty');

    if (!body) return;

    if (!list.length) {
        body.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    const pills = {
        pending: '<span class="status-pill pending">🟡 Ожидает</span>',
        described: '<span class="status-pill described">🟢 Описано</span>',
        signed: '<span class="status-pill signed">🔵 Подписано</span>'
    };

    body.innerHTML = list.map(s => {
        const n = numMap[s.id] || { global: '-', shift: '-' };
        const zones = s.zones || [];
        const nativeZones = zones.filter(z => z.type === 'native').map(z => z.name);
        const contrastZones = zones.filter(z => z.type === 'contrast').map(z => z.name);

        const contrastInfo = s.contrast > 0 ?
            '<span class="badge warning">💉 ' + s.contrast + ' мл</span><br><span style="font-size:11px;color:var(--text-muted)">' + (s.contrastDrugName || '') + '</span>' :
            '—';

        const admitFull = (s.admitDate ? formatDate(s.admitDate) + ' ' : '') + (s.admitTime || '—');

        return '<tr onclick="handleRowClick(event,\'' + s.id + '\')" oncontextmenu="handleRowContextMenu(event,\'' + s.id + '\')">' +
            '<td data-label="№" class="num-cell">' + n.global + '</td>' +
            '<td data-label="№ смены" class="num-cell shift">' + n.shift + '</td>' +
            '<td data-label="Статус">' + pills[s.status || 'pending'] + '</td>' +
            '<td data-label="Дата иссл.">' + formatDate(s.studyDate) + '</td>' +
            '<td data-label="Время иссл."><strong>' + (s.studyTime || '—') + '</strong></td>' +
            '<td data-label="Время поступл." style="font-size:11px">' + admitFull + '</td>' +
            '<td data-label="ФИО"><strong>' + s.fio + '</strong></td>' +
            '<td data-label="Д.р./Возраст">' + formatDate(s.birthDate) + '<br><span style="font-size:11px;color:var(--text-muted)">' + (s.age || '') + ' лет</span></td>' +
            '<td data-label="Отделение">' + (s.dept || '') + '</td>' +
            '<td data-label="Шаблон">' + (s.templateName || '—') + '</td>' +
            '<td data-label="Нативные">' + formatZonesPreview(nativeZones) + '</td>' +
            '<td data-label="С КУ">' + formatZonesPreview(contrastZones) + '</td>' +
            '<td data-label="Доза"><strong>' + (s.totalDose || 0).toFixed(1) + '</strong> мЗв</td>' +
            '<td data-label="Контраст">' + contrastInfo + '</td>' +
            '<td data-label="Врач">' + (s.doctor || '') + '</td>' +
            '<td data-label="Лаборант">' + (s.lab || '') + '</td>' +
            '<td data-label="" style="text-align:center;padding:4px">' +
                '<button class="btn-delete-row" onclick="event.stopPropagation();openDeleteStudyModal(\'' + s.id + '\')" title="Удалить исследование">🗑️</button>' +
            '</td>' +
            '</tr>';
    }).join('');
}

// ============================================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ ЖУРНАЛА
// ============================================================
function handleRowClick(e, id) {
    // Ctrl+клик — редактирование (только для лаборанта)
    if (e.ctrlKey || e.metaKey) {
        if (currentRole === 'doctor') {
            toast('Редактирование — только для лаборанта', 'error');
            return;
        }
        const s = state.studies.find(x => x.id === id);
        if (s && s.status === 'signed') {
            toast('Нельзя редактировать подписанную запись', 'error');
            return;
        }
        openEditStudy(id);
    } else {
        // Обычный клик — рабочее место врача
        if (currentRole !== 'doctor') {
            toast('Окно врача — только для врача', 'error');
            return;
        }
        openDoctorWorkspace(id);
    }
}

function handleRowContextMenu(e, id) {
    e.preventDefault();

    const oldMenu = document.getElementById('rowContextMenu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'rowContextMenu';
    menu.className = 'row-context-menu';
    menu.innerHTML = '<div class="row-context-menu-item" onclick="closeRowContextMenu();openDeleteStudyModal(\'' + id + '\')">🗑️ Удалить исследование</div>';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    document.body.appendChild(menu);

    setTimeout(() => {
        document.addEventListener('click', closeRowContextMenu, { once: true });
    }, 10);
}

function closeRowContextMenu() {
    const m = document.getElementById('rowContextMenu');
    if (m) m.remove();
}

// ============================================================
// 6. БЫСТРАЯ СТАТИСТИКА (верхние карточки)
// ============================================================
function renderQuickStats() {
    const el = document.getElementById('quickStats');
    if (!el) return;

    const t = state.studies.length;
    const pending = state.studies.filter(s => (s.status || 'pending') === 'pending').length;
    const described = state.studies.filter(s => s.status === 'described').length;
    const signed = state.studies.filter(s => s.status === 'signed').length;
    const td = state.studies.reduce((a, s) => a + (s.totalDose || 0), 0);

    el.innerHTML =
        '<div class="stat-card"><div class="stat-label">🩻 Всего</div><div class="stat-value">' + t + '</div></div>' +
        '<div class="stat-card warning"><div class="stat-label">🟡 Ожидает</div><div class="stat-value">' + pending + '</div></div>' +
        '<div class="stat-card success"><div class="stat-label">🟢 Описано</div><div class="stat-value">' + described + '</div></div>' +
        '<div class="stat-card accent"><div class="stat-label">🔵 Подписано</div><div class="stat-value">' + signed + '</div></div>' +
        '<div class="stat-card danger"><div class="stat-label">☢️ Суммарная доза</div><div class="stat-value">' + td.toFixed(1) + '<span class="stat-unit">мЗв</span></div></div>';
}