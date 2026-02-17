
(() => {
  // ==== HARD CAP & DEFAULTS ====
  const CAP_MASTER = 0.08;
  const DEFAULTS = { master: 0.030, pack: 'Lux', variant: 'UltraLow Seco', scaleMode: '432' };

  // ==== PACKS ====
  const PACKS = {
    Lux:  { atlas:'sine', nova:'morph', vitalis:'triangle', pulse:'triangle', artemis:'triangle', serena:'sine', kaos:'saw', genus:'morph', lumine:'morph', rhea:'triangle', solus:'sine', aion:'saw' },
    Terra:{ atlas:'triangle', nova:'sine', vitalis:'triangle', pulse:'sine', artemis:'triangle', serena:'triangle', kaos:'saw', genus:'triangle', lumine:'sine', rhea:'triangle', solus:'sine', aion:'saw' },
    Noir: { atlas:'saw', nova:'square', vitalis:'saw', pulse:'square', artemis:'square', serena:'sine', kaos:'saw', genus:'morph', lumine:'saw', rhea:'triangle', solus:'sine', aion:'saw' }
  };

  // ==== PATTERNS & MAPS ====
  const PATTERNS = { major_penta:[0,2,4,7,9], dorian:[0,2,3,5,7,9,10], phrygian:[0,1,3,5,7,8,10], aeolian:[0,2,3,5,7,8,10] };
  const LS = { get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d }catch(_){return d} }, set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)) }catch(_){} } };
  const MAP = {
    phases:  LS.get('audio.scale.map.phases',  { Isca:'major_penta', Progresso:'dorian', Tensão:'phrygian', Liberação:'aeolian' }),
    actions: LS.get('audio.scale.map.actions', { home_apps:'major_penta', chat_brain:'dorian', stack_nav:'aeolian' })
  };

  // ==== VARIANTS ====
  const VARIANTS = {
    'UltraLow Seco':  { master:0.030, baseGain:0.18, beatGain:0.12, kickF:68, atk:0.004, dec:0.18, clickGain:0.06, clickHP:2600, clickDec:0.08, scDepth:0.22, scRel:0.16, shaper:false, delay:false, airy:false, organic:false },
    'UltraLow Macio': { master:0.030, baseGain:0.20, beatGain:0.14, kickF:54, atk:0.006, dec:0.30, clickGain:0.04, clickHP:2200, clickDec:0.06, scDepth:0.18, scRel:0.22, shaper:false, delay:false, airy:false, organic:false },
    'TapeWarm':       { master:0.035, baseGain:0.20, beatGain:0.14, kickF:60, atk:0.005, dec:0.24, clickGain:0.05, clickHP:2300, clickDec:0.08, scDepth:0.20, scRel:0.18, shaper:true,  delay:false, airy:false, organic:false, drive:1.8 },
    'AiryClick':      { master:0.035, baseGain:0.20, beatGain:0.14, kickF:64, atk:0.004, dec:0.20, clickGain:0.08, clickHP:3200, clickDec:0.09, scDepth:0.20, scRel:0.18, shaper:false, delay:false, airy:true,  organic:false },
    'DubPulse':       { master:0.035, baseGain:0.20, beatGain:0.14, kickF:60, atk:0.004, dec:0.24, clickGain:0.06, clickHP:2600, clickDec:0.10, scDepth:0.22, scRel:0.22, shaper:false, delay:true,  airy:false, organic:false, dlyT:0.28, dlyFb:0.24 },
    'Organic':        { master:0.035, baseGain:0.22, beatGain:0.16, kickF:58, atk:0.005, dec:0.22, clickGain:0.05, clickHP:2400, clickDec:0.08, scDepth:0.25, scRel:0.20, shaper:false, delay:false, airy:false, organic:true }
  };

  // ==== AUDIO CORE ====
  const AC = window.__INFODOSE_AC || new (window.AudioContext||window.webkitAudioContext)();
  window.__INFODOSE_AC = AC;
  const master = (()=>{
    if (window.__INFODOSE_MASTER) return window.__INFODOSE_MASTER;
    const g=AC.createGain(); g.gain.value=Math.min(DEFAULTS.master, CAP_MASTER); g.connect(AC.destination);
    window.__INFODOSE_MASTER=g; return g;
  })();

  // Robust resume (PWA/iOS + keepalive)
  (function(){
    const resume=()=>{ try{ AC.resume() }catch(_){ } };
    ['pointerdown','touchstart','mousedown','keydown','scroll','wheel','visibilitychange','focus'].forEach(ev=>document.addEventListener(ev, resume, true));
    let kept=false; document.addEventListener('pointerdown', ()=>{
      if (kept) return; kept=true;
      try{ const g=master; const o=AC.createOscillator(); o.type='sine'; o.frequency.value=25; const gg=AC.createGain(); gg.gain.value=0.00001; o.connect(gg); gg.connect(g); o.start(); setTimeout(()=>{ try{o.disconnect(); gg.disconnect();}catch(_){ } }, 600); }catch(_){}
    }, {once:true,capture:true});
    window.addEventListener('kobllux:audio:resume', resume);
  })();

  // Wavetable
  const PW=(function(){ const n=2048, mk=(fn)=>{ const re=new Float32Array(n), im=new Float32Array(n); for(let k=1;k<16;k++){ re[k]=fn(k);} return AC.createPeriodicWave(re, im, {disableNormalization:true}); }; return { morphA: mk(k=> (k===1?1:0)), morphB: mk(k=> 1/k) }; })();
  const ROOTS={ atlas:196, nova:220, vitalis:247, pulse:262, artemis:294, serena:330, kaos:349, genus:370, lumine:392, rhea:415, solus:440, aion:494 };
  function toFreq(baseHz, step=0, mode='432'){ let f=baseHz*Math.pow(2, step/12); if(mode==='432') f*= (432/440); return f; }
  function makeSource(type,f){ if(type==='noise'){ const node=AC.createScriptProcessor(512,1,1); node.onaudioprocess=e=>{ const ch=e.outputBuffer.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*0.16; }; return { node, set:()=>{}, stop:()=>{try{node.disconnect()}catch(_){}}}; } const o=AC.createOscillator(); if(type==='morph'){ o.setPeriodicWave(PW.morphA);} else { o.type=type;} o.frequency.value=f; return { node:o, set:(nf)=>o.frequency.setTargetAtTime(nf, AC.currentTime, 0.02), stop:()=>{ try{o.stop()}catch(_){ } try{o.disconnect()}catch(_){ } } }; }
  function env(a=0.02,d=0.75,s=0.40,r=0.95){ const g=AC.createGain(); const t=AC.currentTime; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(1,t+a); g.gain.exponentialRampToValueAtTime(s,t+a+d); g.release=()=>{ const tt=AC.currentTime; g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(g.gain.value||0.0001, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt+r); }; return g; }

  // State
  const State={ variant:LS.get('audio.variant', DEFAULTS.variant), pack:LS.get('audio.pack', DEFAULTS.pack), scale:LS.get('audio.scale', DEFAULTS.scaleMode), master:LS.get('audio.master', DEFAULTS.master), pattern:PATTERNS[MAP.phases['Isca']]||PATTERNS.major_penta };

  // Busses
  let busBase=null, busBeat=null, busGlint=null, shaper=null, preDrive=null, dly=null, dlyIn=null, dlyOut=null, dlyFb=null;
  function createBusses(v){
    try{[busBase, busBeat, busGlint, shaper, preDrive, dly, dlyIn, dlyOut, dlyFb].forEach(x=>x&&x.disconnect&&x.disconnect());}catch(_){}
    busBase=AC.createGain(); busBase.gain.value=v.baseGain; busBase.connect(master);
    busBeat=AC.createGain(); busBeat.gain.value=v.beatGain;
    if(v.shaper){ shaper=AC.createWaveShaper(); const n=1024,c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i*2/n-1; c[i]=Math.tanh((v.drive||1.8)*x);} shaper.curve=c; preDrive=AC.createGain(); preDrive.gain.value=1.0; preDrive.connect(shaper); shaper.connect(busBeat); }
    busBeat.connect(master);
    if(v.delay){ dly=AC.createDelay(1.0); dly.delayTime.value=v.dlyT||0.28; dlyFb=AC.createGain(); dlyFb.gain.value=v.dlyFb||0.24; dly.connect(dlyFb); dlyFb.connect(dly); dlyOut=AC.createGain(); dly.connect(dlyOut); dlyOut.connect(v.shaper? shaper: busBeat); dlyIn=AC.createGain(); }
    busGlint=AC.createGain(); busGlint.gain.value=0.05; busGlint.connect(master);
  }

  // Engines
  let seed=Math.floor(Math.random()*1e9); function rnd(){ let x=Math.sin(seed++)*10000; return x-Math.floor(x); }
  let BASE=null;
  function makeBase({wave='morph', base=220, step=0}){ const src=makeSource(wave, toFreq(base, step, State.scale)); const e=env(); const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=800; f.Q.value=0.8; src.node.connect(f); f.connect(e); e.connect(busBase); if(src.node.start) src.node.start(); let alive=true; (function loop(){ if(!alive) return; const drift=(rnd()-0.5)*0.10; src.set(toFreq(base, step+drift, State.scale)); const cf=650+Math.abs(rnd())*650; f.frequency.setTargetAtTime(cf, AC.currentTime, 0.7); setTimeout(loop, 1200 + Math.floor(rnd()*900)); })(); return { stop(){ alive=false; try{src.stop()}catch(_){ } try{e.release()}catch(_){ } setTimeout(()=>{ try{f.disconnect()}catch(_){ } }, 600); } }; }

  const RHY=(function(){ let v=VARIANTS[State.variant]; const kGain=AC.createGain(); kGain.gain.value=1.0; const cGain=AC.createGain(); cGain.gain.value=1.0;
    function entry(){ return v.shaper? preDrive : busBeat; }
    function wire(){ try{ kGain.disconnect(); cGain.disconnect(); }catch(_){ } kGain.connect(entry()); if(v.delay && dly && dlyIn){ cGain.connect(dlyIn); dlyIn.connect(dly); } else { cGain.connect(entry()); } }
    function refreshParams(){ v=VARIANTS[State.variant]; wire(); }
    function thump(f){ const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(f, AC.currentTime); const g=AC.createGain(); g.gain.setValueAtTime(0.0001, AC.currentTime); const t0=AC.currentTime; g.gain.exponentialRampToValueAtTime(0.75, t0+v.atk); g.gain.exponentialRampToValueAtTime(0.0001, t0+v.dec); o.connect(g); g.connect(kGain); o.start(); setTimeout(()=>{ try{o.stop();o.disconnect();g.disconnect();}catch(_ ){} }, Math.ceil(1000*v.dec+30)); }
    function click(){ if(v.clickGain<=0) return; const n=AC.createScriptProcessor(256,1,1); n.onaudioprocess=e=>{ const ch=e.outputBuffer.getChannelData(0); for(let i=0;i<ch.length;i++){ const t=i/ch.length; ch[i]=(Math.random()*2-1) * (v.airy?0.9:0.6) * (1-t); } }; const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=v.clickHP; const g=AC.createGain(); g.gain.value=v.clickGain; n.connect(f); f.connect(g); if(v.delay && dlyIn){ g.connect(dlyIn); } else { g.connect(cGain); } const t=AC.currentTime; g.gain.setValueAtTime(v.clickGain,t); g.gain.exponentialRampToValueAtTime(0.0001, t+v.clickDec); setTimeout(()=>{ try{n.disconnect(); f.disconnect(); g.disconnect();}catch(_ ){} }, Math.ceil(1000*v.clickDec+40)); }
    function sidechain(){ try{ busBase.gain.cancelScheduledValues(AC.currentTime); busBase.gain.setTargetAtTime(VARIANTS[State.variant].baseGain*(1-VARIANTS[State.variant].scDepth), AC.currentTime, 0.015); busBase.gain.setTargetAtTime(VARIANTS[State.variant].baseGain, AC.currentTime+VARIANTS[State.variant].scRel, 0.12); }catch(_){ } }
    return { refreshParams, pulse(accent=0){ const vv=VARIANTS[State.variant]; const f=vv.kickF+14*accent; thump(f); if(vv.clickGain>0) click(); sidechain(); },
      phase(name){ const vv=VARIANTS[State.variant]; const map={ "Isca": vv.beatGain*0.90, "Progresso": vv.beatGain*1.00, "Tensão": vv.beatGain*1.10, "Liberação": vv.beatGain*0.95 }; const vGain=map[name]!=null?map[name]:vv.beatGain; try{ busBeat.gain.setTargetAtTime(vGain, AC.currentTime, 0.2); }catch(_){ } const patName=MAP.phases[name]; if(patName && PATTERNS[patName]) State.pattern=PATTERNS[patName]; updatePanelScale(); } };
  })();

  function glint(base=220){ const pat=State.pattern||PATTERNS.major_penta; const step=pat[Math.floor(Math.random()*pat.length)] + (Math.random()<0.2?12:0); const f=toFreq(base, step, State.scale);
    const o=AC.createOscillator(); o.type='triangle'; o.frequency.value=f; const g=AC.createGain(); g.gain.value=0.0001; const hp=AC.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=1200; o.connect(hp); hp.connect(g); g.connect(busGlint);
    const t=AC.currentTime; g.gain.setValueAtTime(0.02, t); g.gain.exponentialRampToValueAtTime(0.0001, t+0.28); o.start(); setTimeout(()=>{ try{o.stop(); o.disconnect(); hp.disconnect(); g.disconnect();}catch(_){ } }, 360);
  }

  const WNAME=(n)=> (PACKS[State.pack][n]||'morph'); const ROOT=(n)=> (ROOTS[n]||220);
  let cur={ A:null, names:null };
  function stopAll(){ if(cur.A){ try{cur.A.stop()}catch(_ ){} } cur.A=null; cur.names=null; }
  function startPair(A,B){ stopAll(); cur.A = makeBase({ wave:WNAME(A), base:ROOT(A), step:0 }); cur.names=[A,B]; updatePanelPair(A,B); }

  // ==== LEDSTRIP (clean patch) ====
  function patchLED(){ const LED = window.LEDSTRIP || (window.LEDSTRIP={}); 
    // Zera flags antigas de áudio se houverem
    delete LED.__audioPatched; delete LED.__audioPatchedCtrl;
    // Encadeia mantendo o comportamento original
    const _hr=LED.pulseHR?LED.pulseHR.bind(LED):null; 
    LED.pulseHR=function(...args){ _hr && _hr(...args); RHY.pulse(0.65); glint(ROOT(cur?.names?.[0]||'nova')); };
    const _eng=LED.pulseENG?LED.pulseENG.bind(LED):null; 
    LED.pulseENG=function(...args){ _eng && _eng(...args); RHY.pulse(VARIANTS[State.variant].organic?0.45:0.30); glint(ROOT(cur?.names?.[1]||'lumine')); };
    const _ph =LED.setLoopPhase?LED.setLoopPhase.bind(LED):null; 
    LED.setLoopPhase=function(name){ _ph && _ph(name); RHY.phase(name); };
    const _setAB=LED.setArchetypes?LED.setArchetypes.bind(LED):null; 
    LED.setArchetypes=function(a,b){ _setAB && _setAB(a,b); if (!cur.names || cur.names.join('+') !== (a+'+'+b)) startPair(String(a).toLowerCase(), String(b).toLowerCase()); };
  }
  patchLED(); setInterval(patchLED, 1200);

  // ==== FUSÃO ====
  window.addEventListener('dual:fusion-change', async (ev)=>{ try{ if (AC.state==='suspended') await AC.resume(); }catch(_ ){}; const { enabled, a, b } = ev.detail || {}; if (!enabled){ stopAll(); return; } if (a && b) startPair(a,b); });

  // ==== ACTION → escala dinâmica ====
  (function busScale(){ const Bus=window.InfodoseBus; if(!Bus||!Bus.on) return; try{ Bus.on('ACTION', (evt)=>{ const r=(evt.route||'').toLowerCase();
      if (r.includes('home') || r.includes('apps')) State.pattern = PATTERNS[MAP.actions.home_apps] || PATTERNS.major_penta;
      else if (r.includes('chat') || r.includes('brain')) State.pattern = PATTERNS[MAP.actions.chat_brain] || PATTERNS.dorian;
      else if (r.includes('stack') || r.includes('nav')) State.pattern = PATTERNS[MAP.actions.stack_nav] || PATTERNS.aeolian;
      updatePanelScale(); }); }catch(_){}
  })();

  // ==== PAINEL ====
  function mkBtn(){ const btn=document.createElement('button'); btn.id='btn-audio-panel'; btn.className='btn-audio-panel'; btn.innerHTML='<span class="dot"></span><span class="label">Áudio</span>'; btn.addEventListener('click', togglePanel); return btn; }
  function placeBtn(btn){ const header=document.querySelector('header,.topbar,#header') || document.body; header.appendChild(btn); }
  function styles(){ const css=document.createElement('style'); css.textContent=`
      .btn-audio-panel { position: relative; display:flex; align-items:center; gap:.5rem; padding:.35rem .65rem; border:1px solid rgba(255,255,255,.18); border-radius:10px;
        background: linear-gradient(90deg,var(--archA,#59f),var(--archB,#f59)); color:#fff; font-weight:600; letter-spacing:.3px; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,.15); }
      .btn-audio-panel .dot{ width:8px; height:8px; border-radius:50%; background:#fff; position:relative; }
      .btn-audio-panel .dot::after{ content:''; position:absolute; left:-6px; top:-6px; width:20px; height:20px; border-radius:50%; border:2px solid rgba(255,255,255,.45); animation: ping 1.8s infinite; }
      @keyframes ping { 0%{ transform: scale(.6); opacity:.9 } 80%{ transform: scale(1.6); opacity:0 } 100%{ opacity:0 } }
      .audio-panel { position:fixed; right:16px; bottom:16px; width:360px; background:rgba(18,18,30,.92); color:#fff; border:1px solid rgba(255,255,255,.18); border-radius:12px; backdrop-filter: blur(10px); box-shadow:0 10px 30px rgba(0,0,0,.35); display:none; z-index:9999; }
      .audio-panel.show{ display:block; }
      .audio-panel header{ padding:.6rem .8rem; font-weight:700; border-bottom:1px solid rgba(255,255,255,.12); display:flex; justify-content:space-between; align-items:center;}
      .audio-panel .body{ padding:.6rem .8rem; font-size:.9rem; line-height:1.25rem; }
      .audio-panel .row{ display:flex; gap:.5rem; align-items:center; margin:.35rem 0; }
      .audio-panel .row label{ width:110px; opacity:.9; }
      .audio-panel select, .audio-panel input[type=range]{ flex:1; }
      .audio-panel .kv{ display:flex; justify-content:space-between; margin:.25rem 0; opacity:.9; }
      .audio-panel small{ opacity:.7; }
      .chip{ display:inline-flex; align-items:center; gap:.35rem; padding:.15rem .5rem; border-radius:10px; background:rgba(255,255,255,.08); font-size:.78rem; }
      #ibSLine, #ledstrip-78k { pointer-events: auto !important; cursor: pointer; }
      #ledstrip-78k .lane { pointer-events: none !important; }
    `; document.head.appendChild(css); }
  function panelEl(){ let el=document.getElementById('audioPanel'); if(!el){ el=document.createElement('div'); el.id='audioPanel'; el.className='audio-panel';
      el.innerHTML = `<header>Áudio · Painel <button id="ap-close" title="Fechar" style="background:transparent;border:0;color:#fff;font-weight:700;font-size:1rem;cursor:pointer;">×</button></header>
        <div class="body">
          <div class="kv"><span>Pair</span><b id="ap-pair">—</b></div>
          <div class="row"><label>Variante</label><select id="ap-variant"></select></div>
          <div class="row"><label>Pack</label><select id="ap-pack"></select></div>
          <div class="row"><label>Master</label><input id="ap-master" type="range" min="0" max="0.08" step="0.001"><span class="chip"><span id="ap-master-v"></span></span></div>
          <div class="row"><label>Escala</label>
            <select id="ap-scale">
              <option value="432">432</option><option value="equal">equal</option><option value="just">just</option><option value="pythag">pythag</option>
            </select>
          </div>
          <div style="margin:.6rem 0 .2rem;opacity:.9">Padrões por <b>Fase</b></div>
          <div class="row"><label>Isca</label><select id="ap-ph-isc"></select></div>
          <div class="row"><label>Progresso</label><select id="ap-ph-prog"></select></div>
          <div class="row"><label>Tensão</label><select id="ap-ph-ten"></select></div>
          <div class="row"><label>Liberação</label><select id="ap-ph-lib"></select></div>
          <div style="margin:.6rem 0 .2rem;opacity:.9">Padrões por <b>Ação/Route</b></div>
          <div class="row"><label>Home/Apps</label><select id="ap-ac-home"></select></div>
          <div class="row"><label>Chat/Brain</label><select id="ap-ac-chat"></select></div>
          <div class="row"><label>Stack/Nav</label><select id="ap-ac-stack"></select></div>
          <div class="row" style="justify-content:flex-end"><button id="ap-reset" class="chip" title="Resetar para padrão">Reset</button></div>
          <small>OBS: volume com cap, integra LEDSTRIP/Bus, e respeita PWA.</small>
        </div>`; document.body.appendChild(el); el.querySelector('#ap-close').addEventListener('click', togglePanel); } return el; }
  function togglePanel(){ panelEl().classList.toggle('show'); }
  styles(); const btn=mkBtn(); placeBtn(btn); const strip=document.getElementById('ledstrip-78k'); if (strip) strip.addEventListener('click', togglePanel); const sline=document.getElementById('ibSLine'); if (sline) sline.addEventListener('click', togglePanel);

  function fillSelect(id, options, current){ const s=document.getElementById(id); s.innerHTML=''; options.forEach(o=>{ const opt=document.createElement('option'); opt.value=o; opt.textContent=o; if(o===current) opt.selected=true; s.appendChild(opt); }); return s; }
  function updatePanelPair(a,b){ const el=document.getElementById('ap-pair'); if (el) el.textContent=(a&&b)? (a+' + '+b):'—'; }
  function updatePanelScale(){ const el=document.getElementById('ap-scale'); if (el) el.value = State.scale; }
  function refreshPanelValues(){ const sm=document.getElementById('ap-master'); if (sm){ sm.value = Math.min(State.master, CAP_MASTER); } const smv=document.getElementById('ap-master-v'); if (smv) smv.textContent=(Math.min(State.master, CAP_MASTER)).toFixed(3);
    const selVar=document.getElementById('ap-variant'); if (selVar) selVar.value=State.variant; const selPack=document.getElementById('ap-pack'); if (selPack) selPack.value=State.pack; updatePanelScale();
    const keys=Object.keys(PATTERNS); fillSelect('ap-ph-isc', keys, MAP.phases['Isca']); fillSelect('ap-ph-prog', keys, MAP.phases['Progresso']); fillSelect('ap-ph-ten', keys, MAP.phases['Tensão']); fillSelect('ap-ph-lib', keys, MAP.phases['Liberação']); fillSelect('ap-ac-home', keys, MAP.actions['home_apps']); fillSelect('ap-ac-chat', keys, MAP.actions['chat_brain']); fillSelect('ap-ac-stack', keys, MAP.actions['stack_nav']); }

  function bootPanel(){
    fillSelect('ap-variant', Object.keys(VARIANTS), State.variant).addEventListener('change', (e)=>{ State.variant=e.target.value; LS.set('audio.variant', State.variant); applyVariant(); RHY.refreshParams(); });
    fillSelect('ap-pack', Object.keys(PACKS), State.pack).addEventListener('change', (e)=>{ State.pack=e.target.value; LS.set('audio.pack', State.pack); if (cur.names){ const [a,b]=cur.names; startPair(a,b);} });
    document.getElementById('ap-master').addEventListener('input', (e)=>{ const v=Math.min(parseFloat(e.target.value||DEFAULTS.master), CAP_MASTER); State.master=v; LS.set('audio.master', v); try{ master.gain.setTargetAtTime(v, AC.currentTime, 0.15);}catch(_){ } const smv=document.getElementById('ap-master-v'); if (smv) smv.textContent=v.toFixed(3); });
    document.getElementById('ap-scale').addEventListener('change', (e)=>{ State.scale=e.target.value; LS.set('audio.scale', State.scale); if (cur.names){ const [a,b]=cur.names; startPair(a,b);} });
    document.getElementById('ap-ph-isc').addEventListener('change', e=>{ MAP.phases['Isca']=e.target.value; LS.set('audio.scale.map.phases', MAP.phases); });
    document.getElementById('ap-ph-prog').addEventListener('change', e=>{ MAP.phases['Progresso']=e.target.value; LS.set('audio.scale.map.phases', MAP.phases); });
    document.getElementById('ap-ph-ten').addEventListener('change', e=>{ MAP.phases['Tensão']=e.target.value; LS.set('audio.scale.map.phases', MAP.phases); });
    document.getElementById('ap-ph-lib').addEventListener('change', e=>{ MAP.phases['Liberação']=e.target.value; LS.set('audio.scale.map.phases', MAP.phases); });
    document.getElementById('ap-ac-home').addEventListener('change', e=>{ MAP.actions['home_apps']=e.target.value; LS.set('audio.scale.map.actions', MAP.actions); });
    document.getElementById('ap-ac-chat').addEventListener('change', e=>{ MAP.actions['chat_brain']=e.target.value; LS.set('audio.scale.map.actions', MAP.actions); });
    document.getElementById('ap-ac-stack').addEventListener('change', e=>{ MAP.actions['stack_nav']=e.target.value; LS.set('audio.scale.map.actions', MAP.actions); });
    document.getElementById('ap-reset').addEventListener('click', ()=>{ State.variant='UltraLow Seco'; LS.set('audio.variant', State.variant);
      State.pack='Lux'; LS.set('audio.pack', State.pack); State.master=DEFAULTS.master; LS.set('audio.master', State.master); State.scale=DEFAULTS.scaleMode; LS.set('audio.scale', State.scale);
      MAP.phases={ Isca:'major_penta', Progresso:'dorian', Tensão:'phrygian', Liberação:'aeolian' }; MAP.actions={ home_apps:'major_penta', chat_brain:'dorian', stack_nav:'aeolian' };
      LS.set('audio.scale.map.phases', MAP.phases); LS.set('audio.scale.map.actions', MAP.actions);
      applyVariant(); RHY.refreshParams(); refreshPanelValues(); if(cur.names){ const [a,b]=cur.names; startPair(a,b);} });
    refreshPanelValues();
  }

  function applyVariant(){ const v=VARIANTS[State.variant]; const target=Math.min(State.master ?? v.master, CAP_MASTER); try{ master.gain.setTargetAtTime(target, AC.currentTime, 0.15);}catch(_){ } createBusses(v); }

  // Inicializa
  document.addEventListener('DOMContentLoaded', ()=>{ applyVariant(); bootPanel(); });

  // === FUSION BAR COLOR: non-fusion A→A ===
  function archName(){
    try{
      if (typeof currentArch === 'function') return String(currentArch()).toLowerCase();
      const sel = document.getElementById('arch-select');
      if (sel) return String(sel.value||'atlas').replace(/.*\//,'').replace(/\.html$/i,'').toLowerCase();
    }catch(_){}
    return 'atlas';
  }
  function archColor(name){
    try{
      const ACOL = window.ARCH_COLORS || {};
      return ACOL[name] || getComputedStyle(document.documentElement).getPropertyValue('--archA') || '#409eff';
    }catch(_){ return '#409eff'; }
  }
  function colorFusionSingle(){
    const bar = document.getElementById('ledstrip-fusion'); if (!bar) return;
    const nm = archName(); const C = archColor(nm);
    bar.style.background = `linear-gradient(90deg, ${C}, ${C})`;
    bar.style.opacity = '0.72';
  }
  window.addEventListener('dual:fusion-change', (ev)=>{
    const d = ev.detail || {}; const bar = document.getElementById('ledstrip-fusion'); if (!bar) return;
    if (d.enabled && d.a && d.b){
      const A = archColor(String(d.a).toLowerCase());
      const B = archColor(String(d.b).toLowerCase());
      bar.style.background = `linear-gradient(90deg, ${A}, ${B})`;
    } else {
      colorFusionSingle();
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', colorFusionSingle);
  else colorFusionSingle();
})();
