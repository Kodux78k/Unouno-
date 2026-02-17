
(function(){
  const media = document.getElementById('splashSound');
  if(!media) return;

  // Utilities -------------------------------------------------
  function cssArchColor(){
    const v = getComputedStyle(document.documentElement).getPropertyValue('--arch-color').trim();
    return parseColor(v || '#d4af37'); // fallback to gold
  }
  function parseColor(str){
    // supports #rgb, #rrggbb, rgb(), hsl()
    try{
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = str;
      const c = ctx.fillStyle; // normalized to rgb(a)
      // extract numbers
      const m = c.match(/\d+/g).map(Number);
      return { r:m[0], g:m[1], b:m[2] };
    }catch(e){ return {r:212,g:175,b:55}; }
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; }
    else{
      const d=max-min;
      s=l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d + (g<b?6:0); break;
        case g: h=(b-r)/d + 2; break;
        case b: h=(r-g)/d + 4; break;
      }
      h/=6;
    }
    return {h:h*360,s,l};
  }
  function mix(a,b,t){ // a,b: {r,g,b}  t in [0..1] (0=a,1=b)
    return { r:Math.round(a.r*(1-t)+b.r*t),
             g:Math.round(a.g*(1-t)+b.g*t),
             b:Math.round(a.b*(1-t)+b.b*t) };
  }
  function rgbaStr(c, alpha){ return `rgba(${c.r},${c.g},${c.b},${alpha})`; }

  // Dynamic target color: blend GOLD with archetype overlay tone
  const GOLD = {r:212,g:175,b:55};
  function computeTargetColor(){
    const arch = cssArchColor();
    const {h} = rgbToHsl(arch.r,arch.g,arch.b);
    // Hue-aware weights:
    // blue/cyan (180-240): cooler => favor overlay more (0.65)
    // pink/magenta (300-345): warmer => favor gold more (0.35 overlay)
    // green/teal (120-180): balanced (0.5)
    // else default (0.45)
    let t = 0.45;
    if (h>=180 && h<=240) t = 0.65;
    else if (h>=300 && h<=345) t = 0.35;
    else if (h>=120 && h<180) t = 0.5;
    // Nova tweak: if hue ~320 ±10 → even warmer (0.30 overlay)
    if (h>=310 && h<=330) t = 0.30;
    // Atlas tweak: if hue ~210 ±10 → even cooler (0.72 overlay)
    if (h>=200 && h<=220) t = 0.72;
    return mix(GOLD, arch, t);
  }

  // Canvas + WebAudio ----------------------------------------
  function ensureCanvas(){
    const host = document.getElementById('orbWrap') || document.querySelector('.arch-circle') || document.body;
    let cvs = host.querySelector('canvas.pulse-synth');
    if(!cvs){
      cvs = document.createElement('canvas');
      cvs.className = 'pulse-synth';
      host.appendChild(cvs);
    }
    return cvs;
  }

  let ctx, src, analyser, data, rafId;
  function initAudio(){
    if(ctx) return;
    try{
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      src = ctx.createMediaElementSource(media);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      data = new Uint8Array(analyser.frequencyBinCount);
    }catch(e){
      ctx = null;
    }
  }

  function startSynth(){
    const cvs = ensureCanvas();
    const dpr = Math.max(1, window.devicePixelRatio||1);
    function resize(){
      const rect = cvs.getBoundingClientRect();
      cvs.width = Math.round(rect.width * dpr);
      cvs.height = Math.round(rect.height * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const g = cvs.getContext('2d');
    let t = 0;
    let cached = computeTargetColor();
    let changeTick = 0;

    function strokeArch(alpha){
      // Occasionally refresh in case --arch-color changed
      if ((++changeTick % 30) === 0) cached = computeTargetColor();
      return rgbaStr(cached, alpha);
    }

    function drawFallback(){
      const {width:w, height:h} = cvs;
      g.clearRect(0,0,w,h);
      g.globalCompositeOperation = 'screen';
      const cx = w/2, cy = h/2;
      const R = Math.min(w,h)*0.38;
      const rings = 6;
      for(let i=0;i<rings;i++){
        const r = R*(0.42 + i*0.12 + 0.06*Math.sin( (t*0.01) + i ));
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI*2);
        g.strokeStyle = strokeArch(0.18 - i*0.02);
        g.lineWidth = Math.max(1, r*0.004);
        g.shadowColor = strokeArch(0.22);
        g.shadowBlur = 8;
        g.stroke();
      }
      t += 16;
    }

    function drawAnalyser(){
      const {width:w, height:h} = cvs;
      g.clearRect(0,0,w,h);
      g.globalCompositeOperation = 'screen';

      const cx = w/2, cy = h/2;
      const baseR = Math.min(w,h)*0.22;
      const maxR = Math.min(w,h)*0.46;
      if(analyser && data){
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for(let i=0;i<data.length;i++){ sum += Math.abs(data[i]-128); }
        const avg = sum / data.length;
        const gain = Math.min(1, avg/26);

        const rings = 7;
        for(let r=0;r<rings;r++){
          const p = r/(rings-1);
          const radius = baseR + (maxR-baseR)*p*(0.8 + 0.2*Math.sin((t*0.01)+(r*0.55)));
          g.beginPath();
          g.arc(cx, cy, radius*(1+0.14*gain), 0, Math.PI*2);
          g.strokeStyle = strokeArch(0.10 + 0.25*(1-p)*gain);
          g.lineWidth = Math.max(1, radius*0.0048*(0.55+gain));
          g.shadowColor = strokeArch(0.28);
          g.shadowBlur = 10*(0.5+gain);
          g.stroke();
        }
        const grd = g.createRadialGradient(cx,cy, baseR*0.10, cx,cy, maxR*0.9);
        // inner glow adapts as well
        const inner = strokeArch(0.16 + 0.12*gain);
        const outer = strokeArch(0);
        grd.addColorStop(0, inner);
        grd.addColorStop(1, outer);
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx,cy, maxR, 0, Math.PI*2);
        g.fill();
      }else{
        drawFallback();
      }
      t += 16;
    }

    function loop(){
      drawAnalyser();
      rafId = requestAnimationFrame(loop);
    }
    if(!rafId) loop();

    cvs.classList.add('active');
    return () => {
      cvs.classList.remove('active');
      cancelAnimationFrame(rafId); rafId = null;
      const g2 = cvs.getContext('2d');
      g2 && g2.clearRect(0,0,cvs.width,cvs.height);
    };
  }

  let stopSynth = null;

  async function handlePlay(){
    try{ if(ctx && ctx.state === 'suspended') await ctx.resume(); }catch(e){}
    initAudio();
    if(!stopSynth) stopSynth = startSynth();
  }
  function handlePause(){ if(stopSynth){ stopSynth(); stopSynth = null; } }

  media.addEventListener('play', handlePlay);
  media.addEventListener('playing', handlePlay);
  media.addEventListener('pause', handlePause);
  media.addEventListener('ended', handlePause);

  if(!media.paused && !media.ended){ handlePlay(); }
})();
