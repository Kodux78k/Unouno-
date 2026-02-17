
(function () {
  const LSget = (k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } };

  function setOverlayTransparent(){
    try{
      document.documentElement.style.setProperty('--arch-overlay','rgba(0,0,0,0)');
      document.documentElement.style.setProperty('--arch-overlay-strength','0%');
    }catch(e){}
  }

  function gateApply(){
    // Re-define applyArchOverlay ALWAYS last so it cannot be overridden later
    window.applyArchOverlay = function(name){
      const on = !!LSget('arch:overlayOn', false);
      if(!on){ setOverlayTransparent(); return; }
      const key = (name||'').toLowerCase();
      const MAP = (window.ARCH_OVERLAYS_PATCHED||window.ARCH_OVERLAYS||{default:'rgba(0,0,0,0)'});
      const color = MAP[key] || MAP.default || 'rgba(0,0,0,0)';
      try{
        document.documentElement.style.setProperty('--arch-overlay', color);
        // If some panels manage strength separately, leave current value as-is when ON
      }catch(e){}
    };

    // On load, keep OFF if toggle is OFF
    const sel = document.getElementById('arch-select');
    const base = (sel?.value || '').replace(/\.html$/i,'');
    if(!LSget('arch:overlayOn', false)) setOverlayTransparent(); else window.applyArchOverlay(base);
  }

  if(document.readyState === 'complete') gateApply();
  else window.addEventListener('load', gateApply);
})();
