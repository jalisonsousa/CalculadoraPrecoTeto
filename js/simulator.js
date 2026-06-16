// ===== SIMULADOR DE APORTE =====
// Aba dedicada: o usuário escolhe (marca) os ativos que quer comprar e o
// simulador distribui o valor do aporte SOMENTE entre os selecionados.

const simSelected = new Set();  // chaves (row.id) marcadas pelo usuário (começa vazio)
let   simWeightMode = 'margem'; // 'margem' | 'igual'

// Coleta todos os ativos das abas Ações + FIIs já com Teto/Margem calculados.
function simCollectAssets() {
  const assets  = [];
  const invalid = [];

  document.querySelectorAll('#acoes-tbody tr').forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim().toUpperCase();
    if (!ticker) return;
    const preco = pf(row.querySelector('[data-f="preco"]')?.value);
    const res = calcAcoes(
      preco,
      pf(row.querySelector('[data-f="lpa"]')?.value),
      pf(row.querySelector('[data-f="payout"]')?.value),
      pf(row.querySelector('[data-f="cagr"]')?.value),
      pf(row.querySelector('[data-f="dy"]')?.value),
      pi(row.querySelector('[data-f="tempo"]')?.value)
    );
    if (!preco || !res) { invalid.push(ticker); return; }
    assets.push({ key: row.id, type: 'acoes', ticker, preco, teto: res.teto, margem: res.margem, div12m: 0 });
  });

  document.querySelectorAll('#fiis-tbody tr').forEach(row => {
    const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim().toUpperCase();
    if (!ticker) return;
    const preco   = pf(row.querySelector('[data-f="preco"]')?.value);
    const div12m  = pf(row.querySelector('[data-f="div12m"]')?.value);
    const ipcaRaw = row.querySelector('[data-f="ipca"]')?.value;
    const res = calcFiis(
      preco, div12m,
      ipcaRaw === '' ? 0 : pf(ipcaRaw),
      pf(row.querySelector('[data-f="ipcaMais"]')?.value),
      pf(row.querySelector('[data-f="premio"]')?.value)
    );
    if (!preco || !res) { invalid.push(ticker); return; }
    assets.push({ key: row.id, type: 'fiis', ticker, preco, teto: res.teto, margem: res.margem, div12m });
  });

  return { assets, invalid };
}

function simAssetRow(a) {
  const checked = simSelected.has(a.key) ? 'checked' : '';
  const sel     = simSelected.has(a.key) ? ' sel' : '';
  return `
    <label class="sim-asset${sel}" data-key="${a.key}">
      <input type="checkbox" class="sim-check" ${checked} onchange="simToggle('${a.key}', this.checked)">
      <span class="sim-asset-tk">${a.ticker}</span>
      <span class="sim-asset-meta">
        <span>P. atual <b>${fmtR(a.preco)}</b></span>
        <span>Teto <b style="color:var(--gold)">${fmtR(a.teto)}</b></span>
      </span>
      <span class="result-cell ${getMarginClass(a.margem)}" style="font-size:11px;padding:3px 8px">${getMarginSign(a.margem)}${fmtPct(a.margem)}</span>
    </label>`;
}

function renderSimulador() {
  const listEl = document.getElementById('sim-asset-list');
  if (!listEl) return;
  const { assets, invalid } = simCollectAssets();

  if (!assets.length) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:30px 16px;color:var(--text3)">
        <i class="fa-solid fa-list-check" style="font-size:30px;display:block;margin-bottom:12px"></i>
        <p style="font-size:13px;color:var(--text2)">Adicione e preencha ativos nas abas <strong>Ações</strong> e <strong>FIIs</strong> para simular um aporte.</p>
      </div>`;
    simUpdateCount();
    return;
  }

  const acoes = assets.filter(a => a.type === 'acoes');
  const fiis  = assets.filter(a => a.type === 'fiis');
  let html = '';
  if (acoes.length) {
    html += `<div class="sim-group"><div class="sim-group-title"><i class="fa-solid fa-building-columns"></i> Ações</div>${acoes.map(simAssetRow).join('')}</div>`;
  }
  if (fiis.length) {
    html += `<div class="sim-group"><div class="sim-group-title"><i class="fa-solid fa-city"></i> FIIs</div>${fiis.map(simAssetRow).join('')}</div>`;
  }
  if (invalid.length) {
    html += `<p style="font-size:11px;color:var(--text3);margin-top:10px;padding:0 2px">
      <i class="fa-solid fa-circle-info"></i> Sem dados completos (não aparecem acima): ${invalid.join(', ')}
    </p>`;
  }
  listEl.innerHTML = html;
  simUpdateCount();
}

function simUpdateCount() {
  const el = document.getElementById('sim-count');
  if (!el) return;
  const { assets } = simCollectAssets();
  const sel = assets.filter(a => simSelected.has(a.key)).length;
  el.textContent = assets.length ? `(${sel} de ${assets.length} selecionados)` : '';
}

function simToggle(key, checked) {
  if (checked) simSelected.add(key);
  else         simSelected.delete(key);
  const label = document.querySelector(`.sim-asset[data-key="${key}"]`);
  if (label) label.classList.toggle('sel', checked);
  simUpdateCount();
  runSimulador(true);
}

// Alterna o modo de distribuição (toggle segmentado)
function simSetMode(mode) {
  simWeightMode = mode;
  document.querySelectorAll('#sim-weight .sim-seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  runSimulador(true);
}

function simSelectAll(flag) {
  const { assets } = simCollectAssets();
  assets.forEach(a => { if (flag) simSelected.add(a.key); else simSelected.delete(a.key); });
  renderSimulador();
  runSimulador(true);
}

// quiet = true → acionado por mudança de seleção/modo: não mostra erro de valor vazio.
function runSimulador(quiet) {
  const resultEl = document.getElementById('sim-result');
  if (!resultEl) return;
  // Renderiza e, num clique explícito em "Simular", leva o resultado à vista.
  const show = html => {
    resultEl.innerHTML = html;
    if (!quiet && html) resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const valor = pf(document.getElementById('sim-valor')?.value);

  if (!valor || valor <= 0) {
    show(quiet ? '' :
      '<div class="card p-4" style="text-align:center;color:var(--red);font-size:13px">Informe um valor de aporte válido.</div>');
    return;
  }

  const mode     = simWeightMode;
  const selected = simCollectAssets().assets.filter(a => simSelected.has(a.key));

  if (!selected.length) {
    show('<div class="card p-4" style="text-align:center;color:var(--text2);font-size:13px">Selecione ao menos um ativo para simular.</div>');
    return;
  }

  // Elegibilidade + ordem de prioridade.
  let eligible, aboveTeto = [];
  if (mode === 'igual') {
    eligible = selected.slice();                          // todos, na ordem da lista
  } else {
    const positivos = selected.filter(a => a.margem > 0);
    aboveTeto = positivos.length ? selected.filter(a => a.margem <= 0) : [];
    eligible  = (positivos.length ? positivos : selected.slice())
                  .sort((a, b) => b.margem - a.margem);    // maior margem primeiro
  }

  // Compra gulosa em rodízio: 1 cota por vez, na ordem de prioridade, enquanto houver saldo.
  // Garante que os ativos que cabem sejam comprados; só os que não cabem ficam de fora.
  const qty = new Map(eligible.map(a => [a.key, 0]));
  let remaining = valor, progress = true;
  while (progress) {
    progress = false;
    for (const a of eligible) {
      if (remaining >= a.preco) {
        qty.set(a.key, qty.get(a.key) + 1);
        remaining -= a.preco;
        progress = true;
      }
    }
  }

  const sugest = eligible.map(a => {
    const cotas = qty.get(a.key);
    return {
      ...a, cotas,
      valorUsado: cotas * a.preco,
      divMensal:  a.type === 'fiis' ? cotas * a.div12m / 12 : 0,
      divAnual:   a.type === 'fiis' ? cotas * a.div12m      : 0,
    };
  });

  const comprar  = sugest.filter(s => s.cotas > 0).sort((a, b) => b.margem - a.margem);
  const semCotas = sugest.filter(s => s.cotas === 0);

  if (!comprar.length) {
    const maisBarato = Math.min(...eligible.map(a => a.preco));
    show(`<div class="card p-4" style="text-align:center;color:var(--text2);font-size:13px">Valor insuficiente para comprar 1 cota sequer — o ativo mais barato selecionado custa <strong style="color:var(--text)">${fmtR(maisBarato)}</strong>.</div>`);
    return;
  }

  const temFii = comprar.some(s => s.type === 'fiis');
  const totalUsado     = comprar.reduce((s, a) => s + a.valorUsado, 0);
  const sobra          = valor - totalUsado;
  const totalDivMensal = comprar.reduce((s, a) => s + a.divMensal, 0);
  const totalDivAnual  = comprar.reduce((s, a) => s + a.divAnual,  0);

  const thBase = 'text-align:right;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px';
  let html = `
    <div class="card p-4">
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px">
        <i class="fa-solid fa-coins mr-2" style="color:var(--accent)"></i>Plano de aporte para ${fmtR(valor)}
      </h3>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:1px solid var(--border2)">
            <th style="text-align:left;padding:7px 8px;color:var(--text2);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Ativo</th>
            <th style="${thBase}">Margem</th>
            <th style="${thBase}">Cotas</th>
            <th style="${thBase}">Preço</th>
            <th style="${thBase}">Total</th>
            ${temFii ? `<th style="${thBase};color:var(--gold)">Div/mês</th>` : ''}
          </tr>
        </thead>
        <tbody>`;

  comprar.forEach(s => {
    const badge = s.type === 'fiis'
      ? '<span class="badge" style="margin-left:6px">FII</span>'
      : '<span class="badge badge-green" style="margin-left:6px">Ação</span>';
    const divCell = temFii
      ? `<td style="padding:8px;text-align:right;color:var(--gold);font-weight:600">${s.divMensal > 0 ? fmtR(s.divMensal) : '—'}</td>`
      : '';
    html += `
        <tr style="border-bottom:1px solid var(--border)">
          <td style="padding:8px;font-weight:700;color:var(--accent2);white-space:nowrap">${s.ticker}${badge}</td>
          <td style="padding:8px;text-align:right;color:${s.margem >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:600">${getMarginSign(s.margem)}${fmtPct(s.margem)}</td>
          <td style="padding:8px;text-align:right;font-weight:800;font-size:15px;color:var(--text)">${s.cotas}</td>
          <td style="padding:8px;text-align:right;color:var(--text2);font-size:12px">${fmtR(s.preco)}</td>
          <td style="padding:8px;text-align:right;font-weight:600">${fmtR(s.valorUsado)}</td>
          ${divCell}
        </tr>`;
  });

  html += `</tbody></table></div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;padding:12px 8px 0;margin-top:8px;border-top:1px solid var(--border)">
      ${temFii && totalDivMensal > 0 ? `<span style="color:var(--text2);font-size:12px">Renda gerada: <strong style="color:var(--gold)">${fmtR(totalDivMensal)}/mês</strong> <span style="opacity:0.6">(${fmtR(totalDivAnual)}/ano)</span></span>` : '<span></span>'}
      <span style="color:var(--text2);font-size:12px">Utilizado: <strong style="color:var(--text)">${fmtR(totalUsado)}</strong> &nbsp;·&nbsp; Sobra: <strong style="color:${sobra > 0 ? 'var(--gold)' : 'var(--text)'}">${fmtR(sobra)}</strong></span>
    </div>`;

  if (semCotas.length) {
    html += `<p style="font-size:11px;color:var(--orange);margin-top:10px;padding:0 2px"><i class="fa-solid fa-circle-info"></i> Ficaram de fora por saldo insuficiente (depois de comprar os demais): ${semCotas.map(a => a.ticker).join(', ')}</p>`;
  }
  if (aboveTeto.length) {
    html += `<p style="font-size:11px;color:var(--text3);margin-top:6px;padding:0 2px"><i class="fa-solid fa-circle-info"></i> Acima do teto, sem aporte no modo "Maior margem": ${aboveTeto.map(a => a.ticker).join(', ')}. Use "Dividir igual" para incluí-los.</p>`;
  }

  html += `</div>`;
  show(html);
}
