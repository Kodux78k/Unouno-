
(function(){
  const root = document.documentElement;
  let hud, fps=0, last=performance.now(), frames=0;
  let lastLatency = 0;
  let logs = []; // last 3 entries

  function getVar(name, fallback=''){
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }
  function parsePercent(str, fallback=18){
    if (!str) return fallback;
    const m = /([\d.]+)%/.exec(str);
    if (m) return parseFloat(m[1]);
    const n = parseFloat(str);
    return isFinite(n) ? n*100 : fallback;
  }
  function hexFromColor(str){
    try{
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = str;
      const norm = ctx.fillStyle; // "rgb(r,g,b)"
      const m = norm.match(/\d+/g).map(Number);
      const toHex = (n)=> ('0'+n.toString(16)).slice(-2);
      return '#'+toHex(m[0])+toHex(m[1])+toHex(m[2]);
    }catch(e){ return str; }
  }
  function ls(k, d=null){ try{ const v = localStorage.getItem(k); return v ?? d; }catch(e){ return d; } }

  function addLog(role, text){
    const time = new Date().toLocaleTimeString();
    logs.push({ role, text, time });
    logs = logs.slice(-3);
    if (hud && hud.classList.contains('show')) renderLogs();
  }
  function renderLogs(){
    const box = hud.querySelector('#hudLog');
    if (!box) return;
    box.innerHTML = logs.map(l => {
      const tag = l.role === 'user' ? '🧑' : (l.role === 'ai' ? '🤖' : '🕑');
      return `<div class="logitem"><span class="t">${l.time}</span> <span class="r">${tag}</span> <span class="m">${(l.text||'').slice(0,120)}</span></div>`;
    }).join('') || `<div class="logitem muted">(sem mensagens)</div>`;
  }

  function ensureHUD(){
    if (hud) return hud;
    hud = document.createElement('div');
    hud.id = 'archDebugHUD';
    hud.innerHTML = `
      <h3>Luxara HUD</h3>
      <div class="row">
        <div class="tag">Archetype Color</div>
        <div class="swatch" id="hudSwatch"></div>
        <div class="chip mono" id="hudColor">#000000</div>
      </div>
      <div class="row">
        <div class="tag">Overlay Strength</div>
        <div class="chip" id="hudStrength">18%</div>
      </div>
      <div class="row">
        <div class="tag">Synth FPS</div>
        <div class="chip" id="hudFPS">0</div>
      </div>
      <div class="row">
        <div class="tag">OpenRouter Model</div>
        <div class="chip mono" id="hudModel">—</div>
      </div>
      <div class="row">
        <div class="tag">Last Latency</div>
        <div class="chip" id="hudLatency">— ms</div>
      </div>
      <div class="row controls">
        <button class="btn" id="btnOverlay">Overlay: ON</button>
        <input class="vol" id="hudVol" type="range" min="0" max="100" value="80" title="Volume do splash"/>
        <button class="btn" id="btnTest">Testar OpenRouter</button>
      </div>
      <div class="row">
        <div class="tag">Mini Log</div>
      </div>
      <div id="hudLog" style="max-height:120px; overflow:auto; padding:6px 8px; border-radius:10px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); font: 600 11px/1.3 ui-sans-serif, system-ui;">
        <div class="logitem muted">(sem mensagens)</div>
      </div>
      <div class="hint">Toggle HUD: <strong>Alt+T</strong></div>`;
    document.body.appendChild(hud);

    // style tweaks for log items
    const css = document.createElement('style');
    css.textContent = `#archDebugHUD .logitem{display:flex;gap:6px;align-items:center;margin:2px 0}
      #archDebugHUD .logitem .t{opacity:.6;min-width:48px}
      #archDebugHUD .logitem .r{min-width:18px}
      #archDebugHUD .logitem .m{opacity:.95;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:32vw}
      #archDebugHUD .logitem.muted{opacity:.5}`;
    document.head.appendChild(css);

    // Controls
    const btnOverlay = hud.querySelector('#btnOverlay');
    const rngVol = hud.querySelector('#hudVol');
    const btnTest = hud.querySelector('#btnTest');
    const audio = document.getElementById('splashSound');

    function refreshOverlayBtn(){
      const off = root.getAttribute('data-overlay') === 'off';
      btnOverlay.textContent = 'Overlay: ' + (off ? 'OFF' : 'ON');
    }
    btnOverlay.addEventListener('click', ()=>{
      const off = root.getAttribute('data-overlay') === 'off';
      if (off) root.removeAttribute('data-overlay');
      else root.setAttribute('data-overlay', 'off');
      refreshOverlayBtn();
      updateHUD();
      addLog('sys','overlay: ' + (off ? 'on' : 'off'));
    });
    refreshOverlayBtn();

    if (audio){
      rngVol.value = Math.round((audio.volume ?? 0.8)*100);
      rngVol.addEventListener('input', ()=>{
        try{ audio.volume = rngVol.value/100; addLog('sys','vol: '+rngVol.value+'%'); }catch(e){}
      });
    } else {
      rngVol.disabled = true;
      rngVol.title = "Áudio não encontrado (#splashSound)";
    }

    btnTest.addEventListener('click', async ()=>{
      const msg = "ping Luxara";
      addLog('user', msg);
      // Preferir kobSend se existir (usa feed e renderizador)
      if (typeof window.kobSend === 'function'){
        try{
          window.__luxNet?.start();
          await window.kobSend(msg);
          window.__luxNet?.end();
          addLog('ai','(ver feed)');
        }catch(e){
          addLog('sys','kobSend falhou: '+(e?.message||e));
        }
        return;
      }
      // Fallback: request simples ao OpenRouter e empurra no feed
      try{
        const FEED = document.getElementById('chatFeed') || document.querySelector('#feed,#chat-feed,.chat-feed');
        const LS = localStorage;
        const KEY = LS.getItem("di_apiKey") || LS.getItem("apiKeyInput") || "<COLE_SUA_CHAVE_AQUI>";
        const MODEL = LS.getItem("di_modelName") || "modelName";
        const url = "https://openrouter.ai/api/v1/chat/completions";
        const headers = {
          "Authorization": "Bearer " + KEY,
          "Content-Type": "application/json",
          "HTTP-Referer": location.origin || "http://localhost",
          "X-Title": "HUB UNO"
        };
        const body = {
          model: MODEL,
          messages: [{ role:"system", content:"Você é o A.Infodose no HUB UNO (KOB-DUX). Responda curto, simbólico e útil." },
                     { role:"user", content: msg }],
          stream:false
        };
        window.__luxNet?.start();
        const resp = await fetch(url, { method:"POST", headers, body: JSON.stringify(body) });
        const data = await resp.json();
        window.__luxNet?.end();
        const text = data?.choices?.[0]?.message?.content || "(sem conteúdo)";
        addLog('ai', text);
        // render no feed básico se houver
        if (FEED){
          const wrap = document.createElement('div');
          wrap.className = 'msg ai-rich';
          const box = document.createElement('div');
          box.className = 'render-html';
          box.innerHTML = `<div class="pages-wrapper"></div><div id="pageIndicator" style="font:12px/1.4 ui-monospace;color:#94b6d6;margin-top:6px"></div>`;
          wrap.appendChild(box);
          FEED.appendChild(wrap);
          if (window.renderResponse) window.renderResponse(text);
          FEED.scrollTop = FEED.scrollHeight;
        }
      }catch(e){
        addLog('sys','fallback falhou: '+(e?.message||e));
      }
    });

    return hud;
  }

  function readModel(){
    return ls("openrouter:model") || ls("openrouter_model") || "openai/gpt-4o-mini";
  }

  function updateHUD(){
    const h = ensureHUD();
    const c = getVar('--arch-color', '#d4af37');
    const pct = parsePercent(getVar('--arch-overlay-strength','18%'));
    const sw = h.querySelector('#hudSwatch');
    const hc = h.querySelector('#hudColor');
    const hs = h.querySelector('#hudStrength');
    const hf = h.querySelector('#hudFPS');
    const hm = h.querySelector('#hudModel');
    const hl = h.querySelector('#hudLatency');
    if (sw) sw.style.background = c;
    if (hc) hc.textContent = hexFromColor(c);
    if (hs) hs.textContent = Math.round(pct) + '%';
    if (hf) hf.textContent = Math.round(fps);
    if (hm) hm.textContent = readModel();
    if (hl) hl.textContent = lastLatency ? (Math.round(lastLatency)+' ms') : '— ms';
  }

  function measureFPS(now){
    frames++;
    if (now - last >= 1000){
      fps = (frames * 1000) / (now - last);
      frames = 0; last = now;
      if (hud && hud.classList.contains('show')) updateHUD();
    }
    requestAnimationFrame(measureFPS);
  }
  requestAnimationFrame(measureFPS);

  window.addEventListener('keydown', (ev)=>{
    if (ev.altKey && (ev.key.toLowerCase() === 't')){
      const h = ensureHUD();
      h.classList.toggle('show');
      if (h.classList.contains('show')) updateHUD();
    }
  });

  window.addEventListener('message', (ev)=>{
    if (ev?.data?.type === 'arch:theme' && hud && hud.classList.contains('show')){
      setTimeout(updateHUD, 50);
    }
  });

  // Latency API
  const net = {
    _t: 0,
    start(){ this._t = performance.now(); },
    end(){
      if (!this._t) return;
      lastLatency = performance.now() - this._t;
      this._t = 0;
      if (hud && hud.classList.contains('show')) updateHUD();
      try{ console.info('[LuxNet] last latency:', Math.round(lastLatency), 'ms'); }catch(e){}
    }
  };
  window.__luxHud = { show(){ ensureHUD().classList.add('show'); updateHUD(); },
                      hide(){ ensureHUD().classList.remove('show'); },
                      update: updateHUD };
  window.__luxNet = net;

  // Public log API (optional)
  window.__luxLog = { add: addLog, render: ()=>{ if (hud) renderLogs(); } };
})();
