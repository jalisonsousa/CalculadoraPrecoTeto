// ===== CLOUD STATUS =====
function setCloudStatus(state, text) {
  const colors = { loading:'var(--text3)', ok:'var(--green)', error:'var(--red)', saving:'var(--accent)' };
  const icons  = { loading:'fa-solid fa-circle-notch fa-spin', ok:'fa-solid fa-cloud-arrow-up', error:'fa-solid fa-cloud-exclamation', saving:'fa-solid fa-circle-notch fa-spin' };
  const icon  = document.querySelector('#sticky-cloud-status i');
  const label = document.getElementById('sticky-cloud-label');
  if (icon)  { icon.className = icons[state]; icon.style.color = colors[state]; }
  if (label) { label.textContent = text; label.style.color = colors[state]; }
}

// ===== SAVE TIME =====
function updateSaveTime(iso) {
  if (!iso) return;
  const d = new Date(iso);
  const el = document.getElementById('sticky-save-time');
  if (el) el.textContent = 'Salvo: ' + d.toLocaleDateString('pt-BR') + ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===== SAVE BUTTON STATE (atualiza ambos os botões) =====
function setSaveBtnState(state) {
  const btns = [
    document.getElementById('save-btn'),
    document.getElementById('sticky-save-btn'),
  ];
  btns.forEach(btn => {
    if (!btn) return;
    const isCompact = btn.id === 'sticky-save-btn';
    const label = isCompact ? 'Salvar' : 'Salvar na nuvem';
    if (state === 'loading') {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';
    } else if (state === 'saved') {
      btn.classList.add('saved');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
    } else {
      btn.classList.remove('saved');
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${label}`;
    }
  });
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
const TAB_TITLES = { acoes: 'Ações', fiis: 'FIIs', proventos: 'Proventos FIIs' };

function switchTab(tab) {
  ['acoes', 'fiis', 'proventos'].forEach(t => {
    const navEl = document.getElementById('nav-' + t);
    const tabEl = document.getElementById('tab-' + t);
    if (navEl) navEl.classList.toggle('active', t === tab);
    if (tabEl) tabEl.classList.toggle('active', t === tab);
  });
  const title = document.getElementById('top-bar-title');
  if (title) title.textContent = TAB_TITLES[tab] || '';
  if (tab === 'proventos') updateProventos();
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
    ? `https://www.fundsexplorer.com.br/funds/${ticker.toLowerCase()}`
    : `https://investidor10.com.br/acoes/${ticker.toLowerCase()}/`;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
}

// ===== DELETE ROW =====
function deleteRow(id, cb) {
  const el = document.getElementById(id);
  if (el) { el.remove(); if (cb) cb(); }
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
}

