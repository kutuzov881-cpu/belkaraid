// ============================================================
// ЭКСПОРТ В WORD (ПРОТОКОЛ ИССЛЕДОВАНИЯ)
// ============================================================

function exportToWord() {
    const id = state.currentDoctorStudyId;
    if (!id) return;

    const s = state.studies.find(x => x.id === id);
    if (!s) return;

    const zones = s.zones || [];

    if (!zones.length) {
        toast('Нет зон для экспорта', 'error');
        return;
    }

    // Формируем HTML-блоки для каждой зоны
    let zonesHtml = '';

    zones.forEach((z) => {
        const statusIcon = z.status === 'signed' ? '✅' : z.status === 'described' ? '🟢' : '⏳';
        const typeIcon = z.type === 'native' ? '🦴' : '💉';
        const signature = z.status === 'signed' ?
            '<div style="font-size:9pt;color:#333;margin-top:2px">Подписано: ' + (z.signedBy || '—') + ' ' +
            (z.signedAt ? formatDateTime(z.signedAt) : '') + '</div>' :
            '';

        zonesHtml +=
            '<div class="zone-block" style="margin:12px 0;padding:8px 12px;border-left:4px solid ' +
            (z.type === 'native' ? '#3b82f6' : '#f59e0b') + ';background:#f8fafc;border-radius:4px;">' +
            '<div class="zone-title" style="font-weight:700;color:#2563eb;font-size:10pt;">' +
            statusIcon + ' ' + typeIcon + ' ' + z.name + ' (' + z.dose + ' мЗв) ' +
            (z.status === 'signed' ? '🔵 ПОДПИСАНО' : z.status === 'described' ? '🟢 ОПИСАНО' : '⏳ ОЖИДАЕТ') +
            '</div>' +
            '<div style="font-size:10pt;line-height:1.6;margin-top:4px;white-space:pre-wrap;">' +
            (z.description || '— описание отсутствует —') +
            '</div>' +
            signature +
            '</div>';
    });

    // Полный HTML для Word
    const html = `<!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <title>Протокол КТ</title>
        <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: "Times New Roman", serif; font-size: 11pt; line-height: 1.4; }
            .header { text-align: center; border-bottom: 1.5px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .hospital-name { font-size: 10pt; font-weight: bold; line-height: 1.2; }
            .doc-title { font-size: 12pt; font-weight: bold; margin-top: 8px; text-transform: uppercase; }
            .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
            .info-table td { padding: 3px 5px; vertical-align: top; }
            .info-table .label { font-weight: bold; width: 25%; background: #f5f5f5; }
            .info-table .value { width: 25%; }
            .zone-block { margin: 12px 0; padding: 8px 12px; border-left: 4px solid #3b82f6; background: #f8fafc; border-radius: 4px; }
            .zone-title { font-weight: 700; color: #2563eb; font-size: 10pt; }
            .signed-block { margin-top: 25px; padding: 8px; border: 1px solid #000; display: inline-block; font-size: 10pt; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="hospital-name">МИНИСТЕРСТВО ЗДРАВООХРАНЕНИЯ МОСКОВСКОЙ ОБЛАСТИ<br>
            ГБУЗ МО «Жуковская областная клиническая больница»</div>
            <div class="doc-title">Протокол КТ-исследования № ${s.historyNum || 'б/н'}</div>
        </div>

        <table class="info-table">
            <tr><td class="label">ФИО:</td><td class="value">${s.fio}</td>
                <td class="label">Д.р.:</td><td class="value">${formatDate(s.birthDate)} (${s.age} лет)</td></tr>
            <tr><td class="label">№ истории:</td><td class="value">${s.historyNum || '—'}</td>
                <td class="label">Отделение:</td><td class="value">${s.dept || '—'}</td></tr>
            <tr><td class="label">Поступил:</td><td class="value">${formatDate(s.admitDate)} ${s.admitTime || ''}</td>
                <td class="label">Исследование:</td><td class="value">${formatDate(s.studyDate)} ${s.studyTime || ''}</td></tr>
            <tr><td class="label">Диагноз МКБ-10:</td><td class="value" colspan="3">${s.icdDisplay || '—'}</td></tr>
            <tr><td class="label">Вид исследования:</td><td class="value">${s.templateName || 'КТ'}</td>
                <td class="label">Общая доза:</td><td class="value">${(s.totalDose || 0).toFixed(1)} мЗв</td></tr>
            <tr><td class="label">Контраст:</td><td class="value" colspan="3">${s.contrast > 0 ? s.contrast + ' мл ' + s.contrastDrugName : 'не проводилось'}</td></tr>
            <tr><td class="label">Врач:</td><td class="value">${s.doctor || '—'}</td>
                <td class="label">Лаборант:</td><td class="value">${s.lab || '—'}</td></tr>
        </table>

        <div style="margin:15px 0;font-weight:700;font-size:11pt;">ОПИСАНИЕ ПО ЗОНАМ:</div>
        ${zonesHtml}

        ${s.status === 'signed' ?
            `<div class="signed-block"><strong>Врач-рентгенолог:</strong> ${s.signedBy}<br>
            <strong>Дата:</strong> ${formatDateTime(s.signedAt)}</div>` :
            `<div style="margin-top:30px"><strong>Врач-рентгенолог:</strong> _________________ / ${s.doctor}</div>`
        }
    </body>
    </html>`;

    // Создаём и скачиваем файл
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Протокол_КТ_' + s.fio.replace(/\s/g, '_') + '_' +
        formatDate(s.studyDate).replace(/\./g, '-') + '.doc';
    a.click();

    URL.revokeObjectURL(url);

    toast('📄 Файл Word сохранён', 'success');
}