
(function(){
  // helpers
  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));
  function setLS(k,v){ try{ localStorage.setItem(k,String(v)); }catch(_){ } }
  function getNum(k,d){ try{ const v=localStorage.getItem(k); return v==null? d : parseFloat(v); }catch(_){ return d; } }
  function getFlag(k,d){ try{ const v=localStorage.getItem(k); return v==null? d : v==='1'; }catch(_){ return d; } }

  // defaults (perf + atom)
  const DEF = { target:50, minS:96, minR:80, cap:360, dn:0.85, up:1.06 };
  const KP  = {
    en:'dual.perf.enable', tgt:'dual.perf.target', s:'dual.perf.minSingle', r:'dual.perf.minRing', cap:'dual.perf.maxCap', dn:'dual.perf.stepDown', up:'dual.perf.stepUp'
  };
  if(localStorage.getItem(KP.en)==null) setLS(KP.en,'1');
  if(localStorage.getItem(KP.tgt)==null) setLS(KP.tgt, DEF.target);
  if(localStorage.getItem(KP.s)==null)   setLS(KP.s,   DEF.minS);
  if(localStorage.getItem(KP.r)==null)   setLS(KP.r,   DEF.minR);
  if(localStorage.getItem(KP.cap)==null) setLS(KP.cap, DEF.cap);
  if(localStorage.getItem(KP.dn)==null)  setLS(KP.dn,  DEF.dn);
  if(localStorage.getItem(KP.up)==null)  setLS(KP.up,  DEF.up);
  if(localStorage.getItem('dual.atom.count')==null) setLS('dual.atom.count', 160);
  if(localStorage.getItem('dual.atom.orbit')==null) setLS('dual.atom.orbit', 0.74);
  if(localStorage.getItem('dual.atom.glow')==null)  setLS('dual.atom.glow',  0.38);
  if(localStorage.getItem('dual.ui.bloom')==null)   setLS('dual.ui.bloom',   0);
  document.body.setAttribute('data-orb-solid','off');

  function panel(){
    return $('#lsPanel') || $('#lsModal .ls-panel') || $('.ls-panel') || $('.panel-ls') || $('.settings-panel');
  }

  function ensureSection(){
    const p = panel();
    if(!p || $('#perfControlsV371')) return;
    const tgt=getNum(KP.tgt,DEF.target), ms=getNum(KP.s,DEF.minS), mr=getNum(KP.r,DEF.minR), cap=getNum(KP.cap,DEF.cap), dn=getNum(KP.dn,DEF.dn), up=getNum(KP.up,DEF.up), en=getFlag(KP.en,true);
    const sec = document.createElement('section'); sec.id='perfControlsV371';
    sec.innerHTML = `
      <div class="section-title">Desempenho (FPS Target)</div>
      <div id="perfHud">
        <div class="stats">
          <span class="badge">FPS: <strong id="hudFps">—</strong></span>
          <span class="badge">Meta: <strong id="hudTarget">${tgt}</strong></span>
        </div>
        <button id="perfEnable" class="pill-btn ${en?'on':''}">${en?'Auto':'Manual'}</button>
      </div>
      <div class="line">
        <label>Meta de FPS</label>
        <div><input id="fpsTarget" type="range" min="30" max="60" step="1" value="${tgt}" /><output id="fpsTargetOut">${tgt}</output></div>
      </div>
      <div class="line">
        <label>Min (single)</label>
        <div><input id="minSingle" type="range" min="48" max="160" step="2" value="${ms}" /><output id="minSingleOut">${ms}</output></div>
      </div>
      <div class="line">
        <label>Min por anel</label>
        <div><input id="minRing" type="range" min="48" max="160" step="2" value="${mr}" /><output id="minRingOut">${mr}</output></div>
      </div>
      <div class="line">
        <label>Máximo</label>
        <div><input id="maxCap" type="range" min="160" max="680" step="10" value="${cap}" /><output id="maxCapOut">${cap}</output></div>
      </div>
      <div class="line">
        <label>Passo Reduzir</label>
        <div><input id="stepDn" type="range" min="0.70" max="0.95" step="0.01" value="${dn}" /><output id="stepDnOut">${dn.toFixed(2)}</output></div>
      </div>
      <div class="line">
        <label>Passo Aumentar</label>
        <div><input id="stepUp" type="range" min="1.01" max="1.15" step="0.01" value="${up}" /><output id="stepUpOut">${up.toFixed(2)}</output></div>
      </div>
      <div class="section-title">Partículas do Átomo — SAFE</div>
      <div class="line">
        <label>Quantidade</label>
        <div><input id="safe-count" type="range" min="48" max="220" step="4" value="${getNum('dual.atom.count',160)}" /><output id="safe-count-out">${getNum('dual.atom.count',160)}</output></div>
      </div>
      <div class="line">
        <label>Órbita</label>
        <div><input id="safe-orbit" type="range" min="0.60" max="0.86" step="0.01" value="${getNum('dual.atom.orbit',0.74)}" /><output id="safe-orbit-out">${getNum('dual.atom.orbit',0.74).toFixed(2)}</output></div>
      </div>
      <div class="line">
        <label>Glow</label>
        <div><input id="safe-glow" type="range" min="0.00" max="1.00" step="0.01" value="${getNum('dual.atom.glow',0.38)}" /><output id="safe-glow-out">${getNum('dual.atom.glow',0.38).toFixed(2)}</output></div>
      </div>
    `;
    p.prepend(sec);

    // binds
    function bindR(id, k, fmt=(v)=>v){
      const el = $('#'+id), out=$('#'+id+'Out'); if(!el) return;
      el.addEventListener('input', ()=>{ const val=parseFloat(el.value); out && (out.textContent=fmt(val)); setLS(k, val); $('#hudTarget') && (id==='fpsTarget') && ($('#hudTarget').textContent=String(val)); });
    }
    bindR('fpsTarget', KP.tgt);
    bindR('minSingle', KP.s);
    bindR('minRing',   KP.r);
    bindR('maxCap',    KP.cap);
    bindR('stepDn',    KP.dn, (v)=>v.toFixed(2));
    bindR('stepUp',    KP.up, (v)=>v.toFixed(2));

    ['safe-count','safe-orbit','safe-glow'].forEach(id=>{
      const el=$('#'+id), out=$('#'+id+'-out'); el && el.addEventListener('input', ()=>{ out && (out.textContent = id==='safe-count'? el.value : parseFloat(el.value).toFixed(2)); setLS(el.id==='safe-count'?'dual.atom.count': el.id==='safe-orbit'?'dual.atom.orbit':'dual.atom.glow', el.value); });
    });

    const enBtn = $('#perfEnable'); enBtn && enBtn.addEventListener('click', ()=>{
      const now=!enBtn.classList.contains('on'); enBtn.classList.toggle('on',now); enBtn.textContent = now? 'Auto':'Manual'; setLS(KP.en, now?'1':'0');
    });

    // Live HUD FPS
    let L=performance.now(), F=0;
    function hudTick(t){ F++; if(t-L>=1000){ const fps=F; F=0; L=t; $('#hudFps') && ($('#hudFps').textContent=fps); } requestAnimationFrame(hudTick); }
    requestAnimationFrame(hudTick);
  }

  // robust triggers
  function bind(){
    // when LS opens
    const btn = document.getElementById('btnLS') || [...document.querySelectorAll('button,[role="button"]')].find(b=>/ls|painel|config|settings/i.test((b.textContent||'')+(b.id||'')+(b.className||'')));
    if(btn && !btn.dataset._masterfix){ btn.dataset._masterfix='1'; btn.addEventListener('click', ()=> setTimeout(ensureSection, 120), {passive:true}); }
    // also try on boot and on modal toggle
    setTimeout(ensureSection, 300);
    document.addEventListener('ls:disabled-changed', ()=> setTimeout(ensureSection, 120));
    document.getElementById('arch-frame')?.addEventListener('load', ()=> setTimeout(ensureSection, 200));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
