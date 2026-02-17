
(function(){
  if (window.__ATOM_PATCH__) return; window.__ATOM_PATCH__ = true;
  const ATOM_PALETTES = {
    default : { core:'#7a5bff', ring:'#39ffb6', dust:'#8fd6ff', bg:'#0b0f14' },
    dopamina: { core:'#ff2d7a', ring:'#ff77aa', dust:'#ffd1e2', bg:'#14080f' },
    delta7  : { core:'#ffb300', ring:'#ff8400', dust:'#ffe0a6', bg:'#140f08' },
    asc11   : { core:'#00e6ff', ring:'#39ffb6', dust:'#baf6ff', bg:'#0b0f14' },
    quan    : { core:'#b347ff', ring:'#9d7aff', dust:'#e2ccff', bg:'#110b14' },
    orionis : { core:'#00ffab', ring:'#00ffc9', dust:'#c8fff1', bg:'#08140f' },
    lumenflux:{core:'#9fd3ff', ring:'#e7f0ff', dust:'#ffffff', bg:'#0c121a' },
    vermiph : { core:'#ff6282', ring:'#ff3d5e', dust:'#ffc0cb', bg:'#14080b' }
  };
  const $=(s,r=document)=>r.querySelector(s);
  const arc=$('.arch-circle'); if(!arc) return;
  let fab=arc.querySelector('.arch-fab'); if(!fab){ fab=document.createElement('button'); fab.className='arch-fab'; fab.title='Trocar paleta do átomo'; fab.innerHTML='✦'; arc.appendChild(fab); }
  let cvs=document.getElementById('atomCanvas'); if(!cvs){ cvs=document.createElement('canvas'); cvs.id='atomCanvas'; arc.appendChild(cvs); }
  const ctx=cvs.getContext('2d');
  const DPR=()=> (window.devicePixelRatio||1); let W=0,H=0,CX=0,CY=0;
  function resize(){ const r=arc.getBoundingClientRect(); W=Math.floor(r.width); H=Math.floor(r.height);
    const d=DPR(); cvs.width=Math.max(1,Math.floor(W*d)); cvs.height=Math.max(1,Math.floor(H*d)); cvs.style.width=W+'px'; cvs.style.height=H+'px'; ctx.setTransform(d,0,0,d,0,0); CX=W/2; CY=H/2;}
  resize(); addEventListener('resize', resize);
  const N=120, parts=[]; (function init(){ for(let i=0;i<N;i++){ const radius=0.18+Math.random()*0.34, speed=(Math.random()*0.6+0.2)*(Math.random()<.5?1:-1);
    parts.push({phi:Math.random()*Math.PI*2,r:radius,s:speed,size:1+Math.random()*2,jitter:Math.random()*0.03}); } })();
  let PALETTE=ATOM_PALETTES.asc11; function setAtomPalette(n){ PALETTE=ATOM_PALETTES[n]||ATOM_PALETTES.default; try{ fab.style.boxShadow=`0 0 0 1px ${PALETTE.core}55 inset, 0 10px 22px ${PALETTE.core}33`; }catch(_){} }
  (function hookTheme(){ const map={dopamina:'dopamina',delta7:'delta7',asc11:'asc11',quan:'quan',orionis:'orionis',lumenflux:'lumenflux',vermiph:'vermiph'};
    if(typeof window.setTheme==='function' && !window.__ATOM_WRAP_THEME__){ window.__ATOM_WRAP_THEME__=true; const orig=window.setTheme;
      window.setTheme=function(type){ const r=orig.apply(this,arguments); setAtomPalette(map[type]||'default'); return r; };
    } else { const th=document.body.getAttribute('data-theme'); setAtomPalette(th==='blue1'?'asc11':th==='medium'?'lumenflux':'default'); }
  })();
  const cycle=['asc11','dopamina','delta7','orionis','quan','lumenflux','vermiph']; let cidx=0; fab.addEventListener('click',()=>{ cidx=(cidx+1)%cycle.length; setAtomPalette(cycle[cidx]); });
  function draw(){ ctx.clearRect(0,0,W,H); const m=Math.min(W,H);
    const g=ctx.createRadialGradient(CX,CY,m*0.08,CX,CY,m*0.55); g.addColorStop(0,PALETTE.core+'22'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(CX,CY,m*0.55,0,Math.PI*2); ctx.fill();
    ctx.shadowColor=PALETTE.ring; ctx.shadowBlur=18; ctx.fillStyle=PALETTE.core; ctx.beginPath(); ctx.arc(CX,CY,m*0.06,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=PALETTE.ring+'cc'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(CX,CY,m*0.28,0,Math.PI*2); ctx.stroke();
    for(let i=0;i<parts.length;i++){ const p=parts[i]; p.phi+=(p.s*0.003); const rr=m*(0.14+p.r*0.42), x=CX+Math.cos(p.phi)*rr, y=CY+Math.sin(p.phi)*rr*(0.82+p.jitter*Math.sin(p.phi*3.0));
      ctx.fillStyle=PALETTE.dust; ctx.globalAlpha=0.75; ctx.beginPath(); ctx.arc(x,y,p.size,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1;
    requestAnimationFrame(draw); } requestAnimationFrame(draw);
})();
