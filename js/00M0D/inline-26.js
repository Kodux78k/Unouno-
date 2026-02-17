
(function(){
  // Deduplicate style/script tags by id and ensure final patch order
  try{
    const ORDER = [
      'blue1Theme','customStyle','multiagent-styles','patch-blue1-theme',
      'overlay-defaults','ls-panel-css','show-app-title-css',
      'overlay-css-unify','overlay-guardian-css','orb-slot-css',
      'hdpro-override','ATOM_UI_PATCH','OVERLAY_BG_ONLY','ARCH_FAB_ROUND_FIX'
    ];
    const seen = new Set();
    // Remove duplicate style/script tags with same id (keep last)
    ['style','script'].forEach(tag=>{
      const els = Array.from(document.querySelectorAll(tag+'[id]'));
      for (let i=0;i<els.length;i++){
        const id = els[i].id;
        const dups = els.filter(e=>e.id===id);
        if (dups.length>1){
          dups.slice(0, -1).forEach(x=>x.parentNode && x.parentNode.removeChild(x));
        }
      }
    });
    // Re-append in canonical order near end of HEAD to lock cascade
    const head = document.head || document.querySelector('head');
    if (head){
      ORDER.forEach(id=>{
        const el = document.getElementById(id);
        if (el) head.appendChild(el);
      });
    }
  }catch(e){}

  // Service Worker updater (only when using external sw.js)
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async () => {
      try{
        const reg = await ((location.protocol==='https:'||location.protocol==='http:')?navigator.serviceWorker.register:()=>Promise.reject('sw_disabled'))('./sw.js', {scope:'./'});
        // Ask for update check on load
        try{ reg.update(); }catch{}
        // Auto-reload on new SW activation (once)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function(){
          if (refreshing) return; refreshing = true; location.reload();
        });
        // If there's a waiting worker, tell it to skipWaiting
        if (reg.waiting){
          reg.waiting.postMessage({type:'SKIP_WAITING'});
        }
        // Listen for waiting in future
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller){
              nw.postMessage({type:'SKIP_WAITING'});
            }
          });
        });
        // Handle message from SW
        navigator.serviceWorker.addEventListener('message', evt => {
          if (evt && evt.data && evt.data.type === 'RELOAD') location.reload();
        });
      }catch(e){/* ignore */}
    });
  }
})();
