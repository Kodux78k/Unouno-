

// === HD•PRO Override (Dual UNO) ===================================
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  function toast(msg, ms=1800){
    let t = $('#hdToast'); 
    if(!t){ t = document.createElement('div'); t.id='hdToast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t.__t); t.__t = setTimeout(()=>t.classList.remove('show'), ms);
  }

  // 1) Handle quase invisível para abrir/fechar LS panel (#brain)
  function mountHandle(){
    if($('#lsHandle')) return;
    const btn = document.createElement('button');
    btn.id = 'lsHandle';
    btn.title = 'Abrir/fechar painel (LS)';
    document.body.appendChild(btn);

    function toggleBrain(){
      const brain = $('#brain');
      if(!brain){ toast('Painel LS não encontrado (#brain)'); return; }
      brain.classList.toggle('hide');
      btn.classList.toggle('on', !brain.classList.contains('hide'));
    }
    on(btn, 'click', toggleBrain);
  }

  // 2) Painel HD Pro dentro do #brain (LS Panel)
  function mountHDPro(){
    const brain = $('#brain .popover') || $('#brain');
    if(!brain || brain.__hdproMounted) return;
    brain.__hdproMounted = true;

    // Secção base
    const sec = document.createElement('section');
    sec.className = 'hdpro-sec';
    sec.innerHTML = `
      <div class="sec-hdr">
        <h3>HD • Pro — Sistema</h3>
        <button class="hd-btn ok" id="hdRefresh">Atualizar</button>
      </div>

      <div class="hdpro-grid">
        <div class="hdpro-row">
          <div>
            <div class="hdpro-label">LocalStorage</div>
            <div class="hdpro-meter"><div class="bar" id="barLS"></div></div>
          </div>
          <div class="hdpro-val" id="valLS">–</div>
        </div>

        <div class="hdpro-row">
          <div>
            <div class="hdpro-label">IndexedDB (estimado)</div>
            <div class="hdpro-meter"><div class="bar" id="barIDB"></div></div>
          </div>
          <div class="hdpro-val" id="valIDB">–</div>
        </div>

        <div class="hdpro-row">
          <div>
            <div class="hdpro-label">Total (Storage API)</div>
            <div class="hdpro-meter"><div class="bar" id="barTotal"></div></div>
          </div>
          <div class="hdpro-val" id="valTotal">–</div>
        </div>

        <div class="hdpro-actions">
          <button class="hd-btn" id="btnToggleOrb">Ocultar opções avançadas do ORB/FPS</button>
          <button class="hd-btn" id="btnImportFix">Importar HTML (corrigido)</button>
          <input id="__fileImportHD" type="file" accept=".html,.htm" style="display:none" />
          <button class="hd-btn danger" id="btnClearLS">Limpar LocalStorage</button>
          <button class="hd-btn danger" id="btnClearIDB">Limpar IndexedDB</button>
        </div>
      </div>
    `;
    brain.appendChild(sec);

    // 2a) Toggle avançados ORB/FPS
    on($('#btnToggleOrb', sec), 'click', ()=>{
      const advSelectors = [
        '[data-orb-adv]',
        '#orbAdv', '.orb-adv', '.orb-advanced', '[data-orb-advanced]',
        '#fpsPanel', '.fps-adv', '#orbControls', '.orb-controls'
      ];
      let toggled = 0;
      advSelectors.forEach(sel => {
        $$(sel).forEach(el => { 
          el.classList.toggle('hdpro-adv-hidden'); 
          toggled++;
        });
      });
      toast(toggled ? 'Avançados ORB/FPS alternados' : 'Nenhum bloco avançado encontrado');
    });

    // 2b) Import corrigido (abre HTML local numa sessão dentro do app, fallback nova aba)
    const fileInput = $('#__fileImportHD', sec);
    on($('#btnImportFix', sec), 'click', ()=> fileInput && fileInput.click());
    on(fileInput, 'change', (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const url = URL.createObjectURL(file);
      const name = file.name || 'arquivo.html';
      // destino preferencial
      const anchor = $('#sessionsAnchor') || $('#stackWrap') || $('#v-stack') || $('main');
      if(anchor){
        const wrap = document.createElement('div');
        wrap.className = 'session';
        wrap.innerHTML = `
          <div class="hdr">
            <span class="app-icon">${(name[0]||'W').toUpperCase()}</span>
            <span class="title">${name}</span>
            <div class="tools">
              <button class="btn" data-act="min">Min</button>
              <button class="btn" data-act="full">Full</button>
              <button class="btn" data-act="close">Fechar</button>
            </div>
          </div>
          <iframe src="${url}" referrerpolicy="no-referrer"></iframe>
          <div class="resize-handle" title="Arraste para ajustar altura"></div>
        `;
        anchor.appendChild(wrap);
        // Tools
        on(wrap.querySelector('[data-act="min"]'), 'click', ()=> wrap.classList.toggle('min'));
        on(wrap.querySelector('[data-act="full"]'), 'click', ()=> document.body.classList.toggle('session-full'));
        on(wrap.querySelector('[data-act="close"]'), 'click', ()=> wrap.remove());
        toast('HTML importado dentro do Stack');
      }else{
        window.open(url, '_blank', 'noopener');
        toast('HTML aberto em nova aba');
      }
      e.target.value = '';
    });

    // 2c) Limpar LocalStorage
    on($('#btnClearLS', sec), 'click', ()=>{
      if(confirm('Limpar todo o LocalStorage deste domínio?')){
        try { localStorage.clear(); toast('LocalStorage limpo'); updateMeters(true); }
        catch(err){ console.error(err); toast('Erro ao limpar LocalStorage'); }
      }
    });

    // 2d) Limpar IndexedDB (melhor esforço)
    on($('#btnClearIDB', sec), 'click', async ()=>{
      if(!confirm('Apagar bancos IndexedDB deste domínio?')) return;
      try{
        if(indexedDB.databases){
          const dbs = await indexedDB.databases();
          await Promise.all((dbs||[]).map(d => d && d.name ? new Promise((res)=>{
            const req = indexedDB.deleteDatabase(d.name);
            req.onsuccess = req.onerror = req.onblocked = ()=>res();
          }) : Promise.resolve()));
        }else{
          // Sem enumerate: tente deletar bases comuns do app
          const common = ['dual', 'uno', 'app', 'db', 'files', 'store'];
          await Promise.all(common.map(n => new Promise((res)=>{
            const req = indexedDB.deleteDatabase(n); req.onsuccess = req.onerror = req.onblocked = ()=>res();
          })));
        }
        toast('IndexedDB: pedido de exclusão enviado'); updateMeters(true);
      }catch(err){
        console.error(err); toast('IndexedDB: não suportado/erro');
      }
    });

    // 2e) Atualizar medidores
    on($('#hdRefresh', sec), 'click', ()=> updateMeters(true));

    async function estimateStorage(){
      const est = (navigator.storage && navigator.storage.estimate) ? await navigator.storage.estimate() : {};
      // est.usage (bytes) inclui IDB + Cache + etc (depende do UA)
      // LS estimado manualmente (2 bytes por char em UTF-16)
      let lsBytes = 0;
      try{
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i);
          const v = localStorage.getItem(k);
          lsBytes += 2*((k||'').length + (v||'').length);
        }
      }catch{}
      // Experimento: idbBytes ~ usage - lsBytes (aprox)
      const usage = est.usage || 0;
      const quota = est.quota || 0;
      const idbBytes = Math.max(0, usage - lsBytes);

      return { lsBytes, idbBytes, usage, quota };
    }

    function fmt(bytes){
      const u = ['B','KB','MB','GB','TB'];
      let i=0, n=bytes;
      while(n>=1024 && i<u.length-1){ n/=1024; i++; }
      return `${n.toFixed( (i<=1)?0:1)} ${u[i]}`;
    }

    async function updateMeters(animateNumbers){
      try{
        const {lsBytes, idbBytes, usage, quota} = await estimateStorage();
        const els = {
          barLS: $('#barLS'), valLS: $('#valLS'),
          barIDB: $('#barIDB'), valIDB: $('#valIDB'),
          barTotal: $('#barTotal'), valTotal: $('#valTotal'),
        };
        const percent = (num, den) => (den>0)? Math.min(100, Math.round((num/den)*100)) : 0;
        // Total can use quota as denominator; LS use typical 5MB baseline to visualize
        const lsCap = 5*1024*1024; // 5MB
        const pLS = percent(lsBytes, lsCap);
        const pIDB = quota ? percent(idbBytes, quota) : 0;
        const pTot = percent(usage, quota);

        if(els.barLS) els.barLS.style.width = pLS + '%';
        if(els.barIDB) els.barIDB.style.width = pIDB + '%';
        if(els.barTotal) els.barTotal.style.width = pTot + '%';

        const setNum = (el, val) => { if(el) el.textContent = val; };
        if(animateNumbers){
          animateCount( $('#valLS'), lsBytes );
          animateCount( $('#valIDB'), idbBytes );
          animateCount( $('#valTotal'), usage );
        }else{
          setNum( $('#valLS'), fmt(lsBytes) );
          setNum( $('#valIDB'), fmt(idbBytes) );
          setNum( $('#valTotal'), `${fmt(usage)} / ${quota?fmt(quota):'–'}` );
        }
      }catch(err){ console.error(err); }
    }

    function animateCount(el, bytes){
      if(!el) return;
      const target = bytes;
      const start = parseFloat(el.getAttribute('data-last')||'0');
      const startTime = performance.now();
      const dur = 600;
      function step(t){
        const k = Math.min(1, (t - startTime)/dur);
        const v = Math.round(start + (target-start)*k);
        el.textContent = ( (k<1) ? (v + ' B') : (fmt(target)) );
        if(k<1) requestAnimationFrame(step);
        else el.setAttribute('data-last', String(target));
      }
      requestAnimationFrame(step);
    }

    updateMeters(false);
    // Atualização periódica (leve)
    sec.__interval = setInterval(()=> updateMeters(false), 2500);
  }

  // 3) Start
  function boot(){
    mountHandle();
    mountHDPro();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();

