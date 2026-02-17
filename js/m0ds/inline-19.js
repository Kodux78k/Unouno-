
// BLOOM TOGGLE: persist in localStorage('dual.ui.bloom'), add button above chips
(function(){ 
  const _bState = (localStorage.getItem('dual.ui.bloom') === '1');
  function sendBloom(enabled){
    try{
      const fr = document.getElementById('arch-frame');
      if(fr && fr.contentWindow) fr.contentWindow.postMessage({ type:'bloomToggle', enabled: !!enabled }, '*');
      // Adjust overlay intensity when bloom enabled
      document.documentElement.style.setProperty('--arch-overlay-intensity', enabled? '0.45' : '0.35');
    }catch(e){}
  }
  // ensure we send initial state on boot after DOM ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=> sendBloom(_bState) );
  } else sendBloom(_bState);
  // expose helper for the chip script to create the button
  window._dual_bloom_state = _bState;
  window._dual_bloom_send = sendBloom;
})();
(function(){
  // Minimal palettes (sync with your overlay colors)
  const COLORS = {
    atlas:'#409EFF', nova:'#FF52B1', vitalis:'#34D399', pulse:'#00BFFF',
    artemis:'#FFC300', serena:'#B684FF', kaos:'#FF4D6D', genus:'#22C55E',
    lumine:'#FFD54F', rhea:'#00D1B2', solus:'#6495ED', aion:'#8B5CF6'
  };
  const PRESET = name => ({
    name,
    color: COLORS[name] || '#88a',
    count: (name==='nova'||name==='pulse'||name==='lumine') ? 340 : 260,
    orbitRadius: (name==='nova'||name==='serena'||name==='lumine') ? 0.76 : 0.68,
    spin: (name==='nova'||name==='pulse') ? 0.7 : 0.56,
    size: 0.010, // sphere size
    glow: 0.42
  });

  const ACTIVE = new Set();
  function sendLayers(){
    const fr = document.getElementById('arch-frame');
    if (!fr || !fr.contentWindow) return;
    const arr = Array.from(ACTIVE).map(n => PRESET(n));
    fr.contentWindow.postMessage({ type:'atomConfigLayers', layers: arr }, '*');
  }

  function chipEl(name){
    const b = document.createElement('button');
    b.className = 'arch-chip';
    b.textContent = name[0].toUpperCase()+name.slice(1);
    b.style.borderColor = 'rgba(255,255,255,.18)';
    b.style.background = 'rgba(255,255,255,.06)';
    b.onclick = ()=>{
      if (ACTIVE.has(name)) ACTIVE.delete(name); else ACTIVE.add(name);
      b.classList.toggle('on', ACTIVE.has(name));
      sendLayers();
    };
    return b;
  }

  function ensureStyles(){
    if (document.getElementById('archChip3DStyles')) return;
    const st = document.createElement('style'); st.id='archChip3DStyles';
    st.textContent = `
      .arch-chip-wrap{ display:grid; grid-template-columns: repeat(auto-fill,minmax(92px,1fr)); gap:8px; }
      .arch-chip{ appearance:none; border:1px solid var(--ring, rgba(255,255,255,.18)); background: var(--glass, rgba(255,255,255,.06)); color: var(--txt, #eaf2ff);
        padding:8px 10px; border-radius:999px; font-size:12px; letter-spacing:.2px; cursor:pointer; }
      .arch-chip.on{ background: rgba(57,255,182,.18); border-color: rgba(57,255,182,.45); }
      .arch-chip-title{ font-size:12px; color: var(--muted,#a6b0c0); margin: 6px 0 6px; font-weight:800; }
    `;
    document.head.appendChild(st);
  }

  function injectInLSPanel(){
    ensureStyles();
    const panel = document.getElementById('lsPanel') || document.querySelector('#lsModal .ls-panel');
    if (!panel || document.getElementById('archChip3DSection')) return;
    const sec = document.createElement('div');
    sec.id = 'archChip3DSection';
    sec.className = 'preset';
    sec.style.marginTop = '10px';
    sec.innerHTML = `<div class="arch-chip-title">Arquétipos (camadas no ORB · 3D)</div>`;
    const wrap = document.createElement('div'); wrap.className = 'arch-chip-wrap';
    ['atlas','nova','vitalis','pulse','artemis','serena','kaos','genus','lumine','rhea','solus','aion'].forEach(n=> wrap.appendChild(chipEl(n)));
    sec.appendChild(wrap);
    // === Bloom toggle (insert above chips) ===
    const bloomWrap = document.createElement('div');
    bloomWrap.style.display = 'flex'; bloomWrap.style.alignItems = 'center'; bloomWrap.style.justifyContent = 'space-between';
    bloomWrap.style.marginBottom = '8px';
    const lbl = document.createElement('div'); lbl.textContent = 'Bloom Nébula'; lbl.className='arch-chip-title'; lbl.style.margin='0'; lbl.style.fontSize='12px';
    const toggle = document.createElement('button'); toggle.id='toggleBloomBtn'; toggle.className='arch-chip'; toggle.style.minWidth='92px';
    const state = (localStorage.getItem('dual.ui.bloom') === '1') || !!window._dual_bloom_state;
    if(state) toggle.classList.add('on');
    toggle.textContent = state ? 'Bloom: ON' : 'Bloom: OFF';
    toggle.onclick = function(){
      const now = !toggle.classList.contains('on');
      toggle.classList.toggle('on', now);
      toggle.textContent = now ? 'Bloom: ON' : 'Bloom: OFF';
      try{ localStorage.setItem('dual.ui.bloom', now? '1':'0'); }catch(_){}
      if (window._dual_bloom_send) window._dual_bloom_send(now);
      // send message to iframe as well for immediate toggle
      try{ const f = document.getElementById('arch-frame'); if(f && f.contentWindow) f.contentWindow.postMessage({ type: 'bloomToggle', enabled: !!now }, '*'); }catch(_){}
    };
    sec.insertBefore(bloomWrap, sec.firstChild);
    bloomWrap.appendChild(lbl);
    bloomWrap.appendChild(toggle);
    
    // Coloca no topo do LS Panel
    const hdr = panel.querySelector('.ls-hdr');
    if (hdr && hdr.parentNode) hdr.parentNode.insertBefore(sec, hdr.nextSibling);
    // Ativa por padrão a camada do arquétipo atual
    try{
      const sel = document.getElementById('arch-select');
      const cur = (sel && sel.value || 'atlas.html').replace(/.*\//,'').replace(/\.html$/i,'');
      const btn = wrap.querySelector('button.arch-chip:nth-child(' + (['atlas','nova','vitalis','pulse','artemis','serena','kaos','genus','lumine','rhea','solus','aion'].indexOf(cur)+1) + ')');
      if (cur && btn){ ACTIVE.add(cur); btn.classList.add('on'); sendLayers(); }
    }catch(_){}
  }

  function bindLSButton(){
    const btn = document.getElementById('btnLS');
    if (btn && !btn.dataset._chipsHook){
      btn.dataset._chipsHook = '1';
      btn.addEventListener('click', ()=> setTimeout(injectInLSPanel, 80), {passive:true});
    } else {
      // if already open
      setTimeout(injectInLSPanel, 120);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindLSButton);
  else bindLSButton();

  // Also re-inject if LS modal gets rebuilt
  document.addEventListener('ls:disabled-changed', ()=> setTimeout(injectInLSPanel, 60));
})();
