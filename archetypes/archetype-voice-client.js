
/**
 * archetype-voice-client.js
 * Drop inside an Archetype micro‑app (iframe). It forwards speak requests to the parent HUB.
 */
(function(){
  function speak(text, archName){
    try{
      window.parent && window.parent.postMessage({type:'speak', arch: archName || window.ArchetypeName || 'Luxara', text}, '*');
    }catch(e){ console.warn('postMessage speak failed', e); }
  }
  // Expose
  window.ArchetypeSpeak = { speak };
})();
