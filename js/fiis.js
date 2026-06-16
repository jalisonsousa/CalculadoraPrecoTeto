let fiisRowId = 0;

function calcFiis(preco, div12m, ipca, ipcaMais, premio) {
  if (!preco || !div12m || !(ipca >= 0) || !ipcaMais || !premio) return null;
  const dyTotal = (ipca + ipcaMais + premio) / 100;
  if (dyTotal <= 0) return null;
  const teto   = div12m / dyTotal;
  const margem = (teto - preco) / preco * 100;
  return { dyTotal: dyTotal * 100, teto, margem };
}

function addFiisRow(data) {
  const d   = data || { ticker:'', pvp:'', preco:'', div12m:'', ipca:0, ipcaMais:7, premio:3 };
  const rid = ++fiisRowId;
  const tbody = document.getElementById('fiis-tbody');
  const tr    = document.createElement('tr');
  tr.id           = 'fiis-row-' + rid;
  tr.dataset.order = rid;

  const vPvp     = fmtInput(d.pvp);
  const vPreco   = fmtInput(d.preco);
  const vDiv     = fmtInput(d.div12m);
  const vIpca    = fmtInput(d.ipca);
  const vIpcaMais = fmtInput(d.ipcaMais);
  const vPremio  = fmtInput(d.premio);

  tr.innerHTML = `
    <td><div style="display:flex;align-items:center;gap:3px">
      <a class="ticker-link" onclick="openTickerLink(this,'fiis')" title="Abrir no Investidor10" tabindex="-1" style="cursor:pointer"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      <input class="table-input ticker-input" data-f="ticker" value="${d.ticker}" placeholder="TICK11" style="width:76px" oninput="updateFiisRow(${rid})">
      <span data-r="star" style="display:inline-flex;align-items:center;width:16px;flex-shrink:0"></span>
      <button class="brapi-btn" onclick="fetchRowBrapi(${rid},'fiis')" title="Buscar Preço, P/VP e Div.12M (brapi.dev)" tabindex="-1"><i class="fa-solid fa-rotate"></i></button>
    </div></td>
    <td><input class="table-input" data-f="pvp"      inputmode="decimal" value="${vPvp}"      placeholder="1,00" oninput="numericInput(this);updateFiisRow(${rid})" style="width:64px"></td>
    <td><input class="table-input" data-f="preco"    inputmode="decimal" value="${vPreco}"    placeholder="0,00" oninput="numericInput(this);updateFiisRow(${rid})" style="width:88px"></td>
    <td><input class="table-input" data-f="div12m"   inputmode="decimal" value="${vDiv}"      placeholder="0,00" oninput="numericInput(this);updateFiisRow(${rid})" style="width:80px"></td>
    <td><input class="table-input" data-f="ipca"     inputmode="decimal" value="${vIpca}"     placeholder="%" oninput="numericInput(this);updateFiisRow(${rid})" style="width:60px"></td>
    <td><input class="table-input" data-f="ipcaMais" inputmode="decimal" value="${vIpcaMais}" placeholder="%" oninput="numericInput(this);updateFiisRow(${rid})" style="width:60px"></td>
    <td><input class="table-input" data-f="premio"   inputmode="decimal" value="${vPremio}"   placeholder="%" oninput="numericInput(this);updateFiisRow(${rid})" style="width:60px"></td>
    <td style="text-align:center"><span data-r="dyTotal" class="result-cell result-neutral" style="font-size:12px">—</span></td>
    <td style="text-align:center"><span data-r="teto"    class="result-cell preco-teto-cell">—</span></td>
    <td style="text-align:center"><span data-r="margem"  class="result-cell result-neutral">—</span></td>
    <td><span class="del-btn" onclick="deleteRow('fiis-row-${rid}',updateFiisStats)"><i class="fa-solid fa-xmark"></i></span></td>`;

  tbody.appendChild(tr);
  if (d.preco && d.div12m) updateFiisRow(rid);
}

function updateFiisRow(rid) {
  const row = document.getElementById('fiis-row-' + rid);
  if (!row) return;

  const preco    = pf(row.querySelector('[data-f="preco"]').value);
  const div12m   = pf(row.querySelector('[data-f="div12m"]').value);
  const ipcaRaw  = row.querySelector('[data-f="ipca"]').value;
  const ipca     = pf(ipcaRaw);
  const ipcaMais = pf(row.querySelector('[data-f="ipcaMais"]').value);
  const premio   = pf(row.querySelector('[data-f="premio"]').value);
  const res      = calcFiis(preco, div12m, ipcaRaw === '' ? 0 : ipca, ipcaMais, premio);

  const dyTotalEl = row.querySelector('[data-r="dyTotal"]');
  const tetoEl    = row.querySelector('[data-r="teto"]');
  const margemEl  = row.querySelector('[data-r="margem"]');
  const starEl    = row.querySelector('[data-r="star"]');

  if (res) {
    dyTotalEl.textContent = fmtPct(res.dyTotal);
    tetoEl.textContent    = fmtR(res.teto);
    margemEl.innerHTML    = `<span class="result-cell ${getMarginClass(res.margem)}">${getMarginSign(res.margem)}${fmtPct(res.margem)}</span>`;
    if (res.margem >= 15) {
      row.classList.add('row-opp');
      if (starEl) starEl.innerHTML = '<span class="opp-star"><i class="fa-solid fa-star"></i></span>';
    } else {
      row.classList.remove('row-opp');
      if (starEl) starEl.innerHTML = '';
    }
  } else {
    [dyTotalEl, tetoEl, margemEl].forEach(el => el.innerHTML = `<span style="color:var(--text3)">—</span>`);
    row.classList.remove('row-opp');
    if (starEl) starEl.innerHTML = '';
  }
  updateFiisStats();
}

function updateFiisStats() {
  const rows = document.querySelectorAll('#fiis-tbody tr');
  let total = 0, oport = 0, caro = 0, neutro = 0;
  rows.forEach(r => {
    total++;
    const sp = r.querySelector('[data-r="margem"] span');
    if (!sp) return;
    const c = sp.className;
    if (c.includes('margin-good'))     oport++;
    else if (c.includes('margin-bad')) caro++;
    else                               neutro++;
  });
  document.getElementById('fiis-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-val" style="color:var(--accent)">${total}</div><div class="stat-card-lbl">Total de FIIs</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--green)">${oport}</div><div class="stat-card-lbl">Em Oportunidade</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--orange)">${neutro}</div><div class="stat-card-lbl">Próximo do Teto</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--red)">${caro}</div><div class="stat-card-lbl">Acima do Teto</div></div>`;
}
