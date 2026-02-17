
(function(){
  function toggle78K(){
    var on = document.documentElement.getAttribute('data-78k') === 'on';
    var set = function(v){
      if (v) document.documentElement.setAttribute('data-78k','on');
      else document.documentElement.removeAttribute('data-78k');
      try { localStorage.setItem('uno:78k', v ? '1':'0'); } catch(e){}
      if (window.ORB && typeof window.ORB.setBoost==='function'){ window.ORB.setBoost(v?1.8:1.0); }
    };
    set(!on);
  }
  // boot from LS
  try { if ((localStorage.getItem('uno:78k')||'0')==='1') document.documentElement.setAttribute('data-78k','on'); } catch(e){}

  // Double-click/tap on arch circle toggles 78K
  var circle = document.getElementById('archCircle') || document.querySelector('.arch-circle');
  if (circle){
    circle.addEventListener('dblclick', function(e){ e.preventDefault(); toggle78K(); }, {passive:false});
  }

  // Keyboard shortcut: Shift+K
  window.addEventListener('keydown', function(e){
    if ((e.key==='K' || e.key==='k') && e.shiftKey){ e.preventDefault(); toggle78K(); }
  });
})();
