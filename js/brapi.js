// Integração com brapi.dev — plano free retorna apenas Preço Atual.
// LPA, Payout, CAGR, P/VP e Div.12M precisam ser preenchidos manualmente.

const BRAPI_BASE     = 'https://brapi.dev/api/quote';
const LS_BRAPI_TOKEN = 'precoteto_brapi_token';

function brapiGetToken() {
  return localStorage.getItem(LS_BRAPI_TOKEN) || '';
}

function brapiOpenTokenModal(afterSaveCb) {
  const modal    = document.getElementById('brapi-token-modal');
  if (!modal) return;
  const input    = document.getElementById('brapi-token-input');
  const removeBtn = document.getElementById('brapi-remove-btn');
  const hasToken = !!brapiGetToken();
  if (input) {
    input.value = '';
    input.placeholder = hasToken
      ? 'Token configurado — cole um novo para alterar'
      : 'Cole seu token aqui...';
  }
  if (removeBtn) removeBtn.style.display = hasToken ? 'inline-flex' : 'none';
  modal._afterSave = afterSaveCb || null;
  modal.style.display = 'flex';
  setTimeout(() => input?.focus(), 80);
}

function brapiRemoveToken() {
  localStorage.removeItem(LS_BRAPI_TOKEN);
  brapiUpdateSidebarStatus();
  showToast('Token removido', false);
  brapiCloseTokenModal();
}

function brapiCloseTokenModal() {
  const modal = document.getElementById('brapi-token-modal');
  if (modal) modal.style.display = 'none';
}

function brapiSaveToken() {
  const input = document.getElementById('brapi-token-input');
  const token = input?.value?.trim() || '';
  if (token) {
    localStorage.setItem(LS_BRAPI_TOKEN, token);
    showToast('Token salvo!', false);
  } else if (brapiGetToken()) {
    // Input vazio mas token já existe — mantém o atual
    showToast('Token mantido', false);
  } else {
    localStorage.removeItem(LS_BRAPI_TOKEN);
    showToast('Token removido', false);
  }
  brapiUpdateSidebarStatus();
  const modal = document.getElementById('brapi-token-modal');
  const cb = modal?._afterSave;
  brapiCloseTokenModal();
  if (cb) cb();
}

function brapiUpdateSidebarStatus() {
  const el = document.getElementById('brapi-sidebar-status');
  if (!el) return;
  const hasToken = !!brapiGetToken();
  el.innerHTML = hasToken
    ? '<i class="fa-solid fa-key" style="color:var(--green)"></i> brapi.dev <span style="color:var(--green);font-size:10px">● configurado</span>'
    : '<i class="fa-solid fa-key" style="color:var(--orange)"></i> brapi.dev <span style="color:var(--orange);font-size:10px">● sem token</span>';
}

async function brapiQuote(ticker) {
  const token = brapiGetToken();
  const p = new URLSearchParams();
  if (token) p.set('token', token);
  const res = await fetch(`${BRAPI_BASE}/${ticker}?${p}`);
  if (res.status === 401) throw new Error('__AUTH__');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  const data = json.results?.[0];
  if (!data?.regularMarketPrice) throw new Error('Sem preço para ' + ticker);
  return data.regularMarketPrice;
}

function brapiFlashPrice(el) {
  el.style.transition = 'background-color 0.25s ease';
  el.style.backgroundColor = 'rgba(99,102,241,0.32)';
  setTimeout(() => {
    el.style.backgroundColor = '';
    setTimeout(() => { el.style.transition = ''; }, 300);
  }, 1300);
}

function applyBrapiPrice(row, price, type, rid) {
  const el = row.querySelector('[data-f="preco"]');
  if (!el) return;
  el.value = price.toFixed(2).replace('.', ',');
  brapiFlashPrice(el);
  if (type === 'acoes') updateAcoesRow(rid);
  else                  updateFiisRow(rid);
}

function brapiHandleAuthError(retryFn) {
  showToast('Token brapi.dev necessário', true);
  brapiOpenTokenModal(retryFn);
}

async function fetchRowBrapi(rid, type) {
  const row = document.getElementById(`${type}-row-${rid}`);
  if (!row) return;
  const ticker = row.querySelector('[data-f="ticker"]')?.value?.trim().toUpperCase();
  if (!ticker) { showToast('Digite o ticker primeiro', true); return; }

  const btn = row.querySelector('.brapi-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }

  try {
    const price = await brapiQuote(ticker);
    applyBrapiPrice(row, price, type, rid);
    showToast(`${ticker}: preço atualizado`, false);
  } catch (e) {
    if (e.message === '__AUTH__') brapiHandleAuthError(() => fetchRowBrapi(rid, type));
    else showToast(`Erro ao buscar ${ticker}`, true);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i>'; }
  }
}

async function fetchAllBrapi(type) {
  const tbodyId   = type === 'acoes' ? 'acoes-tbody' : 'fiis-tbody';
  const rows      = [...document.querySelectorAll(`#${tbodyId} tr`)];
  const validRows = rows.filter(r => r.querySelector('[data-f="ticker"]')?.value?.trim());

  if (!validRows.length) return 0;

  const btn = document.getElementById(`brapi-all-${type}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:5px"></i>Buscando...';
  }

  const jobs = validRows.map(row => {
    const ticker = row.querySelector('[data-f="ticker"]').value.trim().toUpperCase();
    return brapiQuote(ticker)
      .then(price => ({ row, price, ticker, ok: true }))
      .catch(err  => ({ row, ticker, ok: false, err: err.message }));
  });

  const results = await Promise.all(jobs);
  let updated = 0;
  let authErr  = false;

  for (const r of results) {
    if (r.ok) {
      const rid = r.row.id.replace(`${type}-row-`, '');
      applyBrapiPrice(r.row, r.price, type, rid);
      updated++;
    } else if (r.err === '__AUTH__') {
      authErr = true;
    }
  }

  if (authErr) brapiHandleAuthError(() => fetchAllBrapi(type));

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-rotate" style="margin-right:5px"></i>Atualizar todos';
  }

  return updated;
}

// Disparado automaticamente após carregar dados da nuvem
async function brapiAutoUpdateAll() {
  if (!brapiGetToken()) return;
  setCloudStatus('loading', 'Atualizando preços...');
  await fetchAllBrapi('acoes');
  await fetchAllBrapi('fiis');
  setCloudStatus('ok', 'Sincronizado');
}
