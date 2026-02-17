
(() => {
  const $ = (q, r=document)=>r.querySelector(q);
  const LS = {
    get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v!=null? JSON.parse(v): d }catch(_){ return d } },
    set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(_){ } },
  };
  const COLORS = {
    atlas:'#409EFF', nova:'#FF52B1', vitalis:'#22C55E', pulse:'#00BFFF',
    artemis:'#FFC300', serena:'#B684FF', kaos:'#FF4D6D', genus:'#57CF70',
    lumine:'#FFD54F', rhea:'#00D1B2', solus:'#6495ED', aion:'#FF9F43'
  };
  const btn = document.getElementById('btn-fusionar');
  const bar = document.getElementById('ledstrip-fusion');
  const stripMain = document.getElementById('ledstrip-78k');
  const sel = $('#arch-select');

  function baseName(path){ return String(path||'').replace(/^.*\//,'').replace(/\.html$/i,'').toLowerCase(); }
  function cap(s){ return s? s[0].toUpperCase()+s.slice(1): s; }
  function currentArch(){
    if (!sel) return 'atlas';
    const v = sel.value || '';
    return baseName(v) || 'atlas';
  }
  function readEnabled(){ return !!LS.get('dual.fusion.enabled', false); }
  function readPair(){ return String(LS.get('dual.fusion.pair','')||''); }
  function writePair(p){ LS.set('dual.fusion.pair', p); }
  function writeEnabled(v){ LS.set('dual.fusion.enabled', !!v); }

  function gradientFor(a,b){
    const ca = COLORS[a] || '#00c2ff', cb = COLORS[b] || '#ff52e5';
    return `linear-gradient(90deg, ${ca}, ${cb})`;
  }
  function clearStripVisuals(){
    if (bar){
      bar.setAttribute('aria-hidden','true');
      bar.style.opacity = '0';
      bar.style.background = 'transparent';
    }
    if (stripMain){
      stripMain.style.removeProperty('--archA');
      stripMain.style.removeProperty('--archB');
    }
  }
  function labelFor(enabled, pairStr){
    if (!enabled) return '✦ Fusionar';
    return pairStr ? `✦ Fusão: ${pairStr}` : '✦ Fusão';
  }
  function applyVisuals(enabled, pair){
    btn.classList.toggle('on', !!enabled);
    btn.textContent = labelFor(enabled, pair);
    if (!enabled){ clearStripVisuals(); return; }
    const [a,b] = (pair||'').split('+').map(s=>s.trim().toLowerCase());
    if (bar){
      bar.setAttribute('aria-hidden','false');
      bar.style.opacity = '0.92';
      if (a && b) bar.style.background = gradientFor(a,b);
    }
    if (stripMain && a && b){
      stripMain.style.setProperty('--archA', COLORS[a] || '#409eff');
      stripMain.style.setProperty('--archB', COLORS[b] || '#ff52b1');
    }
  }
  function emitChange(enabled, pair){
    try {
      const [a,b] = (pair||'').split('+').map(s=>s.trim().toLowerCase());
      window.dispatchEvent(new CustomEvent('dual:fusion-change', { detail: { enabled, pair, a, b } }));
    } catch(_){}
  }
  function pickDefaultPair(){
    const a = currentArch();
    const order = ['atlas','nova','vitalis','pulse','artemis','serena','kaos','genus','lumine','rhea','solus','aion'];
    const i = Math.max(0, order.indexOf(a));
    const b = order[(i+1) % order.length];
    return `${cap(a)}+${cap(b)}`;
  }
  function normalizePairName(str){
    if (!str) return '';
    const parts = str.split('+').map(s=>baseName(s).replace(/[^a-z]/g,''));
    if (parts.length<2) return '';
    return `${cap(parts[0])}+${cap(parts[1])}`;
  }

  function refreshFromLS(){
    // ensure default OFF when absent
    if (localStorage.getItem('dual.fusion.enabled') === null) writeEnabled(false);

    let enabled = readEnabled();
    let pair = readPair();

    // If enabled and pair is missing or mismatched with current arch for slot A, realign A with current
    if (enabled){
      const arch = currentArch();
      if (!pair){
        pair = normalizePairName(pickDefaultPair());
        writePair(pair);
      } else {
        const [A,B] = pair.split('+').map(s=>s.trim());
        const aBase = baseName(A);
        if (aBase !== arch){
          pair = `${cap(arch)}+${B||'Nova'}`; // keep B if present
          writePair(pair);
        }
      }
    }

    applyVisuals(enabled, pair);
  }

  function toggle(){
    const enabled = !readEnabled();
    writeEnabled(enabled);
    if (enabled){
      // ensure pair exists and aligns with current A
      let pair = readPair();
      if (!pair) pair = normalizePairName(pickDefaultPair());
      const arch = currentArch();
      const parts = pair.split('+').map(s=>s.trim());
      const newPair = `${cap(baseName(arch))}+${cap(baseName(parts[1]||'Nova'))}`;
      writePair(newPair);
      applyVisuals(true, newPair);
      emitChange(true, newPair);
      // local toast hook (if defined in this page)
      if (typeof window.dualToast === 'function') window.dualToast(`Fusão ON · ${newPair}`);
    } else {
      applyVisuals(false, readPair());
      emitChange(false, readPair());
      if (typeof window.dualToast === 'function') window.dualToast('Fusão OFF');
    }
  }

  function init(){
    // initial paint
    refreshFromLS();
    // click handler
    btn.addEventListener('click', toggle);
    // react to archetype select changes (only when enabled)
    if (sel){
      sel.addEventListener('change', () => {
        if (!readEnabled()) return;
        // update A slot to current arch, keep B
        let pair = readPair();
        const [A,B] = (pair||'').split('+').map(s=>s.trim());
        const arch = currentArch();
        const newPair = `${cap(baseName(arch))}+${cap(baseName(B||'Nova'))}`;
        writePair(newPair);
        applyVisuals(true, newPair);
        emitChange(true, newPair);
      });
    }
    // react to external changes
    window.addEventListener('dual:fusion-change', () => refreshFromLS());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
