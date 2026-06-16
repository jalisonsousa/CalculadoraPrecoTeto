applyTheme(currentTheme);
loadDataIntoTables(DEFAULTS);

// Restaura a última aba aberta (persiste ao recarregar a página)
try {
  const savedTab = localStorage.getItem(LS_TAB);
  if (savedTab && ['acoes', 'fiis', 'simulador'].includes(savedTab)) switchTab(savedTab);
} catch (e) {}

loadFromCloud();
brapiUpdateSidebarStatus();
