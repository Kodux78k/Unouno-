
(function(){
  function readLSBool(key, d){ try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
  function enforce(){
    var on = !!readLSBool('arch:overlayOn', false);
    document.documentElement.setAttribute('data-overlay', on ? 'on' : 'off');
    if(!on){
      try{
        document.documentElement.style.setProperty('--arch-overlay','rgba(0,0,0,0)');
        document.documentElement.style.setProperty('--arch-overlay-strength','0%');
        var fade = document.getElementById('arch-fadeCover');
        if(fade) fade.style.background = 'transparent';
      }catch(e){}
    }
  }
  function bind(){
    enforce();
    // Poll lightly to defeat late writers
    setInterval(enforce, 500);
    // Also react to storage changes (other tabs)
    window.addEventListener('storage', function(ev){ if(ev && ev.key==='arch:overlayOn'){ enforce(); } });
    // If there is a Brain toggle, hook it
    document.addEventListener('click', function(e){
      var t = e.target;
      if(!t) return;
      if(t.id==='overlayToggle' || t.closest && t.closest('#overlayToggle')){
        setTimeout(enforce, 60);
      }
    }, true);
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', bind); } else { bind(); }
})();
