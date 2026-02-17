
(function(){
  const audio = document.getElementById('splashSound');
  if(!audio) return;

  // remove legacy rectangular button script artifacts if still present (best-effort)
  // (nothing to remove in DOM here; previous script created the button dynamically)

  let cta, mounted=false;
  function mountCTA(){
    if(mounted) return;
    mounted = true;
    const host = document.getElementById('orbWrap') || document.querySelector('.arch-circle') || document.body;
    cta = document.createElement('div');
    cta.className = 'pulse-cta hidden';
    cta.innerHTML = `
      <div class="dot" role="button" aria-label="Toque o pulso para ativar o som"></div>
      <div class="label">toque o pulso</div>`;
    cta.addEventListener('click', async ()=>{
      try{ await audio.play(); }catch(e){ /* ignore */ }
      hideCTA();
    });
    host.appendChild(cta);
  }
  function showCTA(){ mountCTA(); cta?.classList.remove('hidden'); }
  function hideCTA(){ if(!cta) return; cta.classList.add('hidden'); }

  async function tryPlaySilently(){
    try{
      await audio.play();
      hideCTA();
      return true;
    }catch(e){
      // Autoplay blocked: show CTA inside the orb
      showCTA();
      return false;
    }
  }

  // Strategy: on first user interaction we try to play.
  // If blocked, we show the animated pulse inside the orb.
  let armed=false;
  function arm(){
    if(armed) return;
    armed = true;
    const onUserInteract = async () => {
      window.removeEventListener('pointerdown', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
      await tryPlaySilently();
    };
    window.addEventListener('pointerdown', onUserInteract, { once:true, passive:true });
    window.addEventListener('keydown', onUserInteract, { once:true });
  }

  // If the page attempts to play earlier via other code and succeeds, the CTA never shows.
  // Otherwise we arm for first interaction and fall back to CTA if needed.
  document.addEventListener('DOMContentLoaded', arm);

  // Expose minimal API (optional)
  window.__pulseAudioCTA = { show: showCTA, hide: hideCTA, arm };
})();
