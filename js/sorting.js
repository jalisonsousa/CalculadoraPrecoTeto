// estado: { field: 'ticker'|'margem'|null, dir: 'asc'|'desc'|null }
const sortState = {
  'acoes-tbody': { field: null, dir: null },
  'fiis-tbody':  { field: null, dir: null },
};

// ===== TICKER =====
function sortByTicker(tbodyId) {
  const state = sortState[tbodyId];
  const next = state.field === 'ticker' && state.dir === 'asc' ? 'desc' : 'asc';
  sortState[tbodyId] = { field: 'ticker', dir: next };
  updateSortIndicators(tbodyId);

  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const ta = (a.querySelector('[data-f="ticker"]')?.value || '').toUpperCase();
    const tb = (b.querySelector('[data-f="ticker"]')?.value || '').toUpperCase();
    return next === 'asc' ? ta.localeCompare(tb) : tb.localeCompare(ta);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// ===== MARGEM =====
function sortTableByMargem(tbodyId, dir) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const getMargem = r => {
      const sp = r.querySelector('[data-r="margem"] span');
      if (!sp) return -Infinity;
      const n = parseFloat(sp.textContent.replace('%','').replace(',','.').replace('+','').trim());
      return isNaN(n) ? -Infinity : n;
    };
    return dir === 'desc' ? getMargem(b) - getMargem(a) : getMargem(a) - getMargem(b);
  });
  rows.forEach(r => tbody.appendChild(r));
}

function sortByMargem(tbodyId) {
  const state = sortState[tbodyId];
  const next = state.field === 'margem' && state.dir === 'desc' ? 'asc' : 'desc';
  sortState[tbodyId] = { field: 'margem', dir: next };
  updateSortIndicators(tbodyId);
  sortTableByMargem(tbodyId, next);
}

// ===== CLEAR =====
function clearSort(tbodyId) {
  sortState[tbodyId] = { field: null, dir: null };
  updateSortIndicators(tbodyId);
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => parseInt(a.dataset.order || '0') - parseInt(b.dataset.order || '0'));
  rows.forEach(r => tbody.appendChild(r));
}

// ===== INDICADORES =====
function updateSortIndicators(tbodyId) {
  const state   = sortState[tbodyId];
  const isAcoes = tbodyId === 'acoes-tbody';

  // Margem
  const margemBtn = document.getElementById(isAcoes ? 'acoes-sort-btn' : 'fiis-sort-btn');
  if (margemBtn) {
    if      (state.field === 'margem' && state.dir === 'desc') margemBtn.textContent = 'Margem Seg. ↓';
    else if (state.field === 'margem' && state.dir === 'asc')  margemBtn.textContent = 'Margem Seg. ↑';
    else                                                        margemBtn.textContent = 'Margem Seg.';
  }

  // Ticker label
  const labelEl = document.getElementById(isAcoes ? 'acoes-ticker-sort-label' : 'fiis-ticker-sort-label');
  if (labelEl) {
    const base = isAcoes ? 'Ação' : 'FII';
    if      (state.field === 'ticker' && state.dir === 'asc')  labelEl.textContent = base + ' ↑';
    else if (state.field === 'ticker' && state.dir === 'desc') labelEl.textContent = base + ' ↓';
    else                                                        labelEl.textContent = base;
  }
}
