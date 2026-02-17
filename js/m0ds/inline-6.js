
  // Associe sons aos principais elementos de interface.  Cada botão com a
  // classe .btn toca o som de clique; os itens de navegação tocam som de
  // tab ou nav; a abertura/fechamento de sessões dispara sons específicos.
  (function(){
    const getAudio = id => document.getElementById(id);
    const play = (id) => {
      const audio = getAudio(id);
      if (audio) {
        try { audio.currentTime = 0; audio.play(); } catch {}
      }
    };
    // Clique em qualquer botão
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) play('sndClick');
      // Navegação inferior (tabs)
      const navBtn = e.target.closest('nav .btn');
      if (navBtn) play('sndTab');
    });
    // Hover (mouseenter) em botões
    document.body.addEventListener('mouseenter', (e) => {
      const btn = e.target.closest('.btn');
      if (btn) play('sndHover');
    }, true);
    // Sobrescreva open/close de sessões para tocar sons
    window.playOpenSound = () => play('sndOpen');
    window.playCloseSound = () => play('sndClose');
    // Exponha também som especial Tech Pop
    window.playTechPopSound = () => play('sndTechPop');
  })();
  