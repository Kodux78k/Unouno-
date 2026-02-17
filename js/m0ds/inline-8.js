
(function(){
  // Helpers
  const $ = (q, r = document) => r.querySelector(q);
  const LS = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }
  };

  // Inject "Blue‑1" into theme select if missing
  document.addEventListener('DOMContentLoaded', function(){
    try {
      const sel = document.getElementById('themeSelect');
      if (sel && !Array.from(sel.options).some(o => o.value === 'blue1')) {
        const opt = document.createElement('option');
        opt.value = 'blue1'; opt.textContent = 'Blue‑1 (azul)';
        sel.appendChild(opt);
      }
    } catch(e){}
  });

  // Build and inject a Visual & 3D card into Brain view (non-destructive)
  document.addEventListener('DOMContentLoaded', function(){
    const grid = document.querySelector('#v-brain .grid');
    if (!grid) return;
    const panel = document.createElement('div');
    panel.className = 'card fx-trans fx-lift';
    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="font-weight:800">Visual & 3D (presets)</div>
      <div style="margin-top:8px;display:grid;gap:10px">
        <label style="display:flex;align-items:center;gap:8px">
          <span>Preset:</span>
          <select id="visualPreset" class="input ring" style="max-width:260px">
            <option value="blue1">Blue‑1 (shader)</option>
            <option value="strong">Strong</option>
            <option value="cinematic-soft">Cinematic Soft</option>
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:8px">
          <input id="overlayToggle" type="checkbox" />
          <span>Overlay de cor por arquétipo</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px">
          <input id="bloomToggle" type="checkbox" />
          <span>Bloom fotográfico (post)</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px">
          <span>Glow/Toon:</span>
          <input id="glowRange" type="range" min="0" max="1" step="0.05" style="flex:1" />
          <span id="glowVal" class="mut" style="width:42px;text-align:right">0.80</span>
        </label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="applyVisual" class="btn prime fx-trans fx-press ring">Aplicar<span class="ripple"></span></button>
          <button id="resetVisual" class="btn fx-trans fx-press ring">Padrão<span class="ripple"></span></button>
        </div>
        <div class="mut" style="font-size:11px">
          As preferências são salvas no seu navegador e enviadas ao arquétipo ativo.
        </div>
      </div>
    `;
    grid.appendChild(panel);

    // Defaults
    const defaults = {
      preset: LS.get('arch:visualPreset', 'blue1'),
      overlayOn: LS.get('arch:overlayOn', false),
      bloomOn: LS.get('arch:bloomOn', false),
      glow: LS.get('arch:glowStrength', 0.80)
    };

    // UI references
    const selPreset = $('#visualPreset', panel);
    const chkOverlay = $('#overlayToggle', panel);
    const chkBloom = $('#bloomToggle', panel);
    const rngGlow = $('#glowRange', panel);
    const spnGlow = $('#glowVal', panel);
    const btnApply = $('#applyVisual', panel);
    const btnReset = $('#resetVisual', panel);

    // Populate
    selPreset.value = defaults.preset;
    chkOverlay.checked = !!defaults.overlayOn;
    chkBloom.checked = !!defaults.bloomOn;
    rngGlow.value = defaults.glow;
    spnGlow.textContent = Number(defaults.glow).toFixed(2);

    rngGlow.addEventListener('input', () => { spnGlow.textContent = Number(rngGlow.value).toFixed(2); });

    function saveAndApply(){
      const state = {
        preset: selPreset.value,
        overlayOn: !!chkOverlay.checked,
        bloomOn: !!chkBloom.checked,
        glow: Number(rngGlow.value)
      };
      LS.set('arch:visualPreset', state.preset);
      LS.set('arch:overlayOn', state.overlayOn);
      LS.set('arch:bloomOn', state.bloomOn);
      LS.set('arch:glowStrength', state.glow);
      // Update overlay color right away
      try {
        const sel = document.getElementById('arch-select');
        const base = (sel?.value || '').replace(/\.html$/i, '');
        if (window.applyArchOverlay) window.applyArchOverlay(base);
      } catch(e){}
      // Send to iframe
      try { sendVisualSettingsToFrame(); } catch(e){}
    }

    btnApply.addEventListener('click', saveAndApply);
    btnReset.addEventListener('click', () => {
      selPreset.value = 'blue1';
      chkOverlay.checked = false;
      chkBloom.checked = false;
      rngGlow.value = 0.80;
      spnGlow.textContent = '0.80';
      saveAndApply();
    });
  });

  // Canonical overlay colors for the 12 archetypes
  const ARCH_OVERLAYS_PATCHED = {
    atlas:  'rgba(64,158,255,0.22)',
    nova:   'rgba(255,82,177,0.22)',
    vitalis:'rgba(87,207,112,0.22)',
    pulse:  'rgba(0,191,255,0.22)',
    artemis:'rgba(255,195,0,0.22)',
    serena: 'rgba(186,130,219,0.22)',
    kaos:   'rgba(255,77,109,0.22)',
    genus:  'rgba(87,207,112,0.22)',
    lumine: 'rgba(255,213,79,0.22)',
    solus:  'rgba(186,130,219,0.22)',
    rhea:   'rgba(0,209,178,0.22)',
    aion:   'rgba(255,159,67,0.22)',
    default:'rgba(255,255,255,0.0)'
  };

  // Override applyArchOverlay to honor overlay toggle
  (function overrideApplyArchOverlay(){
    const LSget = (k,d)=>{ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } };
    window.applyArchOverlay = function(name){
      const key = (name || '').toLowerCase();
      const on = !!LSget('arch:overlayOn', false);
      const color = on ? (ARCH_OVERLAYS_PATCHED[key] || ARCH_OVERLAYS_PATCHED.default) : 'rgba(0,0,0,0)';
      document.documentElement.style.setProperty('--arch-overlay', color);
    };
    // Apply once at startup for current selection
    document.addEventListener('DOMContentLoaded', function(){
      const sel = document.getElementById('arch-select');
      const base = (sel?.value || '').replace(/\.html$/i, '');
      window.applyArchOverlay(base);
    });
  })();

  // PostMessage: send visual settings to archetype iframe
  function currentVisualSettings(){
    const LSget = (k,d)=>{ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d }catch(e){ return d } };
    return {
      preset: LSget('arch:visualPreset','blue1'),
      bloom: !!LSget('arch:bloomOn', false),
      glow: Number(LSget('arch:glowStrength', 0.80)),
      overlayOn: !!LSget('arch:overlayOn', false)
    };
  }
  window.sendVisualSettingsToFrame = function(){
    try {
      const f = document.getElementById('arch-frame');
      if (f && f.contentWindow) {
        f.contentWindow.postMessage({ type:'visualSettings', data: currentVisualSettings() }, '*');
      }
    } catch(e){}
  };

  // Send settings whenever the iframe loads or signals readiness
  document.addEventListener('DOMContentLoaded', function(){
    const f = document.getElementById('arch-frame');
    if (f) {
      f.addEventListener('load', () => { try { sendVisualSettingsToFrame(); } catch(e){} });
      // small delay to ensure child is ready
      setTimeout(() => { try { sendVisualSettingsToFrame(); } catch(e){} }, 800);
    }
  });
  window.addEventListener('message', (ev) => {
    const msg = ev?.data || {};
    if (msg && msg.type === 'archReady') {
      try { sendVisualSettingsToFrame(); } catch(e){}
    }
  });

})();
