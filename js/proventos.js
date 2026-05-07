// ===== PAINEL DE PROVENTOS =====

function updateProventos() {
  const rows = document.querySelectorAll('#fiis-tbody tr');
  const fiis = [];

  rows.forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value.trim().toUpperCase();
    if (!ticker) return;
    const qty    = pi(row.querySelector('[data-f="qty"]')?.value)   || 0;
    const preco  = pf(row.querySelector('[data-f="preco"]')?.value) || 0;
    const div12m = pf(row.querySelector('[data-f="div12m"]')?.value) || 0;
    fiis.push({
      ticker,
      qty,
      preco,
      div12m,
      divMes:      qty * div12m / 12,
      divAno:      qty * div12m,
      patrimonio:  qty * preco,
    });
  });

  const comQty = fiis.filter(f => f.qty > 0);
  const totalMes = comQty.reduce((s, f) => s + f.divMes, 0);
  const totalAno = comQty.reduce((s, f) => s + f.divAno, 0);
  const totalPat = comQty.reduce((s, f) => s + f.patrimonio, 0);

  document.getElementById('prov-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-val" style="color:var(--green)">${fmtR(totalMes)}</div><div class="stat-card-lbl">Dividendos/mês estimado</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--accent)">${fmtR(totalAno)}</div><div class="stat-card-lbl">Dividendos/ano estimado</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--gold)">${fmtR(totalPat)}</div><div class="stat-card-lbl">Patrimônio em FIIs</div></div>`;

  if (comQty.length === 0) {
    document.getElementById('prov-table').innerHTML = `
      <div style="text-align:center;padding:32px 16px">
        <i class="fa-solid fa-hand-holding-dollar" style="font-size:32px;color:var(--text3);margin-bottom:12px;display:block"></i>
        <p style="color:var(--text2);font-size:13px">Preencha a coluna <strong>Qtd.</strong> na aba FIIs com a quantidade de cotas que você possui.</p>
      </div>`;
    return;
  }

  const sorted = [...comQty].sort((a, b) => b.divMes - a.divMes);

  let html = `
    <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="border-bottom:2px solid var(--border2)">
        <th style="text-align:left;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">FII</th>
        <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Cotas</th>
        <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Div/cota mês</th>
        <th style="text-align:right;padding:8px 10px;color:var(--green);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Total/mês</th>
        <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Total/ano</th>
        <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Patrimônio</th>
      </tr></thead>
      <tbody>`;

  sorted.forEach(f => {
    const pct = totalMes > 0 ? (f.divMes / totalMes * 100) : 0;
    html += `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px 10px;font-weight:700;color:var(--accent2);white-space:nowrap">
          ${f.ticker}
          <div style="height:3px;border-radius:3px;background:var(--surface2);overflow:hidden;margin-top:4px;width:80px">
            <div style="height:100%;width:${pct.toFixed(1)}%;background:var(--green);border-radius:3px"></div>
          </div>
        </td>
        <td style="padding:8px 10px;text-align:right;color:var(--text)">${f.qty}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text2);font-size:12px">${fmtR(f.div12m / 12)}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--green);font-weight:700">${fmtR(f.divMes)}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text2)">${fmtR(f.divAno)}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text2)">${fmtR(f.patrimonio)}</td>
      </tr>`;
  });

  const semQty = fiis.filter(f => f.qty === 0);
  if (semQty.length > 0) {
    html += `<tr><td colspan="6" style="padding:10px;color:var(--text3);font-size:11px">
      Sem quantidade: ${semQty.map(f => f.ticker).join(', ')}
    </td></tr>`;
  }

  html += `</tbody>
    <tfoot><tr style="border-top:2px solid var(--border2)">
      <td colspan="3" style="padding:10px;font-weight:700;color:var(--text);font-size:12px">Total</td>
      <td style="padding:10px;text-align:right;font-weight:800;color:var(--green)">${fmtR(totalMes)}</td>
      <td style="padding:10px;text-align:right;font-weight:700;color:var(--text2)">${fmtR(totalAno)}</td>
      <td style="padding:10px;text-align:right;font-weight:700;color:var(--gold)">${fmtR(totalPat)}</td>
    </tr></tfoot>
  </table></div>`;

  document.getElementById('prov-table').innerHTML = html;
}
