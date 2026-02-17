
(function(){
  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));

  function ensureCompactButton(panelId, actionsId, ids){
    const panel = $(panelId);
    const actions = $(actionsId);
    if(!panel || !actions) return;

    // Create toggle button (once)
    let btn = actions.querySelector('.ls-compact-toggle');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'ls-compact-toggle';
      btn.type = 'button';
      btn.id = ids.toggleId;
      btn.title = 'Alternar modo compacto do painel LS';
      btn.textContent = 'Compactar';
      actions.appendChild(btn);
    }

    // Initial state: compact ON (to liberar espaço)
    if(!panel.classList.contains('ls-compact')){
      panel.classList.add('ls-compact');
    }

    // Toggle logic
    btn.addEventListener('click', ()=>{
      const compact = panel.classList.toggle('ls-compact');
      btn.textContent = compact ? 'Expandir' : 'Compactar';
      // Optional: announce via TTS if available
      try{
        if(typeof speakWithActiveArch === 'function'){
          speakWithActiveArch(compact ? 'Modo compacto ativado' : 'Modo compacto desativado');
        }
      }catch(e){}
      // After toggling, recompute list height
      setTimeout(resizeListArea, 10);
    }, {passive:true});
  }

  function pickListCandidate(root){
    const sels = ['#lsx-list','#ls-list','#ls-keys','.ls-list','.ls-keys','.ls-data'];
    for(const s of sels){
      const el = root.querySelector(s);
      if(el) return el;
    }
    return null;
  }

  function resizeListArea(){
    const panels = ['#lsx-panel','#ls-panel'];
    panels.forEach(pid=>{
      const p = $(pid);
      if(!p) return;
      const actions = p.querySelector('#lsx-actions, #ls-actions, #ls-header, #lsx-header');
      const list = pickListCandidate(p);
      if(!list) return;
      const rect = p.getBoundingClientRect();
      const topY = actions ? actions.getBoundingClientRect().bottom : rect.top;
      const available = Math.max(160, window.innerHeight - topY - 24);
      list.style.maxHeight = available + 'px';
      list.style.overflow = 'auto';
    });
  }

  // Wire up both legacy and namespaced panels
  document.addEventListener('DOMContentLoaded', ()=>{
    ensureCompactButton('#lsx-panel', '#lsx-actions', {toggleId:'lsx-compact-toggle'});
    ensureCompactButton('#ls-panel',  '#ls-actions',  {toggleId:'ls-compact-toggle'});
    resizeListArea();
    window.addEventListener('resize', resizeListArea);
  });
})();
