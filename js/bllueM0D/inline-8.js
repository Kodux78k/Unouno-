
(function() {
  // Melhora o seletor de arquétipos com informações de sotaque
  setTimeout(function() {
    const select = document.getElementById('arch-select');
    if (!select) return;
    
    const VOICE_MAP = window.KOBLLUX?.VOZ?.map || {
      'aion.html': { sotaque: 'inglês' },
      'atlas.html': { sotaque: 'alemão' },
      'elysha.html': { sotaque: 'nativo' },
      'genus.html': { sotaque: 'alemão' },
      'horus.html': { sotaque: 'lusitano' },
      'ignyra.html': { sotaque: 'italiano' },
      'kaion.html': { sotaque: 'alemão' },
      'kaos.html': { sotaque: 'lusitano' },
      'lumine.html': { sotaque: 'nativo' },
      'luxara.html': { sotaque: 'nativo' },
      'nova.html': { sotaque: 'nativo' },
      'rhea.html': { sotaque: 'nativo' }
    };
    
    // Adiciona atributos de sotaque às options sem quebrar o funcionamento
    Array.from(select.options).forEach(opt => {
      const file = opt.value;
      const archName = file.replace(/\.html$/i, '');
      
      // Tenta encontrar o sotaque
      let sotaque = 'nativo';
      for (const [key, value] of Object.entries(VOICE_MAP)) {
        if (key.toLowerCase().includes(archName.toLowerCase())) {
          sotaque = value.sotaque || 'nativo';
          break;
        }
      }
      
      // Adiciona o sotaque como atributo (não altera o texto visível)
      opt.setAttribute('data-sotaque', sotaque);
      
      // Opcional: adiciona um pequeno ícone ou texto (comentado para não quebrar)
      // opt.textContent = archName + ' (' + sotaque + ')';
    });
    
    console.log('✓ Seletor de arquétipos enriquecido com sotaques');
  }, 1000);
})();
