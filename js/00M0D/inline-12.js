
(function(){
  function ensure(){
    if(document.getElementById('ls-panel-js') || document.getElementById('lsModal')) return;
    fetch('lspanel.snpt', {cache:'no-store'}).then(r => r.ok ? r.text(): null).then(txt => {
      if(!txt) return;
      document.body.insertAdjacentHTML('beforeend', txt);
      setTimeout(function(){
        try{
          if(window.DualLS && typeof window.DualLS.render==='function'){ window.DualLS.render(); }
        }catch(e){}
      }, 50);
    }).catch(()=>{});
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', ensure); } else { ensure(); }
})();
