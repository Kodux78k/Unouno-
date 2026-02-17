<script>
/* === UNO & DUAL UNIFIED CONFIGURATION PATCH ===
   - DI = fonte da verdade
   - Espelha DI -> legacy (somente se legacy estiver vazio)
   - Mantém fallback legacy -> DI via Uno.getConfig()
   ============================================== */
(function() {
    if (window.Uno && window.Uno.__unified_config_v1) return;
    window.Uno = window.Uno || {};
    const Uno = window.Uno;
    Uno.__unified_config_v1 = true;

    // --- Constants ---
    const STORAGE = {
        API_KEY: 'di_apiKey',
        MODEL: 'di_modelName',
        SYSTEM_ROLE: 'di_infodoseName',
        USER_ID: 'di_userName',
        BG_IMAGE: 'di_bgImage',
        CUSTOM_CSS: 'di_customCss',
        SOLAR_MODE: 'di_solarMode',
        SOLAR_AUTO: 'di_solarAuto',
        WALLET: 'di_wallet', // opcional: ajuste para namespace di_
        FALLBACK: 'di_fallbackChain'
    };

    const LEGACY_KEYS = {
        API_KEY: ['dual.keys.openrouter', 'infodose:sk', 'openrouter:key'],
        MODEL: ['dual.openrouter.model', 'infodose:model', 'openrouter:model'],
        USER_ID: ['dual.name', 'infodose:userName'],
        SYSTEM_ROLE: ['infodose:assistantName'],
        FALLBACK: ['dual.openrouter.fallback', 'openrouter:fallback']
    };

    // --- Internal Helpers ---
    function LSget(k) { try { return localStorage.getItem(k) || ''; } catch(e) { return ''; } }
    function LSset(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }

    // --- Unified Access Layer ---
    Uno.getConfig = function(key) {
        // 1. Try primary 'di_' key
        let val = LSget(STORAGE[key]);
        if (val) return val;

        // 2. Try legacy keys and migrate if found
        if (LEGACY_KEYS[key]) {
            for (const legacy of LEGACY_KEYS[key]) {
                val = LSget(legacy);
                if (val) {
                    console.log(`[UnifiedConfig] Migrating ${legacy} -> ${STORAGE[key]}`);
                    LSset(STORAGE[key], val);
                    return val;
                }
            }
        }
        return '';
    };

    Uno.setConfig = function(key, val) {
        if (STORAGE[key]) {
            LSset(STORAGE[key], val);
            // Sync legacy keys for backward compatibility if needed
            if (LEGACY_KEYS[key]) {
                LEGACY_KEYS[key].forEach(legacy => LSset(legacy, val));
            }
        }
    };

    // --- OpenRouter Specific ---
    Uno.getOpenRouter = function() {
        return {
            sk: Uno.getConfig('API_KEY'),
            model: Uno.getConfig('MODEL') || 'openrouter/auto'
        };
    };

    // --- Integration Hooks: mirror DI -> legacy (only if legacy absent) ---
    (function syncDItoLegacy() {
      try {
        const setIfEmpty = (legacyKey, diKey) => {
          const diVal = LSget(diKey);
          if (!diVal) return;
          const legacyVal = LSget(legacyKey);
          if (!legacyVal) {
            LSset(legacyKey, diVal);
            console.log(`[UnifiedConfig] Mirrored ${diKey} -> ${legacyKey}`);
          }
        };

        // USER NAME
        setIfEmpty('infodose:userName', 'di_userName');
        setIfEmpty('dual.name', 'di_userName');

        // API KEY
        setIfEmpty('dual.keys.openrouter', 'di_apiKey');
        setIfEmpty('infodose:sk', 'di_apiKey');
        setIfEmpty('openrouter:key', 'di_apiKey');

        // MODEL
        setIfEmpty('dual.openrouter.model', 'di_modelName');
        setIfEmpty('infodose:model', 'di_modelName');
        setIfEmpty('openrouter:model', 'di_modelName');

        // ASSISTANT NAME
        setIfEmpty('infodose:assistantName', 'di_infodoseName');

      } catch (err) {
        console.warn('[UnifiedConfig] syncDItoLegacy failed', err);
      }
    })();

    // Expose helpers for other patches
    window.LSget = LSget;
    window.LSset = LSset;

    console.log('%cUNO & DUAL Unified Config Active', 'background:#0b0f14;color:#39ffb6;padding:2px 6px;border-radius:4px');
})();
</script>
