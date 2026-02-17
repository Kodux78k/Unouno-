
(function(){
  function apply78K(on){
    var html = document.documentElement;
    if(on) html.setAttribute('data-78k','on'); else html.removeAttribute('data-78k');
    try { localStorage.setItem('uno:78k', on ? '1':'0'); } catch(e){}
    if (window.ORB && typeof window.ORB.setBoost==='function'){ window.ORB.setBoost(on?1.8:1.0); }
    else {
      var cur = parseFloat(getComputedStyle(html).getPropertyValue('--arch-overlay-strength')) || 12;
      var str = on ? Math.max(cur, 16) : 12;
      html.style.setProperty('--arch-overlay-strength', str + '%');
    }
    var t = document.getElementById('ls78kToggle'); if (t) t.checked = !!on;
  }
  // boot
  var toggle = document.getElementById('ls78kToggle');
  if (toggle){
    var on = (localStorage.getItem('uno:78k')||'0')==='1';
    apply78K(on);
    toggle.addEventListener('change', function(){ apply78K(toggle.checked); });
  }
  // expose minimal API
  window.UNO = window.UNO || {}; window.UNO.State78K = { set: apply78K };
})();
