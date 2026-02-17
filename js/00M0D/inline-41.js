

/* === UNO CONSOLIDATION PATCH v1 (monolithic-safe) =====================
   - Canonical OpenRouter key/model handling
   - Safe override for sendAIMessage / sendAIMessageCtx
   - Unified applyArchOverlay()
   - Single boot() guard
   ==================================================================== */
(function(){
  if (window.Uno && window.Uno.__consolidated_v1) return;
  window.Uno = window.Uno || {};
  const Uno = window.Uno;
  Uno.__consolidated_v1 = true;

  // ---- Helpers ----
  function LSget(k){ try { return localStorage.getItem(k) || ''; } catch(e){ return ''; } }
  function speak(msg){ try { if (typeof window.speakWithActiveArch === 'function') window.speakWithActiveArch(msg); } catch(e){} }
  function toast(msg){ try { if (typeof window.toast === 'function') window.toast(msg,'ok'); } catch(e){} }
  function warn(msg){ try { if (typeof window.toast === 'function') window.toast(msg,'warn'); } catch(e){} }
  function errt(msg){ try { if (typeof window.toast === 'function') window.toast(msg,'err'); } catch(e){} }
  function feed(type, text){ try { if (typeof window.feedPush === 'function') window.feedPush(type, text); } catch(e){} }
  function showArchMessage(text, type){ try { if (typeof window.showArchMessage === 'function') window.showArchMessage(text, type); } catch(e){} }

  // ---- Canonical OpenRouter config ----
  Uno.getOpenRouter = function(){
    const sk = LSget('dual.keys.openrouter') || LSget('infodose:sk') || '';
    let model = LSget('dual.openrouter.model') || LSget('infodose:model') || 'openrouter/auto';
    return { sk, model };
  };

  Uno.sendChat = async function({messages, model, sk, max_tokens=600, temperature=0.7}){
    if (!sk){
      showArchMessage('Defina sua chave no Brain (OpenRouter).', 'warn');
      feed('status', 'OpenRouter: chave ausente.');
      throw new Error('OpenRouter key missing');
    }
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const payload = { model, messages, max_tokens, temperature };
    const res = await fetch(url, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${sk}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok){
      const body = await res.text().catch(()=>'');
      const msg = `OpenRouter HTTP ${res.status} ${body ? '• '+body.slice(0,160) : ''}`;
      feed('status', 'Erro: ' + msg);
      throw new Error(msg);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  };

  // ---- Override sendAIMessage / sendAIMessageCtx (final authority) ----
  const prevCtx = window.sendAIMessageCtx;
  const prev    = window.sendAIMessage;

  window.sendAIMessageCtx = async function({ userContent, sk, model, system, temperature, max_tokens } = {}){
    try{
      const conf = Uno.getOpenRouter();
      const _sk = sk || conf.sk;
      const _model = model || conf.model || 'openrouter/auto';
      const sysMsg = system || 'Você é um assistente em português. Seja claro e objetivo.';
      const messages = [
        { role:'system', content: sysMsg },
        { role:'user', content: String(userContent||'').trim() }
      ];
      const reply = await Uno.sendChat({ messages, model:_model, sk:_sk, max_tokens: max_tokens??600, temperature: temperature??0.7 });
      return reply;
    }catch(e){
      errt('Falha sendAIMessageCtx: ' + e.message);
      throw e;
    }
  };

  window.sendAIMessage = async function(content, sk, model){
    return window.sendAIMessageCtx({ userContent: content, sk, model });
  };

  // ---- Overlay unify ----
  const ARCH_OVERLAYS = {
    atlas:  'rgba(64,158,255,0.22)',
    nova:   'rgba(255,82,177,0.22)',
    vitalis:'rgba(87,207,112,0.22)',
    pulse:  'rgba(0,191,255,0.22)',
    artemis:'rgba(255,195,0,0.22)',
    serena: 'rgba(186,130,219,0.22)',
    kaos:   'rgba(255,77,109,0.22)',
    genus:  'rgba(87,207,112,0.22)',
    lumine: 'rgba(255,213,79,0.22)',
    solus:  'rgba(186,130,219,0.22)',
    rhea:   'rgba(0,209,178,0.22)',
    aion:   'rgba(255,159,67,0.22)',
    default:'rgba(0,0,0,0)'
  };
  window.applyArchOverlay = function(name){
    try{
      const on = (localStorage.getItem('arch:overlayOn') === 'true') || (localStorage.getItem('arch:overlayOn') === '1');
      const key = String(name||'').toLowerCase();
      const color = on ? (ARCH_OVERLAYS[key] || ARCH_OVERLAYS.default) : 'rgba(0,0,0,0)';
      document.documentElement.style.setProperty('--arch-overlay', color);
      const fade = document.getElementById('arch-fadeCover');
      if (fade) fade.style.background = color;
      document.documentElement.setAttribute('data-overlay', on ? 'on' : 'off');
    }catch(e){}
  };

  // ---- Boot unify ----
  Uno.__booted = false;
  Uno.boot = function(){
    if (Uno.__booted) return;
    Uno.__booted = true;
    try {
      // Ensure overlay matches current archetype selection
      const sel = document.getElementById('arch-select');
      const base = (sel?.value || '').replace(/.*\//,'').replace(/\.html$/i,'');
      if (base) window.applyArchOverlay(base);
    } catch(e){}

    // Small connectivity helper
    window.Uno.testOpenRouter = async function(){
      const { sk, model } = Uno.getOpenRouter();
      if (!sk){ showArchMessage('Sem chave. Abra Brain e salve sua chave.', 'warn'); return; }
      try{
        const reply = await Uno.sendChat({ messages:[{role:'user', content:'Ping.'}], model, sk, max_tokens:60, temperature:0.1 });
        showArchMessage('OpenRouter OK', 'ok');
        feed('ai', 'Teste OpenRouter: ' + (reply||'(sem conteúdo)'));
      }catch(e){
        showArchMessage('OpenRouter falhou: ' + e.message, 'err');
      }
    };

    // Log
    try { console.log('%cUNO Consolidation v1 ready','background:#09223a;color:#9feaff;padding:2px 6px;border-radius:6px'); } catch(e){}
  };

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', Uno.boot, { once:true });
  } else {
    setTimeout(Uno.boot, 0);
  }
})();

