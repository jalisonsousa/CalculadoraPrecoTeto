// ===== SIMULADOR DE APORTE =====

function openSimulator(type) {
  document.getElementById('sim-modal').style.display = 'flex';
  document.getElementById('sim-type').value = type;
  document.getElementById('sim-result').innerHTML = '';
  const input = document.getElementById('sim-valor');
  input.value = '';
  setTimeout(() => input.focus(), 80);
}

function closeSimulator() {
  document.getElementById('sim-modal').style.display = 'none';
}

function runSimulator() {
  const type  = document.getElementById('sim-type').value;
  const valor = pf(document.getElementById('sim-valor').value);
  if (!valor || valor <= 0) {
    document.getElementById('sim-result').innerHTML =
      '<p style="color:var(--red);text-align:center;padding:12px;font-size:13px">Informe um valor válido.</p>';
    return;
  }

  const rows  = document.querySelectorAll('#' + type + '-tbody tr');
  const ativos = [];

  rows.forEach(row => {
    const ticker  = row.querySelector('[data-f="ticker"]')?.value.trim().toUpperCase();
    const preco   = pf(row.querySelector('[data-f="preco"]')?.value);
    const tetoEl  = row.querySelector('[data-r="teto"]');
    const teto    = tetoEl ? pf(tetoEl.textContent.replace('R$','').replace(/\./g,'').replace(',','.').trim()) : 0;
    const margemSpan = row.querySelector('[data-r="margem"] span');
    if (!ticker || !preco || !margemSpan) return;
    const margemRaw = margemSpan.textContent.replace('+','').replace('%','').replace(',','.').trim();
    const margem = parseFloat(margemRaw);
    if (isNaN(margem) || margem <= 0) return;
    const div12m = type === 'fiis' ? pf(row.querySelector('[data-f="div12m"]')?.value) : 0;
    ativos.push({ ticker, preco, teto, margem, div12m });
  });

  if (ativos.length === 0) {
    document.getElementById('sim-result').innerHTML =
      '<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">Nenhum ativo abaixo do preço teto. Adicione ativos com preço atual abaixo do teto calculado.</p>';
    return;
  }

  const totalWeight = ativos.reduce((s, a) => s + a.margem, 0);

  const suggestions = ativos
    .map(a => {
      const allocated  = valor * (a.margem / totalWeight);
      const cotas      = Math.floor(allocated / a.preco);
      const valorUsado = cotas * a.preco;
      const divAnual   = cotas * a.div12m;
      const divMensal  = divAnual / 12;
      return { ...a, cotas, valorUsado, divAnual, divMensal };
    })
    .filter(a => a.cotas > 0)
    .sort((a, b) => b.margem - a.margem);

  const totalUsado = suggestions.reduce((s, a) => s + a.valorUsado, 0);
  const sobra      = valor - totalUsado;

  const semCotas = ativos.filter(a => {
    const allocated = valor * (a.margem / totalWeight);
    return Math.floor(allocated / a.preco) === 0;
  });

  if (suggestions.length === 0) {
    document.getElementById('sim-result').innerHTML =
      '<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">Valor insuficiente para comprar ao menos 1 cota de qualquer ativo em oportunidade.</p>';
    return;
  }

  const isFii = type === 'fiis';
  const divColHeader = isFii
    ? `<th style="text-align:right;padding:7px 8px;color:var(--gold);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Div/mês</th>`
    : '';

  let html = `
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="border-bottom:1px solid var(--border)">
          <th style="text-align:left;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Ativo</th>
          <th style="text-align:right;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Margem</th>
          <th style="text-align:right;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Cotas</th>
          <th style="text-align:right;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Preço</th>
          <th style="text-align:right;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Total</th>
          ${divColHeader}
        </tr>
      </thead>
      <tbody>`;

  suggestions.forEach(s => {
    const divCell = isFii
      ? `<td style="padding:8px 8px;text-align:right;color:var(--gold);font-weight:600">${s.divMensal > 0 ? fmtR(s.divMensal) : '—'}</td>`
      : '';
    html += `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px 8px;font-weight:700;color:var(--accent2)">${s.ticker}</td>
          <td style="padding:8px 8px;text-align:right;color:var(--green);font-weight:600">+${fmtPct(s.margem)}</td>
          <td style="padding:8px 8px;text-align:right;font-weight:800;font-size:15px;color:var(--text)">${s.cotas}</td>
          <td style="padding:8px 8px;text-align:right;color:var(--text2);font-size:12px">${fmtR(s.preco)}</td>
          <td style="padding:8px 8px;text-align:right;font-weight:600">${fmtR(s.valorUsado)}</td>
          ${divCell}
        </tr>`;
  });

  html += `</tbody></table>`;

  const totalDivMensal = suggestions.reduce((s, a) => s + a.divMensal, 0);
  const totalDivAnual  = suggestions.reduce((s, a) => s + a.divAnual,  0);
  const divFooter = isFii && totalDivMensal > 0
    ? `<span style="color:var(--text2);font-size:12px">Div. mensal: <strong style="color:var(--gold)">${fmtR(totalDivMensal)}</strong> <span style="opacity:0.6">(${fmtR(totalDivAnual)}/ano)</span></span>`
    : '';

  html += `
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;padding:10px 8px 0;margin-top:8px;border-top:1px solid var(--border)">
      ${divFooter}
      <span style="color:var(--text2);font-size:12px">Utilizado: <strong style="color:var(--text)">${fmtR(totalUsado)}</strong> &nbsp;·&nbsp; Sobra: <strong style="color:${sobra > 0 ? 'var(--gold)' : 'var(--text)'}">${fmtR(sobra)}</strong></span>
    </div>`;

  if (semCotas.length > 0) {
    html += `<p style="font-size:11px;color:var(--text2);margin-top:10px;padding:0 2px">
      Excluídos por valor insuficiente: ${semCotas.map(a => a.ticker).join(', ')}
    </p>`;
  }

  document.getElementById('sim-result').innerHTML = html;
}
