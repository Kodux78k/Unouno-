
(function(){
  // Remove apenas ids legados conhecidos, preservando #lsModal e #lsPanel
  const LEGACY = [
    'modalLS','localStorageModal','lsWindow','lsPopup','modal-localstorage',
    'local-storage-modal','ls-modal-old','oldLsModal','modalLocalStorage','modal-ls'
  ];
  function clean(){
    try{
      LEGACY.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.remove();
      });
      // Opcional: fecha modais legados que venham com classes genéricas
      document.querySelectorAll('.modal,[role="dialog"]').forEach(el=>{
        if(el.id && (el.id==='lsModal' || el.id==='lsPanel')) return;
        if(el.closest('#lsModal')) return;
        if(/localstorage|modal-ls|ls-?old/i.test(el.id||'') || /localstorage/i.test(el.className||'')){
          el.remove();
        }
      });
    }catch(e){}
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', clean); } else { clean(); }
})();
