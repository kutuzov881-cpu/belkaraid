// ============================================================
// СКЛАД (препараты, расходники, операции)
// v2.0 — сохранение на сервер
// ============================================================

// Отрисовка склада
function renderStock() {
    const ts = state.drugs.reduce((a, d) => a + d.stock, 0);

    document.getElementById('stockStats').innerHTML =
        '<div class="stat-card"><div class="stat-label">💉 Контрастов</div><div class="stat-value">' + state.drugs.length + '</div></div>' +
        '<div class="stat-card success"><div class="stat-label">📦 Общий остаток</div><div class="stat-value">' + ts + '<span class="stat-unit">мл</span></div></div>' +
        '<div class="stat-card accent"><div class="stat-label">🔧 Расходников</div><div class="stat-value">' + state.consumables.length + '</div></div>';

    document.getElementById('drugsList').innerHTML = state.drugs.map(d => {
        const color = d.stock <= 0 ? 'var(--danger)' : d.stock < d.minStock ? 'var(--warning)' : 'var(--primary)';
        return '<div class="card" style="margin-bottom:8px;padding:14px;border-left:4px solid ' + color + '">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div>' +
            '<div style="font-weight:700">' + d.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + d.conc + ' • Мин: ' + d.minStock + ' мл</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="font-size:20px;font-weight:700;color:' + color + '">' + d.stock + ' мл</div>' +
            '<button class="btn btn-secondary" onclick="openDrugModal(\'' + d.id + '\')" style="padding:6px 10px;font-size:11px">✏️</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    document.getElementById('consumablesList').innerHTML = state.consumables.map(c => {
        const stockClass = c.stock <= 0 ? 'empty' : c.stock < c.minStock ? 'low' : '';
        return '<div class="consumable-card">' +
            '<div>' +
            '<div class="consumable-name">' + c.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">Мин: ' + c.minStock + ' шт</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px">' +
            '<div class="consumable-stock ' + stockClass + '">' + c.stock + ' шт</div>' +
            '<button class="btn btn-secondary" onclick="editConsumable(\'' + c.id + '\')" style="padding:6px 10px;font-size:11px">✏️</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

// Журнал операций
function renderOperations() {
    const dateFrom = document.getElementById('opDateFrom').value;
    const dateTo = document.getElementById('opDateTo').value;
    const typeFilter = document.getElementById('opTypeFilter').value;
    const search = document.getElementById('opSearch').value.toLowerCase();

    let ops = [...state.operations].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (dateFrom) ops = ops.filter(o => o.date && o.date >= dateFrom);
    if (dateTo) ops = ops.filter(o => o.date && o.date <= dateTo);
    if (typeFilter) ops = ops.filter(o => o.type === typeFilter);
    if (search) ops = ops.filter(o =>
        (o.itemName || '').toLowerCase().includes(search) ||
        (o.note || '').toLowerCase().includes(search)
    );

    const body = document.getElementById('operationsBody');
    const empty = document.getElementById('operationsEmpty');

    if (!ops.length) {
        body.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    const typeLabels = {
        in: '<span class="op-type-in">📥 Приход</span>',
        out: '<span class="op-type-out">📤 Ручной расход</span>',
        auto: '<span class="op-type-auto">⚙️ Авто-списание</span>'
    };

    body.innerHTML = ops.map(o =>
        '<tr>' +
        '<td>' + formatDate(o.date) + '</td>' +
        '<td>' + (o.time || '—') + '</td>' +
        '<td>' + typeLabels[o.type] + '</td>' +
        '<td>' + o.itemName + '</td>' +
        '<td><strong>' + (o.type === 'in' ? '+' : '-') + o.amount + '</strong> ' + (o.itemType === 'drug' ? 'мл' : 'шт') + '</td>' +
        '<td style="font-size:11px">' + (o.note || '—') + '</td>' +
        '<td style="font-size:11px">' + (o.user || '—') + '</td>' +
        '</tr>'
    ).join('');
}

function clearOpFilters() {
    document.getElementById('opDateFrom').value = '';
    document.getElementById('opDateTo').value = '';
    document.getElementById('opTypeFilter').value = '';
    document.getElementById('opSearch').value = '';
    renderOperations();
}

// Открытие модалки операции
function openOperationModal(type) {
    state.currentOpType = type;

    document.getElementById('operationModalTitle').textContent =
        type === 'in' ? '📥 Добавить приход' : '📤 Ручной расход';

    document.getElementById('opTypeDisplay').innerHTML =
        type === 'in' ?
        '<span class="op-type-in">📥 ПРИХОД</span> — увеличение остатка' :
        '<span class="op-type-out">📤 РУЧНОЙ РАСХОД</span> — уменьшение остатка (брак, истёк срок и т.д.)';

    document.getElementById('opTypeDisplay').style.background =
        type === 'in' ? '#d1fae5' : '#fee2e2';

    const items = [
        ...state.drugs.map(d => ({
            id: d.id,
            name: d.name + ' (' + d.conc + ')',
            type: 'drug',
            stock: d.stock,
            unit: 'мл'
        })),
        ...state.consumables.map(c => ({
            id: c.id,
            name: c.name,
            type: 'consumable',
            stock: c.stock,
            unit: 'шт'
        }))
    ];

    document.getElementById('opItem').innerHTML =
        '<option value="">— выберите —</option>' +
        items.map(it =>
            '<option value="' + it.id + '" data-type="' + it.type + '">' +
            it.name + ' (остаток: ' + it.stock + ' ' + it.unit + ')' +
            '</option>'
        ).join('');

    document.getElementById('opAmount').value = 1;
    document.getElementById('opDate').value = todayISO();
    document.getElementById('opNote').value = '';

    openModal('operationModal');
}

// Сохранение операции — async
async function saveOperation() {
    const itemId = document.getElementById('opItem').value;
    const amount = parseFloat(document.getElementById('opAmount').value) || 0;
    const date = document.getElementById('opDate').value;
    const note = document.getElementById('opNote').value.trim();

    if (!itemId) {
        toast('Выберите препарат/расходник', 'error');
        return;
    }

    if (amount <= 0) {
        toast('Укажите количество', 'error');
        return;
    }

    if (!date) {
        toast('Укажите дату', 'error');
        return;
    }

    const itemEl = document.getElementById('opItem').selectedOptions[0];
    const itemType = itemEl.dataset.type;
    const itemName = itemEl.textContent.split(' (остаток')[0];

    let operation;

    if (state.currentOpType === 'in') {
        if (itemType === 'drug') {
            const d = state.drugs.find(x => x.id === itemId);
            if (d) {
                d.stock += amount;
                await saveDrugToServer(d);
            }
        } else {
            const c = state.consumables.find(x => x.id === itemId);
            if (c) {
                c.stock += amount;
                await saveConsumableToServer(c);
            }
        }

        operation = {
            id: uid(),
            type: 'in',
            itemId: itemId,
            itemName: itemName,
            itemType: itemType,
            amount: amount,
            date: date,
            time: nowTime(),
            note: note || (state.currentUser ? state.currentUser.name : 'Пользователь'),
            createdAt: Date.now()
        };

        await saveOperationToServer(operation);
        state.operations.unshift(operation);

        toast('✅ Приход добавлен: +' + amount, 'success');

    } else {
        if (itemType === 'drug') {
            const d = state.drugs.find(x => x.id === itemId);
            if (!d) { toast('Препарат не найден', 'error'); return; }
            if (amount > d.stock) {
                toast('⚠️ Недостаточно на складе (остаток: ' + d.stock + ' мл)', 'error');
                return;
            }
            d.stock -= amount;
            await saveDrugToServer(d);
        } else {
            const c = state.consumables.find(x => x.id === itemId);
            if (!c) { toast('Расходник не найден', 'error'); return; }
            if (amount > c.stock) {
                toast('⚠️ Недостаточно на складе (остаток: ' + c.stock + ' шт)', 'error');
                return;
            }
            c.stock -= amount;
            await saveConsumableToServer(c);
        }

        operation = {
            id: uid(),
            type: 'out',
            itemId: itemId,
            itemName: itemName,
            itemType: itemType,
            amount: amount,
            date: date,
            time: nowTime(),
            note: note || 'Ручной расход',
            user: state.currentUser ? state.currentUser.name : 'Пользователь',
            createdAt: Date.now()
        };

        await saveOperationToServer(operation);
        state.operations.unshift(operation);

        toast('✅ Ручной расход записан: -' + amount, 'success');
    }

    saveState();
    closeModal('operationModal');

    renderStock();
    renderOperations();
    renderReport();
}

// Остаток на дату
function getStockAtDate(itemId, date) {
    if (!date) return null;

    let stock = 0;
    state.operations
        .filter(o => o.itemId === itemId && o.date && o.date <= date)
        .forEach(o => {
            if (o.type === 'in') stock += o.amount;
            else                 stock -= o.amount;
        });

    return stock;
}

// Отчёт по движению склада (без изменений)
function renderReport() {
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const el = document.getElementById('reportResult');

    if (!dateFrom && !dateTo) {
        el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Выберите период для формирования отчёта (хотя бы одну дату)</div>';
        return;
    }

    const allItems = [
        ...state.drugs.map(d => ({
            id: d.id,
            name: d.name + ' (' + d.conc + ')',
            type: 'drug',
            unit: 'мл',
            currentStock: d.stock,
            minStock: d.minStock
        })),
        ...state.consumables.map(c => ({
            id: c.id,
            name: c.name,
            type: 'consumable',
            unit: 'шт',
            currentStock: c.stock,
            minStock: c.minStock
        }))
    ];

    const periodOps = state.operations.filter(o => {
        if (!o.date) return false;
        if (dateFrom && o.date < dateFrom) return false;
        if (dateTo && o.date > dateTo) return false;
        return true;
    });

    let daysInPeriod;
    if (dateFrom && dateTo) {
        daysInPeriod = Math.max(1, Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1);
    } else if (dateFrom && !dateTo) {
        daysInPeriod = Math.max(1, Math.ceil((new Date() - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1);
    } else {
        const dates = state.operations.map(o => o.date).filter(Boolean).sort();
        if (!dates.length) {
            daysInPeriod = 1;
        } else {
            daysInPeriod = Math.max(1, Math.ceil((new Date(dateTo) - new Date(dates[0])) / (1000 * 60 * 60 * 24)) + 1);
        }
    }

    let html = '<div class="table-wrap"><table><thead><tr>' +
        '<th>Позиция</th>' +
        '<th>Начальный остаток</th>' +
        '<th>Приход</th>' +
        '<th>Расход (авто)</th>' +
        '<th>Расход (ручной)</th>' +
        '<th>Движение</th>' +
        '<th>Конечный остаток</th>' +
        '<th>Прогноз (дней)</th>' +
        '</tr></thead><tbody>';

    allItems.forEach(item => {
        const itemOps = periodOps.filter(o => o.itemId === item.id);

        const periodIn         = itemOps.filter(o => o.type === 'in').reduce((s, o) => s + o.amount, 0);
        const periodAutoOut    = itemOps.filter(o => o.type === 'auto').reduce((s, o) => s + o.amount, 0);
        const periodManualOut  = itemOps.filter(o => o.type === 'out').reduce((s, o) => s + o.amount, 0);
        const totalOut         = periodAutoOut + periodManualOut;

        let startStock;
        if (dateFrom) {
            startStock = getStockAtDate(item.id, dateFrom);
            if (startStock === null) startStock = 0;
        } else {
            startStock = 0;
        }

        let endStock;
        if (dateTo) {
            endStock = getStockAtDate(item.id, dateTo);
            if (endStock === null) endStock = 0;
        } else {
            endStock = item.currentStock;
        }

        const movement = endStock - startStock;
        const movementSign = movement > 0 ? '+' : (movement < 0 ? '−' : '');
        const movementAbs = Math.abs(movement);
        const movementColor = movement > 0 ? 'var(--success)' : (movement < 0 ? 'var(--danger)' : 'var(--text-muted)');

        const dailyConsumption = totalOut / daysInPeriod;
        const forecast = dailyConsumption > 0 ? Math.floor(endStock / dailyConsumption) : '∞';

        const rowColor = endStock <= 0 ? 'background:#fee2e2' :
            (endStock < (item.minStock || 10) ? 'background:#fef3c7' : '');

        html += '<tr style="' + rowColor + '">' +
            '<td><strong>' + item.name + '</strong></td>' +
            '<td>' + startStock + ' ' + item.unit + '</td>' +
            '<td style="color:var(--success);font-weight:700">+' + periodIn + '</td>' +
            '<td style="color:var(--primary)">-' + periodAutoOut + '</td>' +
            '<td style="color:var(--danger)">-' + periodManualOut + '</td>' +
            '<td style="color:' + movementColor + ';font-weight:700">' + movementSign + movementAbs + ' ' + item.unit + '</td>' +
            '<td><strong>' + endStock + ' ' + item.unit + '</strong></td>' +
            '<td>' + (forecast === '∞' ? '<span style="color:var(--text-muted)">—</span>' : '<strong>' + forecast + '</strong> дн.') + '</td>' +
            '</tr>';
    });

    html += '</tbody></table></div>';

    const fromLabel = dateFrom ? formatDate(dateFrom) : 'начало журнала';
    const toLabel   = dateTo ? formatDate(dateTo) : 'сегодня';
    html += '<div style="margin-top:12px;font-size:12px;color:var(--text-muted)">' +
        '📅 Период: ' + fromLabel + ' — ' + toLabel + ' (' + daysInPeriod + ' дн.)' +
        '</div>';

    el.innerHTML = html;
}

// ============================================================
// ПРЕПАРАТЫ — async
// ============================================================
function openDrugModal(id) {
    state.editingDrugId = id || null;

    if (id) {
        const d = state.drugs.find(x => x.id === id);
        if (!d) return;

        document.getElementById('drugModalTitle').textContent = '✏️ Редактирование';
        document.getElementById('drugName').value = d.name;
        document.getElementById('drugConc').value = d.conc || '';
        document.getElementById('drugStock').value = d.stock || 0;
    } else {
        document.getElementById('drugModalTitle').textContent = '🧪 Новый препарат';
        document.getElementById('drugName').value = '';
        document.getElementById('drugConc').value = '';
        document.getElementById('drugStock').value = 0;
    }

    openModal('drugModal');
}

async function saveDrug() {
    const n = document.getElementById('drugName').value.trim();

    if (!n) {
        toast('Введите название', 'error');
        return;
    }

    const d = {
        id: state.editingDrugId || uid(),
        name: n,
        conc: document.getElementById('drugConc').value.trim(),
        volume: 100,
        stock: parseFloat(document.getElementById('drugStock').value) || 0,
        minStock: 100
    };

    if (state.editingDrugId) {
        const i = state.drugs.findIndex(x => x.id === state.editingDrugId);
        state.drugs[i] = d;
    } else {
        state.drugs.push(d);
    }

    // На сервер
    try {
        await saveDrugToServer(d);
        console.log('✅ Препарат на сервер:', d.id);
    } catch (err) {
        console.error('❌ Ошибка:', err);
    }

    saveState();
    closeModal('drugModal');
    renderStock();

    toast('Сохранено', 'success');
}

// ============================================================
// РАСХОДНИКИ — async
// ============================================================
function openConsumableModal(id) {
    state.editingConsumableId = id || null;

    if (id) {
        const c = state.consumables.find(x => x.id === id);
        if (!c) return;

        document.getElementById('consumableModalTitle').textContent = '✏️ Редактирование';
        document.getElementById('consumableName').value = c.name;
        document.getElementById('consumableStock').value = c.stock || 0;
        document.getElementById('consumableMinStock').value = c.minStock || 10;
    } else {
        document.getElementById('consumableModalTitle').textContent = '🔧 Новый расходник';
        document.getElementById('consumableName').value = '';
        document.getElementById('consumableStock').value = 0;
        document.getElementById('consumableMinStock').value = 10;
    }

    openModal('consumableModal');
}

function editConsumable(id) {
    openConsumableModal(id);
}

async function saveConsumable() {
    const n = document.getElementById('consumableName').value.trim();

    if (!n) {
        toast('Введите название', 'error');
        return;
    }

    const c = {
        id: state.editingConsumableId || uid(),
        name: n,
        stock: parseFloat(document.getElementById('consumableStock').value) || 0,
        minStock: parseFloat(document.getElementById('consumableMinStock').value) || 10
    };

    if (state.editingConsumableId) {
        const i = state.consumables.findIndex(x => x.id === state.editingConsumableId);
        state.consumables[i] = c;
    } else {
        state.consumables.push(c);
    }

    // На сервер
    try {
        await saveConsumableToServer(c);
        console.log('✅ Расходник на сервер:', c.id);
    } catch (err) {
        console.error('❌ Ошибка:', err);
    }

    saveState();
    closeModal('consumableModal');
    renderStock();

    toast('Сохранено', 'success');
}