
(function(){
  const ARCHES=[
    {id:'atlas',label:'Atlas'},{id:'nova',label:'Nova'},{id:'vitalis',label:'Vitalis'},{id:'pulse',label:'Pulse'},
    {id:'artemis',label:'Artemis'},{id:'serena',label:'Serena'},{id:'kaos',label:'Kaos'},{id:'genus',label:'Genus'},
    {id:'lumine',label:'Lumine'},{id:'solus',label:'Solus'},{id:'aion',label:'Aion'},{id:'rhea',label:'Rhea'}
  ];
  const $orb=document.getElementById('arch-orb');
  const $use=document.getElementById('arch-icon');
  let idx=0;
  function setArch(key){
    const i=typeof key==='number' ? ((key%ARCHES.length)+ARCHES.length)%ARCHES.length
                                  : ARCHES.findIndex(a=>a.id===String(key).toLowerCase());
    if(i<0) return;
    idx=i;$use.setAttribute('href','#icon-'+ARCHES[i].id);
    try{
      // opcional: mudar overlay do site se usar --grad-a/--grad-b globais
      const root=document.documentElement;
      root.style.setProperty('--arch-overlay','rgba(64,158,255,.22)');
    }catch{}
  }
  window.ArchOrb={set,set:setArch,get:()=>ARCHES[idx],svg:()=>new XMLSerializer().serializeToString($orb)};
  const hash=location.hash.replace('#','').trim(); if(hash) setArch(hash);
})();
