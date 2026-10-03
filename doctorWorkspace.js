// ============================================================
// РАБОЧЕЕ МЕСТО ВРАЧА
// ============================================================

function openDoctorWorkspace(id) {
    if (currentRole !== 'doctor') {
        toast('Только для врача', 'error');
        return;
    }

    let s = state.studies.find(x => x.id === id);
    if (!s) return;

    if (!s.zones || !s.zones.length) {
        const idx = state.studies.findIndex(x => x.id === id);
        state.studies[idx] = migrateStudy(s);
        s = state.studies[idx];
        saveState();
    }

    state.currentDoctorStudyId = id;
    state.currentSelectedZoneIndex = 0;

    const patientInfoEl = document.getElementById('patientInfo');
    if (patientInfoEl) {
        patientInfoEl.innerHTML =
            '<div style="font-weight:700;margin-bottom:4px">' + s.fio + '</div>' +
            '<div>Д.р.: ' + formatDate(s.birthDate) + ' (' + s.age + ' лет)</div>' +
            '<div>№ истории: ' + (s.historyNum || '—') + '</div>';
    }

    const patientStudies = state.studies
        .filter(x => x.fio === s.fio && x.birthDate === s.birthDate)
        .sort((a, b) =>
            ((a.studyDate || '') + ' ' + (a.studyTime || '')).localeCompare(
                (b.studyDate || '') + ' ' + (b.studyTime || '')
            )
        );

    const studiesListEl = document.getElementById('patientStudiesList');
    if (studiesListEl) {
        studiesListEl.innerHTML = patientStudies.map(ps => {
            const zones = ps.zones || [];
            const nativeCount = zones.filter(z => z.type === 'native').length;
            const contrastCount = zones.filter(z => z.type === 'contrast').length;
            const pills = { pending: '🟡', described: '🟢', signed: '🔵' };

            return '<div class="study-list-item ' + (ps.id === id ? 'active' : '') + '" onclick="switchDoctorStudy(\'' + ps.id + '\', event)">' +
                '<div class="study-list-title">' + pills[ps.status || 'pending'] + ' ' + formatDate(ps.studyDate) + ' ' + ps.studyTime + '</div>' +
                '<div class="study-list-meta">' + (ps.templateName || 'Исследование') + '</div>' +
                '<div class="study-list-meta">Нат: ' + nativeCount + ' • КУ: ' + contrastCount + '</div>' +
                '<div class="study-list-meta">Доза: ' + (ps.totalDose || 0).toFixed(1) + ' мЗв</div>' +
                '</div>';
        }).join('');
    }

    loadDoctorStudyData(id);

    openModal('doctorWorkspace');
}

function switchDoctorStudy(id, event) {
    state.currentDoctorStudyId = id;
    state.currentSelectedZoneIndex = 0;

    document.querySelectorAll('.study-list-item').forEach(el => el.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    loadDoctorStudyData(id);
}

function loadDoctorStudyData(id) {
    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    if (!s.zones || !s.zones.length) {
        const idx = state.studies.findIndex(x => x.id === id);
        state.studies[idx] = migrateStudy(s);
        saveState();
        loadDoctorStudyData(id);
        return;
    }

    const zones = s.zones;

    // === Панель с данными пациента ===
    const docInfoEl = document.getElementById('docInfoPanel');
    if (docInfoEl) {
        docInfoEl.innerHTML = `
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">ФИО</div><div style="font-weight:700">${s.fio}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Д.р./Возраст</div><div style="font-weight:700">${formatDate(s.birthDate)} (${s.age} лет)</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Отделение</div><div style="font-weight:700">${s.dept||'—'}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Поступил</div><div style="font-weight:700">${formatDate(s.admitDate)} ${s.admitTime||''}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Исследование</div><div style="font-weight:700">${formatDate(s.studyDate)} ${s.studyTime||''}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Диагноз</div><div style="font-weight:700">${s.icdDisplay||'—'}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Контраст</div><div style="font-weight:700">${s.contrast>0?s.contrast+' мл '+s.contrastDrugName:'без контраста'}</div></div>
<div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Врач / Лаборант</div><div style="font-weight:700">${s.doctor||'—'} / ${s.lab||'—'}</div></div>
`;
    }

    // === Список зон ===
    const nativeZones = zones.filter(z => z.type === 'native');
    const contrastZones = zones.filter(z => z.type === 'contrast');
    const statusLabels = { pending: '⏳ Ожидает', described: '✅ Описано', signed: '🔵 Подписано' };
    const statusClasses = { pending: 'pending', described: 'described', signed: 'signed' };

    let html = '<div style="margin-top:8px"><div style="font-weight:700;margin-bottom:6px;font-size:13px">📋 ЗОНЫ ИССЛЕДОВАНИЯ</div>';

    if (!zones.length) {
        html += '<div style="padding:12px;color:var(--text-muted);font-size:12px">Нет зон для описания</div>';
    } else {
        if (nativeZones.length) {
            html += `<div style="font-size:10px;color:var(--text-muted);margin:6px 0 4px 0;text-transform:uppercase;font-weight:600">🦴 Нативные (${nativeZones.length})</div>`;
            nativeZones.forEach((z, idx) => {
                const realIdx = idx;
                const isActive = state.currentSelectedZoneIndex === realIdx;
                const statusText = statusLabels[z.status] || '⏳ Ожидает';
                const statusClass = statusClasses[z.status] || 'pending';
                html += `<div class="zone-item ${isActive?'active':''}" onclick="selectZone(${realIdx})"><div><strong>${z.name}</strong> <span style="font-size:10px;color:var(--text-muted)">${z.dose} мЗв</span></div><span class="zone-status ${statusClass}">${statusText}</span></div>`;
            });
        }
        if (contrastZones.length) {
            const offset = nativeZones.length;
            html += `<div style="font-size:10px;color:var(--text-muted);margin:6px 0 4px 0;text-transform:uppercase;font-weight:600">💉 С контрастом (${contrastZones.length})</div>`;
            contrastZones.forEach((z, idx) => {
                const realIdx = offset + idx;
                const isActive = state.currentSelectedZoneIndex === realIdx;
                const statusText = statusLabels[z.status] || '⏳ Ожидает';
                const statusClass = statusClasses[z.status] || 'pending';
                html += `<div class="zone-item ${isActive?'active':''}" onclick="selectZone(${realIdx})"><div><strong>${z.name}</strong> <span style="font-size:10px;color:var(--text-muted)">${z.dose} мЗв</span></div><span class="zone-status ${statusClass}">${statusText}</span></div>`;
            });
        }
    }

    html += '</div>';
    const patientStudiesListEl = document.getElementById('patientStudiesList');
    if (patientStudiesListEl) patientStudiesListEl.innerHTML = html;

    if (zones.length) {
        if (state.currentSelectedZoneIndex >= zones.length) state.currentSelectedZoneIndex = 0;
        loadZoneDescription(state.currentSelectedZoneIndex);
    } else {
        const descEl = document.getElementById('doctorDescription');
        if (descEl) descEl.value = '';

        const zoneTitleEl = document.getElementById('zoneTitle');
        if (zoneTitleEl) zoneTitleEl.innerHTML = '<span>Нет зон для описания</span>';

        const zoneCounterEl = document.getElementById('zoneCounter');
        if (zoneCounterEl) zoneCounterEl.textContent = '0 / 0';
    }

    // === Редактируемые поля (С ЗАЩИТОЙ ОТ NULL) ===
    const editStudyDateEl = document.getElementById('editStudyDate');
    if (editStudyDateEl) setDateInput(editStudyDateEl, s.studyDate || '');

    const editStudyTimeEl = document.getElementById('editStudyTime');
    if (editStudyTimeEl) editStudyTimeEl.value = s.studyTime || '';

    const editTotalDoseEl = document.getElementById('editTotalDose');
    if (editTotalDoseEl) editTotalDoseEl.value = s.totalDose || 0;

    const editContrastAmountEl = document.getElementById('editContrastAmount');
    if (editContrastAmountEl) editContrastAmountEl.value = s.contrast || 0;

    // === Шаблоны описаний ===
    if (typeof renderGroupedTemplates === 'function') {
        renderGroupedTemplates(null);
    }

    // === Конструктор протокола — сбрасываем состояние ===
    const constructorAreaEl = document.getElementById('constructorArea');
    if (constructorAreaEl) constructorAreaEl.value = 'ogk';

    if (typeof renderConstructor === 'function') {
        renderConstructor();
    }
}

function selectZone(index) {
    state.currentSelectedZoneIndex = index;
    document.querySelectorAll('.zone-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
    loadZoneDescription(index);
}

function loadZoneDescription(index) {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    const zones = s.zones || [];

    const descEl = document.getElementById('doctorDescription');
    const zoneTitleEl = document.getElementById('zoneTitle');
    const zoneCounterEl = document.getElementById('zoneCounter');

    if (index < 0 || index >= zones.length) {
        if (descEl) descEl.value = '';
        if (zoneTitleEl) zoneTitleEl.innerHTML = '<span>Нет зон</span>';
        if (zoneCounterEl) zoneCounterEl.textContent = '0 / 0';
        return;
    }

    const zone = zones[index];
    const typeLabel = zone.type === 'native' ? '🦴 Нативная' : '💉 С контрастом';

    if (zoneTitleEl) {
        zoneTitleEl.innerHTML =
            '<span>' + zone.name + '</span>' +
            '<span style="font-size:11px;font-weight:400;color:var(--text-muted)">' +
            typeLabel + ' • ' + zone.dose + ' мЗв' +
            '</span>';
    }

    if (zoneCounterEl) zoneCounterEl.textContent = (index + 1) + ' / ' + zones.length;
    if (descEl) descEl.value = zone.description || '';

    const statusMap = {
        pending: { cls: 'pending', text: '🟡 Ожидает' },
        described: { cls: 'described', text: '🟢 Описано' },
        signed: { cls: 'signed', text: '🔵 Подписано' }
    };
    const st = statusMap[zone.status] || statusMap.pending;

    const docStatusPillEl = document.getElementById('docStatusPill');
    if (docStatusPillEl) {
        docStatusPillEl.className = 'status-pill ' + st.cls;
        docStatusPillEl.textContent = st.text;
    }

    const signatureBlockEl = document.getElementById('signatureBlock');
    const signedByEl = document.getElementById('signedBy');
    const signedAtEl = document.getElementById('signedAt');

    if (zone.status === 'signed') {
        if (signatureBlockEl) signatureBlockEl.style.display = 'block';
        if (signedByEl) signedByEl.textContent = zone.signedBy || s.signedBy || s.doctor || '—';
        if (signedAtEl) signedAtEl.textContent = zone.signedAt ? formatDateTime(zone.signedAt) : formatDateTime(s.signedAt);
    } else {
        if (signatureBlockEl) signatureBlockEl.style.display = 'none';
    }

    if (typeof renderGroupedTemplates === 'function') {
        renderGroupedTemplates(zone.name);
    }
}

function navigateZone(delta) {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    const zones = s.zones || [];
    if (!zones.length) return;

    let newIndex = (state.currentSelectedZoneIndex || 0) + delta;
    if (newIndex < 0) newIndex = zones.length - 1;
    if (newIndex >= zones.length) newIndex = 0;

    selectZone(newIndex);
}

function saveDoctorDescription() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) return;

    const zoneIdx = state.currentSelectedZoneIndex;
    const zones = state.studies[idx].zones || [];

    if (zoneIdx < 0 || zoneIdx >= zones.length) {
        toast('Сначала выберите зону', 'error');
        return;
    }

    if (zones[zoneIdx].status === 'signed') {
        toast('Нельзя редактировать подписанную зону', 'error');
        return;
    }

    const descEl = document.getElementById('doctorDescription');
    const desc = descEl ? descEl.value.trim() : '';
    zones[zoneIdx].description = desc;

    if (desc && zones[zoneIdx].status !== 'signed') {
        zones[zoneIdx].status = 'described';
    }

    state.studies[idx].zones = zones;

    const allZones = zones;
    const allDescribed = allZones.every(z => z.status === 'described' || z.status === 'signed');
    const allSigned = allZones.every(z => z.status === 'signed');

    if (allSigned) state.studies[idx].status = 'signed';
    else if (allDescribed) state.studies[idx].status = 'described';
    else state.studies[idx].status = 'pending';

    saveState();
    renderJournal();
    renderQuickStats();

    loadDoctorStudyData(id);

    toast('✅ Описание зоны сохранено', 'success');
}

function resetZoneDescription() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) return;

    const zoneIdx = state.currentSelectedZoneIndex;
    const zones = state.studies[idx].zones || [];

    if (zoneIdx < 0 || zoneIdx >= zones.length) return;

    if (zones[zoneIdx].status === 'signed') {
        toast('Нельзя сбросить подписанную зону', 'error');
        return;
    }

    if (!confirm('Сбросить описание для зоны "' + zones[zoneIdx].name + '"?')) return;

    zones[zoneIdx].description = '';
    zones[zoneIdx].status = 'pending';
    zones[zoneIdx].signedBy = '';
    zones[zoneIdx].signedAt = '';

    state.studies[idx].zones = zones;

    const allZones = zones;
    const allDescribed = allZones.every(z => z.status === 'described' || z.status === 'signed');
    const allSigned = allZones.every(z => z.status === 'signed');

    if (allSigned) state.studies[idx].status = 'signed';
    else if (allDescribed) state.studies[idx].status = 'described';
    else state.studies[idx].status = 'pending';

    saveState();
    renderJournal();
    renderQuickStats();

    loadDoctorStudyData(id);

    toast('Описание зоны сброшено', 'success');
}

function signZone() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) return;

    const zoneIdx = state.currentSelectedZoneIndex;
    const zones = state.studies[idx].zones || [];

    if (zoneIdx < 0 || zoneIdx >= zones.length) {
        toast('Выберите зону', 'error');
        return;
    }

    const zone = zones[zoneIdx];

    if (!zone.description || !zone.description.trim()) {
        toast('Сначала напишите описание для этой зоны', 'error');
        return;
    }

    if (zone.status === 'signed') {
        toast('Эта зона уже подписана', 'error');
        return;
    }

    if (!confirm('Подписать описание для зоны "' + zone.name + '"?')) return;

    zone.status = 'signed';
    zone.signedBy = state.studies[idx].doctor || (state.currentUser && state.currentUser.name) || 'Врач';
    zone.signedAt = nowISO();

    const allZones = state.studies[idx].zones;
    const allSigned = allZones.every(z => z.status === 'signed');

    if (allSigned) {
        state.studies[idx].status = 'signed';
        state.studies[idx].signedBy = state.studies[idx].doctor;
        state.studies[idx].signedAt = nowISO();
    }

    saveState();
    renderJournal();
    renderQuickStats();

    loadDoctorStudyData(id);

    toast('✅ Зона "' + zone.name + '" подписана', 'success');
}

// ============================================================
// СОХРАНЕНИЕ РЕДАКТИРУЕМЫХ ПОЛЕЙ ВРАЧА (с защитой от null)
// ============================================================
function saveEditableFields() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const idx = state.studies.findIndex(s => s.id === id);
    if (idx === -1) return;

    const sdEl = document.getElementById('editStudyDate');
    const stEl = document.getElementById('editStudyTime');
    const tdEl = document.getElementById('editTotalDose');
    const caEl = document.getElementById('editContrastAmount');

    const sd = sdEl ? getDateFromInput(sdEl) : '';
    const st = stEl ? stEl.value : '';
    const td = tdEl ? parseFloat(tdEl.value) : NaN;
    const ca = caEl ? parseFloat(caEl.value) : NaN;

    if (sd) state.studies[idx].studyDate = sd;
    if (st) state.studies[idx].studyTime = st;
    if (!isNaN(td)) state.studies[idx].totalDose = td;
    if (!isNaN(ca)) state.studies[idx].contrast = ca;

    saveState();
    renderJournal();
    renderQuickStats();

    if (typeof loadDoctorStudyData === 'function') loadDoctorStudyData(id);

    const block = document.getElementById('editableFieldsBlock');
    if (block) block.style.display = 'none';

    toast('Изменения сохранены', 'success');
}