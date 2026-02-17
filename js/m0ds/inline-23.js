
(()=>{
const CHAT_BACKEND = "openrouter";
const OPENROUTER_CONF = {
  model: (localStorage.getItem('dual.openrouter.model') || 'openai/gpt-4o-mini'),
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  key: localStorage.getItem('dual.keys.openrouter') || ''
};

const BLOCKS = [
  ["Sinal","Contextualize a intenção do usuário em 1 frase objetiva."],
  ["Mapa","Liste 3-5 pontos-chave do problema."],
  ["Hipóteses","Traga 3 hipóteses testáveis."],
  ["Dados","Quais dados mínimos precisamos coletar?"],
  ["Ações 10min","Aplique uma micro-ação que cabe em 10 minutos."],
  ["Riscos","Alerte sobre 2 riscos ou armadilhas."],
  ["Recursos","Sugira 3 recursos (apps, docs, pessoas)."],
  ["Sequência","Desenhe a ordem ótima em 4 passos."],
  ["Expansão","Mostre 2 variações criativas do caminho."],
  ["Métrica","Defina 1 métrica simples de sucesso."],
  ["Checkpoint","O que revisar em 24h?"],
  ["Compromisso","Gere 1 compromisso curto e claro."],
  ["Fecho","Feche com 1 frase que mantenha o pulso."]
];

function sanitize(md){
  const esc = (s)=>s.replace(/[&<>]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m]));
  md = md.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
         .replace(/\*(.+?)\*/g,'<em>$1</em>')
         .replace(/`([^`]+?)`/g,'<code>$1</code>')
         .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  return md.split('\n').map(ln=>'<p>'+esc(ln)+'</p>').join('');
}

const feed = document.getElementById('chatFeed');
function push(role, title, html){
  const el = document.createElement('div');
  el.className = `msg role-${role}`;
  el.innerHTML = (title ? `<h5>${title}</h5>` : '') + (html||'');
  feed.appendChild(el);
  el.scrollIntoView({behavior:'smooth',block:'end'});
}
function pushBlock(title){
  const el = document.createElement('div');
  el.className = 'msg role-assistant';
  el.innerHTML = `<h5>${title}</h5><div class="mut">…</div>`;
  feed.appendChild(el);
  el.scrollIntoView({behavior:'smooth',block:'end'});
  return el;
}

async function callOpenRouter(messages){
  if(!OPENROUTER_CONF.key){ throw new Error('Chave OpenRouter ausente (defina em localStorage: dual.keys.openrouter)'); }
  const body = { model: OPENROUTER_CONF.model, messages, temperature: 0.7 };
  const r = await fetch(OPENROUTER_CONF.endpoint, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${OPENROUTER_CONF.key}`,
      'HTTP-Referer': location.origin,
      'X-Title':'HUB UNO Chat13'
    },
    body: JSON.stringify(body)
  });
  if(!r.ok){ throw new Error('OpenRouter HTTP '+r.status); }
  const j = await r.json();
  return j.choices?.[0]?.message?.content || '';
}

async function chat13Pipeline(userText){
  const baseSystem = "Você é o Chat13 do HUB UNO. Responda de forma breve, clara e aplicável para cada bloco.";
  const baseMsgs = [{role:'system', content: baseSystem}, {role:'user', content: userText}];
  for(const [title, instr] of BLOCKS){
    const dom = pushBlock(title);
    try{
      const content = await callOpenRouter([
        ...baseMsgs,
        {role:'user', content: `Bloco: ${title}. Instrução: ${instr}.
Formate com frases curtas, listas quando fizer sentido, e sem rodeios.`}
      ]);
      dom.innerHTML = `<h5>${title}</h5>${sanitize(content)}`;
    }catch(e){
      dom.innerHTML = `<h5>${title}</h5><p class="mut">[erro: ${e.message}]</p>`;
    }
  }
}

const input = document.getElementById('chatInput');
document.getElementById('chatSend').addEventListener('click', async ()=>{
  const text = (input.value||'').trim();
  if(!text) return;
  push('user','Você', sanitize(text));
  input.value = ''; input.focus();
  try{ await chat13Pipeline(text); }
  catch(e){ push('assistant','Erro', `<p class="mut">${e.message}</p>`); }
});

input.addEventListener('keydown',(e)=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); document.getElementById('chatSend').click(); }
});

const pulse = document.getElementById('chatPulse');
function setPulseSpeed(fast){ pulse.style.setProperty('animation-duration', fast?'1.6s':'2.8s'); }
input.addEventListener('focus', ()=>setPulseSpeed(true));
input.addEventListener('blur',  ()=>setPulseSpeed(false));

push('assistant','Pronto','<p>Chat 13-Blocos iniciado. Escreva sua intenção e aperte <strong>Enviar</strong>.</p>');
})();
