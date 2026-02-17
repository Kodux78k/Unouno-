
(function(){
  // ---------- Speech de-dup & filter ----------
  const _oldSpeak = (typeof speakWithActiveArch === 'function') ? speakWithActiveArch : null;
  let _lastUtter = { text: '', t: 0 };
  function shouldSpeak(text){
    const now = Date.now();
    // Normalize to lower-case & trim
    const norm = String(text||'').trim().toLowerCase();
    // Drop empty or very short
    if(!norm || norm.length < 2) return false;
    // Drop repeats within 1200ms
    if(norm === (_lastUtter.text||'') and (now - _lastUtter.t) < 1200) return false;
    // If it's about Local Storage panel, prefer "abrindo/fechando" phrasing only.
    if(/local storage/.test(norm)){
      if(/aberto|fechado/.test(norm) && !/abrindo|fechando/.test(norm)) return false;
    }
    _lastUtter = { text: norm, t: now };
    return true;
  }
  window.speakWithActiveArch = function(text){
    try{
      if(!shouldSpeak(text)) return;
      if(_oldSpeak) return _oldSpeak(text);
      // Minimal fallback if original doesn't exist
      if(window.speechSynthesis){
        const u = new SpeechSynthesisUtterance(String(text));
        const vs = speechSynthesis.getVoices();
        const v = vs.find(v=>v.lang && (v.lang.startsWith('pt')||v.lang.startsWith('es'))) || vs[0];
        if(v) u.voice = v;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    }catch(e){}
  };

  // ---------- DualLS patches: say just once ("Abrindo..." / "Fechando...") ----------
  function patchDualLS_A11y(){
    const LSAPI = window.DualLS;
    if(!LSAPI) return;
    const oOpen = LSAPI.open?.bind(LSAPI);
    const oClose = LSAPI.close?.bind(LSAPI);
    const oToggle = LSAPI.toggle?.bind(LSAPI);
    if(oOpen){
      LSAPI.open = function(){
        try{ speakWithActiveArch('Abrindo painel do Local Storage'); }catch(e){}
        return oOpen();
      };
    }
    if(oClose){
      LSAPI.close = function(){
        try{ speakWithActiveArch('Fechando painel do Local Storage'); }catch(e){}
        return oClose();
      };
    }
    if(oToggle){
      LSAPI.toggle = function(){
        const p = document.querySelector('#lsx-panel');
        const willOpen = !(p && p.style.display==='block');
        try{ speakWithActiveArch(willOpen ? 'Abrindo painel do Local Storage' : 'Fechando painel do Local Storage'); }catch(e){}
        return oToggle();
      };
    }
  }

  // ---------- Persist Compact Mode for LS panels ----------
  function persistCompactMode(){
    const KEY = 'ls:compact:on';
    const lsPanel = document.querySelector('#ls-panel');
    const lsxPanel = document.querySelector('#lsx-panel');
    const desired = localStorage.getItem(KEY) === '1';
    [lsPanel, lsxPanel].forEach(p => {
      if(!p) return;
      if(desired) p.classList.add('ls-compact'); else p.classList.remove('ls-compact');
      const btn = p.querySelector('.ls-compact-toggle');
      if(btn && !btn._boundPersist){
        btn._boundPersist = true;
        btn.addEventListener('click', ()=>{
          const on = p.classList.contains('ls-compact');
          localStorage.setItem(KEY, on ? '1' : '0');
        });
      }
    });
  }

  // ---------- PowerAI: unify chat calls & inject Role/System training ----------
  // Reads optional DXT training from localStorage key 'dual.openrouter.training' ({name,data:dataURL})
  async function loadDXTTraining(){
    try{
      const raw = localStorage.getItem('dual.openrouter.training');
      if(!raw) return '';
      const obj = JSON.parse(raw);
      if(!obj || !obj.data) return '';
      const dataUrl = String(obj.data);
      const base64 = dataUrl.split(',')[1] || '';
      if(!base64) return '';
      const bytes = atob(base64);
      // Limit to ~64KB to avoid huge prompts
      if(bytes.length > 64*1024) return bytes.slice(0, 64*1024);
      return bytes;
    }catch(e){ return ''; }
  }

  function activeArchetypePair(){
    // Primary = selected archetype in #arch-select
    let primary = 'Dual';
    try{
      const sel = document.getElementById('arch-select');
      if(sel && sel.value){
        primary = sel.value.replace(/\.html$/i,'').toLowerCase();
      }
    }catch{}
    // Secondary from user preference (array) or fallback
    const pair = JSON.parse(localStorage.getItem('dual.arch.pair')||'[]');
    let secondary = pair.find(x=>x && x.toLowerCase() !== primary) || 'horus';
    // Capitalize
    function cap(s){ s = String(s||'Dual'); return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase(); }
    return [cap(primary), cap(secondary)];
  }

  const oldSend = window.sendAIMessage;
  window.PowerAI = {
    async chat(userContent, sk, model){
      const [archA, archB] = activeArchetypePair();
      const sysIdentity =
        `Você é o Assistente Dual Infodose — codinome "Horus". 
Conectado simultaneamente aos arquétipos ${archA} e ${archB}. 
Fale sempre em português do Brasil, direto e gentil. 
Use o contexto do app (UNO • Brain • Stack • Apps) quando útil.`;

      let training = await loadDXTTraining();
      // Normalize training to text (it may be JSON string)
      if(training && training.trim().startsWith('{')){
        try{
          const j = JSON.parse(training);
          training = (j.system || j.prompt || JSON.stringify(j));
        }catch{}
      }
      const sysTraining = training ? `# Treinamento DXT
${training}` : '';

      const payload = {
        model: model,
        messages: [
          { role: 'system', content: sysIdentity + (sysTraining? '

' + sysTraining : '') },
          { role: 'user', content: String(userContent||'') }
        ],
        max_tokens: 350,
        temperature: 0.7
      };

      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sk}`
        },
        body: JSON.stringify(payload)
      });
      if(!res.ok){
        throw new Error('Erro na API: ' + res.status);
      }
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || '';
      return reply;
    }
  };

  // Override legacy sendAIMessage to call PowerAI
  if(typeof oldSend === 'function'){
    window.sendAIMessage = async function(content, sk, model){
      return await window.PowerAI.chat(content, sk, model);
    };
  }

  // After DOM ready, run patches
  document.addEventListener('DOMContentLoaded', ()=>{
    patchDualLS_A11y();
    persistCompactMode();
    // Re-apply persist on panel (if it was not in the DOM at first render)
    setTimeout(persistCompactMode, 500);
  });
})();
