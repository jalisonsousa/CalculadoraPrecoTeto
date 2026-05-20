// ===== CARTEIRA — Patrimônio & P&L =====

function updateCarteira() {
  const el = document.getElementById('carteira-content');
  if (!el) return;

  const acoes = collectCarteiraAcoes();
  const fiis  = collectCarteiraFiis();
  const todos = [...acoes, ...fiis];

  if (!todos.length) {
    el.innerHTML = `
      <div class="card p-4" style="text-align:center;padding:48px 24px">
        <i class="fa-solid fa-wallet" style="font-size:36px;color:var(--text3);display:block;margin-bottom:14px"></i>
        <p style="color:var(--text2);font-size:13px;margin-bottom:8px">Nenhum ativo com <strong>quantidade</strong> preenchida.</p>
        <p style="color:var(--text3);font-size:12px">Preencha a coluna <strong>Qtd.</strong> nas abas Ações e FIIs para ver sua carteira.</p>
      </div>`;
    return;
  }

  const comPM       = todos.filter(a => a.investido > 0);
  const totalInvest = comPM.reduce((s, a) => s + a.investido, 0);
  const totalAtual  = todos.reduce((s, a) => s + a.valorAtual, 0);
  const totalPnl    = comPM.reduce((s, a) => s + (a.pnlR ?? 0), 0);
  const totalPct    = totalInvest > 0 ? (totalPnl / totalInvest * 100) : 0;
  const pnlCor      = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';

  el.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div class="stat-card"><div>
        <div class="stat-card-val" style="color:var(--accent)">${fmtR(totalInvest || 0)}</div>
        <div class="stat-card-lbl">Patrimônio investido</div>
      </div></div>
      <div class="stat-card"><div>
        <div class="stat-card-val" style="color:var(--text)">${fmtR(totalAtual)}</div>
        <div class="stat-card-lbl">Valor atual</div>
      </div></div>
      <div class="stat-card"><div>
        <div class="stat-card-val" style="color:${pnlCor}">${comPM.length ? (totalPnl >= 0 ? '+' : '') + fmtR(totalPnl) : '—'}</div>
        <div class="stat-card-lbl">Lucro / Prejuízo</div>
      </div></div>
      <div class="stat-card"><div>
        <div class="stat-card-val" style="color:${pnlCor}">${comPM.length ? (totalPct >= 0 ? '+' : '') + totalPct.toFixed(2) + '%' : '—'}</div>
        <div class="stat-card-lbl">Rentabilidade total</div>
      </div></div>
    </div>
    ${acoes.length ? renderCarteiraTable(acoes, 'Ações', 'fa-building-columns', totalAtual) : ''}
    ${fiis.length  ? renderCarteiraTable(fiis,  'FIIs',  'fa-city',             totalAtual) : ''}`;
}

function collectCarteiraAcoes() {
  const out = [];
  document.querySelectorAll('#acoes-tbody tr').forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim();
    if (!ticker) return;
    const qty    = pi(row.querySelector('[data-f="qty"]')?.value)    || 0;
    if (qty <= 0) return;
    const pmedio = pf(row.querySelector('[data-f="pmedio"]')?.value) || 0;
    const preco  = pf(row.querySelector('[data-f="preco"]')?.value)  || 0;
    const res = calcAcoes(
      preco,
      pf(row.querySelector('[data-f="lpa"]')?.value),
      pf(row.querySelector('[data-f="payout"]')?.value),
      pf(row.querySelector('[data-f="cagr"]')?.value),
      pf(row.querySelector('[data-f="dy"]')?.value),
      pi(row.querySelector('[data-f="tempo"]')?.value)
    );
    const investido  = pmedio > 0 ? qty * pmedio : 0;
    const valorAtual = preco  > 0 ? qty * preco  : 0;
    const pnlR   = pmedio > 0 && preco > 0 ? valorAtual - investido : null;
    const pnlPct = pmedio > 0 && preco > 0 ? (preco - pmedio) / pmedio * 100 : null;
    out.push({ ticker, qty, pmedio, preco, investido, valorAtual, pnlR, pnlPct, teto: res?.teto });
  });
  return out;
}

function collectCarteiraFiis() {
  const out = [];
  document.querySelectorAll('#fiis-tbody tr').forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim();
    if (!ticker) return;
    const qty    = pi(row.querySelector('[data-f="qty"]')?.value)    || 0;
    if (qty <= 0) return;
    const pmedio = pf(row.querySelector('[data-f="pmedio"]')?.value) || 0;
    const preco  = pf(row.querySelector('[data-f="preco"]')?.value)  || 0;
    const ipcaRaw = row.querySelector('[data-f="ipca"]')?.value;
    const res = calcFiis(
      preco,
      pf(row.querySelector('[data-f="div12m"]')?.value),
      ipcaRaw === '' ? 0 : pf(ipcaRaw),
      pf(row.querySelector('[data-f="ipcaMais"]')?.value),
      pf(row.querySelector('[data-f="premio"]')?.value)
    );
    const investido  = pmedio > 0 ? qty * pmedio : 0;
    const valorAtual = preco  > 0 ? qty * preco  : 0;
    const pnlR   = pmedio > 0 && preco > 0 ? valorAtual - investido : null;
    const pnlPct = pmedio > 0 && preco > 0 ? (preco - pmedio) / pmedio * 100 : null;
    out.push({ ticker, qty, pmedio, preco, investido, valorAtual, pnlR, pnlPct, teto: res?.teto });
  });
  return out;
}

function renderCarteiraTable(assets, title, icon, grandTotal) {
  const comPM    = assets.filter(a => a.investido > 0);
  const totalInv = comPM.reduce((s, a) => s + a.investido, 0);
  const totalAtu = assets.reduce((s, a) => s + a.valorAtual, 0);
  const totalPnl = comPM.reduce((s, a) => s + (a.pnlR ?? 0), 0);
  const sorted   = [...assets].sort((a, b) => b.valorAtual - a.valorAtual);

  const rows = sorted.map(a => {
    const pnlCls  = a.pnlPct === null ? 'var(--text3)' : a.pnlPct >= 0 ? 'var(--green)' : 'var(--red)';
    const varTxt  = a.pnlPct !== null ? `${a.pnlPct >= 0 ? '+' : ''}${a.pnlPct.toFixed(2)}%` : '—';
    const pnlTxt  = a.pnlR   !== null ? `${a.pnlR >= 0 ? '+' : ''}${fmtR(a.pnlR)}`           : '—';
    const weight  = grandTotal > 0 ? (a.valorAtual / grandTotal * 100) : 0;
    const dash    = `<span style="color:var(--text3)">—</span>`;
    return `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px 10px;font-weight:700;color:var(--accent2);white-space:nowrap">
          ${a.ticker}
          <div style="height:2px;border-radius:2px;background:var(--surface2);overflow:hidden;margin-top:3px;width:60px">
            <div style="height:100%;width:${weight.toFixed(1)}%;background:var(--accent);border-radius:2px"></div>
          </div>
        </td>
        <td style="padding:8px 10px;text-align:right;color:var(--text)">${a.qty}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text2)">${a.pmedio > 0 ? fmtR(a.pmedio) : dash}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text)">${a.preco  > 0 ? fmtR(a.preco)  : dash}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;color:${pnlCls}">${varTxt}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--text2)">${a.investido > 0 ? fmtR(a.investido) : dash}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:600;color:var(--text)">${a.valorAtual > 0 ? fmtR(a.valorAtual) : dash}</td>
        <td style="padding:8px 10px;text-align:right;font-weight:700;color:${pnlCls}">${pnlTxt}</td>
        <td style="padding:8px 10px;text-align:right;color:var(--gold)">${a.teto ? fmtR(a.teto) : dash}</td>
      </tr>`;
  }).join('');

  const footPnlCor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';

  return `
    <div class="card p-4 mb-4">
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="fa-solid ${icon}" style="color:var(--accent)"></i>${title}
        <span style="font-size:11px;color:var(--text3);font-weight:400">${assets.length} ativo${assets.length !== 1 ? 's' : ''}</span>
      </h3>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="border-bottom:2px solid var(--border2)">
          <th style="text-align:left;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Ativo</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Qtd.</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Preço Médio</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Preço Atual</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Variação</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">Investido</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Valor Atual</th>
          <th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px">P&amp;L</th>
          <th style="text-align:right;padding:8px 10px;color:var(--gold);font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">P. Teto</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="border-top:2px solid var(--border2)">
          <td colspan="5" style="padding:10px;font-weight:700;color:var(--text);font-size:12px">Total</td>
          <td style="padding:10px;text-align:right;font-weight:700;color:var(--text2)">${comPM.length ? fmtR(totalInv) : '—'}</td>
          <td style="padding:10px;text-align:right;font-weight:800;color:var(--text)">${fmtR(totalAtu)}</td>
          <td style="padding:10px;text-align:right;font-weight:800;color:${footPnlCor}">${comPM.length ? (totalPnl >= 0 ? '+' : '') + fmtR(totalPnl) : '—'}</td>
          <td></td>
        </tr></tfoot>
      </table>
      </div>
    </div>`;
}
