
// 78K · Dual Strip Controller (pulsating borders + fusion)
(function(){
  // remove old panels
  ['led78k','led78k-micro'].forEach(id=>{ const n=document.getElementById(id); n && n.remove(); });

  const main = document.getElementById('ledstrip-78k');
  const fusion = document.getElementById('ledstrip-fusion');
  if(!main) return;
  const el = {
    eng:  main.querySelector('.lane.eng'),
    hr:   main.querySelector('.lane.hr'),
    loop: main.querySelector('.lane.loop'),
    qa:   main.querySelector('.lane.qa'),
    spark:main.querySelector('.spark')
  };
  const state = { eng:0, hr:0, loopPct:0, qa:false, pos:0 };
  const clamp01 = x => Math.max(0, Math.min(1, x));

  // archetype color map
  const ARCH_COLORS = {
    nova:'#FF52B1', genus:'#52FFB1', lumine:'#B4C8FF', solus:'#DCF0FF',
    atlas:'#409EFF', rhea:'#FFD878', kaos:'#FF4D6D', artemis:'#FF8C3C',
    serena:'#78C8FF', aion:'#64F0FF', pulse:'#00BFFF', vitalis:'#22D392'
  };
  function setArchetypeColors(a,b){
    const A = ARCH_COLORS[(a||'').toLowerCase()] || '#409eff';
    const B = ARCH_COLORS[(b||'').toLowerCase()] || '#ff52b1';
    main.style.setProperty('--archA', A);
    main.style.setProperty('--archB', B);
    fusion && (fusion.style.background = 'linear-gradient(90deg,'+A+','+B+')');
  }

  function render(){
    if(el.eng)  el.eng.style.width  = (clamp01(state.eng/24)*100).toFixed(1) + '%';
    if(el.hr)   el.hr.style.width   = (clamp01(state.hr/24)*100).toFixed(1) + '%';
    if(el.loop) el.loop.style.width = (clamp01(state.loopPct)*100).toFixed(1) + '%';
    if(el.qa) { el.qa.style.width = state.qa ? '100%' : '0%'; el.qa.style.opacity = state.qa ? .35 : 0; }
  }
  // decay + spark
  setInterval(()=>{
    state.eng = Math.max(0, state.eng - 1);
    state.hr  = Math.max(0, state.hr  - 1);
    state.pos = (state.pos+1)%100;
    if(el.spark){
      const p = (state.pos/100)*100;
      el.spark.style.transform = 'translateX(' + p + '%)';
      el.spark.style.opacity = (state.eng+state.hr)>0 ? .8 : .0;
    }
    render();
  }, 900);

  // API
  window.LEDSTRIP = {
    pulseENG(){ state.eng += 2; render(); },
    pulseHR(){  state.hr  += 2; render(); },
    setLoopPhase(name){
      const map = { "Isca": .25, "Progresso": .50, "Tensão": .75, "Liberação": 1.0 };
      state.loopPct = map[name] || 0;
      render();
    },
    setQA(flag){ state.qa = !!flag; render(); },
    setArchetypes(a,b){ setArchetypeColors(a,b); },
    setCompact(flag){ const wrap = main.parentElement; if(!wrap) return; wrap.classList.toggle('compact', !!flag); }
  };

  // auto-wire minimal
  const incENG = ()=>{ try{ LEDSTRIP.pulseENG(); }catch{} };
  const incHR  = ()=>{ try{ LEDSTRIP.pulseHR();  }catch{} };
  document.addEventListener('click', (e)=>{
    const tb = e.target.closest('.tabbar .tab, [data-nav]');
    if(tb){ incENG(); }
  }, true);

  const openAppFn = window.openApp;
  if(typeof openAppFn === 'function'){
    window.openApp = function(a){ incENG(); return openAppFn.apply(this, arguments); };
  }
  const sendUserMessageFn = window.sendUserMessage;
  if(typeof sendUserMessageFn === 'function'){
    window.sendUserMessage = async function(msg){ incENG(); const r = await sendUserMessageFn.apply(this, arguments); return r; };
  }
  const renderAssistantReplyFn = window.renderAssistantReply;
  if(typeof renderAssistantReplyFn === 'function'){
    window.renderAssistantReply = function(raw){ incHR(); return renderAssistantReplyFn.apply(this, arguments); };
  }

  // initial defaults
  try{
    const hasKey = !!(localStorage.getItem('dual.keys.openrouter')||'').trim();
    const hasModel = !!(localStorage.getItem('infodose:model')||localStorage.getItem('dual.openrouter.model')||'').trim();
    LEDSTRIP.setQA(hasKey && hasModel);

    const sel = document.getElementById('arch-select');
    const cur = (sel?.value || 'Atlas').replace(/\.html$/,'');
    const idx = sel ? sel.selectedIndex : 0;
    const nxt = sel ? (sel.options[(idx+1) % sel.options.length].value.replace(/\.html$/,'')) : 'Nova';
    LEDSTRIP.setArchetypes(cur, nxt);
  }catch{}
})();
