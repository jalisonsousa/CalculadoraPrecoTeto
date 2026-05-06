(function() {
  const tip = document.getElementById('g-tip');
  let hideTimer;

  function showTip(el) {
    clearTimeout(hideTimer);
    const html = el.getAttribute('data-tip');
    if (!html) return;
    tip.innerHTML = html;
    tip.classList.add('visible');
    tip.classList.remove('flip-down');
    const r = el.getBoundingClientRect(), vw = window.innerWidth, th = tip.offsetHeight || 100, gap = 8;
    let top = r.top - th - gap, flip = false;
    if (top < 8) { top = r.bottom + gap; flip = true; }
    tip.classList.toggle('flip-down', flip);
    let left = r.left + r.width / 2 - 20;
    if (left + 250 > vw - 8) left = vw - 258;
    if (left < 8) left = 8;
    tip.style.top  = top  + 'px';
    tip.style.left = left + 'px';
  }

  function hideTip() { hideTimer = setTimeout(() => tip.classList.remove('visible'), 120); }

  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); });
  document.addEventListener('mouseout',  e => { const el = e.target.closest('[data-tip]'); if (el) hideTip(); });
  document.addEventListener('click',     e => {
    const el = e.target.closest('[data-tip]');
    if (el) { tip.classList.contains('visible') ? tip.classList.remove('visible') : showTip(el); }
    else     tip.classList.remove('visible');
  });
})();
