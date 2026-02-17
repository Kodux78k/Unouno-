
(function(){
  function bind(){
    var b = document.getElementById('lsRefresh');
    if(b){ b.onclick = function(){ try{ location.reload(); }catch(e){} }; }
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', bind); } else { bind(); }
})();
