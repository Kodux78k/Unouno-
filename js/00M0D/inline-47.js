
// 78K · Fusion Ritual (button ✦ Fusionar)
(function(){
  const btn = document.getElementById('btn-fusionar');
  if(!btn || !window.LEDSTRIP) return;
  const fusionBar = document.getElementById('ledstrip-fusion');

  // animate fusion gradient flow + loop advance to Liberação in ~3s
  function fusionRitual(duration=3000){
    try{
      const sel = document.getElementById('arch-select');
      const cur = (sel?.value || 'Atlas').replace(/\.html$/,'');
      const idx = sel ? sel.selectedIndex : 0;
      const nxt = sel ? (sel.options[(idx+1) % sel.options.length].value.replace(/\.html$/,'')) : 'Nova';
      LEDSTRIP.setArchetypes(cur, nxt);
    }catch{}

    // staged loop advancement
    const steps = [
      {t: 0.00, phase:'Isca'},
      {t: 0.33, phase:'Progresso'},
      {t: 0.66, phase:'Tensão'},
      {t: 1.00, phase:'Liberação'}
    ];

    const t0 = performance.now();
    const startPos = 0; const endPos = 100;
    const raf = (now)=>{
      const dt = Math.min(1, (now - t0) / duration);
      // advance loop by milestones
      for(const s of steps){
        if(Math.abs(dt - s.t) < 0.02){ LEDSTRIP.setLoopPhase(s.phase); }
      }
      // background flow animation
      if(fusionBar){
        fusionBar.style.backgroundSize = '200% 100%';
        fusionBar.style.backgroundPosition = (startPos + (endPos-startPos)*dt) + '% 0%';
        fusionBar.style.opacity = String(.62 + .28*Math.sin(dt*Math.PI));
      }
      if(dt < 1){ requestAnimationFrame(raf); }
      else{
        // settle
        if(fusionBar){
          fusionBar.style.backgroundSize = '';
          fusionBar.style.backgroundPosition = '';
          fusionBar.style.opacity = '.72';
        }
      }
    };
    requestAnimationFrame(raf);
  }

  btn.addEventListener('click', ()=>{
    fusionRitual(3000);
    // give some feedback
    try{ LEDSTRIP.pulseENG(); LEDSTRIP.pulseHR(); }catch{}
  });
  // expose for console
  window.LEDSTRIP && (window.LEDSTRIP.fusionRitual = fusionRitual);
})();
