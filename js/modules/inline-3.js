
(function(){
  const $=(q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  const LS={raw:(k)=>localStorage.getItem(k)||''};
  function utf8Bytes(s){try{return new Blob([s]).size}catch(e){return (new TextEncoder()).encode(s).length}}
  function fmtBytes(n){return n<1024? n+' B' : n<1048576? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(2)+' MB'}
  function lsSize(){let t=0,h=0;const HEAVY=50*1024; for(const k of Object.keys(localStorage)){const v=localStorage.getItem(k)||''; const b=utf8Bytes(k)+utf8Bytes(v); t+=b; if(b>HEAVY) h++;} return {t,h}}
  function estimateUsage(el){ if(navigator.storage?.estimate){ navigator.storage.estimate().then(({usage,quota})=>{ el.textContent=(usage&&quota)?`${fmtBytes(usage)} / ${fmtBytes(quota)}`:'—' }); } else { el.textContent='—'; } }

  const Toast={
    init(){ this.host = $('#lsx-toastBox') || document.body.appendChild(Object.assign(document.createElement('div'),{id:'lsx-toastBox'})); },
    show(msg,type='ok',ms=1600){ if(!this.host) this.init(); const el=$('#tpl-lsx-toast').content.firstElementChild.cloneNode(true); if(type==='warn') el.style.background='linear-gradient(90deg,#2f261b,#3c2d12)'; if(type==='err') el.style.background='linear-gradient(90deg,#2f1b1b,#3c1212)'; el.textContent=msg; this.host.appendChild(el); setTimeout(()=>{ el.style.opacity=.0; el.style.transform='translateY(6px)'; setTimeout(()=>el.remove(),220); }, ms); }
  };

  const Logger={
    init(){ const host = $('#lsx-logger') || document.body.appendChild(Object.assign(document.createElement('div'),{id:'lsx-logger'})); host.innerHTML=''; host.appendChild($('#tpl-lsx-logger').content.cloneNode(true)); $('#lsx-log-close').addEventListener('click',()=> host.style.display='none'); this.host=host; this.pre=$('#lsx-logs'); },
    push(m){ if(!this.pre) this.init(); const line='['+new Date().toLocaleTimeString()+'] '+m; const arr=(this.pre.textContent||'').split('\\n'); arr.unshift(line); this.pre.textContent=arr.slice(0,120).join('\\n'); this.host.style.display='block'; }
  };

  const DualLS={
    open(){ const p=$('#lsx-panel'); if(p){ p.style.display='block'; this.render(); this.refresh(); }},
    close(){ const p=$('#lsx-panel'); if(p){ p.style.display='none'; }},
    toggle(){ const p=$('#lsx-panel'); if(!p) return; p.style.display = (p.style.display==='block'?'none':'block'); if(p.style.display==='block'){ this.render($('#lsx-search').value); this.refresh(); }},
    initPanel({mount='#lsx-mount'}={}){
      const host=$(mount)||document.body; if(!$('#lsx-panel')){ host.appendChild($('#tpl-lsx-panel').content.cloneNode(true));
        // binds
        $('#lsx-hide').addEventListener('click',()=> this.close());
        $('#lsx-refresh').addEventListener('click',()=>{ this.render($('#lsx-search').value); this.refresh(); });
        $('#lsx-search').addEventListener('input',ev=> this.render(ev.target.value));
        $('#lsx-add').addEventListener('click',()=>{ const k=$('#lsx-new-k').value.trim(), v=$('#lsx-new-v').value; if(!k) return; if(localStorage.getItem(k)&&!confirm('Sobrescrever?')) return; localStorage.setItem(k,v); $('#lsx-new-k').value=''; $('#lsx-new-v').value=''; this.render($('#lsx-search').value); this.refresh(); Toast.show('Chave salva','ok'); Logger.push('LS: gravou '+k); });
        $('#lsx-export').addEventListener('click',()=>{ const dump={}; Object.keys(localStorage).forEach(k=> dump[k]=localStorage.getItem(k)); const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ls-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),400); Toast.show('Backup exportado'); Logger.push('LS: exportou backup'); });
        const impBtn=$('#lsx-import-btn'), impInput=$('#lsx-import'); impBtn.addEventListener('click',()=> impInput.click()); impInput.addEventListener('change',(ev)=>{ const f=ev.target.files&&ev.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const obj=JSON.parse(String(r.result||'')); Object.keys(obj).forEach(k=> localStorage.setItem(k,String(obj[k]))); this.render($('#lsx-search').value); this.refresh(); Toast.show('Importação concluída'); Logger.push('LS: importou backup'); }catch(e){ alert('JSON inválido.'); } }; r.readAsText(f); ev.target.value=''; });
        $('#lsx-clear-all').addEventListener('click',()=>{ if(!confirm('Backup automático será criado. Confirmar LIMPAR LocalStorage?')) return; const snap={}; Object.keys(localStorage).forEach(k=> snap[k]=localStorage.getItem(k)); const stamp=new Date().toISOString().replace(/[:.]/g,'-'); try{ localStorage.setItem('ls:backup:'+stamp, JSON.stringify(snap)); }catch(e){} const blob=new Blob([JSON.stringify(snap,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ls-backup-'+stamp+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); localStorage.clear(); this.render(''); this.refresh(); Toast.show('LocalStorage limpo','warn'); Logger.push('LS: limpou tudo'); });
        $('#lsx-clear-idb').addEventListener('click', async()=>{ if(!confirm('Limpar TODOS os bancos IndexedDB deste domínio?')) return; try{ if(indexedDB.databases){ const dbs=await indexedDB.databases(); await Promise.all(dbs.map(d=> new Promise(res=>{ const name=d.name; if(!name) return res(); const req=indexedDB.deleteDatabase(name); req.onsuccess=req.onerror=req.onblocked=()=>res(); }))); alert('IndexedDB limpo (quando suportado).'); } else alert('Navegador não expõe indexedDB.databases().'); }catch(e){ alert('Falha ao limpar IndexedDB: '+e); } this.refresh(); Logger.push('LS: solicitou limpeza IDB'); });
      }
      this.wireHeader();
    },
    wireHeader(){
      const self=this;
      const say=(t)=>{ try{ if(typeof speakWithActiveArch==='function') speakWithActiveArch(t); }catch(e){} };
      document.getElementById('btnLS') && document.getElementById('btnLS').addEventListener('click',()=> self.toggle());
      document.getElementById('btnToggleLocal') && document.getElementById('btnToggleLocal').addEventListener('click',()=>{ const state=(localStorage.getItem('uno:showLocal')==='1'); localStorage.setItem('uno:showLocal', state?'0':'1'); Toast.show(state?'Mostrando todos':'Mostrando Locais'); Logger.push('Header: toggle Locais = '+(!state)); say('Ok'); });
      ['saveName','saveSK','applyCSS','clearCSS','btnPerf','btnVoice','btnImport'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('click',()=> say('Ok')); });
    },
    render(filter=''){
      const grid=$('#lsx-grid'); if(!grid) return;
      const f=(filter||'').toLowerCase(); grid.innerHTML='';
      const groups={}; Object.keys(localStorage).sort().forEach(k=>{ const v=localStorage.getItem(k)||''; if(f && !(k.toLowerCase().includes(f)||v.toLowerCase().includes(f))) return; const grp=k.includes(':')?k.split(':')[0]:(k.includes('.')?k.split('.')[0]:'geral'); (groups[grp] ||= []).push({k,v}); });
      const ordered=Object.keys(groups).sort((a,b)=>a.localeCompare(b));
      const headHTML='<div>Chave</div><div>Valor</div><div>Ações</div>';
      ordered.forEach(name=>{ const det=document.createElement('details'); det.className='lsx-group'; det.open=true; const sum=document.createElement('summary'); sum.innerHTML=`<span class="chev">›</span><strong>${name}</strong><span class="lsx-badge">${groups[name].length}</span>`; det.appendChild(sum); const body=document.createElement('div'); body.className='lsx-body-inner'; const head=document.createElement('div'); head.className='lsx-head'; head.innerHTML=headHTML; body.appendChild(head); groups[name].forEach(({k,v})=> body.appendChild(makeRow(k,v))); det.appendChild(body); grid.appendChild(det); });
      function makeRow(k,vRaw){ const row=document.createElement('div'); row.className='lsx-row'; const colK=document.createElement('div'); colK.className='lsx-k'; colK.textContent=k; const colV=document.createElement('div'); colV.className='lsx-v'; const prev=document.createElement('div'); prev.className='lsx-preview'; prev.textContent=vRaw.length>240?(vRaw.slice(0,240)+'…'):vRaw; const expand=document.createElement('div'); expand.className='lsx-expand'; const ta=document.createElement('textarea'); ta.value=vRaw; expand.appendChild(ta); colV.append(prev,expand); const colA=document.createElement('div'); colA.className='lsx-a'; const mk=(title,cls,cb,svg)=>{const b=document.createElement('button'); b.className='ic-btn'+(cls?(' '+cls):''); b.title=title; b.innerHTML=svg||title; b.onclick=cb; return b;}; const Bx=mk('expandir','',()=>{ expand.style.display=expand.style.display==='block'?'none':'block'; },'<svg width="18" height="18" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="2" fill="currentColor"/></svg>'); const Bc=mk('copiar','',()=> navigator.clipboard.writeText(vRaw),'<svg width="18" height="18" viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" fill="currentColor"/></svg>'); const Bs=mk('salvar','ok',()=>{ const nv=expand.style.display==='block'? ta.value : vRaw; localStorage.setItem(k,nv); prev.textContent=nv.length>240?(nv.slice(0,240)+'…'):nv; DualLS.refresh(); Toast.show('Salvo'); Logger.push('LS: salvou '+k); },'<svg width="18" height="18" viewBox="0 0 24 24"><path d="M17 3H5a2 2 0 0 0-2 2v14h18V7l-4-4z" fill="currentColor"/></svg>'); const Bd=mk('apagar','warn',()=>{ if(!confirm('Apagar “'+k+'”?')) return; localStorage.removeItem(k); row.remove(); DualLS.refresh(); Toast.show('Apagado','warn'); Logger.push('LS: apagou '+k); },'<svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8z" fill="currentColor"/></svg>'); colA.append(Bx,Bc,Bs,Bd); row.append(colK,colV,colA); return row; }
    },
    refresh(){ const {t,h}=lsSize(); $('#lsx-st-keys').textContent=String(localStorage.length); $('#lsx-st-bytes').textContent=fmtBytes(t); $('#lsx-st-heavy').textContent=String(h); estimateUsage($('#lsx-st-usage')); }
  };
  // Expor sob o mesmo nome para compat com seus binds existentes
  window.DualLS = DualLS;
  window.DualToast = Toast;
  window.DualLSLogger = Logger;

  document.addEventListener('DOMContentLoaded',()=>{ Logger.init(); Toast.init(); DualLS.initPanel({ mount:'#lsx-mount' }); if(location.hash==='#lsx'){ DualLS.open(); } });
})();
