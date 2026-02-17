
(function(){
  // --- Palette clone (for S-Line update) ---
  const SLC = {
    nova   : {a:'#FF52B1', b:'#FF9AD9', ring:'#FF52B1', glow:'rgba(255,82,177,.55)'},
    genus  : {a:'#52FFB1', b:'#9DFFC8', ring:'#52FFB1', glow:'rgba(82,255,177,.45)'},
    lumine : {a:'#AEC6FF', b:'#D6E0FF', ring:'#A7C4FF', glow:'rgba(167,196,255,.45)'},
    solus  : {a:'#CFE7FF', b:'#EAF2FF', ring:'#CFE7FF', glow:'rgba(207,231,255,.40)'},
    atlas  : {a:'#409EFF', b:'#7ABEFF', ring:'#3DB2FF', glow:'rgba(64,158,255,.45)'},
    rhea   : {a:'#FFD773', b:'#FFE6A3', ring:'#FFC84A', glow:'rgba(255,200,74,.45)'},
    kaos   : {a:'#FF4D6D', b:'#FF8AA1', ring:'#FF5A7A', glow:'rgba(255,77,109,.48)'},
    artemis: {a:'#FF8C3C', b:'#FFB06A', ring:'#FF9A52', glow:'rgba(255,140,60,.48)'},
    serena : {a:'#78C8FF', b:'#AEE0FF', ring:'#90D6FF', glow:'rgba(120,200,255,.45)'},
    aion   : {a:'#64F0FF', b:'#B4F9FF', ring:'#78F3FF', glow:'rgba(100,240,255,.45)'},
    pulse  : {a:'#00BFFF', b:'#3CE0FF', ring:'#00D9FF', glow:'rgba(0,191,255,.48)'},
    vitalis: {a:'#22D392', b:'#72E5BE', ring:'#29E3A3', glow:'rgba(34,211,146,.45)'}
  };
  const ORDER = Object.keys(SLC);

  function setSLineArch(arch){
    const C = SLC[arch]||{}; const rs = document.documentElement.style;
    rs.setProperty('--ib-a', C.a || '#00c5ff');
    rs.setProperty('--ib-b', C.b || '#ff52e5');
    rs.setProperty('--ib-ring', C.ring || '#00d9ff');
    rs.setProperty('--ib-glow', C.glow || 'rgba(0,197,255,.45)');
    const bar = document.getElementById('ibSLine'); if (bar){ bar.classList.add('flash'); setTimeout(()=>bar.classList.remove('flash'), 220); }
  }
  // Audio (tiny)
  let _ac; function ac(){ return _ac || (_ac=new (window.AudioContext||window.webkitAudioContext)()); }
  function beep(freq=432, ms=160){ try{ const c=ac(), o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(.001,c.currentTime); g.gain.exponentialRampToValueAtTime(.22,c.currentTime+.02); o.start(); o.stop(c.currentTime+ms/1000);}catch(e){} }
  function chord(freq=220){ try{ const c=ac(); [1,1.5,2].forEach((m,i)=>{ const o=c.createOscillator(), g=c.createGain(); o.type=i?'square':'sawtooth'; o.frequency.value=freq*m; o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(.12/(i+1),c.currentTime+.01); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.26); o.start(); o.stop(c.currentTime+.28);});}catch(e){} }

  function currentArch(){
    return localStorage.getItem('infodose:arch.active') || (document.querySelector('#arch-select option:checked')?.value||'atlas').replace(/.*\\//,'').replace(/\\.html$/i,'');
  }

  // --- Apps -> Bus (delegated) ---
  function resolveApp(el){
    const ds = el.dataset||{};
    if (ds.app)  return ds.app;
    if (ds.open) return ds.open;
    if (ds.route) return ds.route.replace(/^app\\.|\\.open$/g,'').replace(/[^a-z0-9_\\-]+/gi,'').toLowerCase();
    const href = el.getAttribute('href')||'';
    if (/^app:/.test(href)) return href.slice(4);
    const m = href.match(/#app-([a-z0-9_\\-]+)/i); if (m) return m[1];
    const txt = (el.textContent||'').trim().toLowerCase().replace(/\\s+/g,'-').replace(/[^a-z0-9_\\-]+/g,'');
    return txt || 'app';
  }
  document.addEventListener('click', (e)=>{
    const sel = e.target.closest('[data-app],[data-route],[data-open],.app-card,.app,[href^=\"app:\"],[href*=\"#app-\"]');
    if (!sel) return;
    const app = resolveApp(sel);
    const arch = sel.getAttribute('data-arch') || currentArch();
    const route = sel.getAttribute('data-route') || `app.${app}.open`;
    window.InfodoseBus && window.InfodoseBus.emit('ACTION', { arch, act:'open', route });
    window.InfodoseBus && window.InfodoseBus.emit('APP_OPEN', { app, arch, route });
    if (sel.getAttribute('data-arch')){ setSLineArch(arch); if (arch==='lumine'||arch==='solus') chord(ARCH_FREQ(arch)); else beep(ARCH_FREQ(arch)); }
  }, {passive:true});

  function ARCH_FREQ(arch){
    switch(arch){ case 'nova': case 'vitalis': return 528; case 'atlas': return 144; case 'serena': case 'genus': return 396; default: return 432; }
  }

  // --- S-Line: HUD + interactions ---
  const HUD = document.getElementById('ibHUD'); const BAR = document.getElementById('ibSLine');
  function hudText(){
    const arch = currentArch();
    let size = 0, last = '—';
    try{ const L = JSON.parse(localStorage.getItem('infodose:log')||'[]'); size = L.length||0; if (L[0]) last = `${L[0].type} @ ${new Date(L[0].ts).toLocaleTimeString()}`; }catch(e){}
    return `<b>Status</b><br><small>pele:</small> ${arch} • <small>log:</small> ${size} • <small>último:</small> ${last}`;
  }
  function hudToggle(){ if(!HUD) return; if (HUD.style.display==='block'){ HUD.style.display='none'; } else { HUD.innerHTML=hudText(); HUD.style.display='block'; setTimeout(()=>{ if (HUD.style.display==='block') HUD.style.display='none'; }, 3000); } }

  // double click => step next arch (visual/som/evento)
  function stepNext(){
    const arch = currentArch(); const i = Math.max(0, ORDER.indexOf(arch)); const nx = ORDER[(i+1)%ORDER.length];
    setSLineArch(nx); if (nx==='lumine'||nx==='solus') chord(ARCH_FREQ(nx)); else beep(ARCH_FREQ(nx));
    window.InfodoseBus && window.InfodoseBus.emit('ARCH_PULSE', { arch:nx, act:'sline-step' });
    localStorage.setItem('infodose:arch.active', nx);
  }

  // long press => auto-ronda toggle
  let pressT=null, rondaT=null, running=false;
  function startRonda(){ if(running) return; running=true; const SEC=4; let i=0;
    const arr=ORDER.slice(); function tick(){ const nx = arr[i%arr.length]; i++; setSLineArch(nx); (nx==='lumine'||nx==='solus')?chord(ARCH_FREQ(nx)):beep(ARCH_FREQ(nx));
      window.InfodoseBus && window.InfodoseBus.emit('ARCH_PULSE', { arch:nx, act:'sline-ronda' });
      localStorage.setItem('infodose:arch.active', nx); rondaT=setTimeout(tick, SEC*1000); } tick(); }
  function stopRonda(){ running=false; if(rondaT) clearTimeout(rondaT); rondaT=null; }

  if (BAR){
    BAR.addEventListener('click', hudToggle, {passive:true});
    BAR.addEventListener('dblclick', stepNext, {passive:true});
    BAR.addEventListener('touchstart', ()=>{ pressT=setTimeout(()=>{ running?stopRonda():startRonda(); }, 520); }, {passive:true});
    BAR.addEventListener('touchend', ()=>{ if(pressT){ clearTimeout(pressT); pressT=null; } }, {passive:true});
  }
})();
