
(function(){
  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));

  function sayLS(text){
    try{
      if(typeof speakWithActiveArch === 'function'){
        speakWithActiveArch(text);
      }else if(window.speechSynthesis){
        const u = new SpeechSynthesisUtterance(text);
        const vs = speechSynthesis.getVoices();
        const v = vs.find(v=>v.lang && (v.lang.startsWith('pt')||v.lang.startsWith('en'))) || vs[0];
        if(v) u.voice = v;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    }catch(e){}
  }

  // Patch DualLS open/close/toggle to speak
  function patchDualLS(){
    if(!window.DualLS) return;
    const origOpen = window.DualLS.open?.bind(window.DualLS);
    const origClose = window.DualLS.close?.bind(window.DualLS);
    const origToggle = window.DualLS.toggle?.bind(window.DualLS);

    if(origOpen){
      window.DualLS.open = function(){
        const r = origOpen?.();
        sayLS('Local Storage aberto');
        return r;
      };
    }
    if(origClose){
      window.DualLS.close = function(){
        sayLS('Local Storage fechado');
        return origClose?.();
      };
    }
    if(origToggle){
      window.DualLS.toggle = function(){
        const p = $('#lsx-panel');
        const willOpen = !(p && p.style.display==='block');
        const r = origToggle?.();
        sayLS(willOpen ? 'Local Storage aberto' : 'Local Storage fechado');
        return r;
      };
    }
  }

  // Add listeners to LSX panel controls (namespaced UI)
  function wireLSX(){
    const map = [
      ['#lsx-add',        ()=>{
        const k = ($('#lsx-new-k')?.value || '').trim();
        sayLS(k ? `Chave ${k} salva no Local Storage` : 'Chave salva no Local Storage');
      }],
      ['#lsx-export',     ()=> sayLS('Backup exportado')],
      ['#lsx-import-btn', ()=> sayLS('Importar backup. Selecione o arquivo')],
      ['#lsx-clear-all',  ()=> sayLS('Limpar Local Storage. Confirme sua escolha')],
      ['#lsx-clear-idb',  ()=> sayLS('Limpar IndexedDB. Confirme sua escolha')],
      ['#lsx-refresh',    ()=> sayLS('Atualizando visão do Local Storage')],
      ['#lsx-hide',       ()=> sayLS('Fechando painel do Local Storage')],
    ];
    map.forEach(([sel,fn])=>{
      const el = $(sel);
      if(el) el.addEventListener('click', fn, {passive:true});
    });

    // Reflect row-level actions via logger hook (save/delete etc.)
    if(window.DualLSLogger){
      const origPush = window.DualLSLogger.push?.bind(window.DualLSLogger);
      if(origPush){
        window.DualLSLogger.push = function(msg){
          try{
            const m = String(msg||'').toLowerCase();
            if(m.includes('ls: salvou'))      sayLS('Chave salva');
            if(m.includes('ls: apagou'))      sayLS('Chave apagada');
            if(m.includes('limpou tudo'))     sayLS('Local Storage limpo');
            if(m.includes('importou backup')) sayLS('Backup importado com sucesso');
            if(m.includes('exportou backup')) sayLS('Backup exportado com sucesso');
          }catch(e){}
          return origPush(msg);
        };
      }
    }
  }

  // Add listeners to legacy LS panel controls (if present)
  function wireLegacyLS(){
    const map = [
      ['#ls-add',        ()=>{
        const k = ($('#ls-new-k')?.value || '').trim();
        sayLS(k ? `Chave ${k} salva no Local Storage` : 'Chave salva no Local Storage');
      }],
      ['#ls-export',     ()=> sayLS('Backup exportado')],
      ['#ls-import-btn', ()=> sayLS('Importar backup. Selecione o arquivo')],
      ['#ls-clear-all',  ()=> sayLS('Limpar Local Storage. Confirme sua escolha')],
      ['#ls-clear-idb',  ()=> sayLS('Limpar IndexedDB. Confirme sua escolha')],
      ['#ls-refresh',    ()=> sayLS('Atualizando visão do Local Storage')],
      ['#ls-hide',       ()=> sayLS('Fechando painel do Local Storage')],
      ['#btnLS',         ()=> sayLS('Abrindo painel do Local Storage')],
    ];
    map.forEach(([sel,fn])=>{
      const el = $(sel);
      if(el) el.addEventListener('click', fn, {passive:true});
    });
  }

  // Theme & background announcements
  function wireThemeBG(){
    const themeSel = $('#themeSelect');
    if(themeSel){
      themeSel.addEventListener('change', ()=>{
        const v = themeSel.value;
        const label = ({default:'padrão', medium:'cinza médio', custom:'personalizado'}[v]||v);
        sayLS(`Tema ${label} aplicado`);
      }, {passive:true});
    }
    const bgInput = $('#bgUpload');
    if(bgInput){
      bgInput.addEventListener('change', ()=>{
        sayLS('Fundo personalizado salvo');
      }, {passive:true});
    }
  }

  // CSS custom announcements
  function wireCSS(){
    const apply = $('#applyCSS');
    const clear = $('#clearCSS');
    const down  = $('#downloadCSS');
    if(apply)  apply.addEventListener('click', ()=> sayLS('CSS aplicado'), {passive:true});
    if(clear)  clear.addEventListener('click', ()=> sayLS('CSS removido'), {passive:true});
    if(down)   down .addEventListener('click', ()=> sayLS('Baixando CSS'), {passive:true});
  }

  // Brain basic saves (name, SK, perf/voice)
  function wireBrain(){
    const map = [
      ['#saveName', ()=> sayLS('Nome salvo')],
      ['#saveSK',   ()=> sayLS('Configurações de modelo salvas')],
      ['#btnPerf',  ()=> sayLS('Preferência de performance atualizada')],
      ['#btnVoice', ()=> sayLS('Preferência de voz atualizada')],
    ];
    map.forEach(([sel,fn])=>{
      const el = $(sel);
      if(el) el.addEventListener('click', fn, {passive:true});
    });
  }

  // Speak when LS header "LS" badge is clicked
  function wireHeaderLS(){
    const btn = $('#btnLS');
    if(btn){
      btn.addEventListener('click', ()=>{
        // DualLS.toggle may also speak; this is fallback
        sayLS('Abrindo painel do Local Storage');
      }, {passive:true});
    }
  }

  // Init once DOM is ready
  document.addEventListener('DOMContentLoaded', ()=>{
    patchDualLS();
    wireLSX();
    wireLegacyLS();
    wireThemeBG();
    wireCSS();
    wireBrain();
    wireHeaderLS();
  });
})();
