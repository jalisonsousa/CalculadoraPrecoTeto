// ===== PAINEL DE PROVENTOS =====

function updateProventos() {
  const rows = document.querySelectorAll('#fiis-tbody tr');
  const fiis = [];

  rows.forEach(row => {
    const ticker   = row.querySelector('[data-f="ticker"]')?.value.trim().toUpperCase();
    if (!ticker) return;
    const qty      = pi(row.querySelector('[data-f="qty"]')?.value)      || 0;
    const preco    = pf(row.querySelector('[data-f="preco"]')?.value)    || 0;
    const div12m   = pf(row.querySelector('[data-f="div12m"]')?.value)   || 0;
    const ipcaRaw  = row.querySelector('[data-f="ipca"]')?.value;
    const ipca     = ipcaRaw === '' ? 0 : pf(ipcaRaw);
    const ipcaMais = pf(row.querySelector('[data-f="ipcaMais"]')?.value);
    const premio   = pf(row.querySelector('[data-f="premio"]')?.value);
    const calc     = calcFiis(preco, div12m, ipca, ipcaMais, premio);
    fiis.push({
      ticker, qty, preco, div12m,
      divMes:     qty * div12m / 12,
      divAno:     qty * div12m,
      patrimonio: qty * preco,
      margem:     calc?.margem ?? null,
    });
  });

  const comQty   = fiis.filter(f => f.qty > 0);
  const totalMes = comQty.reduce((s, f) => s + f.divMes, 0);
  const totalAno = comQty.reduce((s, f) => s + f.divAno, 0);
  const totalPat = comQty.reduce((s, f) => s + f.patrimonio, 0);

  document.getElementById('prov-stats').innerHTML = `
    <div class="stat-card"><div class="stat-card-val" style="color:var(--green)">${fmtR(totalMes)}</div><div class="stat-card-lbl">Dividendos/mês estimado</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--accent)">${fmtR(totalAno)}</div><div class="stat-card-lbl">Dividendos/ano estimado</div></div>
    <div class="stat-card"><div class="stat-card-val" style="color:var(--gold)">${fmtR(totalPat)}</div><div class="stat-card-lbl">Patrimônio em FIIs</div></div>`;

  const fiisValidos = fiis.filter(f => f.preco > 0 && f.div12m > 0);
  updateMetaRenda(totalMes, fiisValidos);

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

function updateMetaRenda(totalMes, fiisParaRecomendar) {
  const el = document.getElementById('meta-renda-content');
  if (!el) return;
  const raw  = document.getElementById('meta-renda-input')?.value || '';
  const meta = pf(raw);

  if (!meta || meta <= 0) {
    el.innerHTML = '<p style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0">Digite sua meta mensal acima para ver o progresso.</p>';
    return;
  }

  const pct   = Math.min((totalMes / meta) * 100, 100);
  const falta = Math.max(meta - totalMes, 0);
  const cor   = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--orange)';
  const barBg = pct >= 100 ? 'var(--green)' : 'linear-gradient(90deg,var(--accent),var(--green))';

  const recoHtml = falta > 0.01 && fiisParaRecomendar?.length
    ? renderRecomendacaoAporte(falta, fiisParaRecomendar)
    : '';

  el.innerHTML = `
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">
        <span style="color:var(--text2)">Renda atual estimada</span>
        <span style="font-weight:700;color:${cor}">${fmtR(totalMes)}<span style="color:var(--text3);font-weight:400"> / ${fmtR(meta)}</span></span>
      </div>
      <div class="meta-progress-track">
        <div class="meta-progress-fill" style="width:${pct.toFixed(1)}%;background:${barBg}"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:10.5px;color:var(--text3)">
        <span>0%</span>
        <span style="font-weight:700;color:${cor}">${pct.toFixed(1)}% atingido</span>
        <span>100%</span>
      </div>
    </div>
    ${pct >= 100
      ? `<div style="text-align:center;padding:8px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:8px;font-size:12px;font-weight:600;color:var(--green)"><i class="fa-solid fa-trophy" style="margin-right:5px"></i>Meta atingida! Parabéns!</div>`
      : `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);font-size:12px;margin-bottom:${recoHtml ? '14px' : '0'}">
           <span style="color:var(--text2)">Faltam</span>
           <span style="font-weight:700;color:var(--orange)">${fmtR(falta)}/mês</span>
         </div>`
    }
    ${recoHtml}`;
}

function renderRecomendacaoAporte(falta, fiis) {
  const opcoes = fiis
    .map(f => {
      const divMesByCota = f.div12m / 12;
      if (divMesByCota <= 0) return null;
      const dyMensal    = divMesByCota / f.preco * 100;
      const cotasNeeded = Math.ceil(falta / divMesByCota);
      const custo       = cotasNeeded * f.preco;
      return { ...f, divMesByCota, dyMensal, cotasNeeded, custo };
    })
    .filter(Boolean)
    .sort((a, b) => b.dyMensal - a.dyMensal);

  if (!opcoes.length) return '';

  const rows = opcoes.map(o => {
    const mCor = o.margem === null ? 'var(--text3)' : o.margem >= 15 ? 'var(--green)' : o.margem >= 0 ? 'var(--orange)' : 'var(--red)';
    const mTxt = o.margem !== null ? `${o.margem >= 0 ? '+' : ''}${o.margem.toFixed(1)}%` : '—';
    return `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:7px 10px;font-weight:700;color:var(--accent2)">${o.ticker}</td>
        <td style="padding:7px 10px;text-align:right;color:var(--text2)">${fmtR(o.preco)}</td>
        <td style="padding:7px 10px;text-align:right;color:var(--text2)">${fmtR(o.divMesByCota)}</td>
        <td style="padding:7px 10px;text-align:right;color:var(--text2);font-size:11px">${o.dyMensal.toFixed(2)}%</td>
        <td style="padding:7px 10px;text-align:right;font-weight:700;color:var(--text)">${o.cotasNeeded}</td>
        <td style="padding:7px 10px;text-align:right;font-weight:600;color:var(--accent)">${fmtR(o.custo)}</td>
        <td style="padding:7px 10px;text-align:right;font-weight:700;color:${mCor}">${mTxt}</td>
      </tr>`;
  }).join('');

  return `
    <div style="border-top:1px solid var(--border);padding-top:14px">
      <p style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px">
        <i class="fa-solid fa-lightbulb" style="color:var(--gold);margin-right:5px"></i>Sugestão de aporte para atingir a meta
      </p>
      <p style="font-size:11px;color:var(--text2);margin-bottom:10px">Cada linha mostra quantas cotas comprar deste FII para fechar os <strong style="color:var(--orange)">${fmtR(falta)}/mês</strong> que faltam. Ordenado por DY mensal (maior eficiência primeiro).</p>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="border-bottom:1px solid var(--border2)">
          <th style="text-align:left;padding:6px 10px;color:var(--text2);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">FII</th>
          <th style="text-align:right;padding:6px 10px;color:var(--text2);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Preço/cota</th>
          <th style="text-align:right;padding:6px 10px;color:var(--text2);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Div/cota mês</th>
          <th style="text-align:right;padding:6px 10px;color:var(--text2);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">DY mensal</th>
          <th style="text-align:right;padding:6px 10px;color:var(--green);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Cotas p/ meta</th>
          <th style="text-align:right;padding:6px 10px;color:var(--accent);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Investimento</th>
          <th style="text-align:right;padding:6px 10px;color:var(--text2);font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">Margem Seg.</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
    </div>`;
}
