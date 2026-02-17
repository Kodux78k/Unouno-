
(function(){
  // --- Bus v2 (safe install) ---
  window.InfodoseBus = window.InfodoseBus || (function(){
    const L = JSON.parse(localStorage.getItem('infodose:log')||'[]');
    const H = {}; const last = new Map(); const MAX=400, THROTTLE_MS=60;
    const SCHEMA = {
      'ARCH_PULSE': { arch:'string', act:'string*' },
      'ACTION'    : { arch:'string*', act:'string*', route:'string*' },
      'HEAT_MARK' : { tag :'string*' }
    };
    const sane=(type,payload)=>{ const sch=SCHEMA[type]; if(!sch) return true;
      for(const k in sch){ const need=sch[k], opt=need.endsWith('*'), typ=opt?need.slice(0,-1):need;
        const v=payload[k]; if(v==null){ if(!opt) return false; } else if(typeof v!==typ) return false; } return true; };
    const push=evt=>{ L.unshift(evt); if(L.length>MAX) L.length=MAX;
      localStorage.setItem('infodose:log', JSON.stringify(L)); };
    return {
      emit(type, payload={}){
        const now=Date.now(), lastTs=last.get(type)||0;
        if (now-lastTs < THROTTLE_MS) return;
        if (!sane(type,payload)) return;
        last.set(type,now);
        const evt={ type, ts:now, ...payload }; push(evt);
        (H[type]||[]).forEach(fn=>{ try{ fn(evt) }catch(e){} });
        return evt;
      },
      on(type, fn){ (H[type]||(H[type]=[])).push(fn); return ()=> H[type]=(H[type]||[]).filter(f=>f!==fn); },
      dump(){ return L.slice(); }
    };
  })();

  // --- Paletas por arquétipo para a S-Line ---
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
  const ARCH_EL = { nova:'madeira', genus:'madeira', lumine:'metal', solus:'metal',
    atlas:'terra', rhea:'terra', kaos:'fogo', artemis:'fogo', serena:'água', aion:'água', pulse:'ar', vitalis:'ar' };

  const SLINE = document.getElementById('ibSLine');
  function slineVars(arch){
    const C = SLC[arch] || {};
    const st = document.documentElement.style;
    st.setProperty('--ib-a', C.a || '#00c5ff');
    st.setProperty('--ib-b', C.b || '#ff52e5');
    st.setProperty('--ib-ring', C.ring || '#00d9ff');
    st.setProperty('--ib-glow', C.glow || 'rgba(0,197,255,.45)');
    if (SLINE){ SLINE.classList.add('flash'); setTimeout(()=>SLINE.classList.remove('flash'), 220); }
  }

  // --- WebAudio beeps simples + power-chord para METAL ---
  let _ac;
  function ac(){ return _ac || (_ac = new (window.AudioContext||window.webkitAudioContext)()); }
  function beep(freq=432, ms=160){
    try{ const ctx=ac(), o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.22,ctx.currentTime+.02);
      o.start(); o.stop(ctx.currentTime + ms/1000);
    }catch(e){}
  }
  function powerChord(freq=220){
    try{
      const ctx=ac(); [1,1.5,2].forEach((m,i)=>{
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type= i? 'square':'sawtooth'; o.frequency.value=freq*m; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.0001,ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(.12/(i+1),ctx.currentTime+.01);
        g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.26);
        o.start(); o.stop(ctx.currentTime+.28);
      });
    }catch(e){}
  }

  // --- Hook nas trocas do arquétipo do HUB ---
  function currentArchBase(){
    const sel = document.getElementById('arch-select');
    if(!sel || sel.selectedIndex<0) return '';
    return (sel.options[sel.selectedIndex].value||'').replace(/.*\\//,'').replace(/\\.html$/i,'');
  }
  function fireArch(arch, act){
    slineVars(arch);
    const el = ARCH_EL[arch]; const freq = (arch==='nova'||arch==='vitalis')?528 : (arch==='atlas'?144 : (arch==='serena'||arch==='genus'?396 : 432));
    if (el==='metal') powerChord(freq); else beep(freq);
    window.InfodoseBus.emit('ARCH_PULSE', { arch, act: act||'switch' });
  }

  function bindHooks(){
    const sel  = document.getElementById('arch-select');
    const prev = document.getElementById('arch-prev');
    const next = document.getElementById('arch-next');
    sel && sel.addEventListener('change', ()=> setTimeout(()=> fireArch(currentArchBase(),'select'), 0), {passive:true});
    prev && prev.addEventListener('click', ()=> setTimeout(()=> fireArch(currentArchBase(),'prev'), 160), {passive:true});
    next && next.addEventListener('click', ()=> setTimeout(()=> fireArch(currentArchBase(),'next'), 160), {passive:true});
    // disparo inicial
    const start = currentArchBase(); if (start) setTimeout(()=> fireArch(start,'boot'), 120);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', bindHooks); else bindHooks();
})();
