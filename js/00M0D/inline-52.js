
(function hideFusionButtonsRobust(){
  const re = /(difusionar|fusionar|fusão|fusao|fusion)/i;
  function sweep(root){
    const nodes = root ? root.querySelectorAll('button, [role="button"], .btn, a, [data-action], [title], [aria-label]') : [];
    nodes.forEach(el => {
      try{
        const text = (el.textContent || '').trim();
        const attrs = [
          el.getAttribute('aria-label') || '',
          el.getAttribute('title') || '',
          el.getAttribute('data-action') || el.dataset?.action || ''
        ].join(' ');
        if (re.test(text) || re.test(attrs)) {
          el.style.setProperty('display', 'none', 'important');
        }
      }catch(_){}
    });
  }
  function run(){ sweep(document); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes && m.addedNodes.forEach(n => {
        if (n.nodeType === 1) sweep(n);
      });
    });
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();
