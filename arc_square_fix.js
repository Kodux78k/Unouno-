
/*! Arc Square Fix — JS (v1.0)
 *  Corrige casos em que aparece um "quadrado" atrás do arco (SVG)
 *  - Remove retângulos de fundo
 *  - Expande regiões de filtros (drop-shadow/blur) para não clipar em box retangular
 *  - Força fill:none nos paths do arco
 */
(() => {
  const selRoots = ['#arc', '.orb-arc', '.ring-arc', '[data-arc]'];
  const $all = (q, r=document) => Array.from(r.querySelectorAll(q));

  function patchSvg(svg){
    try{
      svg.style.background = 'transparent';
      svg.style.overflow = 'visible';

      // 1) Some com rects de fundo comuns
      $all('rect', svg).forEach(r => {
        // mantemos rects com role explícita se marcado
        if (!r.hasAttribute('data-keep')) {
          r.setAttribute('fill','none');
          r.setAttribute('stroke','none');
        }
      });

      // 2) Garante paths sem fill
      $all('path', svg).forEach(p => {
        if (!p.hasAttribute('data-allow-fill')) {
          p.setAttribute('fill','none');
        }
        p.setAttribute('stroke-linecap','round');
        p.setAttribute('stroke-linejoin','round');
      });

      // 3) Expande regiões de filtros pra evitar "retângulo" de clipping
      $all('filter', svg).forEach(f => {
        f.setAttribute('filterUnits','userSpaceOnUse');
        f.setAttribute('primitiveUnits','userSpaceOnUse');
        // caixa expandida
        if (!f.hasAttribute('x')) f.setAttribute('x','-50%');
        if (!f.hasAttribute('y')) f.setAttribute('y','-50%');
        if (!f.hasAttribute('width')) f.setAttribute('width','200%');
        if (!f.hasAttribute('height')) f.setAttribute('height','200%');
      });

      // 4) Ajusta máscaras, se existirem
      $all('mask', svg).forEach(m => {
        m.setAttribute('maskUnits','userSpaceOnUse');
        m.style.maskType = 'luminance';
      });

      // 5) Se existir um <rect> grande com a viewBox, oculta
      const vb = svg.getAttribute('viewBox');
      if (vb){
        const [, , vbw, vbh] = vb.split(/\s+/).map(parseFloat);
        $all('rect', svg).forEach(r => {
          const w = parseFloat(r.getAttribute('width') || '0');
          const h = parseFloat(r.getAttribute('height') || '0');
          if (w && h && Math.abs(w - vbw) < 1 && Math.abs(h - vbh) < 1 && !r.hasAttribute('data-keep')){
            r.setAttribute('fill','none');
            r.setAttribute('stroke','none');
          }
        });
      }
    }catch{}
  }

  function run(){
    selRoots.forEach(rootSel => {
      $all(`${rootSel} svg`).forEach(patchSvg);
      // se o root já for o próprio svg
      $all(rootSel).forEach(el => { if (el.tagName === 'svg') patchSvg(el); });
    });
  }

  const ready = () => {
    run();
    // observa mudanças (re-render do ORB/arc)
    const obs = new MutationObserver(() => run());
    obs.observe(document.body, { childList:true, subtree:true });
  };

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', ready)
    : ready();
})();
