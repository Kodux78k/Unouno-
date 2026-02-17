
(function(){
  const $ = (q,r=document)=>r.querySelector(q);
  const LS = {
    get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
    set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
    raw:(k)=>localStorage.getItem(k)||''
  };

  // Migrate old keys → canonical
  try{
    const themeKeys=['uno:theme','theme','infodose:theme','dual:theme'];
    let theme=null;
    for(const k of themeKeys){ const v=localStorage.getItem(k); if(v && !theme){ theme=v; } }
    if(theme){ localStorage.setItem('uno:theme', theme); }
    const bgKeys=['uno:bg','bg','background','infodose:bg','dual:bg'];
    let bg=null;
    for(const k of bgKeys){ const v=localStorage.getItem(k); if(v && !bg){ bg=v; } }
    if(bg){ localStorage.setItem('uno:bg', bg); }
  }catch{}

  // Ensure BG container
  (function(){
    let bg=document.getElementById('custom-bg');
    if(!bg){
      bg=document.createElement('div');
      bg.id='custom-bg';
      bg.style.cssText='position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none';
      document.body.prepend(bg);
    }
  })();

  // No-flicker theme/bg applier
  function applyTheme_NoFlicker(forceSrc){
    const theme = LS.get('uno:theme','medium');
    if(theme==='default') delete document.body.dataset.theme;
    else document.body.dataset.theme = theme;

    const bgContainer = document.getElementById('custom-bg');
    if(!bgContainer) return;

    if(theme!=='custom'){
      if(bgContainer.firstChild) bgContainer.innerHTML='';
      return;
    }
    const data = forceSrc || LS.get('uno:bg','');
    if(!data){
      document.body.dataset.theme='medium';
      if(bgContainer.firstChild) bgContainer.innerHTML='';
      return;
    }
    const isVid = data.startsWith('data:video/');
    const cur = bgContainer.firstChild;
    if(cur){
      const sameType = (cur.tagName==='VIDEO' && isVid) || (cur.tagName==='IMG' && !isVid);
      if(sameType){
        if(cur.src !== data){ cur.src = data; }
        return;
      }
    }
    const el = document.createElement(isVid?'video':'img');
    el.src = data;
    if(isVid){ el.autoplay=true; el.loop=true; el.muted=true; el.playsInline=true; }
    el.style.width='100%'; el.style.height='100%'; el.style.objectFit='cover';
    if(cur){
      el.style.opacity='0';
      bgContainer.appendChild(el);
      requestAnimationFrame(()=>{
        el.style.transition='opacity .36s ease';
        el.style.opacity='1';
        setTimeout(()=>cur.remove(), 360);
      });
    }else{
      bgContainer.appendChild(el);
    }
  }

  // Wire Brain inputs if present
  document.addEventListener('DOMContentLoaded', ()=>{
    applyTheme_NoFlicker();
    const sel = document.getElementById('themeSelect');
    if(sel){
      sel.value = LS.get('uno:theme','medium');
      sel.addEventListener('change', ()=>{ LS.set('uno:theme', sel.value); applyTheme_NoFlicker(); });
    }
    const up = document.getElementById('bgUpload');
    if(up){
      up.addEventListener('change', (e)=>{
        const f = e.target.files && e.target.files[0];
        if(!f) return;
        const r = new FileReader();
        r.onload = ()=>{
          try{
            LS.set('uno:bg', r.result);
            LS.set('uno:theme','custom');
            if(sel) sel.value='custom';
            applyTheme_NoFlicker(r.result);
          }catch{}
        };
        r.readAsDataURL(f);
      });
    }
  });

  // ---- Archetype iframe fix (sandbox + path) ----
  (function(){
    const frame = document.getElementById('arch-frame') || document.querySelector('iframe#archetype, iframe[data-arch]');
    if(!frame) return;
    // ensure sandbox allows same-origin (for CSS, fonts, and localStorage used by archetypes)
    const want = 'allow-scripts allow-same-origin';
    try{
      const cur = (frame.getAttribute('sandbox')||'').toLowerCase();
      if(!/allow-same-origin/.test(cur)){
        frame.setAttribute('sandbox', (cur + ' ' + want).trim());
      }
    }catch{}
    // If src is only a filename (e.g., atlas.html), prefix with ./archetypes/
    try{
      const src = frame.getAttribute('src')||'';
      if(src && !/^\w+:|^\//.test(src) && !src.startsWith('./archetypes/')){
        frame.setAttribute('src', './archetypes/' + src.replace(/^\.\/?/,'').replace(/^archetypes\//,''));
      }
    }catch{}
    // Hook a select#arch-select if exists
    const sel = document.getElementById('arch-select');
    if(sel){
      sel.addEventListener('change', ()=>{
        const file = sel.value || '';
        if(!file) return;
        const clean = file.replace(/\.html$/i,'') + '.html';
        const newSrc = './archetypes/' + clean;
        const cur = frame.getAttribute('src')||'';
        if(cur!==newSrc){
          frame.src = newSrc;
        }
      });
    }
  })();
})();
