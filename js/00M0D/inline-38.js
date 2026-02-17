
/**
 * Archetype Theme Sync via postMessage
 * Parent listens: { type: 'arch:theme', color: '#rrggbb' | 'rgb(...)', overlayStrength?: 0..1 }
 * Parent requests: postMessage({ type: 'arch:hello' })
 */
(function(){
  const root = document.documentElement;
  const iframe = document.getElementById('arch-frame') || document.querySelector('iframe#arch-frame, .arch-circle iframe');
  const DEFAULT_COLOR = getComputedStyle(root).getPropertyValue('--arch-color').trim() || '#d4af37';

  function clamp01(x){ x = Number(x); return isFinite(x) ? Math.max(0, Math.min(1, x)) : 0.18; }
  function setTheme({color, overlayStrength}){
    if (color) {
      try { root.style.setProperty('--arch-color', color); } catch(e){}
    }
    if (overlayStrength != null) {
      // strength in 0..1 → percentage string
      const pct = Math.round(clamp01(overlayStrength)*100) + '%';
      root.style.setProperty('--arch-overlay-strength', pct);
      // recompute arch-overlay var (for older browsers it's okay to rely on CSS color-mix with updated var)
      // No direct recompute needed; CSS updates automatically where used.
    }
  }

  // Listen from child iframes
  window.addEventListener('message', (ev)=>{
    const data = ev?.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== 'arch:theme') return;
    // Optional: restrict by expected origins if you have them. For now, accept from any for local dev.
    setTheme({ color: data.color || DEFAULT_COLOR, overlayStrength: data.overlayStrength });
  });

  // Ask child to publish theme (handshake) on load
  function requestTheme(){
    if (!iframe || !iframe.contentWindow) return;
    try { iframe.contentWindow.postMessage({ type: 'arch:hello' }, '*'); } catch(e){}
  }
  if (iframe){
    iframe.addEventListener('load', requestTheme);
    // also request shortly after DOMReady (in case load already fired)
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(requestTheme, 250));
  }

  // Expose a manual setter for debugging
  window.setArchTheme = (color='#8a2be2', overlayStrength=0.18) => setTheme({color, overlayStrength});
})();
