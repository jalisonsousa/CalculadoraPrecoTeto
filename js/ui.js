// ===== SYNC STATE — botão unificado de status + salvar =====
function _syncApply(icon, label, color, disabled) {
  const btn = document.getElementById('sticky-save-btn');
  const ico = document.getElementById('sync-icon');
  const lbl = document.getElementById('sync-label');
  if (!btn) return;
  btn.disabled      = disabled;
  btn.style.color   = color;
  btn.style.borderColor = disabled ? '' : color;
  if (ico) ico.className    = icon;
  if (lbl) lbl.textContent  = label;
}

function setCloudStatus(state) {
  const cfg = {
    loading: ['fa-solid fa-circle-notch fa-spin', 'Carregando…',  'var(--text3)',  true ],
    ok:      ['fa-solid fa-cloud-arrow-up',        'Sincronizado', 'var(--green)',  false],
    saving:  ['fa-solid fa-circle-notch fa-spin',  'Salvando…',    'var(--accent)', true ],
    error:   ['fa-solid fa-cloud-exclamation',     'Sem conexão',  'var(--orange)', false],
  };
  const [icon, label, color, disabled] = cfg[state] ?? cfg.ok;
  _syncApply(icon, label, color, disabled);
}

function setSaveBtnState(state) {
  if (state === 'loading') {
    _syncApply('fa-solid fa-circle-notch fa-spin', 'Salvando…', 'var(--accent)', true);
  } else if (state === 'saved') {
    _syncApply('fa-solid fa-check', 'Salvo!', 'var(--green)', true);
  } else {
    _syncApply('fa-solid fa-cloud-arrow-up', 'Sincronizado', 'var(--green)', false);
  }
}

// ===== SAVE TIME =====
function updateSaveTime(iso) {
  if (!iso) return;
  const d  = new Date(iso);
  const el = document.getElementById('sticky-save-time');
  if (el) el.textContent = d.toLocaleDateString('pt-BR') + ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===== TOAST =====
function showToast(msg, warn) {
  const t  = document.getElementById('toast');
  const ic = document.getElementById('toast-icon');
  document.getElementById('toast-msg').textContent = msg;
  ic.className = 'toast-icon ' + (warn ? 'warn fa-solid fa-triangle-exclamation' : 'fa-solid fa-floppy-disk');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== TABS =====
const TAB_TITLES = { acoes: 'Ações', fiis: 'FIIs', simulador: 'Simulador de Aporte' };

function switchTab(tab) {
  ['acoes', 'fiis', 'simulador'].forEach(t => {
    const navEl = document.getElementById('nav-' + t);
    const tabEl = document.getElementById('tab-' + t);
    if (navEl) navEl.classList.toggle('active', t === tab);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
  const title = document.getElementById('top-bar-title');
  if (title) title.textContent = TAB_TITLES[tab] || '';
  if (tab === 'simulador') renderSimulador();
  try { localStorage.setItem(LS_TAB, tab); } catch (e) {}
  closeSidebar();
}

// ===== SIDEBAR (mobile) =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ===== TICKER LINKS =====
function openTickerLink(el, type) {
  const ticker = el.closest('div').querySelector('[data-f="ticker"]').value.trim();
  if (!ticker) return;
  const url = type === 'fiis'
    ? `https://investidor10.com.br/fiis/${ticker.toLowerCase()}`
    : `https://investidor10.com.br/acoes/${ticker.toLowerCase()}/`;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

// ===== DELETE ROW =====
// Primeiro clique arma a confirmação (botão vira lixeira vermelha);
// segundo clique em até 3s remove de fato.
function deleteRow(id, cb, btn) {
  const el = document.getElementById(id);
  if (!el) return;

  if (btn && !btn.classList.contains('confirm')) {
    btn.classList.add('confirm');
    btn.innerHTML = '<i class="fa-solid fa-trash"></i> Confirmar?';
    btn.title = 'Clique novamente para remover';
    clearTimeout(btn._confirmT);
    btn._confirmT = setTimeout(() => {
      btn.classList.remove('confirm');
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      btn.title = '';
    }, 3000);
    return;
  }

  el.remove();
  if (cb) cb();
}

// ===== LOAD DATA INTO TABLES =====
function loadDataIntoTables(data) {
  document.getElementById('acoes-tbody').innerHTML = '';
  document.getElementById('fiis-tbody').innerHTML  = '';
  acoesRowId = 0;
  fiisRowId  = 0;
  (data.acoes || []).forEach(d => addAcoesRow(d));
  (data.fiis  || []).forEach(d => addFiisRow(d));
  updateAcoesStats();
  updateFiisStats();
  // Mantém a lista do simulador em sincronia se for a aba ativa
  if (document.getElementById('tab-simulador')?.classList.contains('active')) renderSimulador();
}

