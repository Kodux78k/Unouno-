
    /* ===================== Helpers ===================== */
    const $ = (q, r = document) => r.querySelector(q);
    const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
    const LS = {
      get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
      set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} },
      raw: (k) => localStorage.getItem(k) || ''
    };

    /* ===================== DualHub State & Logging ===================== */
    // Armazena preferências de performance, voz e registros de eventos para a funcionalidade "Dual" aprimorada.
    const dualState = {
      perf: localStorage.getItem('hub.perf') || 'med',
      voice: localStorage.getItem('hub.voice') || 'Nova',
      logs: []
    };
    // Adiciona uma entrada ao log e atualiza o painel de logs no Brain.
    function dualLog(msg) {
      const entry = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      dualState.logs.unshift(entry);
      const logsEl = document.getElementById('logs');
      if(logsEl) logsEl.textContent = dualState.logs.slice(0, 60).join('\n');
    }

    /* Ripple */
    function addRipple(el) {
      if(!el) return;
      // Ensure a ripple host exists on the element. The global ripple handler will create dots on pointerdown.
      if(!el.querySelector('.ripple')) {
        const slot = document.createElement('span');
        slot.className = 'ripple';
        el.appendChild(slot);
      }
      // Do not attach individual pointerdown events here; ripple will be handled globally.
    }

    /* Toast */
    const toastBox = document.createElement('div');
    toastBox.style.cssText = 'position:fixed;right:14px;bottom:calc(var(--tabsH) + 16px);display:grid;gap:8px;z-index:120';
    document.body.appendChild(toastBox);
    function toast(msg, type = 'ok') {
      const el = document.createElement('div'); el.className = 'fx-trans';
      const bg = type === 'ok' ? 'linear-gradient(90deg,#1b2a2a,#123c2e)' : (type === 'warn' ? 'linear-gradient(90deg,#2f261b,#3c2d12)' : 'linear-gradient(90deg,#2f1b1b,#3c1212)');
      el.style.cssText = `background:${bg}; color:var(--fg); border:${getComputedStyle(document.documentElement).getPropertyValue('--bd')}; padding:.6rem .8rem; border-radius:12px; box-shadow:var(--shadow)`;
      el.textContent = msg; toastBox.appendChild(el);
      setTimeout(() => { el.style.opacity = .0; el.style.transform = 'translateY(6px)'; setTimeout(() => el.remove(), 220); }, 1600);
    }

    /* ===================== Saudação / último estado ===================== */
    function displayGreeting() {
      const card = document.getElementById('greetingCard');
      // Não exibir o cartão de saudação; usamos mensagens na bolinha
      if(card) card.style.display = 'none';
      const name = (localStorage.getItem('infodose:userName') || '').trim();
      const sessions = document.querySelectorAll('.session').length;
      if(!name) {
        showArchMessage('Salve! Ative sua Dual Infodose registrando seu nome na seção Brain.', 'warn');
      } else {
        showArchMessage(`Bem-vindo de volta, ${name}. UNO está ao seu lado. Você tem ${sessions} sessão(ões) ativa(s).`, 'ok');
      }
    }

    /* ===================== Tema & Fundo personalizados ===================== */
    // Aplica o tema salvo no localStorage. Os temas possíveis são: 'default' (remove data-theme), 'medium'
    // e 'custom'.  Quando 'custom' estiver ativo, usa a imagem/vídeo salvo em LS ('uno:bg') como
    // plano de fundo.  Se 'medium' estiver selecionado, adiciona data-theme='medium'.
    function applyTheme() {
      const theme = LS.get('uno:theme', 'medium');
      // Limpe qualquer dataset para que CSS default seja aplicado quando 'default'
      if(theme === 'default') {
        delete document.body.dataset.theme;
      } else {
        document.body.dataset.theme = theme;
      }
      // Gerenciar fundo personalizado
      const bgContainer = document.getElementById('custom-bg');
      if(!bgContainer) return;
      if(theme !== 'custom') {
        bgContainer.innerHTML = '';
        return;
      }
      // Carregar dados do fundo
      const bgData = LS.get('uno:bg', '');
      bgContainer.innerHTML = '';
      if(!bgData) return;
      // Determine se é vídeo ou imagem
      if(/^data:video\//.test(bgData)) {
        const vid = document.createElement('video');
        vid.src = bgData;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.style.width = '100%';
        vid.style.height = '100%';
        vid.style.objectFit = 'cover';
        bgContainer.appendChild(vid);
      } else {
        const img = document.createElement('img');
        img.src = bgData;
        img.alt = '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        bgContainer.appendChild(img);
      }
    }

    /* ===================== CSS Personalizado ===================== */
    // Aplica o CSS salvo em localStorage (chave 'infodose:cssCustom')
    function applyCSS() {
      let styleEl = document.getElementById('customStyle');
      if(!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'customStyle';
        document.head.appendChild(styleEl);
      }
      const css = localStorage.getItem('infodose:cssCustom') || '';
      styleEl.innerHTML = css || '';
    }

    // Inicializa seleção de vozes para cada arquétipo
    function initVoices() {
      const wrap = document.getElementById('voicesWrap');
      if(!wrap) return;
      wrap.innerHTML = '';
      const archList = [ 'Luxara','Rhea','Aion','Atlas','Nova','Genus','Lumine','Kaion','Kaos','Horus','Elysha','Serena' ];
      function populateVoices() {
        let voices = speechSynthesis.getVoices();
        // Filtrar por idiomas suportados (Português e Inglês) se disponível
        const filtered = voices.filter(v => v.lang && (v.lang.startsWith('pt') || v.lang.startsWith('en')));
        voices = filtered.length ? filtered : voices;
        const saved = LS.get('infodose:voices', {}) || {};
        // Se ainda não houver vozes salvas, defina um mapeamento padrão
        if(Object.keys(saved).length === 0 && voices.length) {
          archList.forEach((name, idx) => {
            const v = voices[idx % voices.length];
            if(v) saved[name] = v.name;
          });
          LS.set('infodose:voices', saved);
        }
        archList.forEach(name => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '8px';
          row.style.flexWrap = 'wrap';
          const label = document.createElement('span');
          label.textContent = name;
          label.style.minWidth = '70px';
          label.style.fontWeight = '700';
          const sel = document.createElement('select');
          sel.className = 'input ring';
          sel.style.maxWidth = '220px';
          voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.name;
            opt.textContent = `${v.name} (${v.lang})`;
            sel.appendChild(opt);
          });
          if(saved[name]) sel.value = saved[name];
          sel.onchange = () => {
            saved[name] = sel.value;
            LS.set('infodose:voices', saved);
          };
          const btnTest = document.createElement('button');
          btnTest.className = 'btn fx-trans fx-press ring';
          btnTest.textContent = 'Teste';
          const rp = document.createElement('span'); rp.className = 'ripple'; btnTest.appendChild(rp);
          addRipple(btnTest);
          btnTest.onclick = () => {
            const utter = new SpeechSynthesisUtterance(`Olá, eu sou ${name}`);
            const voiceName = saved[name] || sel.value;
            const voice = voices.find(v => v.name === voiceName);
            if(voice) utter.voice = voice;
            speechSynthesis.cancel();
            speechSynthesis.speak(utter);
          };
          row.appendChild(label);
          row.appendChild(sel);
          row.appendChild(btnTest);
          wrap.appendChild(row);
        });
      }
      populateVoices();
      // Re-populate when voices list changes
      window.speechSynthesis.onvoiceschanged = () => populateVoices();
    }

    // Pronuncia o nome do arquétipo usando a voz selecionada
    function speakArchetype(name) {
      try {
        const archName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const saved = LS.get('infodose:voices', {});
        const voices = speechSynthesis.getVoices();
        let voice = null;
        if(saved && saved[archName]) {
          voice = voices.find(v => v.name === saved[archName]);
        }
        if(!voice) {
          voice = voices.find(v => v.lang && (v.lang.startsWith('pt') || v.lang.startsWith('en')));
        }
        if(!voice && voices.length) voice = voices[0];
        if(!voice) return;
        const utter = new SpeechSynthesisUtterance(`Olá, eu sou ${archName}`);
        utter.voice = voice;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      } catch (e) {}
    }

    // Fala um texto usando a voz associada ao arquétipo atualmente ativo.  Utiliza a lista
    // de vozes do Speech Synthesis e o mapeamento salvo em LS para encontrar a voz
    // correta. Se não houver voz definida, escolhe a primeira disponível (PT/EN).
    function speakWithActiveArch(text) {
      try {
        const select = document.getElementById('arch-select');
        let archFile = select ? select.value || '' : '';
        let base = archFile.replace(/\.html$/i, '');
        const key = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
        const saved = LS.get('infodose:voices', {}) || {};
        const voices = speechSynthesis.getVoices();
        let voice = null;
        if(saved[key]) {
          voice = voices.find(v => v.name === saved[key]);
        }
        if(!voice) {
          voice = voices.find(v => v.lang && (v.lang.startsWith('pt') || v.lang.startsWith('en')));
        }
        if(!voice && voices.length) voice = voices[0];
        if(!voice) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.voice = voice;
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      } catch (e) {}
    }

    // Exibe uma mensagem dentro do círculo do arquétipo. A mensagem desaparece após alguns segundos.
    function showArchMessage(text, type = 'info') {
      try {
        const el = document.getElementById('archMsg');
        if(!el) return;
        el.textContent = text;
        // Ajuste a cor de fundo conforme o tipo
        if(type === 'ok') {
          el.style.background = 'rgba(57,255,182,0.75)';
          el.style.color = '#0b0f14';
        } else if(type === 'warn') {
          el.style.background = 'rgba(255,184,107,0.78)';
          el.style.color = '#0b0f14';
        } else if(type === 'err') {
          el.style.background = 'rgba(255,107,107,0.78)';
          el.style.color = '#0b0f14';
        } else {
          el.style.background = 'rgba(15,17,32,0.72)';
          el.style.color = '';
        }
        el.classList.add('show');
        clearTimeout(el._tm);
        el._tm = setTimeout(() => {
          el.classList.remove('show');
        }, 4000);
      } catch (e) {}
    }

    // Configura o modo de ripple que responde ao áudio do microfone.  Cria um
    // analisador de áudio usando Web Audio API e ajusta a opacidade da camada
    // "audioRipple" conforme a intensidade do som capturado. Um botão
    // (arch-audio) ativa/desativa o efeito de forma discreta.
    function initAudioRipple() {
      const clickLayer = document.getElementById('audioRipple');
      const archCircleEl = document.querySelector('.arch-circle');
      if(!clickLayer || !archCircleEl) return;
      let enabled = false;
      let audioCtx = null;
      let analyser = null;
      let micStream = null;
      // Inicia a captura de áudio e animação
      async function start() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream = stream;
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const src = audioCtx.createMediaStreamSource(stream);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          animate();
        } catch (e) {
          toast('Não foi possível acessar o microfone.', 'err');
          enabled = false;
          archCircleEl.classList.remove('audio-on');
        }
      }
      // Para a captura de áudio e reseta a camada
      function stop() {
        if(micStream) {
          micStream.getTracks().forEach(t => t.stop());
          micStream = null;
        }
        if(audioCtx) {
          try { audioCtx.close(); } catch {}
          audioCtx = null;
        }
        // Remova o efeito de sombra quando desligar
        archCircleEl.style.boxShadow = '';
      }
      // Atualiza a opacidade da camada conforme o volume (RMS)
      function animate() {
        if(!enabled || !analyser) return;
        const buf = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Ajuste a intensidade: multiplique por um fator e limite a 0.6
        // Aplique um brilho em torno do círculo proporcional ao volume
        const intensity = Math.min(0.8, rms * 4);
        const blur = rms * 80;
        archCircleEl.style.boxShadow = `0 0 ${blur}px rgba(255,255,255,${intensity})`;
        requestAnimationFrame(animate);
      }
      // Clique simples no círculo inicia a interação Dual: anima a bolinha,
      // faz a saudação e inicia a captura de voz para conversar com a IA.
      clickLayer.addEventListener('click', () => {
        startDualInteraction();
      });

      // Função global para alternar o modo de visualização do áudio (ripple).  
      // Mantemos para compatibilidade com o botão de áudio no menu.
      window.toggleAudio = function () {
        enabled = !enabled;
        archCircleEl.classList.toggle('audio-on', enabled);
        if(enabled) {
          start();
        } else {
          stop();
        }
      };
    }

    // Mensagem de boas-vindas/ativação
    function welcome() {
      const name = (localStorage.getItem('infodose:userName') || '').trim();
      if(!name) {
        const msg = 'Salve! Ative sua Dual Infodose registrando seu nome na seção Brain.';
        showArchMessage(msg, 'warn');
        try { speakWithActiveArch(msg); } catch {}
      } else {
        const msg = `Bem-vindo de volta, ${name}. UNO está ao seu lado.`;
        showArchMessage(msg, 'ok');
        try { speakWithActiveArch(msg); } catch {}
      }
    }

    /* Apply ripple */
    $$('button').forEach(addRipple);
    // Move the arquétipos circle below the menu in the home view after initialization
    (function() {
      try {
        const home = document.getElementById('v-home');
        if(!home) return;
        const arch = home.querySelector('.arch-container');
        const cards = home.querySelector('.cards');
        // Se ambos existirem, garanta que as cartas apareçam depois do círculo de arquétipos.
        if(arch && cards) {
          arch.insertAdjacentElement('afterend', cards);
        }
      } catch (e) {
        console.warn('Falha ao reposicionar arquétipo:', e);
      }
    })();
    const obs = new MutationObserver((muts) => { muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => { if(n.nodeType === 1) { if(n.matches?.('button')) addRipple(n); n.querySelectorAll?.('button').forEach(addRipple); } })) });
    obs.observe(document.body, { childList: true, subtree: true });

    /* ===================== Navegação + Estado ===================== */
    function nav(key) {
      // Remapeia a antiga aba 'revo' para 'chat'
      if(key === 'revo') key = 'chat';
      // Adicionamos 'chat' à lista de abas para suportar a nova seção
      const tabs = ['home', 'apps', 'stack', 'brain', 'chat'];
      tabs.forEach(k => {
        const viewEl = document.getElementById('v-' + k);
        if(viewEl) viewEl.classList.toggle('active', k === key);
        const tabEl = document.querySelector(`.tab[data-nav="${k}"]`);
        if(tabEl) tabEl.classList.toggle('active', k === key);
      });
      LS.set('uno:lastTab', key);
      // Quando entrar na aba Home, apresente mensagem de saudação / última sessão
      if(key === 'home') {
        try { displayGreeting(); } catch (e) { console.warn(e); }
        try {
          const nameG = (localStorage.getItem('infodose:userName') || '').trim();
          if(!nameG) {
            toast('Salve! Ative sua Dual Infodose registrando seu nome na seção Brain.', 'warn');
          } else {
            // Saudação rápida na forma de toast quando o usuário retorna ao home.
            toast(`Bem-vindo de volta, ${nameG}. UNO está ao seu lado.`, 'ok');
          }
        } catch (e) {}
        // Atualize também os status quando entrar no Home
        try { updateHomeStatus(); } catch {}
      }
      // Nenhuma ação especial ao entrar na aba de chat por enquanto

      // Falar uma frase curta ao trocar de aba, usando a voz do arquétipo ativo
      try {
        let phrase = '';
        let type = 'info';
        switch (key) {
          case 'home': phrase = ''; break;
          case 'apps': phrase = 'Abrindo apps'; break;
          case 'stack': phrase = 'Abrindo stack'; break;
          case 'brain': phrase = 'Abrindo usuário'; break;
          case 'chat': phrase = 'Abrindo chat'; break;
          default: phrase = '';
        }
        if(phrase) {
          speakWithActiveArch(phrase);
          showArchMessage(phrase, type);
        }
        // Mostrar o preview laranja somente na Home; escondê-lo nas outras abas
        try {
          const prev = document.getElementById('msgPreview');
          if(prev) {
            prev.style.display = (key === 'home' && prev.textContent) ? 'block' : 'none';
          }
        } catch (e) { console.warn(e); }
      } catch (e) {}
    }

    // Alterna a visibilidade do menu de arquétipos.  O menu fica
    // escondido/mostrado ao clicar no círculo (toque curto).  Este
    // helper é chamado por initAudioRipple().
    function toggleArchMenu() {
      const menu = document.getElementById('archMenu');
      if(!menu) return;
      menu.classList.toggle('show');
    }

    /**
     * Inicia a interação Dual ao tocar a bolinha.  Esta função aplica uma
     * animação breve de pressão à bolinha, fala a saudação “Oi DUAL” (ou
     * outra frase definida) usando a voz do arquétipo ativo e, em seguida,
     * verifica se o usuário está conectado (nome, chave do OpenRouter e
     * modelo selecionados).  Caso esteja tudo configurado, ativa o
     * reconhecimento de voz para captar a fala do usuário e prosseguir
     * com a conversa.  Caso contrário, exibe uma mensagem orientando o
     * usuário a preencher suas configurações no Brain.
     */
    function startDualInteraction() {
      const archCircle = document.querySelector('.arch-circle');
      if(!archCircle) return;
      // Animação de clique: adiciona classe 'pressed' brevemente
      archCircle.classList.add('pressed');
      setTimeout(() => archCircle.classList.remove('pressed'), 180);
      // Saudação falada
      const greet = 'Oi Dual';
      showArchMessage(greet, 'ok');
      try { speakWithActiveArch(greet); } catch {}
      // Após a saudação, aguarde um curto intervalo antes de iniciar a verificação
      setTimeout(() => {
        const sk = localStorage.getItem('dual.keys.openrouter') || '';
        const userName = (localStorage.getItem('infodose:userName') || '').trim();
        const model = LS.get('dual.openrouter.model');
        if(!sk || !userName || !model) {
          const warn = 'Configure nome, chave e modelo no Brain para conversar.';
          showArchMessage(warn, 'warn');
          return;
        }
        // Se estiver tudo configurado, inicie o reconhecimento de voz
        startSpeechConversation(userName, sk, model);
      }, 600);
    }

    /**
     * Inicia o reconhecimento de fala via Web Speech API.  Quando o usuário
     * terminar de falar, a transcrição é encaminhada para a função de
     * manipulação de mensagens, que enviará a pergunta ao modelo de IA e
     * lidará com a resposta.
     * @param {string} userName Nome do usuário (para personalizar respostas)
     * @param {string} sk Chave da API do OpenRouter
     * @param {string} model Modelo selecionado
     */

    // Insere mensagens no feed de IA da Home. Mantém somente as últimas 10 entradas.
    function feedPush(type, text) {
      // Adiciona mensagem ao feed de IA se existir (mantido para compatibilidade)
      const box = document.getElementById('iaFeed');
      if(box) {
        const div = document.createElement('div');
        div.className = 'msg ' + (type || 'status');
        div.textContent = text;
        box.appendChild(div);
        const msgs = box.querySelectorAll('.msg');
        const limit = 10;
        if(msgs.length > limit) {
          box.removeChild(msgs[0]);
        }
        box.scrollTop = box.scrollHeight;
      }
      // Envia a mensagem também ao feed de chat e atualiza o preview
      try {
        chatPush(type, text);
        if(type === 'ai') updatePreview(text);
      } catch (e) { console.warn(e); }
    }
    // Função auxiliar para adicionar mensagens ao feed de chat
    function chatPush(type, text) {
      const feed = document.getElementById('chatFeed');
      if(!feed) return;
      const div = document.createElement('div');
      div.className = 'msg ' + (type || 'status');
      div.textContent = text;
      feed.appendChild(div);
      const msgs = feed.querySelectorAll('.msg');
      const limit = 50;
      if(msgs.length > limit) {
        feed.removeChild(msgs[0]);
      }
      feed.scrollTop = feed.scrollHeight;
    }
    // Atualiza o preview laranja com a última resposta da IA
    function updatePreview(text) {
      const prev = document.getElementById('msgPreview');
      if(!prev) return;
      prev.textContent = text.replace(/\s+/g, ' ').trim();
      // Exibe o preview apenas se a página Home estiver ativa.  Caso
      // contrário, mantenha-o oculto para não interferir na visualização
      // das outras abas (chat, apps etc.).
      const homeView = document.getElementById('v-home');
      const isHomeActive = homeView && homeView.classList.contains('active');
      prev.style.display = isHomeActive ? 'block' : 'none';
    }
    function startSpeechConversation(userName, sk, model) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SpeechRecognition) {
        showArchMessage('Reconhecimento de fala não suportado neste navegador.', 'err');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        showArchMessage('Estou ouvindo…', 'ok');
        feedPush('status', '🎙️ Ouvindo…');
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if(transcript) {
          feedPush('user', 'Você: ' + transcript);
          showArchMessage('Pulso enviado. Recebendo intenção…', 'ok');
          feedPush('status', '⚡ Pulso enviado · recebendo intenção…');
          handleUserMessage(transcript, userName, sk, model);
        }
      };
      recognition.onerror = (e) => {
        console.error('Erro no reconhecimento de fala:', e);
        showArchMessage('Erro no reconhecimento de fala.', 'err');
        feedPush('status', '❌ Erro no reconhecimento de fala.');
      };
      recognition.start();
    }

    /**
     * Processa a mensagem falada pelo usuário.  Exibe a transcrição no
     * feedback, envia a mensagem ao modelo de IA via OpenRouter e, ao
     * receber a resposta, exibe e fala a resposta de volta.
     * @param {string} text Texto transcrito da fala do usuário
     * @param {string} userName Nome do usuário
     * @param {string} sk Chave OpenRouter
     * @param {string} model Modelo de IA
     */
    async function handleUserMessage(text, userName, sk, model) {
      // A mensagem do usuário já foi adicionada ao feed no evento onresult do reconhecimento de fala
      // Monta prompt incluindo o nome do usuário para personalização
      const prompt = `${userName} disse: ${text}`;
      // Envia ao modelo de IA
      let reply = '';
      try {
        reply = await sendAIMessage(prompt, sk, model);
      } catch (err) {
        console.error('Falha ao consultar IA:', err);
        reply = 'Desculpe, não consegui responder no momento.';
      }
      if(reply) {
        // Determine o arquétipo ativo para prefixar as respostas no feed
        let archName = 'Dual';
        try {
          const select = document.getElementById('arch-select');
          let base = (select?.value || '').replace(/\.html$/i, '');
          archName = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
        } catch (e) {}
        feedPush('ai', archName + ': ' + reply);
        showArchMessage(reply, 'ok');
        try { speakWithActiveArch(reply); } catch {}
      }
    }

    /**
     * Envia uma mensagem ao endpoint de chat do OpenRouter.  Esta função
     * utiliza a API de chat completions para obter uma resposta do modelo
     * selecionado.  Caso não seja possível acessar a API (por exemplo,
     * se a aplicação estiver offline), uma resposta de erro é retornada.
     * @param {string} content Conteúdo da mensagem/prompt
     * @param {string} sk Chave de API
     * @param {string} model Identificador do modelo
     * @returns {Promise<string>} Resposta do modelo
     */
    async function sendAIMessage(content, sk, model) {
      // Estrutura de payload conforme especificação do OpenRouter
      const payload = {
        model: model,
        messages: [
          { role: 'system', content: 'Você é um assistente amistoso que responde em português.' },
          { role: 'user', content: content }
        ],
        max_tokens: 200,
        temperature: 0.7
      };
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sk}`
        },
        body: JSON.stringify(payload)
      });
      if(!res.ok) {
        throw new Error('Erro na API: ' + res.status);
      }
      const data = await res.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return reply || '';
    }

    // Delegue cliques dentro do menu para a função de navegação.
    document.addEventListener('DOMContentLoaded', () => {
      const menu = document.getElementById('archMenu');
      if(menu) {
      menu.addEventListener('click', (e) => {
        // Primeiro verifique se o botão de áudio foi clicado
        const audioBtn = e.target.closest('button[data-audio]');
        if(audioBtn) {
          // Alterna modo áudio usando a função global
          if(typeof toggleAudio === 'function') {
            toggleAudio();
          }
          // Atualize o estado visual do botão
          const archCircle = document.querySelector('.arch-circle');
          if(archCircle) {
            audioBtn.classList.toggle('on', archCircle.classList.contains('audio-on'));
          }
          // Não feche o menu ao alternar áudio
          return;
        }
        // Caso contrário, delegue a navegação para botões com data-nav
        const btn = e.target.closest('button[data-nav]');
        if(btn) {
          nav(btn.getAttribute('data-nav'));
          menu.classList.remove('show');
        }
      });
      }
      // Clique no preview direciona ao chat
      const mp = document.getElementById('msgPreview');
      if(mp) mp.addEventListener('click', () => nav('chat'));

      /* Formulário de chat removido: a captura de mensagens é feita via
         overlay de entrada. */

      // Inicialização dos botões de texto e voz na Home (overlay).  Dois botões
      // empilhados acima da barra: o superior inicia reconhecimento de voz e
      // o inferior mostra o campo de texto. O envio do formulário do
      // overlay dispara a mesma lógica do chat padrão.
      const textBtn = document.getElementById('homeTextBtn');
      const voiceBtn = document.getElementById('homeVoiceBtn');
      const hiOverlay = document.getElementById('homeInputOverlay');
      const hiForm = document.getElementById('homeInputForm');
      const hiInput = document.getElementById('homeInput');
      // Exibe/oculta o overlay ao tocar no botão de texto
      if(textBtn && hiOverlay && hiForm && hiInput) {
        textBtn.addEventListener('click', () => {
          const show = hiOverlay.style.display !== 'block';
          hiOverlay.style.display = show ? 'block' : 'none';
          textBtn.classList.toggle('active', show);
          if(show) setTimeout(() => hiInput.focus(), 60);
        });
        hiForm.addEventListener('submit', (ev) => {
          ev.preventDefault();
          const msg = hiInput.value.trim();
          if(!msg) return;
          feedPush('user', 'Você: ' + msg);
          showArchMessage('Pulso enviado. Recebendo intenção…', 'ok');
          feedPush('status', '⚡ Pulso enviado · recebendo intenção…');
          const userName = (localStorage.getItem('dual.name') || localStorage.getItem('infodose:userName') || '').trim();
          const sk = (localStorage.getItem('dual.keys.openrouter') || localStorage.getItem('infodose:sk') || '').trim();
          let mdl = LS.get('dual.openrouter.model');
          if(!mdl) mdl = (localStorage.getItem('infodose:model') || '').trim() || 'openrouter/auto';
          try { handleUserMessage(msg, userName, sk, mdl); } catch (e) { console.warn(e); }
          hiInput.value = '';
        });
      }
      // Inicia conversa por voz ao tocar no botão de voz
      if(voiceBtn) {
        voiceBtn.addEventListener('click', () => {
          const userName = (localStorage.getItem('dual.name') || localStorage.getItem('infodose:userName') || '').trim();
          const sk = (localStorage.getItem('dual.keys.openrouter') || localStorage.getItem('infodose:sk') || '').trim();
          let mdl = LS.get('dual.openrouter.model');
          if(!mdl) mdl = (localStorage.getItem('infodose:model') || '').trim() || 'openrouter/auto';
          if(hiOverlay) hiOverlay.style.display = 'none';
          if(typeof startSpeechConversation === 'function') {
            startSpeechConversation(userName, sk, mdl);
          }
        });
      }
    });

    // Helper: se a aba Revo estiver ativa, envia a lista atual de apps ao iframe.  
    function maybeSendAppsToRevo() {
      // Revo foi substituído pelo Chat; nenhuma mensagem precisa ser enviada
      return;
    }
    $$('.tab,[data-nav]').forEach(b => b.addEventListener('click', () => nav(b.dataset.nav || 'home')));
    $('#btnBack').onclick = () => { try { history.length > 1 && history.back() } catch { } };
    $('#btnBrain').onclick = () => nav('brain');

    // Restaurar última aba
    let last = LS.get('uno:lastTab', 'home');
    // Se o último tab salvo for 'revo', redirecione para home para evitar páginas vazias
    if(last === 'revo') last = 'home';
    nav(last);
    // Se a aba inicial for home, exibir saudação
    if(last === 'home') {
      try { displayGreeting(); } catch(e) {}
    }

    // Atalhos
    let gPressed = false;
    window.addEventListener('keydown', (e) => {
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); downloadSelf(); return; }
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#appSearch')?.focus(); return; }
      if(e.key.toLowerCase() === 'g') { gPressed = true; setTimeout(() => gPressed = false, 600); return; }
      if(!gPressed) return; const k = e.key.toLowerCase();
      if(k === 'h') nav('home'); if(k === 'a') nav('apps'); if(k === 's') nav('stack'); if(k === 'b') nav('brain'); if(k === 'r') nav('chat'); gPressed = false;
    });

    // Ajuda modal
    const modalHelp = $('#modalHelp');
    $('#btnHelp').onclick = () => { modalHelp.classList.add('open'); modalHelp.setAttribute('aria-hidden', 'false'); };
    $('#closeHelp').onclick = () => { modalHelp.classList.remove('open'); modalHelp.setAttribute('aria-hidden', 'true'); };
    modalHelp.addEventListener('click', (e) => { if(e.target === modalHelp) $('#closeHelp').click(); });

    // Baixar HTML
    function downloadSelf() {
      try {
        const clone = document.documentElement.cloneNode(true);
        const html = '<!doctype html>\n' + clone.outerHTML;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'HUB-UNO.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
        toast('HTML exportado', 'ok');
      } catch (e) { alert('Falha ao exportar: ' + e.message); }
    }
    $('#btnDownload').onclick = downloadSelf;

    /* ===================== Brain ===================== */
    const MODELS = ['openrouter/auto','anthropic/claude-3.5-sonnet','openai/gpt-4.1-mini','google/gemini-1.5-pro','meta/llama-3.1-405b-instruct','mistral/mistral-large-latest'];
    (function initBrain() {
      const sel = $('#model'); sel.innerHTML = ''; MODELS.forEach(m => { const o = document.createElement('option'); o.value = m; o.textContent = m; sel.appendChild(o) });
      sel.value = LS.get('dual.openrouter.model', MODELS[0]);
      $('#sk').value = LS.raw('dual.keys.openrouter');
      $('#saveSK').onclick = () => { LS.set('dual.openrouter.model', sel.value); localStorage.setItem('dual.keys.openrouter', $('#sk').value || ''); toast('Configurações salvas', 'ok'); };
      $('#saveName').onclick = () => {
        localStorage.setItem('infodose:userName', ($('#userName').value || '').trim());
        toast('Nome salvo', 'ok');
        try { displayGreeting(); } catch (e) {}
        try { updateHomeStatus(); } catch {}
      };

      // Permitir adicionar modelo personalizado
      const addBtn = $('#addModel');
      const customInput = $('#customModel');
      if(addBtn && customInput) {
        addBtn.onclick = () => {
          const val = (customInput.value || '').trim();
          if(!val) return;
          const opt = document.createElement('option');
          opt.value = val; opt.textContent = val;
          sel.appendChild(opt);
          sel.value = val;
          LS.set('dual.openrouter.model', val);
          customInput.value = '';
          toast('Modelo adicionado', 'ok');
        };
      }
      // Permitir carregamento de arquivo de treino
      const trainInp = $('#trainingFile');
      if(trainInp) {
        trainInp.addEventListener('change', (ev) => {
          const file = ev.target.files && ev.target.files[0];
          if(!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              LS.set('dual.openrouter.training', { name: file.name, data: reader.result });
              toast('Treinamento carregado', 'ok');
            } catch (err) { console.error(err); toast('Erro ao carregar treino', 'err'); }
          };
          reader.readAsDataURL(file);
        });
      }
    })();

    /* ===================== Inicialização do tema & personalização de fundo ===================== */
    (function initThemeSettings() {
      // Se o usuário nunca selecionou um tema antes, defina o padrão como "medium" (cinza).
      if(!LS.get('uno:theme')) {
        LS.set('uno:theme', 'medium');
      }
      // Aplique o tema salvo imediatamente
      applyTheme();
      // Configure o seletor de tema
      const sel = document.getElementById('themeSelect');
      if(sel) {
        sel.value = LS.get('uno:theme', 'medium');
        sel.addEventListener('change', () => {
          LS.set('uno:theme', sel.value);
          applyTheme();
          toast('Tema atualizado', 'ok');
          try { updateHomeStatus(); } catch {}
        });
      }
      const upload = document.getElementById('bgUpload');
      if(upload) {
        upload.addEventListener('change', (e) => {
          const f = e.target.files && e.target.files[0];
          if(!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              LS.set('uno:bg', reader.result);
              LS.set('uno:theme', 'custom');
              if(sel) sel.value = 'custom';
              applyTheme();
              toast('Fundo personalizado salvo', 'ok');
              try { updateHomeStatus(); } catch {}
            } catch (err) { console.error(err); toast('Erro ao salvar fundo', 'err'); }
          };
          reader.readAsDataURL(f);
        });
      }
    })();

    /* ===================== Ícones inline (data SVG) ===================== */
    function svgIcon(name){
      const common = 'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23f5f7ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
      const m = {
        atlas: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5 8c3 2 11 2 14 0M5 16c3-2 11-2 14 0"/></svg>`,
        nova: `<svg ${common}><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="3"/></svg>`,
        vitalis:`<svg ${common}><path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M13 3l-2 4 3 1-2 4"/></svg>`,
        pulse: `<svg ${common}><path d="M2 12h3l2-4 3 8 2-4h8"/><path d="M20 8v-3M20 19v-3"/></svg>`,
        artemis:`<svg ${common}><path d="M3 12h12"/><path d="M13 6l6 6-6 6"/><circle cx="12" cy="12" r="9"/></svg>`,
        serena:`<svg ${common}><path d="M12 21s-6-3.5-6-8a4 4 0 0 1 6-3 4 4 0 0 1 6 3c0 4.5-6 8-6 8z"/></svg>`,
        kaos:  `<svg ${common}><path d="M4 4l7 7-7 7"/><path d="M20 4l-7 7 7 7"/></svg>`,
        genus: `<svg ${common}><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M7 7l5-3 5 3M17 17l-5 3-5-3"/></svg>`,
        lumine:`<svg ${common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
        rhea:  `<svg ${common}><path d="M12 3v6"/><circle cx="12" cy="9" r="4"/><path d="M12 13v2l-2 2M12 15l2 2M12 17v3"/></svg>`,
        solus: `<svg ${common}><path d="M12 3v6M12 15v6"/><circle cx="12" cy="12" r="3"/><path d="M19 5l-3 3M5 19l3-3M5 5l3 3M19 19l-3-3"/></svg>`,
        aion:  `<svg ${common}><path d="M7 12c0-2.2 1.8-4 4-4 1.2 0 2.3.5 3 1.3M17 12c0 2.2-1.8 4-4 4-1.2 0-2.3-.5-3-1.3"/><path d="M3 12h4M17 12h4"/></svg>`,
        // Extra icons provided by the user. These are approximations of the requested
        // assets (e.g. audio.svg, bolt.svg, etc.) using simple line art. They
        // maintain the same stroke characteristics as the existing icons. To use
        // them elsewhere in the UI, call svgIcon('audio'), svgIcon('bolt'), etc.
        audio: `<svg ${common}><polygon points="3,9 8,9 12,5 12,19 8,15 3,15"/><path d="M15 9c1.5 1.5 1.5 4 0 5"/><path d="M17 7c3 3 3 7 0 10"/></svg>`,
        bolt: `<svg ${common}><path d="M13 3L4 14h7l-2 7 9-11h-7l3-7z"/></svg>`,
        download: `<svg ${common}><path d="M12 3v12"/><path d="M6 9l6 6 6-6"/><path d="M5 19h14"/></svg>`,
        grid: `<svg ${common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
        home: `<svg ${common}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        json: `<svg ${common}><path d="M7 4c-2 0-2 2-2 4v8c0 2 0 4 2 4"/><path d="M17 4c2 0 2 2 2 4v8c0 2 0 4-2 4"/></svg>`,
        'logo-capsule': `<svg ${common}><rect x="4" y="7" width="16" height="10" rx="5"/><path d="M12 7v10"/></svg>`,
        'logo-seed-split': `<svg ${common}><path d="M12 12c0-4 4-8 8-8v8c0 4-4 8-8 8v-8z"/><path d="M12 12c0-4-4-8-8-8v8c0 4 4 8 8 8v-8z"/></svg>`,
        pause: `<svg ${common}><rect x="6" y="4" width="3" height="16"/><rect x="15" y="4" width="3" height="16"/></svg>`,
        play: `<svg ${common}><polygon points="6,4 20,12 6,20"/></svg>`,
        upload: `<svg ${common}><path d="M12 21V9"/><path d="M6 15l6-6 6 6"/><path d="M5 5h14"/></svg>`,
        user: `<svg ${common}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-8 8-8s8 4 8 8"/></svg>`,
        sprites: `<svg ${common}></svg>`
      };
      const raw = m[name] || m['atlas'];
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(raw);
    }

    /* ===================== Apps (embutido + locais) ===================== */
    const RAW = { apps: [] };

    // Controle para exibir apenas apps locais ou todos
    let showOnlyLocal = false;
    // Lista de apps favoritados (por chave). Carregada do localStorage
    let favoriteKeys = [];
    try { favoriteKeys = JSON.parse(localStorage.getItem('infodose:favApps') || '[]') || []; } catch { favoriteKeys = []; }

    /**
     * Alterna um app na lista de favoritos. Salva no localStorage e re-renderiza.
     * @param {string} key
     */
    function toggleFav(key) {
      const idx = favoriteKeys.indexOf(key);
      if(idx >= 0) {
        favoriteKeys.splice(idx, 1);
      } else {
        favoriteKeys.push(key);
      }
      localStorage.setItem('infodose:favApps', JSON.stringify(favoriteKeys));
      renderApps();
    }
    /** Verifica se um app está favoritado. */
    function isFav(key) {
      return favoriteKeys.includes(key);
    }
    const appsWrap = $('#appsWrap'), appsCount = $('#appsCount');

    function normalize(list) {
      return (list || []).map(x => ({
        key: x.key || x.url || x.title || Math.random().toString(36).slice(2),
        title: x.title || x.key || 'App',
        desc: x.desc || '',
        url: String(x.url || ''),
        icon: x.icon || '',
        tags: Array.isArray(x.tags) ? x.tags : []
      }))
    }
    function locals() {
      let arr = []; try { arr = JSON.parse(LS.raw('infodose:locals:v1') || '[]') } catch {}
      return arr.map(l => ({ key: 'local:' + l.id, title: l.name || 'Local', desc: 'HTML local', url: 'local:' + l.id, icon: 'local', tags: ['local'] }))
    }
    function getLocal(id) {
      let arr = []; try { arr = JSON.parse(LS.raw('infodose:locals:v1') || '[]') } catch {}
      return arr.find(x => x.id === id) || null
    }
    function blobURL(local) { const blob = new Blob([local.html || ''], { type: 'text/html;charset=utf-8' }); return URL.createObjectURL(blob) }

    /**
     * Atualiza os cartões de status na Home com informações atuais sobre apps, sessões,
     * preferências do usuário e arquétipo ativo. Chamado sempre que o
     * catálogo muda, quando sessões são abertas/fechadas, quando
     * configurações são salvas ou ao navegar para o Home.
     */
    function updateHomeStatus() {
      try {
        // Apps: número total ou locais se estiver filtrando
        const total = normalize(RAW.apps).concat(locals()).length;
        const localCount = locals().length;
        const txtApps = showOnlyLocal ? (localCount + ' local' + (localCount === 1 ? '' : 's')) : (total + ' app' + (total === 1 ? '' : 's'));
        const elApps = document.getElementById('homeAppsStatus');
        if(elApps) elApps.textContent = txtApps;
      } catch (e) {}
      try {
        // Sessões abertas (Stack)
        const sess = document.querySelectorAll('#stackWrap .session').length;
        const txtSess = sess + ' sessão' + (sess === 1 ? '' : 's');
        const elStack = document.getElementById('homeStackStatus');
        if(elStack) elStack.textContent = txtSess;
      } catch (e) {}
      try {
        // Usuário: nome + tema atual (mapa)
        const name = (localStorage.getItem('infodose:userName') || '').trim();
        const theme = LS.get('uno:theme', 'medium');
        const themeLabel = { 'default': 'padrão', 'medium': 'cinza', 'custom': 'personalizado' }[theme] || theme;
        let txtUser = name || 'Usuário';
        txtUser += ' · ' + themeLabel;
        const elUser = document.getElementById('homeUserStatus');
        if(elUser) elUser.textContent = txtUser;
      } catch (e) {}
      try {
        // Arquétipo ativo: obtém o nome sem extensão
        const sel = document.getElementById('arch-select');
        let archName = '';
        if(sel && sel.options.length > 0) {
          const opt = sel.options[sel.selectedIndex] || null;
          if(opt) archName = opt.textContent.replace(/\.html$/i, '');
        }
        const elArch = document.getElementById('homeArchStatus');
        if(elArch) elArch.textContent = archName || 'Nenhum';
      } catch (e) {}
    }

    function appIconFor(a){
      if(!a.icon) return svgIcon('atlas');
      if(/^(atlas|nova|vitalis|pulse|artemis|serena|kaos|genus|lumine|rhea|solus|aion|local)$/.test(a.icon)) return svgIcon(a.icon);
      return a.icon; // caminho externo
    }

    function cardApp(a) {
      const el = document.createElement('div'); el.className = 'app-card fx-trans fx-lift';
      // Botão de favorito (estrela). Aparece no canto superior direito
      const fav = document.createElement('button'); fav.className = 'fav-btn';
      const favImg = document.createElement('img');
      favImg.alt = 'Favorito';
      // Use ícone local para favorito; evita depender de CDN
      favImg.src = 'icons/star.svg';
      fav.appendChild(favImg);
      // Marque como favoritado se a chave estiver na lista
      if(isFav(a.key)) fav.classList.add('fav');
      fav.onclick = (e) => { e.stopPropagation(); toggleFav(a.key); };
      el.appendChild(fav);
      const ic = document.createElement('div'); ic.className = 'app-icon';
      const img = document.createElement('img'); img.alt = ''; img.width = 24; img.height = 24; img.src = appIconFor(a); ic.appendChild(img);
      const meta = document.createElement('div'); meta.style.flex = '1';
      // Truncar o título para exibir apenas as três primeiras palavras; adicionar reticências quando houver mais.
      const fullTitle = String(a.title || a.key || '').trim();
      const words = fullTitle.split(/\s+/);
      const truncated = words.slice(0, 3).join(' ');
      const displayTitle = words.length > 3 ? truncated + '…' : truncated;
      const t = document.createElement('div');
      t.className = 'app-title';
      t.textContent = displayTitle || fullTitle;
      // O título completo fica como tooltip para acesso total via hover
      t.title = fullTitle;
      const d = document.createElement('div'); d.className = 'mut'; d.textContent = a.desc || a.url;
      const open = document.createElement('button'); open.className = 'btn fx-trans fx-press ring'; open.textContent = 'Abrir';
      const rip = document.createElement('span'); rip.className = 'ripple'; open.appendChild(rip); addRipple(open);
      open.onclick = () => openApp(a);
      meta.appendChild(t); meta.appendChild(d); meta.appendChild(open);
      el.appendChild(ic); el.appendChild(meta);
      return el
    }

    function renderApps() {
      // Busque valores de busca e ordenação apenas se os campos existirem (evita erros se ocultos)
      const searchEl = document.getElementById('appSearch');
      const sortEl = document.getElementById('appSort');
      const q = searchEl ? (searchEl.value || '').toLowerCase() : '';
      const mode = sortEl ? sortEl.value : 'az';
      // Combine apps embutidos e locais
      let L = normalize(RAW.apps).concat(locals());
      // Filtrar apenas locais se ativado
      if(showOnlyLocal) {
        L = L.filter(a => String(a.url || '').startsWith('local:'));
      }
      // Aplicar busca (mantendo compatibilidade se o usuário ainda possuir o campo)
      if(q) {
        L = L.filter(a => (a.title + ' ' + a.desc + ' ' + a.key + ' ' + a.url + ' ' + (a.tags || []).join(' ')).toLowerCase().includes(q));
      }
      // Ordenar: favoritos primeiro, depois título A-Z ou Z-A conforme o select (padrão A-Z)
      L.sort((a, b) => {
        const favA = isFav(a.key); const favB = isFav(b.key);
        if(favA !== favB) return favB - favA; // true=1, false=0 => favoritos no topo
        const dir = mode === 'za' ? -1 : 1;
        return dir * String(a.title || '').localeCompare(b.title || '');
      });
      appsWrap.innerHTML = '';
      L.forEach(a => {
        const card = cardApp(a);
        appsWrap.appendChild(card);
      });
      appsCount.textContent = L.length + ' apps';
      // Reaplicar ícones após adicionar novos cards (garante que as estrelas e ícones de apps carreguem)
      try { applyIcons(); } catch {}
      // Notifique o Revo de que os apps mudaram, se estiver ativo
      maybeSendAppsToRevo();
      // Atualize o painel de status na home com o novo número de apps
      try { updateHomeStatus(); } catch {}
    }

    (function loadEmbeddedApps(){
      try {
        const raw = JSON.parse($('#APPS_JSON').textContent || '{}');
        RAW.apps = Array.isArray(raw.apps) ? raw.apps : (Array.isArray(raw) ? raw : []);
      } catch { RAW.apps = [] }
      renderApps();
      // Sempre envie o catálogo atualizado ao iframe do Revo após carregar os apps embutidos.
      try {
        const iframe = document.getElementById('revoEmbed');
        if(iframe) {
          const apps = RAW && Array.isArray(RAW.apps) ? RAW.apps : [];
          const send = () => { if(iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'apps', apps }, '*'); };
          // Envie após pequeno atraso para garantir que o iframe esteja pronto
          setTimeout(send, 100);
          // E também quando o iframe terminar de carregar
          iframe.removeEventListener('load', iframe._sendAppsEmbedded);
          iframe._sendAppsEmbedded = send;
          iframe.addEventListener('load', send, { once: true });
        }
      } catch(e) { console.warn('Falha ao postMessage apps após embed:', e); }
    })();

    // Locais
    $('#btnImport').onclick = async () => {
      const fs = Array.from($('#fileLocal').files || []);
      if(!fs.length) return;
      const tasks = fs.map(f => new Promise(res => {
        const r = new FileReader();
        r.onload = () => {
          const content = String(r.result || '');
          // Se for um arquivo JSON, tente carregá-lo como catálogo de apps
          if(/\.json$/i.test(f.name)) {
            try {
              const obj = JSON.parse(content);
              const apps = Array.isArray(obj.apps) ? obj.apps : (Array.isArray(obj) ? obj : []);
              // Substitua o catálogo embutido pelo JSON local e recarregue a lista
              RAW.apps = apps;
              renderApps();
              toast('apps.json local carregado', 'ok');
            } catch (err) {
              console.error(err);
              toast('Erro ao ler apps.json', 'err');
            }
            // Não adicionar JSON à lista de locais; retorne null
            res(null);
          } else {
            // Trate como HTML local
            res({ id: 'l_' + Math.random().toString(36).slice(2), name: f.name.replace(/\.(html?|txt)$/i, ''), html: content, ts: Date.now() });
          }
        };
        r.readAsText(f);
      }));
      const list = (await Promise.all(tasks)).filter(Boolean);
      const cur = JSON.parse(LS.raw('infodose:locals:v1') || '[]');
      list.forEach(x => cur.unshift(x));
      localStorage.setItem('infodose:locals:v1', JSON.stringify(cur));
      renderApps();
      if(list.length) toast('HTMLs locais adicionados', 'ok');
    };
    $('#btnExport').onclick = () => { const data = { v: 1, when: Date.now(), items: JSON.parse(LS.raw('infodose:locals:v1') || '[]') }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'locals_pack.json'; a.click(); };
    $('#btnClear').onclick = () => { if(confirm('Limpar HTMLs locais salvos?')) { localStorage.removeItem('infodose:locals:v1'); renderApps(); toast('Locais limpos', 'warn'); } };

    // Alterna exibição de apps locais/apenas locais
    try {
      const btnToggleLocal = document.getElementById('btnToggleLocal');
      if(btnToggleLocal) {
        btnToggleLocal.onclick = () => {
          showOnlyLocal = !showOnlyLocal;
          // Atualize o texto do botão conforme o modo
          btnToggleLocal.firstChild && (btnToggleLocal.firstChild.nodeValue = showOnlyLocal ? 'Mostrar Todos' : 'Mostrar Locais');
          renderApps();
        };
      }
    } catch (e) { console.warn('Falha ao associar btnToggleLocal:', e); }

    /* ===================== Stack ===================== */
    const stackWrap = $('#stackWrap'), dock = $('#dock');
    function badge(item) { const b = document.createElement('button'); b.className = 'badge fx-trans fx-press ring'; b.textContent = item.title || 'App'; b.title = 'Reabrir ' + (item.title || 'App'); const rp = document.createElement('span'); rp.className = 'ripple'; b.appendChild(rp); addRipple(b); b.onclick = () => { const s = document.querySelector('[data-sid="' + item.sid + '"]'); if(s) { s.scrollIntoView({ behavior: 'smooth' }); s.classList.remove('min'); } }; return b }
    function updateDock() {
      dock.innerHTML = '';
      $$('.session').forEach(s => {
        const meta = JSON.parse(s.dataset.meta || '{}');
        dock.appendChild(badge({ title: meta.title, sid: s.dataset.sid }))
      });
      // Atualize o status de sessões na home
      try { updateHomeStatus(); } catch {}
    }
    function openApp(a) {
      const sid = 's_' + Math.random().toString(36).slice(2);
      const isLocal = String(a.url || '').startsWith('local:'); const lr = isLocal ? getLocal(String(a.url).slice(6)) : null; const url = lr ? blobURL(lr) : a.url;
      const card = document.createElement('div'); card.className = 'session fx-trans fx-lift'; card.dataset.sid = sid; card.dataset.meta = JSON.stringify({ title: a.title || 'App', url: a.url || '' });
      card.innerHTML = `
        <div class="hdr"><div class="title">${(a.title || 'App')}</div><div class="tools"><button class="btn ring fx-trans fx-press" data-act="min" title="Minimizar"><span style="font-size:16px;line-height:1">&minus;</span><span class="ripple"></span></button><button class="btn ring fx-trans fx-press" data-act="ref" title="Recarregar"><span style="font-size:16px;line-height:1">&#8635;</span><span class="ripple"></span></button><button class="btn ring fx-trans fx-press" data-act="close" title="Fechar"><span style="font-size:16px;line-height:1">&times;</span><span class="ripple"></span></button></div></div><iframe src="${url || 'about:blank'}" allow="autoplay; clipboard-read; clipboard-write; picture-in-picture; fullscreen"></iframe><div class="resize-handle" title="Arraste para ajustar a altura"></div>`;
      // Redimensionar altura do iframe arrastando o handle
      (function bindResize(){
        const handle = card.querySelector('.resize-handle');
        const iframe = card.querySelector('iframe');
        if(!handle || !iframe) return;
        let startY = 0, startH = 0, dragging = false;
        handle.addEventListener('pointerdown', (ev) => {
          dragging = true;
          startY = ev.clientY;
          startH = iframe.clientHeight;
          handle.setPointerCapture(ev.pointerId);
        });
        handle.addEventListener('pointermove', (ev) => {
          if(!dragging) return;
          const dy = ev.clientY - startY;
          const h = Math.max(120, startH + dy);
          iframe.style.height = h + 'px';
        });
        const stop = () => { dragging = false; };
        handle.addEventListener('pointerup', stop);
        handle.addEventListener('pointercancel', stop);
      })();
      // Prepend the session card dependendo do modo de abertura. Se "abrir dentro" estiver marcado,
      // insira a sessão no topo da página (sessionsAnchor); caso contrário, use o stackWrap padrão.
      const anchor = document.getElementById('sessionsAnchor');
      if($('#openInside').checked && anchor) {
        anchor.prepend(card);
      } else {
        stackWrap.prepend(card);
      }
      // Não chamar applyIcons aqui: ícones embutidos manualmente nos botões de sessão
      card.querySelector('[data-act=min]').onclick = () => {
        card.classList.toggle('min');
        updateDock();
        dualLog('Sessão minimizada: ' + (a.title || 'App'));
      };
      card.querySelector('[data-act=ref]').onclick = () => { const fr = card.querySelector('iframe'); try { fr.contentWindow.location.reload() } catch { fr.src = fr.src } };
      card.querySelector('[data-act=close]').onclick = () => {
        card.remove();
        updateDock();
        dualLog('Sessão fechada: ' + (a.title || 'App'));
      };
      // Navegue para a view Stack apenas quando não estiver abrindo dentro da página.
      if(!$('#openInside').checked) nav('stack');
      updateDock();
      toast('App aberto: ' + (a.title || 'App'), 'ok');
      dualLog('Sessão aberta: ' + (a.title || 'App'));
    }
    $('#btnCloseAll').onclick = () => { if(!confirm('Fechar todas as sessões abertas?')) return; $$('.session').forEach(s => s.remove()); updateDock(); toast('Todas as sessões fechadas', 'warn'); };

    /* ===================== Archetypes (Central Circle) ===================== */
    (function () {
      const archList = [
        'luxara.html',
        'rhea.html',
        'aion.html',
        'atlas.html',
        'nova.html',
        'genus.html',
        'lumine.html',
        'kaion.html',
        'kaos.html',
        'horus.html',
        'elysha.html'
      ];
      const select = document.getElementById('arch-select');
      const frame = document.getElementById('arch-frame');
      const fade = document.getElementById('arch-fadeCover');

      // Mapeamento de cores/gradientes por arquétipo.  Cada chave
      // corresponde ao nome do arquivo sem a extensão .html e define
      // um valor CSS (cor sólida ou gradiente) com opacidade baixa
      // para aplicar como overlay.  Ajuste as cores conforme o
      // significado simbólico de cada arquétipo.
      const ARCH_OVERLAYS = {
        luxara: 'rgba(181, 96, 255, 0.22)',  // roxo suave
        rhea:   'rgba(0, 209, 178, 0.22)',  // verde-água
        aion:   'rgba(255, 159, 67, 0.22)',  // laranja dourado
        atlas:  'rgba(64, 158, 255, 0.22)',  // azul celeste
        nova:   'rgba(255, 82, 177, 0.22)',  // rosa fúcsia
        genus:  'rgba(87, 207, 112, 0.22)',  // verde esmeralda
        lumine:'rgba(255, 213, 79, 0.22)',  // amarelo suave
        kaion:  'rgba(0, 191, 255, 0.22)',  // azul turquesa
        kaos:   'rgba(255, 77, 109, 0.22)', // vermelho vibrante
        horus:  'rgba(255, 195, 0, 0.22)',  // dourado
        elysha:'rgba(186, 130, 219, 0.22)', // lilás
        // valores padrão para quaisquer outros arquétipos
        default:'rgba(255, 255, 255, 0.0)'
      };

      // Aplica a cor/gradiente de overlay correspondente ao arquétipo
      function applyArchOverlay(name) {
        const key = (name || '').toLowerCase();
        const color = ARCH_OVERLAYS[key] || ARCH_OVERLAYS.default;
        document.documentElement.style.setProperty('--arch-overlay', color);
      }
      function populate() {
        select.innerHTML = '';
        archList.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        });
      }
      function setSrcByIndex(idx) {
        if(!archList.length) return;
        const n = (idx + archList.length) % archList.length;
        select.selectedIndex = n;
        const file = archList[n];
        frame.src = './archetypes/' + file;
        // Pronuncia o nome do arquétipo sempre que for selecionado
        try {
          const base = file.replace(/\.html$/i, '');
          speakArchetype(base);
        } catch (e) {}
        // Atualiza as informações da Home (cartões) quando o arquétipo muda
        try {
          updateHomeStatus();
        } catch (e) {}

        // Ajusta o overlay de cor para o arquétipo selecionado
        try {
          const base = file.replace(/\.html$/i, '');
          applyArchOverlay(base);
        } catch (e) {}
      }
      let current = 0;
      populate();
      if(archList.length) setSrcByIndex(0);
      document.getElementById('arch-prev').addEventListener('click', () => {
        current = (current - 1 + archList.length) % archList.length;
        fade.classList.add('show');
        setTimeout(() => {
          setSrcByIndex(current);
          setTimeout(() => fade.classList.remove('show'), 200);
        }, 140);
      });
      document.getElementById('arch-next').addEventListener('click', () => {
        current = (current + 1) % archList.length;
        fade.classList.add('show');
        setTimeout(() => {
          setSrcByIndex(current);
          setTimeout(() => fade.classList.remove('show'), 200);
        }, 140);
      });
      select.addEventListener('change', () => {
        current = select.selectedIndex;
        fade.classList.add('show');
        setTimeout(() => {
          setSrcByIndex(current);
          setTimeout(() => fade.classList.remove('show'), 200);
        }, 140);
      });
    })();

    /* ===================== Custom CSS & Voices: Event Handlers ===================== */
    // Aplicar CSS personalizado salvo no carregamento inicial
    try { applyCSS(); } catch (e) {}
    // Inicializar vozes na aba Brain
    try { initVoices(); } catch (e) {}
    // Inicializar ripple de áudio (modo que responde ao microfone)
    try { initAudioRipple(); } catch (e) {}
    // Exibir saudação inicial se aplicável
    try { welcome(); } catch (e) {}
    // Conectar botões de CSS personalizado
    const btnApplyCSS = document.getElementById('applyCSS');
    const btnClearCSS = document.getElementById('clearCSS');
    const btnDownloadCSS = document.getElementById('downloadCSS');
    if(btnApplyCSS) {
      btnApplyCSS.addEventListener('click', () => {
        const textarea = document.getElementById('cssCustom');
        const css = (textarea && textarea.value || '').trim();
        localStorage.setItem('infodose:cssCustom', css);
        applyCSS();
        toast('CSS aplicado', 'ok');
      });
    }
    if(btnClearCSS) {
      btnClearCSS.addEventListener('click', () => {
        localStorage.removeItem('infodose:cssCustom');
        const textarea = document.getElementById('cssCustom');
        if(textarea) textarea.value = '';
        applyCSS();
        toast('CSS removido', 'warn');
      });
    }
    if(btnDownloadCSS) {
      btnDownloadCSS.addEventListener('click', () => {
        const css = localStorage.getItem('infodose:cssCustom') || '';
        const blob = new Blob([css], { type: 'text/css' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'custom.css';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
      });
    }

    /* ===================== Init ===================== */
    // Inicialize preferências de performance e voz e associe botões no Brain
    (function initDualPrefs(){
      const perfSel = document.getElementById('selPerf');
      const voiceSel = document.getElementById('selVoice');
      if(perfSel) perfSel.value = dualState.perf;
      if(voiceSel) voiceSel.value = dualState.voice;
      const perfBtn = document.getElementById('btnPerf');
      const voiceBtn = document.getElementById('btnVoice');
      if(perfBtn && perfSel) {
        perfBtn.addEventListener('click', () => {
          dualState.perf = perfSel.value;
          localStorage.setItem('hub.perf', dualState.perf);
          dualLog('Performance atualizada: ' + dualState.perf);
          toast('Performance atualizada', 'ok');
        });
      }
      if(voiceBtn && voiceSel) {
        voiceBtn.addEventListener('click', () => {
          dualState.voice = voiceSel.value;
          localStorage.setItem('hub.voice', dualState.voice);
          dualLog('Voz selecionada: ' + dualState.voice);
          toast('Voz atualizada', 'ok');
        });
      }
    })();
    $$('button').forEach(addRipple);
  