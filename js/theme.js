let currentTheme = localStorage.getItem(LS_THEME) || 'dark';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-icon').className  = t === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  document.getElementById('theme-label').textContent = t === 'dark' ? 'Escuro' : 'Claro';
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(LS_THEME, currentTheme);
  applyTheme(currentTheme);
}
