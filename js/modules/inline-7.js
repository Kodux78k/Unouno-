
// === TTS Navegação: toggle no Brain (sem editar código existente) ======================
(function(){
  const LS_KEY = 'uno:tts.nav'; // 'on' | 'off'
  function getNavTTS(){ return (localStorage.getItem(LS_KEY) || 'on') !== 'off'; }
  function setNavTTS(on){ localStorage.setItem(LS_KEY, on ? 'on' : 'off'); updateBtn(); }

  // Monkey-patch: suprimir speak() quando em contexto de navegação e toggle OFF
  function patchSpeakAndNav(){
    const origSpeak = window.speak;
    if (origSpeak && !origSpeak.__patchedForNavTTS){
      const wrapped = function(text, opts){
        try{
          if (window._navContext === true && !getNavTTS()){
            // bloqueia falas de navegação
            return;
          }
        }catch(e){}
        return origSpeak.apply(this, arguments);
      };
      wrapped.__patchedForNavTTS = true;
      window.speak = wrapped;
    }
    const origNav = window.nav;
    if (typeof origNav === 'function' && !origNav.__patchedForNavTTS){
      const wrappedNav = function(){
        window._navContext = true;
        try { return origNav.apply(this, arguments); }
        finally { window._navContext = false; }
      };
      wrappedNav.__patchedForNavTTS = true;
      window.nav = wrappedNav;
    }
  }

  // criar UI: botão pequeno ON/OFF
  let btn;
  function updateBtn(){
    if(!btn) return;
    const on = getNavTTS();
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'TTS Nav: ON' : 'TTS Nav: OFF';
    btn.classList.toggle('on', on);
  }

  function makeButton(){
    btn = document.createElement('button');
    btn.id = 'btnTTSNavToggle';
    btn.type = 'button';
    btn.className = 'btn-ttsnav';
    btn.title = 'Alternar TTS de navegação';
    btn.addEventListener('click', ()=> setNavTTS(!getNavTTS()));
    updateBtn();
    return btn;
  }

  function mountButton(){
    const targets = [
      '#brain .tools', '#brain .header', '#brain',
      '#brainPanel', '#brain-header', '#brain-tools',
      '#lsx-actions', '#lsx-panel .header',
      '#header .right', '#header .tools', '#header'
    ];
    const el = targets.map(q=>document.querySelector(q)).find(Boolean) || document.body;
    el.appendChild(makeButton());
  }

  function addStyles(){
    const css = document.createElement('style');
    css.textContent = `
      .btn-ttsnav{
        font: 500 11px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif;
        padding: 6px 8px;
        border-radius: 999px;
        border: 1px solid var(--line, #2a2f39);
        background: rgba(255,255,255,0.04);
        color: var(--fg, #e7ecf5);
        margin-left: 8px;
        vertical-align: middle;
        cursor: pointer;
        opacity: 0.9;
        transition: box-shadow .2s var(--ease), opacity .2s var(--ease), transform .08s var(--ease);
      }
      .btn-ttsnav:hover{ opacity:1; }
      .btn-ttsnav:active{ transform: translateY(1px); }
      .btn-ttsnav.on{
        box-shadow: 0 0 0 2px rgba(0,255,170,.2), 0 0 14px rgba(0,255,170,.25);
        background: radial-gradient(100% 100% at 50% 0%, rgba(0,255,170,.18), rgba(0,0,0,0));
        border-color: rgba(0,255,170,.35);
      }
      @media (max-width: 420px){
        .btn-ttsnav{ padding: 5px 7px; font-size: 10px; }
      }
    `;
    document.head.appendChild(css);
  }

  function init(){
    try{ patchSpeakAndNav(); }catch(e){}
    addStyles();
    mountButton();
    // Observa mudanças externas no localStorage e reflete no botão
    window.addEventListener('storage', (ev)=>{
      if(ev.key === LS_KEY) updateBtn();
    });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();
})();
