/* === CONSOLIDATION: remover duplicatas de #v-chat (manter onde existe #chatFeed) === */
(function(){
  try{
    const chats = Array.from(document.querySelectorAll('section#v-chat'));
    if (chats.length <= 1) return;
    const keep = chats.find(sec => sec.querySelector('#chatFeed, .chat-feed, .chat-composer')) || chats[0];
    chats.forEach(sec => { if(sec !== keep){ sec.parentElement && sec.parentElement.removeChild(sec); } });
  }catch(e){ console.warn('chat consolidation:', e); }
})();