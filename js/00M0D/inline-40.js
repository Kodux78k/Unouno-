
(() => {
  const APP_COLORS = {
    'Atlas': ['#409EFF','#8fd3ff'],
    'Nova': ['#ff52e5','#f8c058'],
    'Vitalis': ['#ff9f43','#39ffb6'],
    'Pulse': ['#8a2be2','#00e5ff'],
    'Artemis': ['#00c2ff','#39ffb6'],
    'Serena': ['#b08fff','#ffadad'],
    'Kaos': ['#ff9f43','#ff4d6d'],
    'Genus': ['#a3ff4d','#00e5ff'],
    'Lumine': ['#ffd700','#ff7ab6'],
    'Rhea': ['#ff7aa2','#ffa5d8'],
    'Solus': ['#4b6fff','#8fd3ff'],
    'Aion': ['#2dd4bf','#10b981'],
  };

  // Apply per-app accent
  function applyAppAccents(){
    document.querySelectorAll('.app-card').forEach(card => {
      const titleEl = card.querySelector('.app-title');
      if (!titleEl) return;
      const full = titleEl.getAttribute('title') || titleEl.textContent || '';
      // Expected format "Atlas · Cartesius" or "Atlas ·…"
      const root = full.split('·')[0].trim();
      const colors = APP_COLORS[root];
      if (!colors) return;
      card.style.setProperty('--appA', colors[0]);
      card.style.setProperty('--appB', colors[1]);
      card.classList.add('accented');
    });
  }

  // Prevent duplicate icon fallback (safety, replica correção da base)
  function dedupeAppIcons(){
    document.querySelectorAll('.app-card .app-icon').forEach(ico => {
      const icons = Array.from(ico.querySelectorAll('svg,img'));
      if (icons.length <= 1) return;
      let keep = icons.find(n => n.tagName === 'SVG') || icons[0];
      icons.forEach(n => { if (n !== keep) n.remove(); });
    });
  }

  // Archetype overlay sync (tone matches archetype)
  const ARCH_COLORS = {
    'atlas':  { color: '#409EFF', overlay: 'rgba(64,158,255,0.22)' },
    'nova':   { color: '#ff52e5', overlay: 'rgba(255,82,229,0.22)' },
    'vitalis':{ color: '#2dd4bf', overlay: 'rgba(45,212,191,0.20)' },
    'pulse':  { color: '#8a2be2', overlay: 'rgba(138,43,226,0.20)' },
    'artemis':{ color: '#00c2ff', overlay: 'rgba(0,194,255,0.20)' },
    'serena': { color: '#b08fff', overlay: 'rgba(176,143,255,0.20)' },
    'kaos':   { color: '#ff9f43', overlay: 'rgba(255,159,67,0.20)' },
    'genus':  { color: '#a3ff4d', overlay: 'rgba(163,255,77,0.18)' },
    'lumine': { color: '#ffd700', overlay: 'rgba(255,215,0,0.18)' },
    'rhea':   { color: '#ff7aa2', overlay: 'rgba(255,122,162,0.20)' },
    'solus':  { color: '#4b6fff', overlay: 'rgba(75,111,255,0.20)' },
    'aion':   { color: '#10b981', overlay: 'rgba(16,185,129,0.20)' },
  };
  function currentArchKey(){
     const sel = document.getElementById('arch-select');
     if (!sel) return 'atlas';
     const opt = sel.value || '';
     const m = opt.match(/\/([a-z]+)\.html$/i);
     return m ? m[1].toLowerCase() : 'atlas';
  }
  function applyOverlayFromArch(){
     const key = currentArchKey();
     const cfg = ARCH_COLORS[key] || ARCH_COLORS['atlas'];
     document.documentElement.style.setProperty('--arch-color', cfg.color);
     document.documentElement.style.setProperty('--arch-overlay', cfg.overlay);
     const call = document.getElementById('orbCall');
     if (call) call.style.textShadow = `0 0 12px ${cfg.color}80`;
  }
  function wireArchSelect(){
    const sel = document.getElementById('arch-select');
    if (!sel) return;
    sel.addEventListener('change', applyOverlayFromArch);
  }

  // "Toque o pulso" CTA + synth
  function ensurePulseCTA(){
    const wrap = document.getElementById('orbWrap');
    if (!wrap || wrap.querySelector('.pulse-cta')) return;
    const cta = document.createElement('div');
    cta.className = 'pulse-cta hidden';
    cta.innerHTML = '<div class="dot"></div><div class="label">toque o pulso</div>';
    wrap.appendChild(cta);
    cta.addEventListener('click', () => {
      hideCTA();
      startSynthSplash();
      tryResumeAudio();
    }, { once: true });
    window._pulseCTA = { show: showCTA, hide: hideCTA };
    function showCTA(){ cta.classList.remove('hidden'); }
    function hideCTA(){ cta.classList.add('hidden'); }
  }

  function tryResumeAudio(){
    const ctx = window.__AUDIO_CTX__ || (window.AudioContext ? new AudioContext() : null);
    if (ctx && ctx.state === 'suspended') { ctx.resume().catch(()=>{}); }
    const el = document.getElementById('splashSound');
    if (el) { el.volume = 0.0; el.play().catch(()=>{}); setTimeout(()=>{ try{ el.pause(); el.currentTime = 0; }catch{} }, 200); }
    window.dispatchEvent(new CustomEvent('kobllux:audio:resume'));
  }

  function startSynthSplash(){
    const wrap = document.getElementById('orbWrap');
    if (!wrap) return;
    let canvas = wrap.querySelector('canvas#pulseSynth');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'pulseSynth';
      canvas.className = 'pulse-synth';
      wrap.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    function resize(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
    resize(); window.addEventListener('resize', resize);
    canvas.classList.add('active');
    const t0 = performance.now();
    const dur = 1500;
    const rootStyles = getComputedStyle(document.documentElement);
    const colorA = rootStyles.getPropertyValue('--arch-color').trim() || '#d4af37';
    function paint(t){
      const p = Math.min(1, (t - t0)/dur);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const cx = canvas.width/2, cy = canvas.height/2;
      const maxR = Math.min(cx,cy);
      for (let i=0;i<4;i++){
        const k = p*1.1 - i*0.18;
        if (k <= 0) continue;
        const r = maxR * k;
        const g = ctx.createRadialGradient(cx, cy, Math.max(0,r-28), cx, cy, r);
        g.addColorStop(0, colorA + '80');
        g.addColorStop(1, '#0000');
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fill();
      }
      if (p < 1){ requestAnimationFrame(paint); } else {
        canvas.classList.remove('active');
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
    }
    requestAnimationFrame(paint);
  }

  // Detect autoplay block → show CTA
  function detectAudioGate(){
    const el = document.getElementById('splashSound');
    if (!el) return;
    el.play().then(() => {
      el.pause(); el.currentTime = 0;
      if (window._pulseCTA) window._pulseCTA.hide();
    }).catch(() => {
      if (window._pulseCTA) window._pulseCTA.show();
    });
  }

  function boot(){
    applyAppAccents();
    dedupeAppIcons();
    applyOverlayFromArch();
    wireArchSelect();
    ensurePulseCTA();
    detectAudioGate();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
