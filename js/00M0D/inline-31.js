
(function(){
  var modal = document.getElementById('lsModal');
  var btnRefresh = document.getElementById('lsFabRefresh');
  var btnClose = document.getElementById('lsFabClose');
  if (btnRefresh){ btnRefresh.addEventListener('click', function(e){ e.preventDefault(); location.reload(); }); }
  if (btnClose){ btnClose.addEventListener('click', function(e){ e.preventDefault(); if(modal){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); } }); }
})();
