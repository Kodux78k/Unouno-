
(function(){
  function set78K(on){
    var html = document.documentElement;
    if (on) html.setAttribute('data-78k','on'); else html.removeAttribute('data-78k');
    try { localStorage.setItem('uno:78k', on ? '1':'0'); } catch(e){}
    // Boost no ORB se disponível
    if (window.ORB && typeof window.ORB.setBoost === 'function') {
      window.ORB.setBoost(on ? 1.8 : 1.0);
    } else {
      // fallback: reforça overlay quando 78K ligado
      var cur = parseFloat(getComputedStyle(html).getPropertyValue('--arch-overlay-strength')) || 12;
      var str = on ? Math.max(cur, 16) : 12;
      html.style.setProperty('--arch-overlay-strength', str + '%');
    }
    var b = document.getElementById('btn78K'); if (b) b.classList.toggle('on', !!on);
  }
  var btn = document.getElementById('btn78K');
  if (btn){
    set78K((localStorage.getItem('uno:78k')||'0') === '1');
    btn.addEventListener('click', function(){ set78K(!(document.documentElement.getAttribute('data-78k')==='on')); });
  }

  // brainLog helper
  window.brainLog = function(msg, type){
    try {
      var box = document.getElementById('brainLogs') || document.getElementById('logs');
      if (!box) return;
      var t = new Date().toLocaleTimeString();
      var tag = type ? ('['+String(type).toUpperCase()+'] ') : '';
      var line = '['+t+'] ' + tag + String(msg);
      box.textContent = (line + '
' + box.textContent).slice(0, 16000);
    } catch(e){}
  };

  // Normalizar títulos de apps (upload/local)
  document.querySelectorAll('[data-role="app-card"], .app-card').forEach(function(card){
    var t = card.querySelector('.app-title');
    if (!t) return;
    var raw = t.getAttribute('title') || t.textContent || '';
    t.textContent = String(raw).trim();
  });
})();
