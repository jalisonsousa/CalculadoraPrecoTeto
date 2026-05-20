function collectCurrentData() {
  const acoes = [];
  document.querySelectorAll('#acoes-tbody tr').forEach(row => {
    acoes.push({
      ticker: row.querySelector('[data-f="ticker"]').value || '',
      qty:    pi(row.querySelector('[data-f="qty"]')?.value)    || 0,
      pmedio: pf(row.querySelector('[data-f="pmedio"]')?.value),
      preco:  pf(row.querySelector('[data-f="preco"]').value),
      lpa:    pf(row.querySelector('[data-f="lpa"]').value),
      payout: pf(row.querySelector('[data-f="payout"]').value),
      cagr:   pf(row.querySelector('[data-f="cagr"]').value)  || 10,
      dy:     pf(row.querySelector('[data-f="dy"]').value)    || 8,
      tempo:  pi(row.querySelector('[data-f="tempo"]').value) || 5,
    });
  });
  const fiis = [];
  document.querySelectorAll('#fiis-tbody tr').forEach(row => {
    fiis.push({
      ticker:   row.querySelector('[data-f="ticker"]').value || '',
      qty:      pi(row.querySelector('[data-f="qty"]')?.value)    || 0,
      pmedio:   pf(row.querySelector('[data-f="pmedio"]')?.value),
      pvp:      pf(row.querySelector('[data-f="pvp"]').value),
      preco:    pf(row.querySelector('[data-f="preco"]').value),
      div12m:   pf(row.querySelector('[data-f="div12m"]').value),
      ipca:     pf(row.querySelector('[data-f="ipca"]').value),
      ipcaMais: pf(row.querySelector('[data-f="ipcaMais"]').value) || 7,
      premio:   pf(row.querySelector('[data-f="premio"]').value)   || 3,
    });
  });
  const brapiToken = brapiGetToken();
  const metaRenda  = document.getElementById('meta-renda-input')?.value || '';
  return { acoes, fiis, savedAt: new Date().toISOString(), ...(metaRenda && { metaRenda }), ...(brapiToken && { brapiToken }) };
}

function restoreBrapiToken(data) {
  if (!data?.brapiToken) return;
  localStorage.setItem(LS_BRAPI_TOKEN, data.brapiToken);
  brapiUpdateSidebarStatus();
}

async function loadFromCloud() {
  setCloudStatus('loading', 'Carregando...');
  try {
    const res = await fetch(JB_URL + '/latest', {
      headers: { 'X-Access-Key': JB_API_KEY, 'X-Bin-Meta': 'false' }
    });

    if (res.status === 404 || res.status === 400) {
      setCloudStatus('ok', 'Nenhum dado salvo ainda');
      loadDataIntoTables(DEFAULTS);
      return;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    if (data && data.acoes && data.fiis && data.acoes.length > 0) {
      const first = data.acoes[0];
      const isValid = first && ('lpa' in first || 'payout' in first || 'dy' in first);
      if (isValid) {
        restoreBrapiToken(data);
        loadDataIntoTables(data);
        updateSaveTime(data.savedAt);
        setCloudStatus('ok', 'Sincronizado');
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
        brapiAutoUpdateAll();
        return;
      }
    }
    setCloudStatus('ok', 'Nenhum dado salvo ainda');
    loadDataIntoTables(DEFAULTS);
  } catch(e) {
    console.warn('JSONBin load failed:', e);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.acoes && cached.fiis) {
          restoreBrapiToken(cached);
          loadDataIntoTables(cached);
          updateSaveTime(cached.savedAt);
          setCloudStatus('error', 'Sem conexão — usando cache');
          brapiAutoUpdateAll();
          return;
        }
      }
    } catch(e2) {}
    loadDataIntoTables(DEFAULTS);
    setCloudStatus('error', 'Sem conexão');
  }
}

async function saveData() {
  setSaveBtnState('loading');
  setCloudStatus('saving', 'Salvando...');

  const data = collectCurrentData();
  try {
    const res = await fetch(JB_URL, {
      method:  'PUT',
      headers: jbHeaders,
      body:    JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}

    setSaveBtnState('saved');
    setTimeout(() => setSaveBtnState('reset'), 2000);
    updateSaveTime(data.savedAt);
    setCloudStatus('ok', 'Sincronizado');
    showToast('Dados salvos na nuvem!', false);
  } catch(e) {
    console.error('JSONBin save failed:', e);
    setSaveBtnState('reset');
    setCloudStatus('error', 'Erro ao salvar');
    showToast('Erro ao salvar na nuvem. Verifique a conexão.', true);
  }
}

function exportData() {
  const data = collectCurrentData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'preco-teto-' + new Date().toLocaleDateString('pt-BR').replace(/\//g, '-') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exportado!', false);
}
