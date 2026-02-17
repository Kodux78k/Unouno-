
    (function(){ 
      if (!window.Uno || window.Uno.__fallback_patch_v1) return;
      const Uno = window.Uno; 
      Uno.__fallback_patch_v1 = true;

      function LSget(k){ try{ return localStorage.getItem(k) || ''; }catch(e){ return ''; } }
      function LSset(k,v){ try{ localStorage.setItem(k,v); }catch(e){ } }
      function feed(type, text){ try{ if (typeof window.feedPush === 'function') window.feedPush(type, text); }catch(e){ } }

      const DEFAULT_CHAIN = [
        'deepseek/deepseek-chat',
        'meta/llama-3.1-8b-instruct',
        'mistral/mistral-small-latest',
        'openrouter/auto'
      ];

      function chainFromLS(){
        const raw = LSget('dual.openrouter.fallback') || LSget('openrouter:fallback') || '';
        if (!raw) return DEFAULT_CHAIN.slice();
        return raw.split(',').map(s=>s.trim()).filter(Boolean);
      }

      // Wrap Uno.sendChat to add headers and timeout
      const _baseSend = Uno.sendChat;
      Uno.sendChat = async function({messages, model, sk, max_tokens=600, temperature=0.7, timeoutMs=30000}){
        if (!sk) throw new Error('OpenRouter key missing');
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort('timeout'), timeoutMs);
        try {
          const url = 'https://openrouter.ai/api/v1/chat/completions';
          const payload = { model, messages, max_tokens, temperature };
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sk}`,
              'HTTP-Referer': location.origin || 'http://localhost',
              'X-Title': 'HUB UNO'
            },
            body: JSON.stringify(payload),
            signal: ctrl.signal
          });
          if (!res.ok) {
            const body = await res.text().catch(()=>'');
            throw new Error(`OpenRouter HTTP ${res.status}` + (body ? ' • ' + body.slice(0,160) : ''));
          }
          const data = await res.json();
          return (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
        } finally {
          clearTimeout(id);
        }
      };

      Uno.sendWithFallback = async function({messages, sk, preferredModel, max_tokens=600, temperature=0.7}){
        const chain = [ preferredModel || (Uno.getOpenRouter && Uno.getOpenRouter().model) || 'openrouter/auto' ]
                      .concat( chainFromLS() );
        const tried = new Set();
        let lastErr;
        for (const mdl of chain) {
          if (!mdl || tried.has(mdl)) continue;
          tried.add(mdl);
          try {
            feed('status', 'OpenRouter tentando: ' + mdl);
            const out = await Uno.sendChat({ messages, model: mdl, sk, max_tokens, temperature });
            feed('status', 'OpenRouter OK: ' + mdl);
            return out;
          } catch(e) {
            lastErr = e;
            feed('status', 'Falhou: ' + mdl + ' -> ' + (e && e.message ? e.message : e));
          }
        }
        throw lastErr || new Error('Nenhum modelo respondeu');
      };

      // Replace sendAIMessageCtx to use fallback
      const prevCtx = window.sendAIMessageCtx;
      window.sendAIMessageCtx = async function({ userContent, sk, model, system, temperature, max_tokens } = {}){
        const conf = Uno.getOpenRouter ? Uno.getOpenRouter() : { sk: '', model: 'openrouter/auto' };
        const _sk = sk || conf.sk;
        const _model = model || conf.model;
        const sysMsg = system || 'Você é um assistente em português. Seja claro e objetivo.';
        const messages = [
          { role: 'system', content: sysMsg },
          { role: 'user', content: String(userContent||'').trim() }
        ];
        return Uno.sendWithFallback({ messages, sk: _sk, preferredModel: _model, temperature: temperature ?? 0.7, max_tokens: max_tokens ?? 600 });
      };

      // Key/model compatibility layer (mirror keys both ways)
      (function syncKeys(){
        const k1 = LSget('dual.keys.openrouter') || '';
        const k2 = LSget('openrouter:key') || LSget('openrouter_key') || '';
        const k  = k1 || k2;
        if (k && !k1) LSset('dual.keys.openrouter', k);
        if (k && !k2) LSset('openrouter:key', k);

        const m1 = LSget('dual.openrouter.model') || '';
        const m2 = LSget('openrouter:model') || LSget('openrouter_model') || '';
        const m  = m1 || m2 || 'openrouter/auto';
        if (m && !m1) LSset('dual.openrouter.model', m);
        if (m && !m2) LSset('openrouter:model', m);
      })();
    })();
    