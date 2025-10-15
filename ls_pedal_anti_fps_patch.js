
/*! LS-PEDAL Anti-FPS Sliders Patch v1.1 (FPS-only) — no CSS
 *  Oculta apenas os controles de FPS/Desempenho do LS-Pedal,
 *  mantendo visíveis os de Partículas do Átomo.
 *  Autor: GPT-5 Thinking (for Kodux)
 */
(() => {
  const PATCH_ID = 'LS-PEDAL_ANTI_FPS_PATCH_v1_1';
  if (window.__LS_PEDAL_ANTI_FPS__) return;
  window.__LS_PEDAL_ANTI_FPS__ = true;

  const STORAGE_KEY = 'lsPedal:showFpsAdvanced'; // true = mostrar, false = ocultar
  const getFlag = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'false'); } catch { return false; } };
  const setFlag = (v) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(!!v)); } catch {} };

  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => Array.from(r.querySelectorAll(q));

  // Heurística de FPS/Desempenho (sem tocar em "Partículas")
  const FPS_KEYWORDS = [
    'fps', 'frame', 'frames', 'frame rate', 'framerate',
    'desempenho', 'performance', 'alvo', 'target', 'ms',
    'vsync', 'tick', 'loop', 'raf', 'latência', 'latency'
  ];

  function isFpsLabelText(txt) {
    const t = (txt || '').toLowerCase();
    if (!t) return false;
    // evita confundir com partículas
    if (t.includes('partícula') || t.includes('particula') || t.includes('particles') || t.includes('átomo') || t.includes('atomo')) return false;
    return FPS_KEYWORDS.some(k => t.includes(k));
  }

  // encontra o bloco "grupo" que contém o input (linha/row/fieldset)
  function findGroup(el) {
    return el.closest('.line, .row, fieldset, .group, .setting, .control') || el.parentElement;
  }

  function markFpsGroup(el) {
    const group = findGroup(el);
    if (!group) return null;

    // checa textos próximos (labels, legends, aria-label, placeholders)
    const nearText = [
      (group.querySelector('label, legend') || {}).textContent || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('placeholder') || '',
      (el.previousElementSibling && el.previousElementSibling.textContent) || '',
      (el.nextElementSibling && el.nextElementSibling.textContent) || ''
    ].join(' | ');

    if (isFpsLabelText(nearText)) return group;

    // fallback: olha ancestrais até 2 níveis por textos indicativos
    let p = group;
    for (let i=0; i<2 && p; i++) {
      const t = p.textContent || '';
      if (isFpsLabelText(t)) return group;
      p = p.parentElement;
    }
    return null;
  }

  function collectFpsGroups(panel) {
    const groups = new Set();

    // 1) Inputs com type range/number ligados a FPS
    $$('input[type="range"], input[type="number"]', panel).forEach(inp => {
      const g = markFpsGroup(inp);
      if (g) groups.add(g);
    });

    // 2) Se existirem wrappers conhecidos (IDs/Classes) de performance, adiciona direto
    const known = ['#perfControlsV371', '#lsFpsControls', '.fps-controls', '.performance-controls'];
    known.forEach(sel => { const el = $(sel, panel); if (el) groups.add(el); });

    return groups;
  }

  function applyVisibility(panel, show) {
    const fpsGroups = collectFpsGroups(panel);
    fpsGroups.forEach(el => { el.style.display = show ? '' : 'none'; });

    const btn = $('#lsAntiFpsBtn', panel);
    if (btn) btn.textContent = show ? 'Ocultar FPS/Desempenho' : 'Mostrar FPS/Desempenho';
  }

  function ensureToggle(panel) {
    // tenta achar barra de ações do modal LS
    const actions =
      $('#lsModal .ls-actions', panel) ||
      $('.ls-actions', panel) ||
      $('#lsPanel .ls-actions', panel) ||
      null;
    if (!actions || $('#lsAntiFpsBtn', panel)) return;

    const btn = document.createElement('button');
    btn.id = 'lsAntiFpsBtn';
    btn.type = 'button';
    btn.textContent = getFlag() ? 'Ocultar FPS/Desempenho' : 'Mostrar FPS/Desempenho';
    btn.addEventListener('click', () => {
      const next = !getFlag();
      setFlag(next);
      applyVisibility(panel, next);
    });
    actions.appendChild(btn);
  }

  function run() {
    const panel = $('#lsPanel') || $('#lsModal .ls-panel') || $('#lsModal') || document.body;
    if (!panel) return;
    ensureToggle(panel);
    applyVisibility(panel, getFlag());
  }

  function bind() {
    const btnLS = document.getElementById('btnLS');
    if (btnLS && !btnLS.dataset._lsAntiFpsBound) {
      btnLS.dataset._lsAntiFpsBound = '1';
      btnLS.addEventListener('click', () => setTimeout(run, 120), { passive: true });
    }
    run(); // tenta aplicar já
    const obs = new MutationObserver(() => {
      if (document.getElementById('lsModal')?.classList?.contains('open')) run();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', bind)
    : bind();
})();
