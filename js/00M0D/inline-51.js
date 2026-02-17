
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .fusion-toggle, #fusion-toggle, .btn-fusion, [data-action="fusion-toggle"],
    .fusion-btn, .btn[data-fusion], button[aria-label*="Fusão" i] { display:none !important; }
    #ledstrip-fusion, #ledstrip-78k, #ibSLine { cursor: pointer; }
  `;
  document.head.appendChild(css);

  function getEnabled(){ try{ return JSON.parse(localStorage.getItem('dual.fusion.enabled')||'false'); }catch(_){ return false; } }
  function setEnabled(v){ try{ localStorage.setItem('dual.fusion.enabled', JSON.stringify(!!v)); }catch(_){ } }
  function normName(n){ return String(n||'').replace(/.*\//,'').replace(/\.html$/i,'').toLowerCase(); }
  function currentArchSafe(){
    try{
      if (typeof currentArch === 'function') return normName(currentArch());
      const sel = document.getElementById('arch-select');
      if (sel){ const opt = sel.options[sel.selectedIndex]; if (opt) return normName(opt.value||opt.textContent||''); }
    }catch(_){}
    return '';
  }
  let trail = [];
  function pushArch(n){
    n = normName(n);
    if (!n) return;
    if (trail.length && trail[trail.length-1]===n) return;
    trail.push(n);
    if (trail.length>8) trail = trail.slice(-8);
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const sel = document.getElementById('arch-select');
    if (sel){
      const opt = sel.options[sel.selectedIndex];
      if (opt) pushArch(opt.value||opt.textContent||'');
      sel.addEventListener('change', ()=>{
        const o = sel.options[sel.selectedIndex];
        pushArch(o ? (o.value||o.textContent||'') : '');
      });
    }
  });
  (function hookLEDTrail(){
    const LED = window.LEDSTRIP || (window.LEDSTRIP = {});
    if (LED.__trailPatched) return;
    const _setAB = LED.setArchetypes ? LED.setArchetypes.bind(LED) : null;
    LED.setArchetypes = function(a,b){ _setAB && _setAB(a,b); pushArch(a); pushArch(b); };
    LED.__trailPatched = true;
  })();

  function dispatchFusion(enabled, a, b){
    try{
      const det = enabled ? {enabled:true, a: normName(a), b: normName(b)} : {enabled:false};
      window.dispatchEvent(new CustomEvent('dual:fusion-change', { detail: det }));
    }catch(_){}
  }

  function handleToggle(ev){
    try{
      const enabled = getEnabled();
      if (enabled){
        setEnabled(false);
        dispatchFusion(false);
      } else {
        const A = currentArchSafe() || (trail.length? trail[trail.length-1]: 'atlas');
        let B = A;
        for (let i=trail.length-2; i>=0; i--){
          if (trail[i] && trail[i] !== A){ B = trail[i]; break; }
        }
        setEnabled(true);
        dispatchFusion(true, A, B);
      }
      const el = ev.currentTarget;
      if (el && el.style){
        const old = el.style.outline;
        el.style.outline = '2px solid rgba(255,255,255,.65)';
        setTimeout(()=>{ try{ el.style.outline = old || ''; }catch(_){ } }, 180);
      }
    }catch(_){}
  }

  function bindBars(){
    ['ledstrip-fusion','ledstrip-78k','ibSLine'].forEach(id=>{
      const el = document.getElementById(id);
      if (el && !el.__fusionToggleBound){
        el.addEventListener('click', handleToggle, true);
        el.__fusionToggleBound = true;
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindBars);
  else bindBars();

  (function bootRestore(){
    if (!getEnabled()) return;
    const A = currentArchSafe() || (trail.length? trail[trail.length-1]: 'atlas');
    let B = A;
    for (let i=trail.length-2; i>=0; i--){
      if (trail[i] && trail[i] !== A){ B = trail[i]; break; }
    }
    dispatchFusion(true, A, B);
  })();
})();
