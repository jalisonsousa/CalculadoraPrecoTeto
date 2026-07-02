let acoesRowId = 0;

function calcAcoes(preco, lpa, payout, cagr, dy, tempo) {
  if (!preco || !lpa || !payout || !cagr || !dy || !tempo) return null;
  const lpaFut = lpa * Math.pow(1 + cagr / 100, tempo);
  const divFut = lpaFut * (payout / 100);
  const teto   = divFut / (dy / 100);
  const margem = (teto - preco) / preco * 100;
  return { lpaFut, divFut, teto, margem };
}

function addAcoesRow(data) {
  const d   = data || { ticker:'', preco:'', lpa:'', payout:'', cagr:10, dy:8, tempo:5 };
  const rid = ++acoesRowId;
  const tbody = document.getElementById('acoes-tbody');
  const tr    = document.createElement('tr');
  tr.id           = 'acoes-row-' + rid;
  tr.dataset.order = rid;

  const vPreco  = fmtInput(d.preco);
  const vLpa    = fmtInput(d.lpa);
  const vPayout = fmtInput(d.payout);
  const vCagr   = fmtInput(d.cagr);
  const vDy     = fmtInput(d.dy);
  const vTempo  = d.tempo || '';

  tr.innerHTML = `
    <td><div style="display:flex;align-items:center;gap:3px">
      <a class="ticker-link" onclick="openTickerLink(this,'acoes')" title="Abrir no Investidor10" tabindex="-1" style="cursor:pointer"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      <input class="table-input ticker-input" data-f="ticker" value="${d.ticker}" placeholder="TICK3" style="width:76px" oninput="updateAcoesRow(${rid})">
      <span data-r="star" style="display:inline-flex;align-items:center;width:16px;flex-shrink:0"></span>
    </div></td>
    <td><input class="table-input" data-f="preco"  inputmode="decimal" value="${vPreco}"  placeholder="0,00" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:88px"></td>
    <td><input class="table-input" data-f="lpa"    inputmode="decimal" value="${vLpa}"    placeholder="0,00" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:72px"></td>
    <td><input class="table-input" data-f="payout" inputmode="decimal" value="${vPayout}" placeholder="%" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:72px"></td>
    <td><input class="table-input" data-f="cagr"   inputmode="decimal" value="${vCagr}"   placeholder="%" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:64px"></td>
    <td><input class="table-input" data-f="dy"     inputmode="decimal" value="${vDy}"     placeholder="%" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:64px"></td>
    <td><input class="table-input" data-f="tempo"  inputmode="numeric" value="${vTempo}"  placeholder="5" oninput="numericInput(this);updateAcoesRow(${rid})" style="width:52px"></td>
    <td style="text-align:center"><span data-r="lpaFut" class="result-cell result-neutral" style="font-size:12px">—</span></td>
    <td style="text-align:center"><span data-r="divFut" class="result-cell result-neutral" style="font-size:12px">—</span></td>
    <td style="text-align:center"><span data-r="teto"   class="result-cell preco-teto-cell">—</span></td>
    <td style="text-align:center"><span data-r="margem" class="result-cell result-neutral">—</span></td>
    <td><span class="del-btn" onclick="deleteRow('acoes-row-${rid}',updateAcoesStats,this)"><i class="fa-solid fa-xmark"></i></span></td>`;

  tbody.appendChild(tr);
  if (d.preco && d.lpa) updateAcoesRow(rid);
}

function updateAcoesRow(rid) {
  const row = document.getElementById('acoes-row-' + rid);
  if (!row) return;

  const preco  = pf(row.querySelector('[data-f="preco"]').value);
  const lpa    = pf(row.querySelector('[data-f="lpa"]').value);
  const payout = pf(row.querySelector('[data-f="payout"]').value);
  const cagr   = pf(row.querySelector('[data-f="cagr"]').value);
  const dy     = pf(row.querySelector('[data-f="dy"]').value);
  const tempo  = pi(row.querySelector('[data-f="tempo"]').value);
  const res    = calcAcoes(preco, lpa, payout, cagr, dy, tempo);

  const lpaFutEl = row.querySelector('[data-r="lpaFut"]');
  const divFutEl = row.querySelector('[data-r="divFut"]');
  const tetoEl   = row.querySelector('[data-r="teto"]');
  const margemEl = row.querySelector('[data-r="margem"]');
  const starEl   = row.querySelector('[data-r="star"]');

  if (res) {
    lpaFutEl.textContent = fmtR(res.lpaFut);
    divFutEl.textContent = fmtR(res.divFut);
    tetoEl.textContent   = fmtR(res.teto);
    margemEl.innerHTML   = `<span class="result-cell ${getMarginClass(res.margem)}">${getMarginSign(res.margem)}${fmtPct(res.margem)}</span>`;
    if (res.margem >= 15) {
      row.classList.add('row-opp');
      if (starEl) starEl.innerHTML = '<span class="opp-star"><i class="fa-solid fa-star"></i></span>';
    } else {
      row.classList.remove('row-opp');
      if (starEl) starEl.innerHTML = '';
    }
  } else {
    [lpaFutEl, divFutEl, tetoEl, margemEl].forEach(el => el.innerHTML = `<span style="color:var(--text3)">—</span>`);
    row.classList.remove('row-opp');
    if (starEl) starEl.innerHTML = '';
  }
  updateAcoesStats();
}

function updateAcoesStats() {
  const rows = document.querySelectorAll('#acoes-tbody tr');
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
  document.getElementById('acoes-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-val" style="color:var(--accent)">${total}</div><div class="stat-card-lbl">Total de Ações</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--green)">${oport}</div><div class="stat-card-lbl">Em Oportunidade</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--orange)">${neutro}</div><div class="stat-card-lbl">Próximo do Teto</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--red)">${caro}</div><div class="stat-card-lbl">Acima do Teto</div></div>`;
}
