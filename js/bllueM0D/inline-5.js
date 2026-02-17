
(function(){
  const $ = (q,r=document)=>r.querySelector(q);
  const $$ = (q,r=document)=>Array.from(r.querySelectorAll(q));
  const LS = {
    get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
    set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
    raw:(k)=>localStorage.getItem(k)||'',
    del:(k)=>{try{localStorage.removeItem(k)}catch(e){}},
    clear:()=>{try{localStorage.clear()}catch(e){}}
  };
  const isROM = ()=>/rom/i.test(location.hash)||/\\brom\\b/i.test(document.title)||/\\brom\\b/i.test((document.body.getAttribute('data-page')||''));

  // ===== Toaster =====
  let toastTimer=null;
  function showToast(msg, ms=2800){
    const el = $('#dual-toaster');
    if(!el) return;
    el.textContent = String(msg);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ el.classList.remove('show'); }, ms);
  }
  window.DualToast = showToast;

  // ===== Archetype bubble (ROM) =====
  let bubbleTimer=null;
  function showArchBubble(msg, ms=4500){
    const host = $('#arch-bubble'); if(!host) return;
    host.innerHTML = '<div class="bubble"></div>';
    const b = host.firstElementChild;
    b.textContent = String(msg);
    requestAnimationFrame(()=>{
      b.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(()=>{ b.classList.remove('show'); }, ms);
    });
  }

  // ===== LocalStorage Brain Viewer =====
  function renderLS(){
    const grid = $('#ls-grid'); if(!grid) return;
    grid.innerHTML = '';
    Object.keys(localStorage).sort().forEach(k=>{
      const v = LS.raw(k);
      const rowK = document.createElement('div'); rowK.className='k'; rowK.textContent=k;
      const rowV = document.createElement('div'); rowV.textContent = v.length>200? (v.slice(0,200)+'…'): v;
      const rowA = document.createElement('div');
      const del = document.createElement('button'); del.textContent='apagar';
      del.addEventListener('click', ()=>{ LS.del(k); renderLS(); });
      rowA.appendChild(del);
      grid.appendChild(rowK); grid.appendChild(rowV); grid.appendChild(rowA);
    });
  }
  const panel = $('#ls-panel');
  $('#ls-panel-btn')?.addEventListener('click', ()=>{ panel.style.display='block'; renderLS(); });
  $('#ls-hide')?.addEventListener('click', ()=>{ panel.style.display='none'; });
  $('#ls-refresh')?.addEventListener('click', renderLS);
  $('#ls-clear-all')?.addEventListener('click', ()=>{
    if(confirm('Limpar TODO o LocalStorage? Esta ação é irreversível.')){
      LS.clear(); renderLS(); showToast('LocalStorage limpo.');
    }
  });

  // ===== Message routing =====
  // If chatPush exists, wrap it so AI messages are routed: ROM -> archetype bubble; other pages -> toaster.
  const _chatPush = window.chatPush;
  if(typeof _chatPush === 'function'){
    window.chatPush = function(type, text){
      try{
        if(type==='ai'){
          if(isROM()) showArchBubble(text);
          else showToast(text);
          // Não duplicar na timeline original quando for AI
          return;
        }
      }catch(e){}
      return _chatPush.apply(this, arguments);
    };
  }

  // If your code dispatches window events instead of chatPush, you can use these:
  window.dispatchEvent(new CustomEvent('dual:assistant:message',{detail:{text:'(hook pronto)'}}));
  window.addEventListener('dual:assistant:message', (ev)=>{
    const text = (ev && ev.detail && ev.detail.text) ? ev.detail.text : '';
    if(!text) return;
    if(isROM()) showArchBubble(text); else showToast(text);
  });

  // ===== Ensure ROM speaks via archetype (signal) =====
  // Fire a lightweight signal any time we land on ROM; your archetype code can listen and speak.
  function pingROM(){
    if(isROM()){
      window.dispatchEvent(new CustomEvent('dual:rom:entered', {detail:{archetype: localStorage.getItem('archetype:active')||''}}));
    }
  }
  window.addEventListener('hashchange', pingROM);
  document.addEventListener('DOMContentLoaded', pingROM);
})();
