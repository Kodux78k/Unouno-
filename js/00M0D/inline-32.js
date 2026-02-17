
(function(){
  const root = document.documentElement;
  const archSelect = document.getElementById('arch-select');
  const overlayMap = {
    'atlas.html':'#409EFF','nova.html':'#ff67c4','vitalis.html':'#39ffb6',
    'pulse.html':'#ff9f43','artemis.html':'#ff6b6b','serena.html':'#9b87ff',
    'kaos.html':'#ffd700','genus.html':'#00c5e5','lumine.html':'#f5f7ff',
    'rhea.html':'#68d391','solus.html':'#94b6d6','aion.html':'#8a2be2'
  };
  function applyOverlayFrom(src){
    const key = (src||'').split('/').pop();
    const c = overlayMap[key] || '#8a2be2';
    root.style.setProperty('--arch-color', c);
  }
  if (archSelect){
    applyOverlayFrom(archSelect.value);
    archSelect.addEventListener('change', e => {
      document.documentElement.classList.add('arch-switching');
      applyOverlayFrom(e.target.value);
      requestAnimationFrame(()=> setTimeout(()=> document.documentElement.classList.remove('arch-switching'), 180));
    });
  }
})();
