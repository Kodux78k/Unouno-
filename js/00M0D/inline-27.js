
  (function(){
    const LSKEY='dual.state.78k';
    function isOn(){ return !!localStorage.getItem(LSKEY); }
    function setUI(on){
      const lsBtn=document.getElementById('lsToggle78k');
      if(lsBtn){
        lsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        lsBtn.textContent = on ? '78K: ON' : '78K: OFF';
        if(lsBtn.classList) lsBtn.classList.toggle('prime', !!on);
      }
      const badge=document.getElementById('badge78k');
      if(badge){
        badge.style.display = on ? 'inline' : 'none';
      }
    }
    function enable(){
      localStorage.setItem(LSKEY,'1');
      try{ if(window.Ativar78K) window.Ativar78K(); }catch(e){}
      setUI(true);
    }
    function disable(){
      localStorage.removeItem(LSKEY);
      try{ document.documentElement.style.removeProperty('--arch-overlay'); }catch(e){}
      setUI(false);
    }
    function toggle(){ isOn() ? disable() : enable(); }
    document.addEventListener('DOMContentLoaded', function(){
      const btn=document.getElementById('lsToggle78k');
      if(btn){ btn.addEventListener('click', function(){ toggle(); }); }
      setUI(isOn());
    });
    window.addEventListener('storage', function(ev){
      if(ev.key===LSKEY){
        setUI(!!ev.newValue);
      }
    });
  })();
  