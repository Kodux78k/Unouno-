
window.addEventListener('load', () => {
  const splash = document.getElementById('appSplash');
  if (!splash) return;
  // Reproduza o som do splash assim que a página carregar, se houver um elemento de áudio.
  const audioElem = document.getElementById('splashSound');
  if (audioElem) {
    try {
      audioElem.currentTime = 0;
      audioElem.play().catch(() => {
        /* Alguns navegadores bloqueiam a reprodução automática.  Ignore erros aqui. */
      });
    } catch (err) {}
  }
  // Fale durante o splash usando a síntese de voz
  try {
    if (typeof speakSplash === 'function') speakSplash();
  } catch {}
  // Em seguida, faça a saudação completa alguns instantes depois do splash
  try {
    if (typeof speakHomeGreeting === 'function') setTimeout(() => speakHomeGreeting(), 400);
  } catch {}
  // Aguarde um breve instante após o carregamento para garantir que o loader seja exibido.
  // Aumente este valor (ms) para manter o splash por mais tempo. Aqui usamos 1200ms (1.2s).
  setTimeout(() => {
    splash.classList.add('hidden');
    // Remova o elemento do DOM após a transição de opacidade
    setTimeout(() => {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 400);
  }, 1200);
});
