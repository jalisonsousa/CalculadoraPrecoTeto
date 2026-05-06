const fmt    = (v, d=2) => v.toLocaleString('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
const fmtPct = v => v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%';
const fmtR   = v => 'R$ ' + fmt(v);

function getMarginClass(m) { return m >= 15 ? 'margin-good' : m >= 0 ? 'margin-warn' : 'margin-bad'; }
function getMarginIcon(m)  { return ''; }
function getMarginSign(m)  { return m >= 0 ? '+' : ''; }

// Aceita vírgula ou ponto como separador decimal
function pf(v) { return parseFloat(String(v).replace(',','.')) || 0; }
function pi(v) { return parseInt(String(v)) || 0; }

// Valida: só dígitos, vírgula ou ponto (máx 1 separador)
function numericInput(el) {
  let v = el.value.replace(/[^0-9.,]/g,'');
  const parts = v.split(/[.,]/);
  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
  el.value = v;
}

function fmtInput(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = parseFloat(v);
  if (isNaN(n)) return '';
  return String(v);
}
