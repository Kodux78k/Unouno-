
(function(){
  // ---- Helpers ----
  function $(q, r=document){ return r.querySelector(q); }
  function baseName(file){ return String(file||'').replace(/\.html$/i,'').toLowerCase(); }

  // ---- Create orb-slot and move the iframe inside the orb ----
  function fuseIframeIntoOrb(){
    var wrap = $('#orbWrap');
    var frame = $('#arch-frame');
    if(!wrap || !frame) return;
    // If already fused, skip
    if (frame.parentElement && frame.parentElement.classList && frame.parentElement.classList.contains('orb-slot')) return;
    var slot = document.createElement('div');
    slot.className = 'orb-slot';
    // Insert slot above particles but below ring (order controlled by CSS z-index)
    wrap.appendChild(slot);
    // Move iframe inside slot
    slot.appendChild(frame);
  }

  // ---- Archetype persistence (uno:arch) + overlay/apply + Firestore sync ----
  function currentSelectBase(){
    var sel = $('#arch-select'); if(!sel) return '';
    var opt = sel.options[sel.selectedIndex];
    return baseName(opt && opt.value);
  }
  function applyArch(base){
    var sel = $('#arch-select'), frame = $('#arch-frame'), fade = $('#arch-fadeCover');
    if(!sel || !frame) return;
    var idx = -1;
    for (var i=0;i<sel.options.length;i++){
      if (baseName(sel.options[i].value) === base){ idx = i; break; }
    }
    if (idx >= 0){
      sel.selectedIndex = idx;
      if (fade) fade.classList.add('show');
      var file = sel.options[idx].value;
      frame.src = './archetypes/' + file;
      try { if (typeof window.applyArchOverlay === 'function') window.applyArchOverlay(base); } catch(_){}
      try { if (typeof window.speakArchetype === 'function') window.speakArchetype(base); } catch(_){}
      try { if (typeof window.updateHomeStatus === 'function') window.updateHomeStatus(); } catch(_){}
      setTimeout(function(){ if (fade) fade.classList.remove('show'); }, 240);
    }
  }
  function saveArch(base){
    if(!base) return;
    try { localStorage.setItem('uno:arch', base); } catch(_){}
    // If a shared app state exists, mirror and save remotely
    try {
      if (window.S && S.state){
        S.state.archetype = base;
        if (typeof window.saveState === 'function') saveState(S.state);
      }
    } catch(_){}
  }
  function bindArchPersistence(){
    var sel = $('#arch-select'), prev = $('#arch-prev'), next = $('#arch-next');
    function persist(){ var b=currentSelectBase(); if(b){ saveArch(b);} }
    if (sel) sel.addEventListener('change', persist, {passive:true});
    if (prev) prev.addEventListener('click', function(){ setTimeout(persist, 0); }, {passive:true});
    if (next) next.addEventListener('click', function(){ setTimeout(persist, 0); }, {passive:true});
    // Accept remote notifications
    window.addEventListener('message', function(ev){
      var d = ev && ev.data || {};
      if (d && d.type==='archReady' && d.name){
        var b = baseName(d.name);
        saveArch(b);
      }
    });
  }
  function bootWithSavedArch(){
    var saved = (localStorage.getItem('uno:arch') || localStorage.getItem('infodose:arch') || '').replace(/\.html$/i,'');
    saved = baseName(saved);
    if(saved){
      var cur = currentSelectBase();
      if (cur !== saved) applyArch(saved);
    } else {
      // Initialize with current
      saveArch(currentSelectBase());
    }
  }

  function start(){
    fuseIframeIntoOrb();
    bindArchPersistence();
    bootWithSavedArch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
