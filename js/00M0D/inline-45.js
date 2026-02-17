
(() => {
  const A4_432 = 432, A4_440 = 440, BASE_220 = 220;
  const storage = {
    get(k, def){ try{ return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(def)); }catch(_){ return def; } },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  };

  // ===== Synth plumbing =====
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  const master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);

  function envGain(a=0.01, d=0.15, s=0.6, r=0.2){
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, AC.currentTime);
    const now = AC.currentTime;
    g.gain.exponentialRampToValueAtTime(1.0, now + a);
    g.gain.exponentialRampToValueAtTime(s, now + a + d);
    g.release = () => {
      const t = AC.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value || 0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + r);
      setTimeout(()=> g.disconnect(), r*1000 + 50);
    };
    return g;
  }

  function biquad(type="lowpass", freq=1200, Q=0.7){
    const f = AC.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = Q;
    return f;
  }

  function lfo(targetParam, rate=4.0, depth=30, isHz=true){
    const o = AC.createOscillator(); o.type = "sine";
    const g = AC.createGain(); g.gain.value = isHz ? depth : targetParam.value * depth;
    o.connect(g); g.connect(targetParam); o.start();
    o.onended = () => { try{g.disconnect();}catch(_){} };
    o.frequency.value = rate;
    return o;
  }

  function noise(){
    const b = AC.createBuffer(1, AC.sampleRate * 1.5, AC.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
    const src = AC.createBufferSource(); src.buffer = b; src.loop = true;
    return src;
  }

  function waveshaper(amount=2.0){
    const n = 1024, c = new Float32Array(n);
    for(let i=0;i<n;i++){ const x = i*2/n-1; c[i] = Math.tanh(amount*x); }
    const ws = AC.createWaveShaper(); ws.curve = c; ws.oversample = '4x';
    return ws;
  }

  function delay(ms=120, fb=0.25, wet=0.3){
    const d = AC.createDelay(); d.delayTime.value = ms/1000;
    const g = AC.createGain(); g.gain.value = fb;
    const mix = AC.createGain(); mix.gain.value = wet;
    d.connect(g); g.connect(d); // feedback loop
    return { node:d, fb:g, mix };
  }

  // ===== Archetype param table (visual already exists) =====
  const defs = {
    atlas:   { phrase:"Eu organizo o fluxo com sabedoria cósmica", overlay:"rgba(64,158,255,.22)", osc:"sawtooth",  env:[0.02,0.18,0.7,0.18], filt:["lowpass",1400,0.9], lfo:{rate:2.0, depth:8, target:"filter"} },
    nova:    { phrase:"Ideias são sementes! Vamos colorir fora das linhas", overlay:"rgba(255,82,177,.22)", osc:"sine", env:[0.01,0.10,0.4,0.18], glide:true, noise:true, filt:["highpass",900,0.6], lfo:{rate:5.5, depth:20, target:"pitch"} },
    vitalis: { phrase:"Ação agora! Cada segundo é combustível", overlay:"rgba(34,211,146,.22)", osc:"sawtooth", env:[0.005,0.06,0.5,0.09], filt:["lowpass",1600,0.6], lfo:{rate:7.5, depth:0.25, target:"amp"} },
    pulse:   { phrase:"Sinta a corrente… você não está sozinho", overlay:"rgba(0,191,255,.22)",  osc:"sine", env:[0.02,0.18,0.8,0.25], filt:["lowpass",1100,0.7], lfo:{rate:1.8, depth:0.45, target:"amp"}, delay:[140,0.35,0.25] },
    artemis: { phrase:"O mapa é só o começo. Onde queremos ir?", overlay:"rgba(255,140,60,.22)", osc:"triangle", env:[0.01,0.12,0.6,0.16], sweep:true, filt:["bandpass",1500,1.2], lfo:{rate:3.0, depth:60, target:"filter"} },
    serena:  { phrase:"Respire. Este espaço é seu.", overlay:"rgba(120,200,255,.18)", osc:"sine", env:[0.25,0.6,0.85,0.8], filt:["lowpass",800,0.9], lfo:{rate:0.6, depth:0.2, target:"amp"}, delay:[220,0.45,0.35] },
    kaos:    { phrase:"Quebre as regras. O caos é a verdadeira ordem.", overlay:"rgba(255,77,109,.22)", osc:"square", env:[0.004,0.05,0.5,0.06], filt:["highpass",1200,0.4], noise:true, drive:3.2, lfo:{rate:9.0, depth:120, target:"filter"} },
    genus:   { phrase:"Mãos à obra! Vamos construir o impossível.", overlay:"rgba(82,255,177,.20)", osc:"square", env:[0.01,0.10,0.5,0.14], fm:{ratio:2.0, index:70}, filt:["bandpass",1400,1.1] },
    lumine:  { phrase:"Ria! A luz está em você!", overlay:"rgba(180,200,255,.20)", osc:"triangle", env:[0.005,0.08,0.6,0.12], arp:[0,4,7,12], lfo:{rate:5.5, depth:40, target:"pitch"} },
    solus:   { phrase:"O silêncio guarda respostas que o barulho ignora.", overlay:"rgba(220,240,255,.16)", osc:"sine", env:[0.6,0.8,0.9,1.2], filt:["lowpass",620,1.0] },
    rhea:    { phrase:"Somos fios da mesma teia cósmica", overlay:"rgba(255,220,120,.18)", osc:"sawtooth", env:[0.08,0.35,0.75,0.5], phaser:true, filt:["lowpass",1000,0.7] },
    aion:    { phrase:"Sou o tempo vivo, ritmo da eternidade", overlay:"rgba(100,240,255,.16)", osc:"sine", env:[0.005,0.05,0.6,0.05], clock:true, filt:["highpass",400,0.8] }
  };

  // Persist/restore custom packs
  const packKey = "infodose:archetypes.pack";
  const saved = storage.get(packKey, null);
  if (saved) Object.assign(defs, saved);

  // Global tuning
  const tuneKey = "infodose:tuning";
  const tuning = storage.get(tuneKey, {A4:A4_432});
  const hz = (semi=0) => (tuning.A4 || A4_432) * Math.pow(2, semi/12);

  function trig(arch){
    const d = defs[arch]; if(!d) return;
    // voice chain
    const out = master;
    const g = envGain(...(d.env||[0.01,0.1,0.6,0.2])); g.connect(out);

    // filter
    const f = d.filt ? biquad(...d.filt) : null;
    if (f) { f.connect(g); }

    // source(s)
    const carrier = AC.createOscillator();
    carrier.type = d.osc || "sine";
    // base freq pick: a simple chord degree mapping per arch
    let base = BASE_220; // A3 ~ 220Hz base
    if (arch==="atlas") base = hz(-12);
    if (arch==="nova") base = hz(0);
    if (arch==="vitalis") base = hz(2);
    if (arch==="pulse") base = hz(-5);
    if (arch==="artemis") base = hz(7);
    if (arch==="serena") base = hz(-9);
    if (arch==="kaos") base = hz(5);
    if (arch==="genus") base = hz(12);
    if (arch==="lumine") base = hz(9);
    if (arch==="solus") base = hz(-12);
    if (arch==="rhea") base = hz(-7);
    if (arch==="aion") base = hz(0);

    carrier.frequency.value = base;

    // FM (Genus)
    let mod=null, modGain=null;
    if (d.fm){
      mod = AC.createOscillator(); mod.type = "sine"; mod.frequency.value = base * (d.fm.ratio||2);
      modGain = AC.createGain(); modGain.gain.value = d.fm.index||50;
      mod.connect(modGain); modGain.connect(carrier.frequency);
      mod.start();
    }

    // Noise / Drive
    let ns=null, ws=null;
    if (d.noise){
      ns = noise();
      if (f) ns.connect(f); else ns.connect(g);
      ns.start();
    }
    if (d.drive){
      ws = waveshaper(d.drive);
    }

    // Arp (Lumine)
    if (d.arp){
      const seq = d.arp; let i=0;
      const timer = setInterval(()=>{ carrier.frequency.setTargetAtTime(base*Math.pow(2, seq[i%seq.length]/12), AC.currentTime, .01); i++; }, 90);
      setTimeout(()=> clearInterval(timer), 500);
    }

    // Sweeps / Glide (Artemis/Nova)
    if (d.sweep){
      const now=AC.currentTime;
      const tgt = base*1.5;
      carrier.frequency.setTargetAtTime(tgt, now, .12);
      carrier.frequency.setTargetAtTime(base, now+.25, .22);
    }
    if (d.glide){
      const now=AC.currentTime;
      carrier.frequency.setTargetAtTime(base*1.25, now, .06);
      carrier.frequency.setTargetAtTime(base, now+.12, .08);
    }

    // Phaser (Rhea) rudimentary
    let phLFO=null, phaser=[];
    if (d.phaser){
      for(let k=0;k<3;k++){ const bp=biquad("bandpass", 400*(k+1), 8); phaser.push(bp); if(k===0){ if(f) f.connect(bp); else carrier.connect(bp); } else phaser[k-1].connect(bp); }
      phaser[phaser.length-1].connect(g);
      phLFO = lfo(phaser[0].frequency, 0.25, 220, true);
    }

    // Clock (Aion)
    if (d.clock){
      // simple click train synced to 90 bpm (change with ronda)
      const bpm = 90; const beat = 60/bpm;
      for(let k=0;k<6;k++){
        const t = AC.currentTime + k*beat;
        const kosc = AC.createOscillator(); kosc.type="square"; kosc.frequency.value = hz(24);
        const kg = AC.createGain(); kg.gain.value = 0.0001;
        kosc.connect(kg); if (f) kg.connect(f); else kg.connect(g);
        kg.gain.setValueAtTime(0.6, t); kg.gain.exponentialRampToValueAtTime(0.0001, t+0.08);
        kosc.start(t); kosc.stop(t+0.09);
      }
    }

    // Delay (Pulse, Serena)
    let dnode=null;
    if (d.delay){
      const {node, fb, mix} = delay(...d.delay);
      dnode = node; const tap = AC.createGain(); tap.gain.value = 1.0;
      if (f) { if (ws){ carrier.connect(ws); ws.connect(f); } else { carrier.connect(f); } f.connect(node); node.connect(fb); node.connect(mix); mix.connect(g); }
      else   { if (ws){ carrier.connect(ws); ws.connect(node); } else { carrier.connect(node); } node.connect(fb); node.connect(mix); mix.connect(g); }
    }

    // LFO target
    let oLFO=null;
    if (d.lfo){
      if (d.lfo.target==="filter" && f) oLFO = lfo(f.frequency, d.lfo.rate, d.lfo.depth, true);
      else if (d.lfo.target==="amp")     oLFO = lfo(g.gain, d.lfo.rate, d.lfo.depth, false);
      else if (d.lfo.target==="pitch")   oLFO = lfo(carrier.frequency, d.lfo.rate, d.lfo.depth, true);
    }

    // Connect & start
    if (!d.phaser){
      if (f) { if (ws){ carrier.connect(ws); ws.connect(f); } else { carrier.connect(f); } f.connect(g); }
      else   { if (ws){ carrier.connect(ws); ws.connect(g); } else { carrier.connect(g); } }
    }
    carrier.start();

    // Release
    setTimeout(()=>{
      try{carrier.stop();}catch(_){}
      if (ns) try{ns.stop();}catch(_){}
      g.release();
      [f, ws, dnode, mod, modGain, oLFO, phLFO, ...phaser].forEach(n=>{ try{n.disconnect();}catch(_){} });
    }, 520);
  }

  // Hook BUS
  if (window.InfodoseBus && window.InfodoseBus.on){
    InfodoseBus.on('ARCH_PULSE', e => {
      // tuning hooks (central modulators)
      const a = (e.arch||"").toLowerCase();
      if (a==="koblux" || a==="kobllux" || a==="kobluxx"){ tuning.A4 = A4_432; storage.set(tuneKey, tuning); }
      if (a==="kodux"){ tuning.A4 = A4_440; storage.set(tuneKey, tuning); }
      if (a==="bllue" || a==="blue"){ tuning.A4 = BASE_220*2; storage.set(tuneKey, tuning); } // 220*2=440 as variant
      trig(e.arch);
    });
  }

  // Save / Load pack
  function savePack(){
    const blob = new Blob([JSON.stringify(defs,null,2)], {type:"application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "infodose_archetypes_pack.json";
    a.click();
    storage.set(packKey, defs);
  }
  function loadPack(obj){
    try{
      Object.assign(defs, obj||{});
      storage.set(packKey, defs);
      alert("Pack importado!");
    }catch(e){ alert("Falha ao importar pack."); }
  }

  // Wire buttons
  const btnSv = document.getElementById('ibPackSave');
  const btnLd = document.getElementById('ibPackLoad');
  const inLd  = document.getElementById('ibPackIn');
  if (btnSv) btnSv.addEventListener('click', savePack);
  if (btnLd) btnLd.addEventListener('click', ()=> inLd.click());
  if (inLd)  inLd.addEventListener('change', async (ev)=>{
    const file = ev.target.files && ev.target.files[0]; if(!file) return;
    const txt = await file.text(); loadPack(JSON.parse(txt));
  });
})();
