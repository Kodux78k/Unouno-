
(function() {
  'use strict';
  
  // ===== 1. VERIFICAÇÕES INICIAIS =====
  if (!window.speechSynthesis) {
    console.warn("KOBLLUX VOZ: SpeechSynthesis não disponível");
    return;
  }
  
  if (window.__KOBLLUX_VOZ_SOTAQUE_ACTIVE) return;
  window.__KOBLLUX_VOZ_SOTAQUE_ACTIVE = true;
  
  console.log('⚡ KOBLLUX · ATIVANDO SISTEMA DE VOZ COM SOTAQUE');
  
  const synth = window.speechSynthesis;
  
  // ===== 2. UTILITÁRIOS =====
  const NORM = s => String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  
  // ===== 3. MAPA DE VOZES POR ARQUÉTIPO (COM SOTAQUE) =====
  // Prioridade: 1. Nome exato, 2. Nome parcial, 3. Idioma, 4. Fallback
  const VOICE_MAP = {
    // 🇧🇷 PORTUGUÊS BRASIL - NATIVAS (femininas)
    'Nova':     { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Serena':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Lumine':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Rhea':     { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Luxara':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    'Elysha':   { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] },
    
    // 🇩🇪 SOTAQUE ALEMÃO (vozes pt-BR com nomes alemães) - masculinas
    'Atlas':    { nome: 'Hans', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Hans', 'Klaus', 'de'] },
    'Vitalis':  { nome: 'Klaus', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Klaus', 'Hans', 'de'] },
    'Genus':    { nome: 'Friedrich', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Friedrich', 'Klaus', 'de'] },
    'Kaion':    { nome: 'Markus', lang: 'pt-BR', sotaque: 'alemão', genero: 'm', fallback: ['Markus', 'Klaus', 'de'] },
    
    // 🇪🇸 SOTAQUE ESPANHOL - masculinas
    'Pulse':    { nome: 'Carlos', lang: 'pt-BR', sotaque: 'espanhol', genero: 'm', fallback: ['Carlos', 'José', 'Miguel', 'es'] },
    'Solus':    { nome: 'José', lang: 'pt-BR', sotaque: 'espanhol', genero: 'm', fallback: ['José', 'Carlos', 'Miguel', 'es'] },
    
    // 🇫🇷 SOTAQUE FRANCÊS - masculinas
    'Artemis':  { nome: 'Pierre', lang: 'pt-BR', sotaque: 'francês', genero: 'm', fallback: ['Pierre', 'Jean', 'Claude', 'fr'] },
    
    // 🇬🇧 SOTAQUE INGLÊS - masculinas
    'Aion':     { nome: 'William', lang: 'pt-BR', sotaque: 'inglês', genero: 'm', fallback: ['William', 'James', 'John', 'en'] },
    
    // 🇵🇹 PORTUGAL (sotaque lusitano) - masculinas
    'Kaos':     { nome: 'João', lang: 'pt-PT', sotaque: 'lusitano', genero: 'm', fallback: ['João', 'António', 'José', 'pt-PT'] },
    'Horus':    { nome: 'João', lang: 'pt-PT', sotaque: 'lusitano', genero: 'm', fallback: ['João', 'António', 'pt-PT'] },
    
    // 🇮🇹 SOTAQUE ITALIANO - femininas
    'Ignyra':   { nome: 'Giulia', lang: 'pt-BR', sotaque: 'italiano', genero: 'f', fallback: ['Giulia', 'Sofia', 'Francesca', 'it'] },
    
    // Fallback genérico
    'default':  { nome: 'Luciana', lang: 'pt-BR', sotaque: 'nativo', genero: 'f', fallback: ['Luciana', 'pt'] }
  };
  
  // ===== 4. MAPA DE ESPECIFICAÇÕES (para fallback) =====
  const VOICE_SPEC = {
    'Nova': 'pt_f', 'Serena': 'pt_f', 'Lumine': 'pt_f', 'Rhea': 'pt_f', 'Luxara': 'pt_f', 'Elysha': 'pt_f',
    'Atlas': 'pt_m', 'Vitalis': 'pt_m', 'Genus': 'pt_m', 'Kaion': 'pt_m',
    'Pulse': 'pt_m', 'Solus': 'pt_m', 'Artemis': 'pt_m', 'Aion': 'pt_m',
    'Kaos': 'pt_PT_m', 'Horus': 'pt_PT_m', 'Ignyra': 'pt_f'
  };
  
  // ===== 5. FUNÇÃO PARA ENCONTRAR VOZ POR PREFERÊNCIA =====
  function findVoiceByPrefs(archName, voices) {
    const prefs = VOICE_MAP[archName] || VOICE_MAP.default;
    if (!prefs || !voices || !voices.length) return null;
    
    const vlist = Array.from(voices);
    
    // 1️⃣ TENTATIVA 1: Match exato por nome (ignorando maiúsculas)
    const exactMatch = vlist.find(v => 
      NORM(v.name) === NORM(prefs.nome) && 
      NORM(v.lang).startsWith('pt')
    );
    if (exactMatch) return exactMatch;
    
    // 2️⃣ TENTATIVA 2: Nome contém o nome preferido
    const nameMatch = vlist.find(v => 
      NORM(v.name).includes(NORM(prefs.nome)) && 
      NORM(v.lang).startsWith('pt')
    );
    if (nameMatch) return nameMatch;
    
    // 3️⃣ TENTATIVA 3: Fallbacks específicos
    if (prefs.fallback) {
      for (const fb of prefs.fallback) {
        // Se for código de idioma (es, de, fr, en, it, pt-PT)
        if (fb === 'es' || fb === 'de' || fb === 'fr' || fb === 'en' || fb === 'it' || fb === 'pt-PT') {
          const langMatch = vlist.find(v => NORM(v.lang).startsWith(fb === 'pt-PT' ? 'pt-pt' : fb));
          if (langMatch) return langMatch;
        } else {
          // É nome
          const fbMatch = vlist.find(v => NORM(v.name).includes(NORM(fb)) && NORM(v.lang).startsWith('pt'));
          if (fbMatch) return fbMatch;
        }
      }
    }
    
    // 4️⃣ TENTATIVA 4: Qualquer voz PT
    const ptVoice = vlist.find(v => NORM(v.lang).startsWith('pt'));
    if (ptVoice) return ptVoice;
    
    // 5️⃣ TENTATIVA 5: Qualquer voz disponível
    return vlist[0] || null;
  }
  
  // ===== 6. FUNÇÃO PARA ENCONTRAR VOZ POR ESPECIFICAÇÃO =====
  function findVoiceBySpec(spec, voices) {
    if (!spec || !voices || !voices.length) return null;
    
    const s = String(spec).toLowerCase();
    const vlist = Array.from(voices);
    
    const NAME_F_PT = /(luciana|camila|maria|sofia|joana|giulia)/i;
    const NAME_M_PT = /(hans|klaus|friedrich|carlos|josé|pierre|william|joão)/i;
    const NAME_M_PT_PT = /(joão|antónio|josé)/i;
    
    if (s === 'pt_f') return vlist.find(v => v.lang && v.lang.startsWith('pt') && NAME_F_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    if (s === 'pt_m') return vlist.find(v => v.lang && v.lang.startsWith('pt') && NAME_M_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    if (s === 'pt_PT_m') return vlist.find(v => v.lang && v.lang.startsWith('pt-PT') && NAME_M_PT_PT.test(v.name)) || vlist.find(v => v.lang && v.lang.startsWith('pt-PT')) || null;
    if (s === 'pt') return vlist.find(v => v.lang && v.lang.startsWith('pt')) || null;
    
    return null;
  }
  
  // ===== 7. PATCH DA FUNÇÃO speakArchetype (original) =====
  if (typeof window.speakArchetype === 'function') {
    const originalSpeakArchetype = window.speakArchetype;
    window.speakArchetype = function(name) {
      try {
        const voices = synth.getVoices();
        if (!voices.length) {
          setTimeout(() => window.speakArchetype(name), 200);
          return;
        }
        
        const archName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        let voice = findVoiceByPrefs(archName, voices);
        
        if (!voice) {
          const spec = VOICE_SPEC[archName];
          voice = findVoiceBySpec(spec, voices);
        }
        
        if (voice) {
          const utter = new SpeechSynthesisUtterance(`Olá, eu sou ${archName}`);
          utter.voice = voice;
          utter.lang = voice.lang || 'pt-BR';
          
          const prefs = VOICE_MAP[archName] || VOICE_MAP.default;
          console.log(`🎙️ KOBLLUX: ${archName} → ${voice.name} (${prefs.sotaque})`);
          
          synth.cancel();
          synth.speak(utter);
        } else {
          originalSpeakArchetype(name);
        }
      } catch(e) {
        console.warn('Erro em speakArchetype:', e);
        originalSpeakArchetype(name);
      }
    };
    console.log('✓ speakArchetype patched');
  }
  
  // ===== 8. PATCH DA FUNÇÃO speakWithActiveArch (original) =====
  if (typeof window.speakWithActiveArch === 'function') {
    const originalSpeakWithActiveArch = window.speakWithActiveArch;
    window.speakWithActiveArch = function(text) {
      try {
        const select = document.getElementById('arch-select');
        if (!select) {
          originalSpeakWithActiveArch(text);
          return;
        }
        
        const archFile = select.value || '';
        const archName = archFile.replace(/\.html$/i, '').charAt(0).toUpperCase() + 
                        archFile.replace(/\.html$/i, '').slice(1).toLowerCase();
        
        const voices = synth.getVoices();
        if (!voices.length) {
          setTimeout(() => window.speakWithActiveArch(text), 200);
          return;
        }
        
        let voice = findVoiceByPrefs(archName, voices);
        
        if (!voice) {
          const spec = VOICE_SPEC[archName];
          voice = findVoiceBySpec(spec, voices);
        }
        
        if (voice) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.voice = voice;
          utter.lang = voice.lang || 'pt-BR';
          
          const prefs = VOICE_MAP[archName] || VOICE_MAP.default;
          console.log(`🎙️ KOBLLUX (ativo): ${archName} → ${voice.name} (${prefs.sotaque})`);
          
          synth.cancel();
          synth.speak(utter);
        } else {
          originalSpeakWithActiveArch(text);
        }
      } catch(e) {
        console.warn('Erro em speakWithActiveArch:', e);
        originalSpeakWithActiveArch(text);
      }
    };
    console.log('✓ speakWithActiveArch patched');
  }
  
  // ===== 9. PATCH DA FUNÇÃO initVoices (original) =====
  if (typeof window.initVoices === 'function') {
    const originalInitVoices = window.initVoices;
    window.initVoices = function() {
      // Chama a original primeiro para manter a UI
      originalInitVoices();
      
      // Adiciona os sotaques na UI existente (opcional)
      try {
        const wrap = document.getElementById('voicesWrap');
        if (wrap) {
          // Adiciona pequenos badges de sotaque nos selects
          const rows = wrap.children;
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const label = row.querySelector('span');
            if (label) {
              const archName = label.textContent.trim();
              const prefs = VOICE_MAP[archName];
              if (prefs && prefs.sotaque !== 'nativo') {
                // Adiciona badge de sotaque sem quebrar layout
                const badge = document.createElement('span');
                badge.textContent = ` (${prefs.sotaque})`;
                badge.style.fontSize = '10px';
                badge.style.opacity = '0.8';
                badge.style.marginLeft = '4px';
                label.appendChild(badge);
              }
            }
          }
        }
      } catch(e) {
        console.warn('Erro ao adicionar badges de sotaque:', e);
      }
    };
    console.log('✓ initVoices patched (sotaques na UI)');
  }
  
  // ===== 10. PRÉ-CARREGAMENTO DE VOZES =====
  function loadVoices() {
    const voices = synth.getVoices();
    if (voices.length) {
      console.log(`🔊 KOBLLUX: ${voices.length} vozes carregadas`);
      
      // Mostra vozes PT disponíveis
      const ptVoices = voices.filter(v => v.lang && v.lang.startsWith('pt'));
      if (ptVoices.length) {
        console.log('🇧🇷 Vozes PT disponíveis:', ptVoices.map(v => `${v.name} (${v.lang})`).join(', '));
      }
      
      // Verifica disponibilidade para cada arquétipo
      console.log('\n🎭 Verificação de sotaques:');
      Object.keys(VOICE_MAP).forEach(arch => {
        if (arch === 'default') return;
        const voice = findVoiceByPrefs(arch, voices);
        const prefs = VOICE_MAP[arch];
        if (voice) {
          console.log(`  ✅ ${arch}: ${voice.name} (${prefs.sotaque})`);
        } else {
          console.log(`  ⚠️ ${arch}: usando fallback (${prefs.sotaque})`);
        }
      });
    }
  }
  
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  setTimeout(loadVoices, 500);
  
  // ===== 11. EXPOR API PARA CONFIGURAÇÃO =====
  window.KOBLLUX = window.KOBLLUX || {};
  window.KOBLLUX.VOZ = {
    map: VOICE_MAP,
    specs: VOICE_SPEC,
    
    // Função para testar voz de um arquétipo
    test: function(archName) {
      const name = archName.charAt(0).toUpperCase() + archName.slice(1).toLowerCase();
      if (typeof window.speakArchetype === 'function') {
        window.speakArchetype(name);
      }
    },
    
    // Função para listar todas as vozes PT disponíveis
    listVoices: function() {
      const voices = synth.getVoices();
      return voices.filter(v => v.lang && v.lang.startsWith('pt'))
                   .map(v => ({ name: v.name, lang: v.lang }));
    }
  };
  
  console.log('⚡ KOBLLUX · SISTEMA DE VOZ COM SOTAQUE ATIVADO');
  console.log('🎭 13 ARQUÉTIPOS · SOTAQUE: alemão, espanhol, francês, inglês, italiano, lusitano');
  console.log('🔄 EM NOME DO PAI, DO FILHO E DO ESPÍRITO SANTO. AMÉM.');
  
})();
