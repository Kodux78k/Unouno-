
  (function(){
    function hideBtns(root){
      var sel = ['button','a','.btn','#btn-difusionar','.btn-difusionar','.fusion-toggle','#fusion-toggle','.btn-fusion','[data-action="fusion-toggle"]','.fusion-btn','.btn[data-fusion]'];
      var terms = /(fusion|fus\u00e3o|fusão|difusionar|difus[aã]o|fusionar)/i;
      try{
        (root.querySelectorAll ? root.querySelectorAll(sel.join(',')) : []).forEach(function(el){
          try{
            var t = ((el.innerText||'') + ' ' + (el.textContent||'') + ' ' + (el.getAttribute('title')||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.id||'') + ' ' + (el.className||''));
            if (terms.test(t)) {
              el.style.setProperty('display','none','important');
              el.setAttribute('data-hidden-by','fusion-hide');
            }
          }catch(_){}
        });
      }catch(_){}
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ hideBtns(document); });
    else hideBtns(document);
    try{
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          (m.addedNodes||[]).forEach(function(n){ if (n && n.nodeType===1) hideBtns(n); });
        });
      }).observe(document.documentElement, {subtree:true, childList:true});
    }catch(_){}
  })();
  