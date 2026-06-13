function startSpeechConversation(userName, sk, model) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
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

    // sync com sistema global (IMPORTANTE no teu stack novo)
    window.KOBLLUX = window.KOBLLUX || {};
    window.KOBLLUX.state = window.KOBLLUX.state || {};
    window.KOBLLUX.state.listening = true;
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();

    if (!transcript) return;

    feedPush('user', 'Você: ' + transcript);

    showArchMessage('Pulso enviado. Recebendo intenção…', 'ok');
    feedPush('status', '⚡ Pulso enviado · recebendo intenção…');

    // passa pelo pipeline principal (IA)
    try {
      handleUserMessage(transcript, userName, sk, model);
    } catch (e) {
      console.warn('handleUserMessage falhou:', e);
    }

    // opcional: também dispara bridge para outros módulos
    if (window.KOBLLUX?.send) {
      window.KOBLLUX.send("VOICE_INPUT", { text: transcript, userName });
    }

    window.KOBLLUX.state.listening = false;
  };

  recognition.onerror = (e) => {
    console.error('Erro no reconhecimento de fala:', e);

    showArchMessage('Erro no reconhecimento de fala.', 'err');
    feedPush('status', '❌ Erro no reconhecimento de fala.');

    if (window.KOBLLUX?.state) {
      window.KOBLLUX.state.listening = false;
    }
  };

  recognition.onend = () => {
    if (window.KOBLLUX?.state) {
      window.KOBLLUX.state.listening = false;
    }
  };

  recognition.start();
}
