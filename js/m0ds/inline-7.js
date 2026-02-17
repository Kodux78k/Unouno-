
// ===================== ChatPlus — v1 (2025-09-26) =====================
// Adds: emoji buttons, 3-block expandable answers, safe HTML rendering,
// autosave + compaction, and speech cues "Pulso enviado / Recebendo intenção".

(function(){
  const $ = (q, r=document)=>r.querySelector(q);
  const $$ = (q, r=document)=>Array.from(r.querySelectorAll(q));
  const LS = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
    raw:(k)=>localStorage.getItem(k)||''
  };

  // ---------- 1) Safe HTML sanitizer ----------
  function sanitizeHTML(input){
    try{
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(input||''), 'text/html');
      const disallowed = ['script','style','link','iframe','object','embed','meta'];
      disallowed.forEach(tag => doc.querySelectorAll(tag).forEach(n=>n.remove()));
      // Remove on* attributes and style; harden URLs
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
      const allowedProtocols = ['http:', 'https:', 'data:'];
      while (walker.nextNode()) {
        const el = walker.currentNode;
        // Remove event handlers and style
        [...el.attributes].forEach(a => {
          if (/^on/i.test(a.name) || a.name === 'style') el.removeAttribute(a.name);
        });
        if (el.tagName === 'A') {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
          const href = el.getAttribute('href') || '';
          try {
            const u = new URL(href, location.href);
            if (!allowedProtocols.includes(u.protocol)) el.removeAttribute('href');
          } catch { el.removeAttribute('href'); }
        }
        if (el.tagName === 'IMG') {
          const src = el.getAttribute('src') || '';
          if (!/^https?:|^data:image\//i.test(src)) {
            el.removeAttribute('src');
          } else if (src.startsWith('data:') && src.length > 200000) {
            el.setAttribute('src', '');
          }
          el.setAttribute('loading','lazy');
          el.setAttribute('decoding','async');
          el.style.maxWidth = '100%';
          el.style.height = 'auto';
          el.style.borderRadius = '8px';
        }
      }
      return doc.body.innerHTML;
    }catch(e){
      return String(input||'').replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
    }
  }

  // ---------- 2) Emoji wrapper & quick-reply ----------
  const emojiRegex = /([\p{Extended_Pictographic}\u2600-\u27BF](?:\uFE0F|\u200D[\p{Extended_Pictographic}\u2600-\u27BF])*)/gu;
  function wrapEmojisInEl(root){
    if (!root) return;
    // Walk text nodes and replace emojis with buttons
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const toReplace = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue) continue;
      if (emojiRegex.test(node.nodeValue)) {
        toReplace.push(node);
      }
      emojiRegex.lastIndex = 0;
    }
    toReplace.forEach(node => {
      const frag = document.createDocumentFragment();
      const parts = node.nodeValue.split(emojiRegex);
      parts.forEach(part => {
        if (!part) return;
        if (emojiRegex.test(part)) {
          const btn = document.createElement('button');
          btn.className = 'emoji-btn';
          btn.textContent = part;
          btn.setAttribute('data-emoji', part);
          frag.appendChild(btn);
          emojiRegex.lastIndex = 0;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  // Delegation: clicking an emoji sends it as a new message
  const chatFeed = document.getElementById('chatFeed');
  if (chatFeed) {
    chatFeed.addEventListener('click', (e) => {
      const btn = e.target.closest('.emoji-btn');
      if (!btn) return;
      const emoji = btn.getAttribute('data-emoji') || btn.textContent || '';
      if (emoji) {
        if (typeof window.sendUserMessage === 'function') {
          window.sendUserMessage(emoji);
        }
      }
    });
  }

  // ---------- 3) Chat store + compaction ----------
  const ChatStore = {
    key: 'uno:chat:v2',
    memKey: 'uno:chat:mem',
    maxPairs: 12,
    maxChars: 100000,
    load(){ return LS.get(this.key, []); },
    save(list){ LS.set(this.key, list||[]); },
    memory(){ return LS.get(this.memKey, ''); },
    setMemory(text){ LS.set(this.memKey, String(text||'')); },
    append(role, content){
      const list = this.load();
      list.push({ role, content: String(content||''), ts: Date.now() });
      this.save(list);
      this.compact();
    },
    clear(){ LS.set(this.key, []); LS.set(this.memKey, ''); },
    compact(){
      try {
        let list = this.load();
        const textLen = list.map(x => x.content||'').join('\n').length;
        if (list.length > 120 || textLen > this.maxChars) {
          const keep = list.filter(m => m.role === 'user' || m.role === 'assistant');
          // Keep last N pairs, summarize the rest
          const cutoffIndex = Math.max(0, keep.length - (this.maxPairs*2));
          const older = keep.slice(0, cutoffIndex);
          const newer = keep.slice(cutoffIndex);
          const summary = this.naiveSummarize(older);
          this.setMemory(summary);
          // Rebuild list with summary marker + newer
          const rebuilt = [];
          if (summary) rebuilt.push({ role: 'system', content: 'Contexto resumido: ' + summary, ts: Date.now() });
          newer.forEach(m => rebuilt.push(m));
          this.save(rebuilt);
        }
      } catch (e) {}
    },
    naiveSummarize(msgs){
      if (!Array.isArray(msgs) || !msgs.length) return '';
      const lines = [];
      let count = 0;
      for (const m of msgs) {
        const role = m.role === 'assistant' ? 'IA' : (m.role === 'user' ? 'Você' : m.role);
        const t = String(m.content||'').replace(/\s+/g,' ').trim();
        if (!t) continue;
        const first = t.split(/[.!?]/)[0];
        if (first) {
          lines.push('• ' + role + ': ' + first.slice(0, 160));
          count += first.length;
        }
        if (count > 1200) break;
      }
      return lines.join('\n');
    },
    buildMessages(userContent){
      // System directives to enforce 3 blocks.
      const sys = {
        role: 'system',
        content: [
          'Você é um assistente em português.',
          'Estruture SEMPRE a resposta em 3 blocos, com estes títulos exatos:',
          '### Recompensa Inicial',
          '### Curiosidade & Expansão',
          '### Antecipação Vibracional',
          'Cada bloco pode conter HTML simples seguro (sem scripts).'
        ].join(' ')
      };
      const memory = this.memory();
      const memMsg = memory ? { role: 'system', content: 'Contexto resumido (memória):\n' + memory } : null;
      const prev = this.load().filter(m => m.role === 'user' || m.role === 'assistant');
      // Keep last pairs
      const sliceStart = Math.max(0, prev.length - (this.maxPairs*2));
      const context = prev.slice(sliceStart);
      const msgs = [sys];
      if (memMsg) msgs.push(memMsg);
      context.forEach(m => msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
      msgs.push({ role: 'user', content: userContent });
      return msgs;
    }
  };
  window.ChatStore = ChatStore;

  // ---------- 4) Render expandable 3-block reply with optional HTML ----------
  function extractHTMLFromFences(text){
    const m = /```html\s*([\s\S]*?)\s*```/i.exec(text||'');
    return m ? m[1] : null;
  }
  function splitIntoBlocks(raw){
    const t = String(raw||'');
    const re1 = /###\s*Recompensa\s*Inicial[\s\S]*?(?=###\s*Curiosidade\s*&\s*Expans[aã]o|$)/i;
    const re2 = /###\s*Curiosidade\s*&\s*Expans[aã]o[\s\S]*?(?=###\s*Antecip[aã]o\s*Vibracional|$)/i;
    const re3 = /###\s*Antecip[aã]o\s*Vibracional[\s\S]*/i;
    const b1 = (t.match(re1)||[''])[0].replace(/###.*?\n?/,'').trim();
    const b2 = (t.match(re2)||[''])[0].replace(/###.*?\n?/,'').trim();
    const b3 = (t.match(re3)||[''])[0].replace(/###.*?\n?/,'').trim();
    if (b1 || b2 || b3) return { reward:b1, curious:b2, vibe:b3 };
    // Fallback: split roughly
    const parts = t.split(/\n\n+/);
    const n = parts.length;
    const reward = parts.slice(0, Math.max(1, Math.ceil(n*0.3))).join('\n\n');
    const curious = parts.slice(Math.max(1, Math.ceil(n*0.3)), Math.max(2, Math.ceil(n*0.7))).join('\n\n');
    const vibe = parts.slice(Math.max(2, Math.ceil(n*0.7))).join('\n\n');
    return { reward, curious, vibe };
  }
  function paraToHTML(s){
    const esc = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return esc.split(/\n{2,}/).map(p => '<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
  }
  function createBlockEl(title, content){
    const details = document.createElement('details');
    details.className = 'ai-block';
    const summary = document.createElement('summary');
    summary.innerHTML = title;
    const body = document.createElement('div');
    body.className = 'block-body';
    // If fenced HTML present, render sanitized HTML
    const fenced = extractHTMLFromFences(content||'');
    if (fenced) {
      const safe = sanitizeHTML(fenced);
      body.innerHTML = '<div class="render-html">'+ safe +'</div>';
    } else if (/<[a-z][\s\S]*>/i.test(content||'')) {
      body.innerHTML = '<div class="render-html">'+ sanitizeHTML(content) +'</div>';
    } else {
      body.innerHTML = paraToHTML(content||'');
    }
    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }
  function renderAssistantReply(raw){
    const feed = document.getElementById('chatFeed');
    if (!feed) return;
    const { reward, curious, vibe } = splitIntoBlocks(raw||'');
    const wrap = document.createElement('div');
    wrap.className = 'msg ai ai-rich';
    // Build the three blocks
    const b1 = createBlockEl('1) <strong>Recompensa Inicial</strong> ⚡', reward||'');
    const b2 = createBlockEl('2) <strong>Curiosidade &amp; Expansão</strong> 🔎', curious||'');
    const b3 = createBlockEl('3) <strong>Antecipação Vibracional</strong> ✨', vibe||'');
    // Open first block by default
    b1.open = true;
    wrap.appendChild(b1);
    wrap.appendChild(b2);
    wrap.appendChild(b3);
    // Extract emojis to suggestion row
    const ems = (raw||'').match(/([\p{Extended_Pictographic}\u2600-\u27BF])/gu) || [];
    const uniq = Array.from(new Set(ems)).slice(0,8);
    if (uniq.length) {
      const sug = document.createElement('div');
      sug.className = 'emoji-suggestions';
      uniq.forEach(e => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = e;
        btn.setAttribute('data-emoji', e);
        sug.appendChild(btn);
      });
      wrap.appendChild(sug);
    }
    feed.appendChild(wrap);
    wrapEmojisInEl(wrap);
    feed.scrollTop = feed.scrollHeight;
    // Update preview and voice (speak only the reward block text stripped)
    try {
      const txt = (reward||'').replace(/<[^>]*>/g,'').replace(/```[\s\S]*?```/g,'').trim();
      if (typeof updatePreview === 'function') updatePreview(txt || (raw||'').slice(0,180));
      if (typeof speakWithActiveArch === 'function' && txt) speakWithActiveArch(txt);
    } catch{}
    // Save to chat store
    try { if (!window.__RESTORING_CHAT) ChatStore.append('assistant', raw||''); } catch{}
  }
  window.renderAssistantReply = renderAssistantReply;

  // ---------- 5) Unified sendUserMessage ----------
  async function sendUserMessage(msg){
    const text = String(msg||'').trim();
    if (!text) return;
    // Show in feeds + voice status
    if (typeof feedPush === 'function') feedPush('user', 'Você: ' + text);
    try {
      if (typeof showArchMessage === 'function') showArchMessage('Pulso enviado. Recebendo intenção…', 'ok');
      if (typeof speakWithActiveArch === 'function') {
        speakWithActiveArch('Pulso enviado');
        setTimeout(()=>speakWithActiveArch('Recebendo intenção'), 380);
      }
    } catch{}
    if (typeof feedPush === 'function') feedPush('status', '⚡ Pulso enviado · recebendo intenção…');
    try { ChatStore.append('user', text); } catch{}
    // Build OpenRouter call
    const userName = (localStorage.getItem('dual.name') || localStorage.getItem('infodose:userName') || '').trim();
    const sk = (localStorage.getItem('dual.keys.openrouter') || localStorage.getItem('infodose:sk') || '').trim();
    let model = (window.LS && LS.get && LS.get('dual.openrouter.model')) || (localStorage.getItem('infodose:model') || '').trim() || 'openrouter/auto';
    // Call
    try {
      const reply = await sendAIMessageCtx({ userContent: text, sk, model });
      if (reply) {
        renderAssistantReply(reply);
      }
    } catch (err) {
      console.error(err);
      if (typeof feedPush === 'function') feedPush('status', '❌ Erro ao obter resposta.');
    }
  }
  window.sendUserMessage = sendUserMessage;

  // ---------- 6) Override/extend existing functions non-intrusively ----------
  // a) StartSpeech: override to route to sendUserMessage()
  if (typeof startSpeechConversation === 'function') {
    window._startSpeechConversationOrig = startSpeechConversation;
  }
  window.startSpeechConversation = function(userName, sk, model){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      try { showArchMessage('Reconhecimento de fala não suportado neste navegador.', 'err'); } catch {}
      try { feedPush('status', '❌ Reconhecimento de fala não suportado.'); } catch {}
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      try { showArchMessage('Estou ouvindo…', 'ok'); } catch {}
      try { feedPush('status', '🎙️ Ouvindo…'); } catch {}
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) sendUserMessage(transcript);
    };
    recognition.onerror = (e) => {
      console.error('Erro no reconhecimento de fala:', e);
      try { showArchMessage('Erro no reconhecimento de fala.', 'err'); } catch {}
      try { feedPush('status', '❌ Erro no reconhecimento de fala.'); } catch {}
    };
    recognition.start();
  };

  // b) Override sendAIMessage to support full context + 3-block instruction
  if (typeof sendAIMessage === 'function') window._sendAIMessageOrig = sendAIMessage;
  async function sendAIMessageCtx({ userContent, sk, model }){
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const messages = ChatStore.buildMessages(userContent);
    const payload = {
      model: model,
      messages: messages,
      max_tokens: 600,
      temperature: 0.7
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sk}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Erro na API: ' + res.status);
    const data = await res.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return reply || '';
  }
  window.sendAIMessageCtx = sendAIMessageCtx;
  window.sendAIMessage = async function(content, sk, model){
    return sendAIMessageCtx({ userContent: content, sk, model });
  };

  // c) Wrap openApp to speak app title on open
  if (typeof openApp === 'function') {
    const _openApp = openApp;
    window.openApp = function(a){
      try {
        if (typeof speakWithActiveArch === 'function') speakWithActiveArch('Abrindo ' + (a && (a.title||'app')));
      } catch{}
      return _openApp(a);
    }
  }

  // d) Force app card titles to 2 words + ellipsis (post-render safety)
  if (typeof cardApp === 'function') {
    const _cardApp = cardApp;
    window.cardApp = function(a){
      const el = _cardApp(a);
      try {
        const fullTitle = String(a.title || a.key || '').trim();
        const words = fullTitle.split(/\s+/);
        const two = words.slice(0,2).join(' ');
        const display = words.length > 2 ? two + '…' : two;
        const tEl = el.querySelector('.app-title');
        if (tEl) { tEl.textContent = display || fullTitle; tEl.title = fullTitle; }
      } catch{}
      return el;
    }
  }

  // e) Feed autosave: patch feedPush/chatPush to store messages (without breaking UI)
  const _feedPush = (typeof feedPush === 'function') ? feedPush : null;
  window.feedPush = function(type, text){
    if (_feedPush) _feedPush(type, text);
    try {
      if (type === 'user') {
        const t = String(text||'').replace(/^Você:\s*/i,'');
        ChatStore.append('user', t);
      } else if (type === 'ai') {
        const t = String(text||'').replace(/^[^:]+:\s*/i,'');
        ChatStore.append('assistant', t);
      }
    } catch {}
  };
  if (typeof chatPush === 'function') {
    const _chatPush = chatPush;
    window.chatPush = function(type, text){
      _chatPush(type, text);
      try {
        if (type === 'user') {
          const t = String(text||'').replace(/^Você:\s*/i,'');
          ChatStore.append('user', t);
        } else if (type === 'ai') {
          const t = String(text||'').replace(/^[^:]+:\s*/i,'');
          ChatStore.append('assistant', t);
        }
      } catch {}
    }
  }

  // ---------- 7) Restore chat on load ----------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.__RESTORING_CHAT = true;
      const list = ChatStore.load();
      if (!list || !list.length) return;
      const feed = document.getElementById('chatFeed');
      if (!feed) return;
      list.forEach(m => {
        if (m.role === 'assistant') {
          // Render as blocks if possible
          window.renderAssistantReply(m.content);
        } else if (m.role === 'user') {
          const div = document.createElement('div');
          div.className = 'msg user';
          div.textContent = 'Você: ' + (m.content||'');
          feed.appendChild(div);
        }
      });
      feed.scrollTop = feed.scrollHeight;
      window.__RESTORING_CHAT = false;
    } catch (e) { console.warn('Restore chat failed', e); window.__RESTORING_CHAT = false; }
  });

  // ---------- 8) Intercept home input form submit (capture) to route to sendUserMessage ----------
  document.addEventListener('DOMContentLoaded', () => {
    const hiForm = document.getElementById('homeInputForm');
    const hiInput = document.getElementById('homeInput');
    if (hiForm && hiInput) {
      hiForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        const msg = (hiInput.value || '').trim();
        if (msg) window.sendUserMessage(msg);
        hiInput.value = '';
        return false;
      }, true); // capture to preempt previous handler
    }
  });

})(); // end ChatPlus
