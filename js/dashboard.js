// ===== DASHBOARD — Gráfico de Margens de Segurança =====

function updateDashboard() {
  const el = document.getElementById('dashboard-content');
  if (!el) return;
  const acoes = collectAcoesMargens();
  const fiis  = collectFiisMargens();
  el.innerHTML = `
    <div class="dash-grid">
      <div class="card p-4">${renderMarginSection(acoes, 'fa-building-columns', 'Ações')}</div>
      <div class="card p-4">${renderMarginSection(fiis, 'fa-city', 'FIIs')}</div>
    </div>`;
}

function collectAcoesMargens() {
  const out = [];
  document.querySelectorAll('#acoes-tbody tr').forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim();
    if (!ticker) return;
    const res = calcAcoes(
      pf(row.querySelector('[data-f="preco"]')?.value),
      pf(row.querySelector('[data-f="lpa"]')?.value),
      pf(row.querySelector('[data-f="payout"]')?.value),
      pf(row.querySelector('[data-f="cagr"]')?.value),
      pf(row.querySelector('[data-f="dy"]')?.value),
      pi(row.querySelector('[data-f="tempo"]')?.value)
    );
    if (res) out.push({ ticker, margin: res.margem, teto: res.teto });
  });
  return out.sort((a, b) => b.margin - a.margin);
}

function collectFiisMargens() {
  const out = [];
  document.querySelectorAll('#fiis-tbody tr').forEach(row => {
    const ticker   = row.querySelector('[data-f="ticker"]')?.value?.trim();
    if (!ticker) return;
    const ipcaRaw  = row.querySelector('[data-f="ipca"]')?.value;
    const res = calcFiis(
      pf(row.querySelector('[data-f="preco"]')?.value),
      pf(row.querySelector('[data-f="div12m"]')?.value),
      ipcaRaw === '' ? 0 : pf(ipcaRaw),
      pf(row.querySelector('[data-f="ipcaMais"]')?.value),
      pf(row.querySelector('[data-f="premio"]')?.value)
    );
    if (res) out.push({ ticker, margin: res.margem, teto: res.teto });
  });
  return out.sort((a, b) => b.margin - a.margin);
}

function renderMarginSection(assets, icon, title) {
  if (!assets.length) return `
    <div style="text-align:center;padding:40px 0;color:var(--text3)">
      <i class="fa-solid ${icon}" style="font-size:28px;margin-bottom:10px;display:block"></i>
      <p style="font-size:12px">Nenhum ativo com dados completos</p>
    </div>`;

  const opp  = assets.filter(a => a.margin >= 15).length;
  const prox = assets.filter(a => a.margin >= 0 && a.margin < 15).length;
  const caro = assets.filter(a => a.margin < 0).length;

  // Escala: máximo valor absoluto no dataset (mín. 20 para evitar barras gigantes)
  const maxAbs = Math.max(...assets.map(a => Math.abs(a.margin)), 20);

  const rows = assets.map(a => {
    const cls  = a.margin >= 15 ? 'good' : a.margin >= 0 ? 'warn' : 'bad';
    const pct  = (Math.abs(a.margin) / maxAbs * 100).toFixed(1);
    const sign = a.margin >= 0 ? '+' : '';
    return `
      <div class="mchart-row">
        <div class="mchart-ticker">${a.ticker}</div>
        <div class="mchart-bars">
          <div class="mchart-neg-area">
            <div class="mchart-fill bad" style="width:${a.margin < 0 ? pct : 0}%"></div>
          </div>
          <div class="mchart-center"></div>
          <div class="mchart-pos-area">
            <div class="mchart-fill ${cls}" style="width:${a.margin >= 0 ? pct : 0}%"></div>
          </div>
        </div>
        <div class="mchart-pct ${cls}">${sign}${a.margin.toFixed(1)}%</div>
      </div>`;
  }).join('');

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <h3 style="font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
        <i class="fa-solid ${icon}" style="color:var(--accent)"></i>${title}
      </h3>
      <div style="display:flex;gap:12px;font-size:11px;font-weight:600">
        <span style="color:var(--green)">${opp} oportunidade${opp !== 1 ? 's' : ''}</span>
        <span style="color:var(--orange)">${prox} próximo${prox !== 1 ? 's' : ''}</span>
        <span style="color:var(--red)">${caro} acima</span>
      </div>
    </div>
    <div>${rows}</div>
    <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:10px;color:var(--text3)">
      <span>← Acima do teto (caro)</span>
      <span style="color:var(--border2);font-weight:700">0%</span>
      <span>Abaixo do teto (oportunidade) →</span>
    </div>`;
}
