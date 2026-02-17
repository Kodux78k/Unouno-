
(function(){
  function initArchSelect(){
    var sel=document.getElementById('arch-select'); if(!sel) return;
    var saved=(localStorage.getItem('uno:arch')||localStorage.getItem('infodose:arch')||'').replace(/\.html$/i,'');
    var idx=-1;
    for(var i=0;i<sel.options.length;i++){
      var v=sel.options[i].value.replace(/\.html$/i,'');
      if(saved && v===saved){ idx=i; break; }
    }
    sel.selectedIndex = idx; // -1 = nenhum, evita default 'atlas'
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', initArchSelect); } else { initArchSelect(); }
})();
