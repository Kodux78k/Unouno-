
/*! arch3d_embed.js — per‑archetype 3D solid with Toon + Photographic Bloom
 *  Drop-in for files in ./archetypes/*.html (transparent background)
 *  Requires: three.js r155 (auto), postprocessing (auto)
 */
(function(){
  const NAME = (location.pathname.split('/').pop()||'').replace(/\.html$/i,'').toLowerCase();
  const MAP = {
    atlas:{ kind:'cube',   color:'#409eff' },
    nova:{ kind:'icosa',   color:'#ff52b1' },
    vitalis:{ kind:'tetra', color:'#34d399' },
    pulse:{ kind:'octa',   color:'#f472b6' },
    artemis:{ kind:'dodeca', color:'#22d3ee' },
    serena:{ kind:'dodeca', color:'#a78bfa' },   // per user request
    kaos:{ kind:'tetra',   color:'#ff4d6d' },
    genus:{ kind:'dodeca', color:'#57cf70' },
    lumine:{ kind:'icosa', color:'#ffd54f' },
    rhea:{ kind:'octa',    color:'#00d1b2' },
    solus:{ kind:'dodeca', color:'#b691ff' },
    aion:{ kind:'icosa',   color:'#ff9f43' }
  };
  function ensureThree(onReady){
    if (window.THREE && THREE.Scene) return onReady();
    const s = document.createElement('script');
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r155/three.min.js";
    s.onload = onReady; document.head.appendChild(s);
  }
  function ensurePostFX(onReady){
    if (window.THREE && THREE.UnrealBloomPass) return onReady();
    let q = 0;
    function add(src){
      const s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = ()=>{ q--; if (!q) onReady(); };
      s.onerror = ()=>{ q--; if (!q) onReady(); };
      document.head.appendChild(s); q++;
    }
    const cdn = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r155/examples/js/postprocessing";
    add(cdn + "/EffectComposer.js");
    add(cdn + "/RenderPass.js");
    add(cdn + "/UnrealBloomPass.js");
  }
  function makeGeometry(T, size){
    const THREE_ = window.THREE, s = size||1;
    switch(String(T||'cube').toLowerCase()){
      case 'tetra':  return new THREE_.TetrahedronGeometry(0.9*s, 0);
      case 'octa':   return new THREE_.OctahedronGeometry(0.9*s, 0);
      case 'dodeca': return new THREE_.DodecahedronGeometry(0.9*s, 0);
      case 'icosa':  return new THREE_.IcosahedronGeometry(0.9*s, 0);
      default:       return new THREE_.BoxGeometry(1.2*s,1.2*s,1.2*s);
    }
  }
  function hex(c){ try{ return new THREE.Color(c); }catch{return new THREE.Color(0xffffff)} }
  function init(){
    const cfg = MAP[NAME] || MAP.atlas;
    const root = document.body;
    // host container
    const box = document.createElement('div');
    Object.assign(box.style, { position:'fixed', inset:'0', pointerEvents:'none' });
    root.appendChild(box);
    const layer = document.createElement('div');
    Object.assign(layer.style, { position:'absolute', inset:'0'});
    box.appendChild(layer);

    const THREE_ = window.THREE;
    const renderer = new THREE_.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.outputColorSpace = THREE_.SRGBColorSpace;
    renderer.toneMapping = THREE_.ACESFilmicToneMapping;
    layer.appendChild(renderer.domElement);
    const scene = new THREE_.Scene();
    const camera = new THREE_.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    // Lights
    scene.add(new THREE_.AmbientLight(0xffffff, 0.7));
    const key = new THREE_.DirectionalLight(0xffffff, 1.2);
    key.position.set(2.2,2.5,3.2); scene.add(key);
    const rim = new THREE_.DirectionalLight(0xffffff, 0.8);
    rim.position.set(-2,-1.8,-2.5); scene.add(rim);

    // Solid
    const geo = makeGeometry(cfg.kind);
    const mat = new THREE_.MeshToonMaterial({
      color: hex(cfg.color),
      emissive: hex(cfg.color),
      emissiveIntensity: 0.25
    });
    const mesh = new THREE_.Mesh(geo, mat);
    scene.add(mesh);
    const wire = new THREE_.LineSegments(new THREE_.EdgesGeometry(geo),
      new THREE_.LineBasicMaterial({ color: 0xffffff, opacity: 0.28, transparent: true }));
    scene.add(wire);

    // Composer
    let composer, renderPass, bloomPass;
    function buildComposer(){
      renderPass = new THREE_.RenderPass(scene, camera);
      const v = new THREE_.Vector2(layer.clientWidth||512, layer.clientHeight||512);
      bloomPass  = new THREE_.UnrealBloomPass(v, 0.85, 0.62, 0.25);
      composer   = new THREE_.EffectComposer(renderer);
      composer.addPass(renderPass); composer.addPass(bloomPass);
    }

    function resize(){
      const w = layer.clientWidth, h = layer.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w/h; camera.updateProjectionMatrix();
      if (composer) composer.setSize(w, h);
    }
    window.addEventListener('resize', resize); resize();

    // Animate
    function loop(t){
      const k = (t||0) * 0.001;
      mesh.rotation.x = k * 0.3; mesh.rotation.y = k * 0.45;
      mesh.scale.setScalar(1 + Math.sin(k*2)*0.02);
      wire.rotation.copy(mesh.rotation);
      if (composer) composer.render(); else renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    ensurePostFX(()=>{ try{ buildComposer(); }catch(e){} });
    requestAnimationFrame(loop);
  }
  ensureThree(init);
})();
