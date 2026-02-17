/* patch-xxx.js — colocar em dist/js/patch-xxx.js */
/* cria global DualPatches */
(function(global){
  const DualPatches = {};
  /* helper storage safe */
  function safeGetLS(k){ try{ return localStorage.getItem(k) }catch(e){ return null } }
  function safeSetLS(k,v){ try{ localStorage.setItem(k,v); return true }catch(e){ return false } }
  /* create LS panel */
  DualPatches.createLSPanel = function(opts = {}){
    if(document.getElementById('dual-ls-panel')) return; // já existe
    const wrap = document.createElement('div');
    wrap.id = 'dual-ls-panel';
    wrap.innerHTML = `
      <div class="dual-row">
        <div class="dual-ttl">Dual — Local Storage</div>
        <button class="dual-btn" id="dual-ls-refresh">Atualizar</button>
        <button class="dual-btn" id="dual-ls-toggle">Fechar</button>
      </div>
      <input type="search" id="dual-ls-search" placeholder="buscar chave...">
      <div id="dual-ls-list"></div>
      <div class="dual-actions">
        <div class="dual-pill small">Itens: <span id="dual-ls-count">0</span></div>
        <div style="display:flex;gap:8px;">
          <button class="dual-btn" id="dual-ls-export">Exportar</button>
          <button class="dual-btn" id="dual-ls-clear">Limpar (debug)</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    // handlers
    function renderList(filter=''){
      const list = document.getElementById('dual-ls-list');
      const keys = Object.keys(localStorage).sort();
      list.innerHTML = '';
      let count = 0;
      keys.forEach(k=>{
        if(filter && !k.toLowerCase().includes(filter)) return;
        const v = safeGetLS(k);
        const item = document.createElement('div');
        item.className = 'dual-ls-item';
        const keyDiv = document.createElement('div'); keyDiv.className='key'; keyDiv.textContent = k;
        const valDiv = document.createElement('div'); valDiv.className='val'; 
        // tentar pretty JSON
        let pretty = v;
        try{ const parsed = JSON.parse(v); pretty = JSON.stringify(parsed, null, 2); }catch(e){}
        valDiv.textContent = pretty;
        item.appendChild(keyDiv); item.appendChild(valDiv);
        list.appendChild(item);
        count++;
      });
      document.getElementById('dual-ls-count').textContent = count;
    }
    renderList('');
    document.getElementById('dual-ls-refresh').addEventListener('click', ()=>renderList(document.getElementById('dual-ls-search').value.toLowerCase()));
    document.getElementById('dual-ls-search').addEventListener('input', (e)=>renderList(e.target.value.toLowerCase()));
    document.getElementById('dual-ls-toggle').addEventListener('click', ()=>wrap.classList.toggle('show'));
    document.getElementById('dual-ls-export').addEventListener('click', ()=>{
      const dump = {};
      Object.keys(localStorage).forEach(k=> dump[k] = safeGetLS(k));
      const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'localstorage-dual.json'; a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('dual-ls-clear').addEventListener('click', ()=>{
      if(!confirm('Limpar localStorage completo? (apenas para debug)')) return;
      localStorage.clear(); renderList(document.getElementById('dual-ls-search').value.toLowerCase());
    });
    // show by default (animation)
    requestAnimationFrame(()=>wrap.classList.add('show'));
  };

  /* load patches css dynamically (se quiser carregar via js em vez de link) */
  DualPatches.loadPatchesCSS = function(url){
    if(document.querySelector(`link[data-dual-patch="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-dual-patch', url);
    document.head.appendChild(link);
  };

  /* orb implementation — canvas 2D lightweight orb for Adj open */
  DualPatches._orb = { anim: null, ctx:null, canvas:null, running:false };
  DualPatches.initAdjOrb = function(containerSelectorOrEl, opts = {}){
    const container = (typeof containerSelectorOrEl === 'string') ? document.querySelector(containerSelectorOrEl) : containerSelectorOrEl;
    if(!container) return console.warn('DualPatches: container não encontrado para orb');
    // create wrapper
    let wrap = container.querySelector('.dual-orb-wrap');
    if(!wrap){
      wrap = document.createElement('div'); wrap.className='dual-orb-wrap';
      container.appendChild(wrap);
    }
    // create canvas
    if(DualPatches._orb.canvas) return; // já criado
    const canvas = document.createElement('canvas'); canvas.id = 'dual-orb-canvas';
    canvas.width = wrap.clientWidth * devicePixelRatio;
    canvas.height = wrap.clientHeight * devicePixelRatio;
    canvas.style.width = '100%'; canvas.style.height = '100%';
    wrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    DualPatches._orb.canvas = canvas; DualPatches._orb.ctx = ctx; DualPatches._orb.running = true;

    // particles
    const particles = [];
    const N = Math.max(16, Math.min(64, Math.floor((wrap.clientWidth/100)*6)));
    for(let i=0;i<N;i++){
      particles.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: (Math.random()*12+6)*devicePixelRatio,
        vx: (Math.random()-0.5)*0.6*devicePixelRatio,
        vy: (Math.random()-0.5)*0.4*devicePixelRatio,
        alpha: 0.06 + Math.random()*0.22
      });
    }

    // draw loop
    let t0 = performance.now();
    function step(t){
      if(!DualPatches._orb.running) return;
      const dt = (t - t0)/1000; t0 = t;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      // soft background gradient
      const g = ctx.createLinearGradient(0,0,w,h);
      g.addColorStop(0, 'rgba(12,14,22,0.0)');
      g.addColorStop(1, 'rgba(6,8,12,0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);
      // central glow
      const cx = w*0.5, cy = h*0.45;
      const grd = ctx.createRadialGradient(cx,cy,20, cx,cy, Math.max(w,h)*0.7);
      grd.addColorStop(0, 'rgba(127,127,255,0.22)');
      grd.addColorStop(0.25, 'rgba(125,249,255,0.08)');
      grd.addColorStop(1, 'rgba(10,12,16,0.0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(cx,cy, Math.min(w,h)*0.35, 0, Math.PI*2); ctx.fill();
      // particles
      particles.forEach(p=>{
        p.x += p.vx * (1 + Math.sin(t/1000 + p.r));
        p.y += p.vy * (1 + Math.cos(t/1200 + p.r));
        if(p.x < -p.r) p.x = w + p.r;
        if(p.x > w + p.r) p.x = -p.r;
        if(p.y < -p.r) p.y = h + p.r;
        if(p.y > h + p.r) p.y = -p.r;
        ctx.beginPath();
        ctx.fillStyle = `rgba(125,249,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      DualPatches._orb.anim = requestAnimationFrame(step);
    }
    DualPatches._orb.anim = requestAnimationFrame(step);
    // responsive
    function onResize(){ 
      if(!DualPatches._orb.canvas) return;
      canvas.width = wrap.clientWidth * devicePixelRatio;
      canvas.height = wrap.clientHeight * devicePixelRatio;
    }
    window.addEventListener('resize', onResize);
    DualPatches._orb._onResize = onResize;
    return { canvas, ctx };
  };

  DualPatches.destroyAdjOrb = function(){
    if(!DualPatches._orb.canvas) return;
    DualPatches._orb.running = false;
    if(DualPatches._orb.anim) cancelAnimationFrame(DualPatches._orb.anim);
    if(DualPatches._orb.canvas && DualPatches._orb.canvas.parentNode) DualPatches._orb.canvas.parentNode.removeChild(DualPatches._orb.canvas);
    window.removeEventListener('resize', DualPatches._orb._onResize);
    DualPatches._orb.canvas = null; DualPatches._orb.ctx=null; DualPatches._orb.anim=null; DualPatches._orb._onResize=null;
  };

  /* convenience: auto-open when Adj modal opened (tries several selectors) */
  DualPatches.hookAdjOpen = function(opts = {}){
    // selectors possíveis para o editor Adj; tenta hook por mutation observer
    const selectors = opts.selectors || ['#adj-editor','.adj-modal','#adj'];
    function tryHook(){
      for(const s of selectors){
        const el = document.querySelector(s);
        if(el) return el;
      }
      return null;
    }
    let hooked = false;
    function check(){
      const el = tryHook();
      if(el && !hooked){
        // cria orb dentro do elemento adj (ou seu container)
        DualPatches.initAdjOrb(el);
        hooked = true;
      }
      if(!el && hooked){
        DualPatches.destroyAdjOrb();
        hooked = false;
      }
    }
    // observer para entrar/saída
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { childList:true, subtree:true });
    // polivalente: também checa a cada 800ms por 5s para capturar loads tardios
    let attempts = 0;
    const interval = setInterval(()=>{
      attempts++;
      check();
      if(attempts>8){ clearInterval(interval); }
    }, 800);
    // expor stop function
    DualPatches._adjHookStop = ()=>{ mo.disconnect(); clearInterval(interval); };
  };

  /* export para global */
  global.DualPatches = DualPatches;
})(window);