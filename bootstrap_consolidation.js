/* === CONSOLIDATION: bootstrap de tema/overlay (aplicar ao carregar) === */
(function(){
  try{
    const theme = localStorage.getItem('uno:theme') || 'default';
    document.body.dataset.theme = (theme === 'blue1') ? 'blue1' : '';
    if (!localStorage.getItem('uno:overlayLevel')) localStorage.setItem('uno:overlayLevel','22');
    function overlayAlpha(){ const v=parseInt(localStorage.getItem('uno:overlayLevel')||'22',10); return Math.min(30,Math.max(0,isNaN(v)?22:v))/100; }
    function overlayColor(name,a){ const RGB={atlas:[64,158,255],nova:[255,82,177],vitalis:[72,218,168],pulse:[0,191,255],artemis:[186,130,219],serena:[140,190,255],kaos:[255,77,109],genus:[87,207,112],lumine:[255,213,79],rhea:[0,209,178],solus:[100,149,237],aion:[255,159,67]}; const rgb=RGB[name]||[64,158,255]; return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }
    const saved=(localStorage.getItem('uno:arch')||'atlas').toLowerCase();
    const a = overlayAlpha(); document.documentElement.style.setProperty('--arch-overlay', overlayColor(saved,a));
  }catch(e){ console.warn('bootstrap consolidation:', e); }
})();