// ============================================================
// ПЕЧАТЬ ПРОТОКОЛА ИЗ БРАУЗЕРА
// ============================================================

function printProtocol(studyId) {
    const s = state.studies.find(x => x.id === studyId);
    if (!s) {
        toast('Исследование не найдено', 'error');
        return;
    }

    const zones = s.zones || [];
    if (!zones.length) {
        toast('Нет зон для печати', 'error');
        return;
    }

    // Формируем HTML для печати
    let zonesHtml = '';
    zones.forEach(z => {
        const typeLabel = z.type === 'native' ? '🦴 Нативная' : '💉 С контрастом';
        const statusLabel = z.status === 'signed' ? '✅ Подписано'
            : z.status === 'described' ? '🟢 Описано'
            : '⏳ Ожидает';

        zonesHtml += `
            <div class="zone-block">
                <div class="zone-title">
                    ${z.name} <span class="zone-meta">(${typeLabel}, ${z.dose} мЗв) — ${statusLabel}</span>
                </div>
                <div class="zone-text">${z.description || '— описание отсутствует —'}</div>
                ${z.status === 'signed' ? `
                    <div class="zone-sign">
                        Подписано: ${z.signedBy || '—'} • ${z.signedAt ? formatDateTime(z.signedAt) : ''}
                    </div>
                ` : ''}
            </div>
        `;
    });

    // Сводная информация
    const infoBlock = `
        <table class="info-table">
            <tr>
                <td class="label">ФИО:</td>
                <td class="value">${s.fio}</td>
                <td class="label">Дата рождения:</td>
                <td class="value">${formatDate(s.birthDate)} (${s.age} лет)</td>
            </tr>
            <tr>
                <td class="label">№ истории:</td>
                <td class="value">${s.historyNum || '—'}</td>
                <td class="label">Отделение:</td>
                <td class="value">${s.dept || '—'}</td>
            </tr>
            <tr>
                <td class="label">Поступил:</td>
                <td class="value">${formatDate(s.admitDate)} ${s.admitTime || ''}</td>
                <td class="label">Исследование:</td>
                <td class="value">${formatDate(s.studyDate)} ${s.studyTime || ''}</td>
            </tr>
            <tr>
                <td class="label">Диагноз МКБ-10:</td>
                <td class="value" colspan="3">${s.icdDisplay || '—'}</td>
            </tr>
            <tr>
                <td class="label">Вид исследования:</td>
                <td class="value">${s.templateName || 'КТ'}</td>
                <td class="label">Общая доза:</td>
                <td class="value">${(s.totalDose || 0).toFixed(1)} мЗв</td>
            </tr>
            <tr>
                <td class="label">Контраст:</td>
                <td class="value" colspan="3">${s.contrast > 0 ? s.contrast + ' мл ' + (s.contrastDrugName || '') : 'не проводилось'}</td>
            </tr>
            <tr>
                <td class="label">Врач:</td>
                <td class="value">${s.doctor || '—'}</td>
                <td class="label">Лаборант:</td>
                <td class="value">${s.lab || '—'}</td>
            </tr>
        </table>
    `;

    // Финальная подпись
    const signature = s.status === 'signed'
        ? `<div class="signature-block">
             <strong>Врач-рентгенолог:</strong> ${s.signedBy}<br>
             <strong>Дата подписи:</strong> ${formatDateTime(s.signedAt)}
           </div>`
        : `<div class="signature-line">
             <strong>Врач-рентгенолог:</strong> _________________ / ${s.doctor || ''}
           </div>`;

    // Полный HTML
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Протокол КТ — ${s.fio}</title>
<style>
    @page { size: A4; margin: 15mm 12mm; }
    * { box-sizing: border-box; }
    body {
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0;
    }
    .header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }
    .hospital-name {
        font-size: 10pt;
        font-weight: bold;
        line-height: 1.3;
    }
    .hospital-subtitle {
        font-size: 9pt;
        color: #444;
        margin-top: 2px;
    }
    .doc-title {
        font-size: 13pt;
        font-weight: bold;
        margin-top: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .doc-number {
        font-size: 11pt;
        margin-top: 4px;
    }
    .info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 10pt;
    }
    .info-table td {
        padding: 4px 6px;
        vertical-align: top;
        border: 1px solid #ccc;
    }
    .info-table .label {
        font-weight: bold;
        width: 18%;
        background: #f5f5f5;
    }
    .info-table .value {
        width: 32%;
    }
    .section-title {
        font-size: 11pt;
        font-weight: bold;
        margin: 16px 0 8px;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 4px;
    }
    .zone-block {
        margin: 12px 0;
        padding: 10px 12px;
        border-left: 3px solid #2b579a;
        background: #f9fafb;
        page-break-inside: avoid;
    }
    .zone-title {
        font-weight: bold;
        font-size: 11pt;
        color: #1e3a5f;
        margin-bottom: 4px;
    }
    .zone-meta {
        font-weight: normal;
        font-size: 9pt;
        color: #666;
    }
    .zone-text {
        font-size: 10pt;
        line-height: 1.5;
        white-space: pre-wrap;
        margin-top: 6px;
    }
    .zone-sign {
        font-size: 9pt;
        color: #666;
        margin-top: 6px;
        font-style: italic;
    }
    .signature-block {
        margin-top: 30px;
        padding: 10px 14px;
        border: 1px solid #000;
        display: inline-block;
        font-size: 10pt;
    }
    .signature-line {
        margin-top: 40px;
        font-size: 11pt;
    }
    .footer {
        margin-top: 30px;
        font-size: 8pt;
        color: #888;
        text-align: center;
        border-top: 1px solid #ccc;
        padding-top: 8px;
    }
    @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
</style>
</head>
<body>

<div class="header">
    <div class="hospital-name">
        МИНИСТЕРСТВО ЗДРАВООХРАНЕНИЯ МОСКОВСКОЙ ОБЛАСТИ<br>
        ГБУЗ МО «Жуковская областная клиническая больница»
    </div>
    <div class="hospital-subtitle">140186, Московская область, г. Жуковский</div>
    <div class="doc-title">Протокол КТ-исследования</div>
    <div class="doc-number">№ ${s.historyNum || 'б/н'} от ${formatDate(s.studyDate)}</div>
</div>

${infoBlock}

<div class="section-title">Описание по зонам (${zones.length})</div>
${zonesHtml}

${signature}

<div class="footer">
    Документ сформирован автоматически • КТ-Журнал Pro v24 • ${formatDate(todayISO())} ${nowTime()}
</div>

<script>
    window.onload = function() {
        setTimeout(function() {
            window.print();
        }, 300);
    };
</script>
</body>
</html>`;

    // Открываем новое окно и печатаем
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
        toast('Разрешите всплывающие окна для печати', 'error');
        return;
    }
    w.document.write(html);
    w.document.close();
}