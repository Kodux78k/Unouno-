
// KOBLLUX Archetype Bridge (iframe side)
(function(){
  const ARCH_NAME = (function(){
    try {
      const f = (location.pathname.split('/').pop()||'').replace(/\.html$/i,'');
      return f.toLowerCase();
    } catch(e){ return ''; }
  })();

  // Apply dataset for quick CSS hooks, and expose payload globally for 3D renderer
  function applyConfig(payload){
    try {
      if (!payload || !payload.preset) return;
      document.documentElement.dataset.preset = (payload.presetName || 'Blue-1').replace(/\s+/g,'-').toLowerCase();
      document.documentElement.dataset.overlay = payload.overlayEnabled ? 'on' : 'off';
      const solid = (payload.solidMap && (payload.solidMap[ARCH_NAME] || payload.solidMap.default)) || 'icosahedron';
      document.documentElement.dataset.solid = solid;
      window.KOBLLUX_CONFIG = payload;
      // Optional hooks your 3D can implement:
      // window.setSolid?.(solid);
      // window.setBloom?.(payload.preset.bloom);
      // window.updateShaderParams?.(payload.preset.shader);
    } catch (e) {}
  }

  window.addEventListener('message', (ev) => {
    if (!ev || !ev.data) return;
    if (ev.data.type === 'kobllux:config') {
      applyConfig(ev.data);
    }
  });

  // Hello handshake
  try { window.parent.postMessage({ type: 'kobllux:hello', arch: ARCH_NAME }, '*'); } catch (e) {}

  // Expose a tiny API for manual testing in console
  window.__kobllux = { applyConfig };
})();
