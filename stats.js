// ============================================================
// ОТЧЁТЫ И СТАТИСТИКА
// ============================================================

// ============================================================
// 1. ГЛАВНАЯ ФУНКЦИЯ — ОТРИСОВКА ВСЕЙ СТАТИСТИКИ
// ============================================================
function renderStats() {
    const filtered = getFilteredStudies();
    renderQuickStats();

    const fullStatsEl = document.getElementById('fullStats');
    if (fullStatsEl) {
        fullStatsEl.innerHTML = document.getElementById('quickStats').innerHTML;
    }

    // ============================================================
    // ОБЩИЕ ИТОГИ
    // ============================================================
    let totalZones = 0, totalNative = 0, totalContrast = 0, totalDose = 0;
    filtered.forEach(s => {
        const zones = s.zones || [];
        totalZones += zones.length;
        totalNative += zones.filter(z => z.type === 'native').length;
        totalContrast += zones.filter(z => z.type === 'contrast').length;
        totalDose += s.totalDose || 0;
    });

    const totalStatsEl = document.getElementById('totalStatsGrid');
    if (totalStatsEl) {
        totalStatsEl.innerHTML =
            '<div class="stat-card accent"><div class="stat-label">🦴 Всего зон</div><div class="stat-value">' + totalZones + '</div></div>' +
            '<div class="stat-card success"><div class="stat-label">🦴 Нативные зоны</div><div class="stat-value">' + totalNative + '</div></div>' +
            '<div class="stat-card warning"><div class="stat-label">💉 Зоны с КУ</div><div class="stat-value">' + totalContrast + '</div></div>' +
            '<div class="stat-card danger"><div class="stat-label">☢️ Суммарная доза</div><div class="stat-value">' + totalDose.toFixed(1) + '<span class="stat-unit">мЗв</span></div></div>';
    }

    // ============================================================
    // ПО МЕСЯЦАМ
    // ============================================================
    const bm = {};
    filtered.forEach(s => {
        if (!s.studyDate) return;
        const k = s.studyDate.slice(0, 7);
        bm[k] = (bm[k] || 0) + 1;
    });

    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const monthHtml = Object.entries(bm).sort((a, b) => b[0].localeCompare(a[0])).map(([m, c]) => {
        const [y, mo] = m.split('-');
        return '<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">' +
            '<span>' + monthNames[parseInt(mo) - 1] + ' ' + y + '</span>' +
            '<span class="badge">' + c + '</span>' +
            '</div>';
    }).join('');

    const monthEl = document.getElementById('statsByMonth');
    if (monthEl) {
        monthEl.innerHTML = monthHtml || '<div class="empty">Нет данных</div>';
    }

    // ============================================================
    // ПО ОТДЕЛЕНИЯМ
    // ============================================================
    const byDept = {};
    filtered.forEach(s => {
        if (!s.dept) return;
        if (!byDept[s.dept]) byDept[s.dept] = { total: 0, zones: {} };
        byDept[s.dept].total++;
        (s.zones || []).forEach(z => {
            byDept[s.dept].zones[z.name] = (byDept[s.dept].zones[z.name] || 0) + 1;
        });
    });

    const deptHtml = Object.entries(byDept).sort((a, b) => b[1].total - a[1].total).map(([dept, data]) => {
        const zonesHtml = Object.entries(data.zones).sort((a, b) => b[1] - a[1])
            .map(([z, c]) => '<div class="detail-row"><span class="detail-label">' + (ZONE_ABBR[z] || z) + '</span><span class="detail-value">' + c + '</span></div>')
            .join('');
        return '<div style="margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">' +
            '<div style="background:var(--surface-2);padding:8px 12px;font-weight:700;display:flex;justify-content:space-between">' +
            '<span>🏥 ' + dept + '</span><span class="badge">' + data.total + '</span></div>' +
            '<div style="padding:8px 12px">' + zonesHtml + '</div></div>';
    }).join('');

    const deptTotal = Object.values(byDept).reduce((a, d) => a + d.total, 0);
    const deptTotalRow = deptTotal > 0
        ? '<div class="detail-row" style="border-top:2px solid var(--primary);margin-top:8px;padding-top:8px;font-weight:700">' +
          '<span class="detail-label" style="color:var(--primary)">ИТОГО по отделениям:</span>' +
          '<span class="detail-value">' + deptTotal + ' исследований</span>' +
          '</div>'
        : '';

    const deptEl = document.getElementById('statsByDept');
    if (deptEl) {
        deptEl.innerHTML = (deptHtml + deptTotalRow) || '<div class="empty">Нет данных</div>';
    }

    // ============================================================
    // ПО ЗОНАМ
    // ============================================================
    const zoneStats = {};
    filtered.forEach(s => {
        (s.zones || []).forEach(z => {
            if (!zoneStats[z.name]) zoneStats[z.name] = { total: 0, type: z.type === 'native' ? 'Нативная' : 'С КУ', doctors: {} };
            zoneStats[z.name].total++;
            zoneStats[z.name].doctors[s.doctor] = (zoneStats[z.name].doctors[s.doctor] || 0) + 1;
        });
    });

    const zoneHtml = Object.entries(zoneStats).sort((a, b) => b[1].total - a[1].total).map(([z, data]) => {
        const typeBadge = data.type === 'Нативная' ? '<span class="badge success">Нат</span>' : '<span class="badge warning">КУ</span>';
        const doctorsHtml = Object.entries(data.doctors).map(([d, c]) =>
            '<span style="font-size:10px;color:var(--text-muted);margin-right:8px">' + d + ': ' + c + '</span>').join('');
        return '<div class="detail-row" style="flex-direction:column;align-items:stretch">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-weight:600">' + (ZONE_ABBR[z] || z) + ' ' + typeBadge + '</span>' +
            '<span class="detail-value">' + data.total + '</span></div>' +
            '<div style="margin-top:4px">' + doctorsHtml + '</div></div>';
    }).join('');

    const zoneTotal = Object.values(zoneStats).reduce((a, d) => a + d.total, 0);
    const zoneTotalRow = zoneTotal > 0
        ? '<div class="detail-row" style="border-top:2px solid var(--primary);margin-top:8px;padding-top:8px;font-weight:700">' +
          '<span class="detail-label" style="color:var(--primary)">ИТОГО зон:</span>' +
          '<span class="detail-value">' + zoneTotal + '</span>' +
          '</div>'
        : '';

    const zoneEl = document.getElementById('statsByZone');
    if (zoneEl) {
        zoneEl.innerHTML = (zoneHtml + zoneTotalRow) || '<div class="empty">Нет данных</div>';
    }

    // ============================================================
    // ПО ДИАГНОЗАМ
    // ============================================================
    const byDiag = {};
    filtered.forEach(s => {
        if (!s.icdDisplay) return;
        if (!byDiag[s.icdDisplay]) byDiag[s.icdDisplay] = { count: 0, studies: [] };
        byDiag[s.icdDisplay].count++;
        byDiag[s.icdDisplay].studies.push(s);
    });

    const diagHtml = Object.entries(byDiag).sort((a, b) => b[1].count - a[1].count).map(([diag, data]) => {
        const studiesHtml = data.studies.slice(0, 5).map(s =>
            '<div class="detail-row"><span class="detail-label">' + formatDate(s.studyDate) + ' ' + s.fio + '</span>' +
            '<span class="detail-value">' +
            (s.zones ? s.zones.filter(z => z.type === 'native').length : 0) + ' нат, ' +
            (s.zones ? s.zones.filter(z => z.type === 'contrast').length : 0) + ' КУ</span></div>').join('');
        const more = data.studies.length > 5 ? '<div style="font-size:11px;color:var(--text-muted);padding:4px 0">...и ещё ' + (data.studies.length - 5) + '</div>' : '';
        return '<div style="margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">' +
            '<div style="background:var(--surface-2);padding:8px 12px;font-weight:700;display:flex;justify-content:space-between">' +
            '<span style="font-size:12px">🩺 ' + diag + '</span><span class="badge">' + data.count + '</span></div>' +
            '<div style="padding:8px 12px">' + studiesHtml + more + '</div></div>';
    }).join('');

    const diagTotal = Object.values(byDiag).reduce((a, d) => a + d.count, 0);
    const diagTotalRow = diagTotal > 0
        ? '<div class="detail-row" style="border-top:2px solid var(--primary);margin-top:8px;padding-top:8px;font-weight:700">' +
          '<span class="detail-label" style="color:var(--primary)">ИТОГО диагнозов:</span>' +
          '<span class="detail-value">' + diagTotal + ' исследований</span>' +
          '</div>'
        : '';

    const diagEl = document.getElementById('statsByDiag');
    if (diagEl) {
        diagEl.innerHTML = (diagHtml + diagTotalRow) || '<div class="empty">Нет данных</div>';
    }

    // ============================================================
    // ПО СМЕНАМ (с 08:00 до 08:00)
    // ============================================================
    const byShift = {};

    filtered.forEach(s => {
        const shiftStart = getShiftDate(s.studyDate, s.studyTime);
        if (!shiftStart) return;

        if (!byShift[shiftStart]) {
            byShift[shiftStart] = {
                startDate: shiftStart,
                endDate: addDays(shiftStart, 1),
                studies: 0,
                zones: 0
            };
        }

        byShift[shiftStart].studies++;
        byShift[shiftStart].zones += (s.zones || []).length;
    });

    const shiftKeys = Object.keys(byShift).sort((a, b) => b.localeCompare(a));

    const shiftHtml = shiftKeys.map(key => {
    const sh = byShift[key];
    const startFmt = formatDate(sh.startDate);
    const endFmt = formatDate(sh.endDate);

    return '<div class="detail-row shift-row" onclick="openShiftDetails(\'' + sh.startDate + '\')" style="cursor:pointer">' +
        '<span class="detail-label">🔄 <strong>' + startFmt + ' 08:00</strong> → <strong>' + endFmt + ' 08:00</strong></span>' +
        '<span class="detail-value">' +
            '<span class="badge">👤 ' + sh.studies + ' чел</span> ' +
            '<span class="badge accent">🦴 ' + sh.zones + ' зон</span>' +
        '</span>' +
        '</div>';
}).join('');

    const shiftTotals = shiftKeys.reduce((acc, k) => {
        acc.studies += byShift[k].studies;
        acc.zones += byShift[k].zones;
        return acc;
    }, { studies: 0, zones: 0 });

    const shiftTotalRow = shiftKeys.length ? (
        '<div class="detail-row" style="border-top:2px solid var(--primary);margin-top:6px;padding-top:8px;font-weight:700">' +
        '<span class="detail-label" style="color:var(--primary)">ИТОГО смен: ' + shiftKeys.length + '</span>' +
        '<span class="detail-value">' +
            '<span class="badge success">👤 ' + shiftTotals.studies + ' чел</span> ' +
            '<span class="badge success">🦴 ' + shiftTotals.zones + ' зон</span>' +
        '</span>' +
        '</div>'
    ) : '';

    const shiftEl = document.getElementById('statsByShift');
    if (shiftEl) {
        shiftEl.innerHTML = (shiftHtml + shiftTotalRow) || '<div class="empty">Нет данных</div>';
    }
}

// ============================================================
// 2. МОДАЛКА ДЕТАЛЕЙ СМЕНЫ
// ============================================================
function openShiftDetails(shiftStart) {
    const shiftEnd = addDays(shiftStart, 1);

    // Находим все исследования за эту смену
    const studies = state.studies.filter(s => {
        const sd = getShiftDate(s.studyDate, s.studyTime);
        return sd === shiftStart;
    });

    if (!studies.length) {
        toast('Нет исследований за эту смену', 'error');
        return;
    }

    // Считаем зоны
    const zoneCount = {};
    studies.forEach(s => {
        (s.zones || []).forEach(z => {
            if (!zoneCount[z.name]) {
                zoneCount[z.name] = {
                    name: z.name,
                    type: z.type,
                    count: 0,
                    dose: z.dose || 0
                };
            }
            zoneCount[z.name].count++;
        });
    });

    const zonesArr = Object.values(zoneCount).sort((a, b) => b.count - a.count);

    // Итоги
    const totalZones = zonesArr.reduce((a, z) => a + z.count, 0);
    const nativeZones = zonesArr.filter(z => z.type === 'native').reduce((a, z) => a + z.count, 0);
    const contrastZones = zonesArr.filter(z => z.type === 'contrast').reduce((a, z) => a + z.count, 0);

    // Заголовок
    const titleEl = document.getElementById('shiftDetailsTitle');
    if (titleEl) {
        titleEl.innerHTML = '🔄 Смена: <strong>' + formatDate(shiftStart) + ' 08:00</strong> → <strong>' + formatDate(shiftEnd) + ' 08:00</strong>';
    }

    // Сводка
    let html =
        '<div class="stats-grid" style="margin-bottom:20px">' +
            '<div class="stat-card">' +
                '<div class="stat-label">👤 Исследований</div>' +
                '<div class="stat-value">' + studies.length + '</div>' +
            '</div>' +
            '<div class="stat-card accent">' +
                '<div class="stat-label">🦴 Всего зон</div>' +
                '<div class="stat-value">' + totalZones + '</div>' +
            '</div>' +
            '<div class="stat-card success">' +
                '<div class="stat-label">🦴 Нативные зоны</div>' +
                '<div class="stat-value">' + nativeZones + '</div>' +
            '</div>' +
            '<div class="stat-card warning">' +
                '<div class="stat-label">💉 С КУ</div>' +
                '<div class="stat-value">' + contrastZones + '</div>' +
            '</div>' +
        '</div>';

    // Список зон
    html += '<div style="font-weight:700;margin-bottom:12px;font-size:14px">📋 Зоны за смену:</div>';
    html += '<div class="table-wrap"><table><thead><tr>';
    html += '<th>Зона</th><th>Тип</th><th>Доза (мЗв)</th><th>Кол-во</th>';
    html += '</tr></thead><tbody>';

    zonesArr.forEach(z => {
        const typeLabel = z.type === 'native'
            ? '<span class="badge success">🦴 Нативная</span>'
            : '<span class="badge warning">💉 С КУ</span>';
        html += '<tr>' +
            '<td><strong>' + z.name + '</strong></td>' +
            '<td>' + typeLabel + '</td>' +
            '<td>' + z.dose + '</td>' +
            '<td><strong>' + z.count + '</strong></td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';

    // График
    html += '<div style="font-weight:700;margin:20px 0 12px;font-size:14px">📊 График по зонам:</div>';
    html += '<div class="chart-container" style="height:350px"><canvas id="shiftDetailsChart"></canvas></div>';

    const bodyEl = document.getElementById('shiftDetailsBody');
    if (bodyEl) bodyEl.innerHTML = html;

    // Сохраняем данные для экспорта
    window._currentShiftData = {
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        studies: studies,
        zones: zonesArr,
        totals: {
            studies: studies.length,
            totalZones: totalZones,
            nativeZones: nativeZones,
            contrastZones: contrastZones
        }
    };

    // Открываем модалку
    openModal('shiftDetailsModal');

    // Рисуем график
    setTimeout(() => {
        const ctx = document.getElementById('shiftDetailsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: zonesArr.map(z => z.name),
                datasets: [{
                    label: 'Количество',
                    data: zonesArr.map(z => z.count),
                    backgroundColor: zonesArr.map(z =>
                        z.type === 'native' ? '#3b82f6' : '#f59e0b'
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: 'Количество' }
                    },
                    x: {
                        title: { display: true, text: 'Зона' }
                    }
                }
            }
        });
    }, 100);
}

// ============================================================
// 3. ЭКСПОРТ СМЕНЫ В EXCEL
// ============================================================
function exportShiftToExcel() {
    if (!window._currentShiftData) {
        toast('Нет данных для экспорта', 'error');
        return;
    }

    if (typeof XLSX === 'undefined') {
        toast('Библиотека XLSX не загружена', 'error');
        return;
    }

    const data = window._currentShiftData;
    const wb = XLSX.utils.book_new();

    // Лист 1: Сводка
    const summary = [
        ['Смена', formatDate(data.shiftStart) + ' 08:00 → ' + formatDate(data.shiftEnd) + ' 08:00'],
        [''],
        ['Показатель', 'Значение'],
        ['Исследований', data.totals.studies],
        ['Всего зон', data.totals.totalZones],
        ['Нативных зон', data.totals.nativeZones],
        ['Зон с КУ', data.totals.contrastZones]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Сводка');

    // Лист 2: Зоны
    const zonesData = [['Зона', 'Тип', 'Доза (мЗв)', 'Количество']];
    data.zones.forEach(z => {
        zonesData.push([
            z.name,
            z.type === 'native' ? 'Нативная' : 'С КУ',
            z.dose,
            z.count
        ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(zonesData), 'Зоны');

    // Лист 3: Исследования
    const studiesData = [['№', 'Дата', 'Время', 'ФИО', 'Отделение', 'Врач', 'Лаборант', 'Зон', 'Доза']];
    data.studies.forEach((s, i) => {
        studiesData.push([
            i + 1,
            formatDate(s.studyDate),
            s.studyTime || '',
            s.fio || '',
            s.dept || '',
            s.doctor || '',
            s.lab || '',
            (s.zones || []).length,
            (s.totalDose || 0).toFixed(1)
        ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(studiesData), 'Исследования');

    // Сохраняем
    const fileName = 'Смена_' + data.shiftStart + '_' + data.shiftEnd + '.xlsx';
    XLSX.writeFile(wb, fileName);

    toast('📊 Excel-файл сохранён', 'success');
}

// ============================================================
// 4. МОДАЛКА ГРАФИКОВ (общая)
// ============================================================
let chartsModalInstances = [];
let chartsModalData = null;

function _destroyChartsModalInstances() {
    chartsModalInstances.forEach(c => { try { c.destroy(); } catch (e) {} });
    chartsModalInstances = [];
}

function _chartsModalAddSection(title) {
    const body = document.getElementById('chartsModalBody');
    const section = document.createElement('div');
    section.className = 'charts-section';
    section.innerHTML = '<div class="charts-section-title">' + title + '</div><div class="charts-container"><canvas></canvas></div>';
    body.appendChild(section);
    return section.querySelector('canvas');
}

function _openChartsModal(title, sections, data) {
    _destroyChartsModalInstances();
    chartsModalData = data || null;
    document.getElementById('chartsModalTitle').textContent = title;
    document.getElementById('chartsModalBody').innerHTML = '';
    const canvases = sections.map(s => ({ section: s, canvas: _chartsModalAddSection(s.title) }));
    openModal('chartsModal');
    requestAnimationFrame(() => {
        canvases.forEach(({ section, canvas }) => {
            if (typeof section.draw === 'function') {
                const inst = section.draw(canvas);
                if (inst) chartsModalInstances.push(inst);
            }
        });
    });
}

function closeChartsModal() {
    _destroyChartsModalInstances();
    chartsModalData = null;
    closeModal('chartsModal');
}

const _CHART_COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#eab308','#a855f7','#0ea5e9','#22c55e'];

function _pickColors(n) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(_CHART_COLORS[i % _CHART_COLORS.length]);
    return a;
}

function _barOptions(xLabel, yLabel) {
    return {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, title: { display: !!yLabel, text: yLabel || '', font: { size: 11 } } },
            x: { ticks: { font: { size: 11 } }, title: { display: !!xLabel, text: xLabel || '', font: { size: 11 } } }
        }
    };
}

function _pieOptions() {
    return { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 10 } } } };
}

function _emptyCharts(title) {
    _openChartsModal(title, [], null);
    document.getElementById('chartsModalBody').innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted)">Нет данных для отображения</div>';
}

// ============================================================
// 5. ГРАФИКИ ПО ОТДЕЛЕНИЯМ
// ============================================================
function openDeptCharts() {
    const filtered = getFilteredStudies();
    const byDept = {};
    filtered.forEach(s => {
        if (!s.dept) return;
        if (!byDept[s.dept]) byDept[s.dept] = { total: 0, native: 0, contrast: 0 };
        byDept[s.dept].total++;
        (s.zones || []).forEach(z => {
            if (z.type === 'native') byDept[s.dept].native++;
            else byDept[s.dept].contrast++;
        });
    });
    const depts = Object.keys(byDept).sort((a, b) => byDept[b].total - byDept[a].total);
    if (!depts.length) return _emptyCharts('🏥 Графики по отделениям');
    const totals = depts.map(d => byDept[d].total);
    const natives = depts.map(d => byDept[d].native);
    const contrasts = depts.map(d => byDept[d].contrast);

    const sections = [
        { title: '📊 Количество исследований по отделениям', draw: c => new Chart(c, { type: 'bar', data: { labels: depts, datasets: [{ label: 'Исследований', data: totals, backgroundColor: _pickColors(depts.length), borderRadius: 4 }] }, options: _barOptions('Отделение', 'Исследований') }) },
        { title: '📊 Нативные vs КУ по отделениям', draw: c => new Chart(c, { type: 'bar', data: { labels: depts, datasets: [{ label: '🦴 Нативные', data: natives, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: '💉 С КУ', data: contrasts, backgroundColor: '#f59e0b', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 15 } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } } }) },
        { title: '🥧 Доля исследований по отделениям', draw: c => new Chart(c, { type: 'pie', data: { labels: depts, datasets: [{ data: totals, backgroundColor: _pickColors(depts.length), borderWidth: 2, borderColor: '#fff' }] }, options: _pieOptions() }) }
    ];
    const data = {
        type: 'dept',
        sections: [
            { title: 'Количество исследований по отделениям', rows: depts.map((d, i) => [d, totals[i]]) },
            { title: 'Нативные / КУ по отделениям', rows: depts.map((d, i) => [d + ' / Нативные', natives[i]]).concat(depts.map((d, i) => [d + ' / КУ', contrasts[i]])) },
            { title: 'Доля исследований по отделениям', rows: depts.map((d, i) => [d, totals[i]]) }
        ]
    };
    _openChartsModal('🏥 Графики по отделениям', sections, data);
}

// ============================================================
// 6. ГРАФИКИ ПО ЗОНАМ
// ============================================================
function openZoneCharts() {
    const filtered = getFilteredStudies();
    const zoneStats = {};
    let totalNative = 0, totalContrast = 0;
    filtered.forEach(s => {
        (s.zones || []).forEach(z => {
            if (z.type === 'native') totalNative++; else totalContrast++;
            if (!zoneStats[z.name]) zoneStats[z.name] = { total: 0 };
            zoneStats[z.name].total++;
        });
    });
    const zoneNames = Object.keys(zoneStats).sort((a, b) => zoneStats[b].total - zoneStats[a].total);
    if (!zoneNames.length) return _emptyCharts('🦴 Графики по зонам');
    const top10 = zoneNames.slice(0, 10);
    const top10Counts = top10.map(z => zoneStats[z].total);

    const byDoctor = {};
    filtered.forEach(s => {
        const doc = s.doctor || '—';
        if (!byDoctor[doc]) byDoctor[doc] = 0;
        byDoctor[doc] += (s.zones || []).length;
    });
    const doctorNames = Object.keys(byDoctor).sort((a, b) => byDoctor[b] - byDoctor[a]);
    const doctorCounts = doctorNames.map(d => byDoctor[d]);

    const sections = [
        { title: '📊 Топ-10 зон по количеству исследований', draw: c => new Chart(c, { type: 'bar', data: { labels: top10, datasets: [{ label: 'Исследований', data: top10Counts, backgroundColor: _pickColors(top10.length), borderRadius: 4 }] }, options: Object.assign(_barOptions('', 'Количество'), { indexAxis: 'y' }) }) },
        { title: '🥧 Нативные зоны vs Зоны с КУ', draw: c => new Chart(c, { type: 'pie', data: { labels: ['🦴 Нативные', '💉 С КУ'], datasets: [{ data: [totalNative, totalContrast], backgroundColor: ['#3b82f6', '#f59e0b'], borderWidth: 2, borderColor: '#fff' }] }, options: _pieOptions() }) },
        { title: '📊 Количество зон по врачам', draw: c => new Chart(c, { type: 'bar', data: { labels: doctorNames, datasets: [{ label: 'Зон', data: doctorCounts, backgroundColor: _pickColors(doctorNames.length), borderRadius: 4 }] }, options: _barOptions('Врач', 'Количество зон') }) }
    ];
    const data = {
        type: 'zone',
        sections: [
            { title: 'Топ-10 зон по количеству', rows: top10.map((z, i) => [z, top10Counts[i]]) },
            { title: 'Нативные / КУ', rows: [['Нативные', totalNative], ['С КУ', totalContrast]] },
            { title: 'Количество зон по врачам', rows: doctorNames.map((d, i) => [d, doctorCounts[i]]) }
        ]
    };
    _openChartsModal('🦴 Графики по зонам', sections, data);
}

// ============================================================
// 7. ГРАФИКИ ПО ДИАГНОЗАМ
// ============================================================
function openDiaCharts() {
    const filtered = getFilteredStudies();
    const byDiag = {};
    filtered.forEach(s => {
        if (!s.icdDisplay) return;
        byDiag[s.icdDisplay] = (byDiag[s.icdDisplay] || 0) + 1;
    });
    const diagNames = Object.keys(byDiag).sort((a, b) => byDiag[b] - byDiag[a]);
    if (!diagNames.length) return _emptyCharts('🩺 Графики по диагнозам');
    const top10 = diagNames.slice(0, 10);
    const top10Counts = top10.map(d => byDiag[d]);

    const sections = [
        { title: '📊 Топ-10 диагнозов по количеству', draw: c => new Chart(c, { type: 'bar', data: { labels: top10, datasets: [{ label: 'Исследований', data: top10Counts, backgroundColor: _pickColors(top10.length), borderRadius: 4 }] }, options: Object.assign(_barOptions('', 'Количество'), { indexAxis: 'y' }) }) },
        { title: '🥧 Доля диагнозов', draw: c => new Chart(c, { type: 'pie', data: { labels: diagNames, datasets: [{ data: diagNames.map(d => byDiag[d]), backgroundColor: _pickColors(diagNames.length), borderWidth: 2, borderColor: '#fff' }] }, options: _pieOptions() }) }
    ];
    const data = {
        type: 'diag',
        sections: [
            { title: 'Топ-10 диагнозов по количеству', rows: top10.map((d, i) => [d, top10Counts[i]]) },
            { title: 'Доля диагнозов', rows: diagNames.map(d => [d, byDiag[d]]) }
        ]
    };
    _openChartsModal('🩺 Графики по диагнозам', sections, data);
}

// ============================================================
// 8. ГРАФИКИ ПО МЕСЯЦАМ
// ============================================================
function openMonthCharts() {
    const filtered = getFilteredStudies();
    const bm = {};
    filtered.forEach(s => {
        if (!s.studyDate) return;
        const k = s.studyDate.slice(0, 7);
        if (!bm[k]) bm[k] = { total: 0, native: 0, contrast: 0 };
        bm[k].total++;
        (s.zones || []).forEach(z => {
            if (z.type === 'native') bm[k].native++;
            else bm[k].contrast++;
        });
    });
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const keys = Object.keys(bm).sort();
    if (!keys.length) return _emptyCharts('📅 Графики по месяцам');
    const labels = keys.map(k => {
        const [y, mo] = k.split('-');
        return monthNames[parseInt(mo) - 1] + ' ' + y;
    });
    const totals = keys.map(k => bm[k].total);
    const natives = keys.map(k => bm[k].native);
    const contrasts = keys.map(k => bm[k].contrast);

    const sections = [
        { title: '📊 Количество исследований по месяцам', draw: c => new Chart(c, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Исследований', data: totals, backgroundColor: '#3b82f6', borderRadius: 4 }] }, options: _barOptions('Месяц', 'Исследований') }) },
        { title: '📈 Динамика исследований по месяцам', draw: c => new Chart(c, { type: 'line', data: { labels: labels, datasets: [{ label: 'Исследований', data: totals, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.15)', fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: '#8b5cf6' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } } }) },
        { title: '📊 Нативные vs КУ по месяцам', draw: c => new Chart(c, { type: 'bar', data: { labels: labels, datasets: [{ label: '🦴 Нативные', data: natives, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: '💉 С КУ', data: contrasts, backgroundColor: '#f59e0b', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 15 } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } } }) }
    ];
    const data = {
        type: 'month',
        sections: [
            { title: 'Количество исследований по месяцам', rows: keys.map((k, i) => [labels[i], totals[i]]) },
            { title: 'Нативные / КУ по месяцам', rows: keys.map((k, i) => [labels[i] + ' / Нативные', natives[i]]).concat(keys.map((k, i) => [labels[i] + ' / КУ', contrasts[i]])) }
        ]
    };
    _openChartsModal('📅 Графики по месяцам', sections, data);
}

// ============================================================
// 9. ГРАФИКИ ПО ПРОИЗВОДИТЕЛЬНОСТИ ПЕРСОНАЛА
// ============================================================
function openPerformanceCharts() {
    const filtered = getFilteredStudies();
    const doctorStats = {};
    filtered.forEach(s => {
        if (!s.doctor) return;
        if (!doctorStats[s.doctor]) doctorStats[s.doctor] = { native: 0, contrast: 0, total: 0 };
        (s.zones || []).forEach(z => {
            if (z.type === 'native') doctorStats[s.doctor].native++;
            else doctorStats[s.doctor].contrast++;
            doctorStats[s.doctor].total++;
        });
    });
    const labStats = {};
    filtered.forEach(s => {
        if (!s.lab) return;
        if (!labStats[s.lab]) labStats[s.lab] = { native: 0, contrast: 0, total: 0 };
        (s.zones || []).forEach(z => {
            if (z.type === 'native') labStats[s.lab].native++;
            else labStats[s.lab].contrast++;
            labStats[s.lab].total++;
        });
    });

    if (!Object.keys(doctorStats).length && !Object.keys(labStats).length) return _emptyCharts('👨‍⚕️ Графики по персоналу');

    const doctorNames = Object.keys(doctorStats).sort((a, b) => doctorStats[b].total - doctorStats[a].total);
    const doctorNative = doctorNames.map(d => doctorStats[d].native);
    const doctorContrast = doctorNames.map(d => doctorStats[d].contrast);
    const doctorTotals = doctorNames.map(d => doctorStats[d].total);

    const labNames = Object.keys(labStats).sort((a, b) => labStats[b].total - labStats[a].total);
    const labNative = labNames.map(l => labStats[l].native);
    const labContrast = labNames.map(l => labStats[l].contrast);
    const labTotals = labNames.map(l => labStats[l].total);

    const sections = [];
    if (doctorNames.length) {
        sections.push({
            title: '📊 Врачи: нативные vs КУ',
            draw: c => new Chart(c, { type: 'bar', data: { labels: doctorNames, datasets: [{ label: '🦴 Нативные', data: doctorNative, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: '💉 С КУ', data: doctorContrast, backgroundColor: '#f59e0b', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 15 } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } } })
        });
        sections.push({
            title: '🥧 Врачи: доля в общем количестве зон',
            draw: c => new Chart(c, { type: 'pie', data: { labels: doctorNames, datasets: [{ data: doctorTotals, backgroundColor: _pickColors(doctorNames.length), borderWidth: 2, borderColor: '#fff' }] }, options: _pieOptions() })
        });
    }
    if (labNames.length) {
        sections.push({
            title: '📊 Лаборанты: нативные vs КУ',
            draw: c => new Chart(c, { type: 'bar', data: { labels: labNames, datasets: [{ label: '🦴 Нативные', data: labNative, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: '💉 С КУ', data: labContrast, backgroundColor: '#f59e0b', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 15 } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } } })
        });
        sections.push({
            title: '🥧 Лаборанты: доля в общем количестве зон',
            draw: c => new Chart(c, { type: 'pie', data: { labels: labNames, datasets: [{ data: labTotals, backgroundColor: _pickColors(labNames.length), borderWidth: 2, borderColor: '#fff' }] }, options: _pieOptions() })
        });
    }

    const data = {
        type: 'performance',
        sections: [
            { title: 'Врачи: нативные / КУ', rows: doctorNames.map((d, i) => [d + ' / Нативные', doctorNative[i]]).concat(doctorNames.map((d, i) => [d + ' / КУ', doctorContrast[i]])) },
            { title: 'Врачи: всего зон', rows: doctorNames.map((d, i) => [d, doctorTotals[i]]) },
            { title: 'Лаборанты: нативные / КУ', rows: labNames.map((l, i) => [l + ' / Нативные', labNative[i]]).concat(labNames.map((l, i) => [l + ' / КУ', labContrast[i]])) },
            { title: 'Лаборанты: всего зон', rows: labNames.map((l, i) => [l, labTotals[i]]) }
        ]
    };
    _openChartsModal('👨‍⚕️ Графики по персоналу', sections, data);
}

// ============================================================
// 10. ГРАФИКИ ПО СМЕНАМ
// ============================================================
function openShiftCharts() {
    const filtered = getFilteredStudies();
    const byShift = {};
    filtered.forEach(s => {
        const shiftStart = getShiftDate(s.studyDate, s.studyTime);
        if (!shiftStart) return;
        if (!byShift[shiftStart]) byShift[shiftStart] = { studies: 0, zones: 0 };
        byShift[shiftStart].studies++;
        byShift[shiftStart].zones += (s.zones || []).length;
    });

    const shiftKeys = Object.keys(byShift).sort((a, b) => a.localeCompare(b));
    if (!shiftKeys.length) return _emptyCharts('🔄 Графики по сменам');

    const labels = shiftKeys.map(k => {
        const end = addDays(k, 1);
        return formatDate(k) + ' → ' + formatDate(end);
    });
    const studies = shiftKeys.map(k => byShift[k].studies);
    const zones = shiftKeys.map(k => byShift[k].zones);

    const sections = [
        { title: '📊 Исследований по сменам', draw: c => new Chart(c, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Исследований', data: studies, backgroundColor: '#3b82f6', borderRadius: 4 }] }, options: _barOptions('Смена', 'Исследований') }) },
        { title: '📊 Зон по сменам', draw: c => new Chart(c, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Зон', data: zones, backgroundColor: '#8b5cf6', borderRadius: 4 }] }, options: _barOptions('Смена', 'Зон') }) }
    ];

    const data = {
        type: 'shift',
        sections: [
            { title: 'Исследований по сменам', rows: shiftKeys.map((k, i) => [labels[i], studies[i]]) },
            { title: 'Зон по сменам', rows: shiftKeys.map((k, i) => [labels[i], zones[i]]) }
        ]
    };
    _openChartsModal('🔄 Графики по сменам', sections, data);
}

// ============================================================
// 11. ЭКСПОРТ ДАННЫХ ИЗ МОДАЛКИ ГРАФИКОВ В CSV
// ============================================================
function exportChartsData() {
    if (!chartsModalData) { toast('Нечего экспортировать', 'error'); return; }
    const titleMap = { dept: 'Графики по отделениям', zone: 'Графики по зонам', diag: 'Графики по диагнозам', month: 'Графики по месяцам', performance: 'Графики по персоналу', shift: 'Графики по сменам' };
    const headerTitle = titleMap[chartsModalData.type] || 'Графики';
    const lines = [];
    lines.push(['Отчёт: ' + headerTitle]);
    lines.push(['Дата формирования: ' + formatDate(todayISO())]);
    lines.push([]);
    chartsModalData.sections.forEach(section => {
        lines.push(['=== ' + section.title + ' ===']);
        lines.push(['Название', 'Значение']);
        section.rows.forEach(r => lines.push([r[0], r[1]]));
        lines.push([]);
    });
    const csv = lines.map(row => row.map(cell => {
        const v = (cell === null || cell === undefined) ? '' : String(cell);
        return '"' + v.replace(/"/g, '""') + '"';
    }).join(';')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Графики_' + chartsModalData.type + '_' + todayISO() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('📊 Отчёт сохранён', 'success');
}

// ============================================================
// 12. ПОЛНЫЙ ЭКСПОРТ В EXCEL (несколько листов, .xlsx)
// ============================================================
function exportFullExcel() {
    if (typeof XLSX === 'undefined') {
        toast('Библиотека XLSX не загружена (проверьте интернет)', 'error');
        return;
    }
    const filtered = getFilteredStudies();
    if (!filtered.length) { toast('Нет данных для экспорта', 'error'); return; }

    const numMap = calculateNumbers();
    const statusNames = { pending: 'Ожидает', described: 'Описано', signed: 'Подписано' };
    const wb = XLSX.utils.book_new();

    // Лист 1: Исследования
    const studiesHeader = ['№','№ смены','Статус','Дата исследования','Время исследования','ФИО','Дата рождения','Возраст','№ истории','Отделение','Шаблон','МКБ-10','Дата поступления','Время поступления','Нативные зоны','Зоны с КУ','Доза (мЗв)','Контраст (мл)','Препарат','Врач','Лаборант','Подписал','Дата подписи'];
    const studiesRows = filtered.map(s => {
        const n = numMap[s.id] || { global: '-', shift: '-' };
        const zones = s.zones || [];
        const nativeNames = zones.filter(z => z.type === 'native').map(z => z.name).join(', ');
        const contrastNames = zones.filter(z => z.type === 'contrast').map(z => z.name).join(', ');
        return [n.global, n.shift, statusNames[s.status || 'pending'], formatDate(s.studyDate), s.studyTime || '', s.fio || '', formatDate(s.birthDate), s.age || '', s.historyNum || '', s.dept || '', s.templateName || '', s.icdDisplay || '', formatDate(s.admitDate), s.admitTime || '', nativeNames, contrastNames, (s.totalDose || 0).toFixed(1), s.contrast || 0, s.contrastDrugName || '', s.doctor || '', s.lab || '', s.signedBy || '', s.signedAt ? formatDateTime(s.signedAt) : ''];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([studiesHeader, ...studiesRows]), 'Исследования');

    // Лист 2: По отделениям
    const byDept = {};
    filtered.forEach(s => {
        if (!s.dept) return;
        if (!byDept[s.dept]) byDept[s.dept] = { total: 0, native: 0, contrast: 0 };
        byDept[s.dept].total++;
        (s.zones || []).forEach(z => {
            if (z.type === 'native') byDept[s.dept].native++;
            else byDept[s.dept].contrast++;
        });
    });
    const deptRows = [['Отделение', 'Исследований', 'Нативных зон', 'Зон с КУ']];
    Object.entries(byDept).sort((a, b) => b[1].total - a[1].total).forEach(([dept, d]) => deptRows.push([dept, d.total, d.native, d.contrast]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptRows), 'По отделениям');

    // Лист 3: По зонам
    const zoneStats = {};
    filtered.forEach(s => {
        (s.zones || []).forEach(z => {
            if (!zoneStats[z.name]) zoneStats[z.name] = { total: 0, type: z.type === 'native' ? 'Нативная' : 'С КУ', doctors: {} };
            zoneStats[z.name].total++;
            const doc = s.doctor || '—';
            zoneStats[z.name].doctors[doc] = (zoneStats[z.name].doctors[doc] || 0) + 1;
        });
    });
    const zoneRows = [['Зона', 'Тип', 'Всего', 'Врачи (кто описывал)']];
    Object.entries(zoneStats).sort((a, b) => b[1].total - a[1].total).forEach(([z, d]) => {
        const docs = Object.entries(d.doctors).map(([doc, c]) => doc + ': ' + c).join('; ');
        zoneRows.push([z, d.type, d.total, docs]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(zoneRows), 'По зонам');

    // Лист 4: По диагнозам
    const byDiag = {};
    filtered.forEach(s => {
        if (!s.icdDisplay) return;
        byDiag[s.icdDisplay] = (byDiag[s.icdDisplay] || 0) + 1;
    });
    const diagRows = [['Диагноз МКБ-10', 'Количество исследований']];
    Object.entries(byDiag).sort((a, b) => b[1] - a[1]).forEach(([d, c]) => diagRows.push([d, c]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(diagRows), 'По диагнозам');

    // Лист 5: По месяцам
    const bm = {};
    filtered.forEach(s => {
        if (!s.studyDate) return;
        const k = s.studyDate.slice(0, 7);
        if (!bm[k]) bm[k] = { total: 0, native: 0, contrast: 0 };
        bm[k].total++;
        (s.zones || []).forEach(z => {
            if (z.type === 'native') bm[k].native++;
            else bm[k].contrast++;
        });
    });
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const monthRows = [['Месяц', 'Исследований', 'Нативных зон', 'Зон с КУ']];
    Object.keys(bm).sort().forEach(k => {
        const [y, mo] = k.split('-');
        monthRows.push([monthNames[parseInt(mo) - 1] + ' ' + y, bm[k].total, bm[k].native, bm[k].contrast]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthRows), 'По месяцам');

    // Лист 6: По врачам
    const doctorStats = {};
    filtered.forEach(s => {
        if (!s.doctor) return;
        if (!doctorStats[s.doctor]) doctorStats[s.doctor] = { native: 0, contrast: 0, total: 0 };
        (s.zones || []).forEach(z => {
            if (z.type === 'native') doctorStats[s.doctor].native++;
            else doctorStats[s.doctor].contrast++;
            doctorStats[s.doctor].total++;
        });
    });
    const doctorRows = [['Врач', 'Нативных зон', 'Зон с КУ', 'Всего зон']];
    Object.entries(doctorStats).sort((a, b) => b[1].total - a[1].total).forEach(([d, st]) => doctorRows.push([d, st.native, st.contrast, st.total]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(doctorRows), 'По врачам');

    // Лист 7: По лаборантам
    const labStats = {};
    filtered.forEach(s => {
        if (!s.lab) return;
        if (!labStats[s.lab]) labStats[s.lab] = { native: 0, contrast: 0, total: 0 };
        (s.zones || []).forEach(z => {
            if (z.type === 'native') labStats[s.lab].native++;
            else labStats[s.lab].contrast++;
            labStats[s.lab].total++;
        });
    });
    const labRows = [['Лаборант', 'Нативных зон', 'Зон с КУ', 'Всего зон']];
    Object.entries(labStats).sort((a, b) => b[1].total - a[1].total).forEach(([l, st]) => labRows.push([l, st.native, st.contrast, st.total]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(labRows), 'По лаборантам');

    // Лист 8: По сменам
    const byShift = {};
    filtered.forEach(s => {
        const shiftStart = getShiftDate(s.studyDate, s.studyTime);
        if (!shiftStart) return;
        if (!byShift[shiftStart]) byShift[shiftStart] = { studies: 0, zones: 0 };
        byShift[shiftStart].studies++;
        byShift[shiftStart].zones += (s.zones || []).length;
    });
    const shiftRows = [['Смена', 'Исследований', 'Зон']];
    Object.keys(byShift).sort().forEach(k => {
        const end = addDays(k, 1);
        shiftRows.push([formatDate(k) + ' → ' + formatDate(end), byShift[k].studies, byShift[k].zones]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(shiftRows), 'По сменам');

    XLSX.writeFile(wb, 'КТ_отчёт_' + todayISO() + '.xlsx');
    toast('📊 Excel-файл сохранён (8 листов)', 'success');
}