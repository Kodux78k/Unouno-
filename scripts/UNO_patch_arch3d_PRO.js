
/*!
 * UNO_patch_arch3d_PRO.js — Cinema Ready
 * Features:
 * - Canonical 12 archetypes + aliases
 * - PBR MeshPhysical w/ HDRI (RGBELoader) + clearcoat
 * - UnrealBloomPass + SSAOPass (EffectComposer pipeline)
 * - Audio-reactive (mic): bloom strength, emissive, scale, particle velocity
 * - Particles orbiting + color sync + voice button solid icon
 * - Toon mode (MeshToonMaterial) toggle
 * - Control Panel (UI) with sliders/toggles
 *
 * Requires (CDNs included in HTML):
 *  three.min.js, RGBELoader, EffectComposer, RenderPass, UnrealBloomPass, SSAOPass, CopyShader, ShaderPass
 */
(function(){
  const CANON = ['atlas','nova','vitalis','pulse','artemis','serena','kaos','genus','lumine','rhea','solus','aion'];
  const ALIAS = { lumine:['luxara'], serena:['elysha'], aion:['kaion'], artemis:['horus'] };
  const SOLID = {
    atlas:{kind:'cube',   color:'#409eff'},
    nova:{kind:'icosa',   color:'#ff52b1'},
    vitalis:{kind:'tetra',color:'#34d399'},
    pulse:{kind:'octa',   color:'#f472b6'},
    artemis:{kind:'dodeca',color:'#22d3ee'},
    serena:{kind:'octa',  color:'#a78bfa'},
    kaos:{kind:'tetra',   color:'#ff4d6d'},
    genus:{kind:'dodeca', color:'#57cf70'},
    lumine:{kind:'icosa', color:'#ffd54f'},
    rhea:{kind:'octa',    color:'#00d1b2'},
    solus:{kind:'dodeca', color:'#b691ff'},
    aion:{kind:'icosa',   color:'#ff9f43'},
    default:{kind:'cube', color:'#ffffff'}
  };
  const $ = (q,r=document)=>r.querySelector(q);

  function ensureThree(onReady){
    if (window.THREE && THREE.Scene && THREE.EffectComposer) return onReady();
    const check = setInterval(()=>{
      if (window.THREE && THREE.Scene && THREE.EffectComposer) {
        clearInterval(check); onReady();
      }
    }, 50);
  }

  const select = $('#arch-select');
  const frame  = $('#arch-frame');
  const circle = $('.arch-circle');
  const fade   = $('#arch-fadeCover');
  if (!select || !frame || !circle) return;

  async function exists(path){
    try { const res = await fetch(path,{method:'HEAD',cache:'no-store'}); return res.ok; }
    catch(e){ try{ const r2 = await fetch(path,{method:'GET',headers:{'Range':'bytes=0-16'},cache:'no-store'}); return r2.ok; } catch { return false; } }
  }
  async function resolveFile(base){
    const tries = [base].concat(ALIAS[base]||[]);
    for (const key of tries){
      const file = `./archetypes/${key}.html`;
      if (await exists(file)) return { key, file };
    }
    return { key: base, file: `./archetypes/${base}.html` };
  }

  let resolved = [];
  async function rebuildSelect(){
    select.innerHTML=''; resolved=[];
    for (const k of CANON){
      const it = await resolveFile(k);
      resolved.push(it);
      const opt = document.createElement('option');
      opt.value = it.file; opt.textContent = it.key + '.html'; opt.dataset.key = it.key;
      select.appendChild(opt);
    }
    let idx = 0;
    const cur = (frame.getAttribute('src')||'').toLowerCase();
    if (cur){ const j = resolved.findIndex(x => cur.includes('/'+x.key+'.html')); if (j>=0) idx = j; }
    setByIndex(idx, true);
  }

  function setByIndex(i, noFade){
    const n = (i % resolved.length + resolved.length) % resolved.length;
    select.selectedIndex = n;
    const it = resolved[n];
    if (!noFade && fade) fade.classList.add('show');
    frame.src = it.file;
    updateSolid(it.key);
    if (!noFade && fade) setTimeout(()=>fade.classList.remove('show'), 200);
    try { if (typeof window.updateHomeStatus==='function') window.updateHomeStatus(); } catch {}
  }

  const btnPrev = $('#arch-prev'), btnNext = $('#arch-next');
  if (btnPrev) btnPrev.addEventListener('click', ()=> setByIndex(select.selectedIndex - 1));
  if (btnNext) btnNext.addEventListener('click', ()=> setByIndex(select.selectedIndex + 1));
  select.addEventListener('change', ()=> setByIndex(select.selectedIndex));

  // 3D
  let renderer, scene, camera, mesh, wire, particles, rim, composer, bloomPass, ssaoPass, renderPass, raf;
  let hdrEquirect, pmrem;
  const layer = document.createElement('div');
  layer.id = 'arch3d-layer';
  Object.assign(layer.style, { position:'absolute', inset:'0', zIndex:65, pointerEvents:'none' });
  circle.appendChild(layer);

  // Audio-reactive
  let analyser, dataArray, audioActive=false, audioLevel=0;

  // Control state
  const CTRL = {
    mode: 'pbr',                // 'pbr' | 'toon'
    bloomStrength: 0.9,
    bloomThreshold: 0.2,
    bloomRadius: 0.6,
    ssao: true,
    exposure: 1.0,
    particles: 900,
    mic: false
  };

  function geoByKind(kind){
    const T = window.THREE;
    switch((kind||'').toLowerCase()){
      case 'tetra':  return new T.TetrahedronGeometry(0.9, 0);
      case 'octa':   return new T.OctahedronGeometry(0.9, 0);
      case 'dodeca': return new T.DodecahedronGeometry(0.9, 0);
      case 'icosa':  return new T.IcosahedronGeometry(0.9, 0);
      case 'cube':
      default:       return new T.BoxGeometry(1.2,1.2,1.2);
    }
  }

  function init3D(){
    const T = window.THREE;
    renderer = new T.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CTRL.exposure;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.0);

    layer.appendChild(renderer.domElement);
    window.addEventListener('resize', resize);

    // Composer
    composer = new T.EffectComposer(renderer);
    renderPass = new T.RenderPass(scene, camera);
    bloomPass  = new T.UnrealBloomPass(new T.Vector2(1,1), CTRL.bloomStrength, CTRL.bloomRadius, CTRL.bloomThreshold);
    ssaoPass   = new T.SSAOPass(scene, camera, circle.clientWidth, circle.clientHeight);
    ssaoPass.kernelRadius = 8;
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(ssaoPass);

    // HDRI (equirectangular)
    // Public HDRI example (small). If blocked, we'll fallback to PMREM of a tiny canvas.
    const hdrURL = "https://raw.githubusercontent.com/gkjohnson/threejs-sandbox/master/assets/environment/royal_esplanade_1k.hdr";
    const loader = new T.RGBELoader();
    loader.setDataType(T.UnsignedByteType).load(hdrURL, (tex)=>{
      tex.mapping = T.EquirectangularReflectionMapping;
      hdrEquirect = tex;
      pmrem = new T.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(hdrEquirect).texture;
    }, undefined, ()=>{
      // Fallback env
      const cvs=document.createElement('canvas'); cvs.width=cvs.height=16; const ctx=cvs.getContext('2d');
      ctx.fillStyle = '#101010'; ctx.fillRect(0,0,16,16); ctx.fillStyle = '#1d1d1d'; ctx.fillRect(0,0,16,8);
      const envTex = new T.CanvasTexture(cvs); envTex.mapping = T.EquirectangularReflectionMapping;
      scene.environment = envTex;
    });
  }

  function makeParticles(colorHex){
    const T = window.THREE;
    const COUNT = CTRL.particles;
    const g = new T.BufferGeometry();
    const pos = new Float32Array(COUNT*3);
    for (let i=0;i<COUNT;i++){
      const r = 1.5 + Math.random()*1.0;
      const th = Math.random()*Math.PI*2;
      const ph = Math.acos(2*Math.random()-1);
      pos[i*3+0] = r*Math.sin(ph)*Math.cos(th);
      pos[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      pos[i*3+2] = r*Math.cos(ph);
    }
    g.setAttribute('position', new T.BufferAttribute(pos,3));
    const m = new T.PointsMaterial({ size: 0.02, color: colorHex || 0xffffff, transparent:true, opacity:0.6, depthWrite:false });
    return new T.Points(g,m);
  }

  function dispose(obj){
    if (!obj) return;
    try{
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material){
        if (Array.isArray(obj.material)) obj.material.forEach(m=>m.dispose());
        else obj.material.dispose();
      }
    }catch(e){}
  }

  function setSolid(kind, colorHex){
    const T = window.THREE;
    if (mesh){ scene.remove(mesh); dispose(mesh); mesh=null; }
    if (wire){ scene.remove(wire); dispose(wire); wire=null; }
    if (particles){ scene.remove(particles); dispose(particles); particles=null; }
    if (rim){ scene.remove(rim); dispose(rim); rim=null; }

    const geo = geoByKind(kind);
    const col = new T.Color(colorHex || '#ffffff');

    if (CTRL.mode === 'toon'){
      const tmat = new T.MeshToonMaterial({ color: col.getHex() });
      mesh = new T.Mesh(geo, tmat);
    } else {
      const pmat = new T.MeshPhysicalMaterial({
        color: col.getHex(),
        metalness: 0.42,
        roughness: 0.22,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        reflectivity: 0.9,
        envMapIntensity: 1.0,
        emissive: col.clone().multiplyScalar(0.06),
        transparent: true,
        opacity: 0.98
      });
      mesh = new T.Mesh(geo, pmat);
    }

    const wmat = new T.LineBasicMaterial({ color: col.clone().lerp(new T.Color(0xffffff),0.2).getHex(), transparent:true, opacity:0.45 });
    wire = new T.LineSegments(new T.EdgesGeometry(geo), wmat);

    const rimMat = new T.MeshBasicMaterial({ color: col.getHex(), transparent:true, opacity:0.08, blending: T.AdditiveBlending });
    rim = new T.Mesh(geo.clone(), rimMat); rim.scale.multiplyScalar(1.02);

    particles = makeParticles(col.getHex());

    scene.add(mesh); scene.add(wire); scene.add(rim); scene.add(particles);
    camera.position.set(0,0, ['tetra','octa'].includes(kind) ? 2.6 : (kind==='cube'?3.4:3.0));
  }

  function resize(){
    if (!renderer || !camera) return;
    const w = circle.clientWidth, h = circle.clientHeight;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    if (ssaoPass) ssaoPass.setSize(w, h);
    camera.aspect = Math.max(w/h, 0.0001);
    camera.updateProjectionMatrix();
  }

  function animate(){
    const T = window.THREE, t = performance.now()*0.001;

    // audio level 0..1
    let lvl = 0;
    if (audioActive && analyser && dataArray){
      analyser.getByteFrequencyData(dataArray);
      let sum=0; for (let i=0;i<dataArray.length;i++) sum += dataArray[i];
      lvl = (sum / dataArray.length) / 255;
      audioLevel = audioLevel*0.8 + lvl*0.2; // smoothing
    }

    // animate solid
    if (mesh){ mesh.rotation.x = t*0.3; mesh.rotation.y = t*0.45; const s = 1 + Math.sin(t*2)*0.02 + audioLevel*0.05; mesh.scale.setScalar(s);
      if (mesh.material && mesh.material.emissive) mesh.material.emissiveIntensity = 0.6 + audioLevel*1.0;
    }
    if (wire){ wire.rotation.x = t*0.3; wire.rotation.y = t*0.45; }
    if (rim){ rim.rotation.x = t*0.3; rim.rotation.y = t*0.45; rim.material.opacity = 0.06 + audioLevel*0.12; }
    if (particles){ particles.rotation.y = t*(0.12 + audioLevel*0.4); particles.rotation.x = Math.sin(t*0.25)*(0.04 + audioLevel*0.1); }

    // post
    renderer.toneMappingExposure = CTRL.exposure;
    if (bloomPass){
      bloomPass.threshold = CTRL.bloomThreshold;
      bloomPass.radius    = CTRL.bloomRadius;
      bloomPass.strength  = CTRL.bloomStrength + audioLevel*0.6;
    }
    if (ssaoPass){ ssaoPass.enabled = !!CTRL.ssao; }

    composer ? composer.render() : renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  // Voice icon
  const voiceBtn = $('#btnVoice') || $('#archAudioBtn') || $('#homeVoiceBtn');
  const SVGs = {
    cube:    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 7l9-5 9 5v10l-9 5-9-5V7z"/><path fill="#fff" opacity=".2" d="M12 2v20"/></svg>',
    tetra:   '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l9 18H3L12 3z"/></svg>',
    octa:    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2l8 10-8 10L4 12 12 2z"/></svg>',
    dodeca:  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 3h10l5 7-5 7H7L2 10 7 3z"/></svg>',
    icosa:   '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/><path d="M12 2l6 10-6 10L6 12 12 2z"/></svg>'
  };
  function setVoiceIcon(kind, color){
    if (!voiceBtn) return;
    const svg = SVGs[kind] || SVGs.cube;
    voiceBtn.innerHTML = svg;
    voiceBtn.style.color = color||'#fff';
    voiceBtn.title = `Sólido: ${kind}`;
  }

  function updateSolid(key){
    const meta = SOLID[key] || SOLID.default;
    setSolid(meta.kind, meta.color);
    if (particles && particles.material) {
      particles.material.color.set(meta.color);
      particles.material.needsUpdate = true;
    }
    setVoiceIcon(meta.kind, meta.color);
  }

  // Control Panel UI
  function buildPanel(){
    const ui = document.createElement('div');
    ui.id = 'arch3d-panel';
    ui.innerHTML = `
      <style>
      #arch3d-panel{position:absolute; right:8px; top:8px; z-index:99; background:rgba(0,0,0,.55);
        border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:10px; color:#fff; font:12px/1.3 Inter,system-ui,Arial}
      #arch3d-panel .row{display:flex; align-items:center; gap:6px; margin:6px 0}
      #arch3d-panel input[type=range]{width:120px}
      #arch3d-panel label{opacity:.9; min-width:86px; display:inline-block}
      #arch3d-panel .title{font-weight:700; margin-bottom:6px; opacity:.95}
      #arch3d-panel .small{opacity:.8; font-size:11px}
      </style>
      <div class="title">KOBLUX • Cinema Controls</div>
      <div class="row"><label>Mode</label>
        <select id="ui_mode"><option value="pbr">PBR</option><option value="toon">Toon</option></select>
      </div>
      <div class="row"><label>Exposure</label><input id="ui_exposure" type="range" min="0.3" max="1.8" step="0.01" value="${CTRL.exposure}"><span class="small" id="tx_exposure">${CTRL.exposure}</span></div>
      <div class="row"><label>Bloom Str.</label><input id="ui_bloomS" type="range" min="0" max="2" step="0.01" value="${CTRL.bloomStrength}"><span class="small" id="tx_bloomS">${CTRL.bloomStrength}</span></div>
      <div class="row"><label>Bloom Thres.</label><input id="ui_bloomT" type="range" min="0" max="1" step="0.01" value="${CTRL.bloomThreshold}"><span class="small" id="tx_bloomT">${CTRL.bloomThreshold}</span></div>
      <div class="row"><label>Bloom Radius</label><input id="ui_bloomR" type="range" min="0" max="1" step="0.01" value="${CTRL.bloomRadius}"><span class="small" id="tx_bloomR">${CTRL.bloomRadius}</span></div>
      <div class="row"><label>SSAO</label><input id="ui_ssao" type="checkbox" ${CTRL.ssao?'checked':''}></div>
      <div class="row"><label>Particles</label><input id="ui_particles" type="range" min="200" max="2000" step="50" value="${CTRL.particles}"><span class="small" id="tx_particles">${CTRL.particles}</span></div>
      <div class="row"><label>Mic</label><button id="ui_mic">${CTRL.mic?'Stop':'Start'}</button></div>
    `;
    circle.appendChild(ui);

    const Q = id=>ui.querySelector(id);
    Q('#ui_mode').value = CTRL.mode;
    Q('#ui_mode').addEventListener('change', e=>{ CTRL.mode = e.target.value; updateSolid((select.options[select.selectedIndex].dataset.key)); });
    Q('#ui_exposure').addEventListener('input', e=>{ CTRL.exposure = parseFloat(e.target.value); Q('#tx_exposure').textContent = CTRL.exposure.toFixed(2); });
    Q('#ui_bloomS').addEventListener('input', e=>{ CTRL.bloomStrength = parseFloat(e.target.value); Q('#tx_bloomS').textContent = CTRL.bloomStrength.toFixed(2); });
    Q('#ui_bloomT').addEventListener('input', e=>{ CTRL.bloomThreshold = parseFloat(e.target.value); Q('#tx_bloomT').textContent = CTRL.bloomThreshold.toFixed(2); });
    Q('#ui_bloomR').addEventListener('input', e=>{ CTRL.bloomRadius = parseFloat(e.target.value); Q('#tx_bloomR').textContent = CTRL.bloomRadius.toFixed(2); });
    Q('#ui_ssao').addEventListener('change', e=>{ CTRL.ssao = e.target.checked; });
    Q('#ui_particles').addEventListener('input', e=>{
      CTRL.particles = parseInt(e.target.value,10);
      Q('#tx_particles').textContent = CTRL.particles;
      // rebuild particles preserving color
      const key = (select.options[select.selectedIndex].dataset.key);
      const color = (SOLID[key]||SOLID.default).color;
      if (particles){ scene.remove(particles); }
      particles = makeParticles(color);
      scene.add(particles);
    });
    Q('#ui_mic').addEventListener('click', async ()=>{
      if (!audioActive){
        try{
          const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const source = ctx.createMediaStreamSource(stream);
          analyser = ctx.createAnalyser(); analyser.fftSize = 512;
          dataArray = new Uint8Array(analyser.frequencyBinCount);
          source.connect(analyser);
          audioActive = true; CTRL.mic = true; Q('#ui_mic').textContent = 'Stop';
        }catch(e){ alert('Mic bloqueado: ' + e.message); }
      }else{
        audioActive = false; CTRL.mic = false; Q('#ui_mic').textContent = 'Start';
      }
    });
  }

  ensureThree(async ()=>{
    init3D();
    await rebuildSelect();
    buildPanel();
    cancelAnimationFrame(raf); animate();
    resize();
  });

  window.UNO_ARCH3D = { disableTint:true };
})();
