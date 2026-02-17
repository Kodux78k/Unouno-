
(function(){
  try{
    var L=document.createElement('div'); L.id='su-loader';
    L.innerHTML = '<div class="su-mark">Sempre Único</div><div class="dot"></div><div class="su-logo">Sempre seu</div><div class="spinner" aria-hidden="true"></div>';
    if (document.readyState!=='loading' && document.body){ document.body.appendChild(L); }
    else { document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(L); }, {once:true}); }
  }catch(_){}

  function hideFusionButtons(root){
    root = root || document;
    var C = root.querySelectorAll('button, [role="button"], a, .btn');
    for (var i=0;i<C.length;i++){
      var el=C[i];
      var label=(el.getAttribute('aria-label')||el.textContent||'').toLowerCase();
      var id=(el.id||'').toLowerCase(), cls=(el.className||'').toLowerCase();
      if (/\b(fusão|fusao|fusionar|difusionar|fusion|difusion)\b/.test(label+ ' '+ id+ ' '+ cls)){
        el.classList.add('su-hidden-fusion-btn'); el.style.display='none';
      }
    }
    var hints=[
      '#fusion-toggle','.btn-fusion','[data-action="fusion-toggle"]','[data-action*="fusion"]',
      'button[data-fusion]','[aria-label*="Fusão" i]','[aria-label*="fusao" i]','[data-testid*="fusion" i]'
    ];
    try{ root.querySelectorAll(hints.join(',')).forEach(function(el){ el.classList.add('su-hidden-fusion-btn'); el.style.display='none'; }); }catch(_){}
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', function(){ hideFusionButtons(document); }); }
  else { hideFusionButtons(document); }

  var mo=new MutationObserver(function(muts){
    muts.forEach(function(m){
      if (m.addedNodes) m.addedNodes.forEach(function(n){
        if (n.nodeType===1) hideFusionButtons(n);
      });
    });
  });
  try{ mo.observe(document.documentElement, {childList:true, subtree:true}); }catch(_){}

  var KEY='su:autoreload:v1';
  try{
    if (!localStorage.getItem(KEY)){
      localStorage.setItem(KEY, '1');
      setTimeout(function(){ try{ location.reload(); }catch(_){ } }, 140);
      return;
    }
  }catch(_){}

  function done(){
    try{
      var el=document.getElementById('su-loader');
      if (!el) return;
      el.classList.add('done');
      setTimeout(function(){ try{ el.remove(); }catch(_){ } }, 520);
    }catch(_){}
  }
  if (document.readyState==='complete'){ setTimeout(done, 260); }
  else { window.addEventListener('load', function(){ setTimeout(done, 260); }, {once:true}); }
})();
