
(() => {
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const prettyBytes = (n)=>{ if(!Number.isFinite(n)||n<=0) return '0 B'; const u=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<u.length-1){n/=1024;i++} return n.toFixed(2)+' '+u[i] };
  const isJson = (v)=>{ try{ JSON.parse(v); return true; }catch{ return false; } };
  const inferType = (v)=>{
    if(v==null||v==='') return 'empty';
    if(isJson(v)){const p=JSON.parse(v); if(Array.isArray(p)) return 'json[array]'; if(p&&typeof p==='object') return 'json[object]'; return 'json['+(typeof p)+']';}
    if(/^data:image\//i.test(v)||/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v)) return 'image';
    if(/^(true|false|1|0)$/i.test(v)) return 'boolean-like';
    if(/^https?:\/\//i.test(v)) return 'url';
    if(/^data:/i.test(v)) return 'data-url';
    return 'string';
  };

  const DISABLED_KEY = 'infodose:presets.disabled';
  const PRESETS = [
    { key:'infodose:userName', label:'Usuário' },
    { key:'infodose:assistantName', label:'Assistente' },
    { key:'dual.keys.openrouter', label:'Chave OpenRouter (ativa)' },
    { key:'dual.openrouter.model', label:'Modelo OpenRouter' },
    { key:'uno:theme', label:'Tema' },
    { key:'uno:bg', label:'Fundo Custom' },
    { key:'infodose:cssCustom', label:'CSS Custom' },
    { key:'infodose:voices', label:'Vozes Arquetípicas' }
  ];

  const disabledSet = ()=> { try{ return new Set(JSON.parse(localStorage.getItem(DISABLED_KEY)||'[]')); }catch{ return new Set(); } };
  const saveDisabled = (set)=> localStorage.setItem(DISABLED_KEY, JSON.stringify(Array.from(set)));
  const isEnabled = (k)=> !disabledSet().has(k);
  const toggleDisabled = (k)=> { const s=disabledSet(); s.has(k)?s.delete(k):s.add(k); saveDisabled(s); renderAll(); window.dispatchEvent(new CustomEvent('ls:disabled-changed',{detail:{key:k,disabled:s.has(k)}})); };

  // Carteira SK
  const WALLET_KEY = 'dual.keys.wallet';
  const getWallet = ()=>{ try{ return JSON.parse(localStorage.getItem(WALLET_KEY)||'[]'); }catch{return []} };
  const setWallet = (arr)=> localStorage.setItem(WALLET_KEY, JSON.stringify(arr));
  const addWalletItem = (name, key)=>{
    const list=getWallet();
    const genId = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    list.push({ id: genId, name, key, active:false });
    setWallet(list); renderWallet();
  };
  const removeWalletItem = (id)=>{ const list=getWallet().filter(x=>x.id!==id); setWallet(list); ensureActiveConsistency(); renderWallet(); };
  const activateWalletItem = (id)=>{
    const list=getWallet().map(x=>({...x, active: x.id===id})); setWallet(list);
    if(isEnabled('dual.keys.openrouter')){
      const chosen=list.find(x=>x.active); localStorage.setItem('dual.keys.openrouter', chosen? chosen.key: '');
    }
    renderAll();
  };
  const ensureActiveConsistency = ()=>{ const list=getWallet(); const anyActive=list.some(x=>x.active); if(!anyActive){ localStorage.setItem('dual.keys.openrouter',''); } };
  const renderWallet = ()=>{
    const grid=$('#skGrid'); if(!grid) return; grid.innerHTML='';
    const list=getWallet(); if(!list.length){ grid.innerHTML='<div class="meta">Nenhuma chave na carteira ainda.</div>'; return; }
    list.forEach(item=>{
      const div=document.createElement('div'); div.className='sk-item';
      const top=document.createElement('div'); top.className='top';
      const name=document.createElement('div'); name.className='name'; name.textContent=item.name+(item.active?' • ATIVA':'');
      const act=document.createElement('div');
      const bUse=document.createElement('button'); bUse.textContent=item.active?'Desativar':'Ativar';
      bUse.onclick=()=>{ if(item.active){
          const list2=getWallet().map(x=>({...x, active: x.id===item.id? false: x.active })); setWallet(list2); ensureActiveConsistency(); renderWallet(); renderAll();
        } else { activateWalletItem(item.id); } };
      const bDel=document.createElement('button'); bDel.textContent='Apagar'; bDel.onclick=()=>{ if(confirm('Apagar entrada da carteira?')) removeWalletItem(item.id) };
      act.append(bUse,bDel); top.append(name,act);
      const key=document.createElement('div'); key.className='key'; key.textContent=item.key;
      div.append(top,key); grid.append(div);
    });
  };

  // LS
  const lsEntries = ()=>{ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; out.push({key:k,val:v}); } return out.sort((a,b)=>a.key.localeCompare(b.key)); };
  const lsSizeBytes = ()=>{ let sum=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; sum += k.length + v.length; } return sum; };

  const renderPresets = ()=>{
    const grid=$('#presetsGrid'); if(!grid) return; grid.innerHTML='';
    const dis=disabledSet();
    PRESETS.forEach(p=>{
      const val=localStorage.getItem(p.key); const on=!dis.has(p.key);
      const wrap=document.createElement('div'); wrap.className='preset';
      const head=document.createElement('div'); head.className='row';
      const name=document.createElement('div'); name.innerHTML = `<strong>${p.label}</strong><div class="type">${p.key}</div>`;
      const sw=document.createElement('div'); sw.className='switch'+(on?' on':''); sw.title=on?'Desativar (não apaga)':'Ativar'; sw.onclick=()=>toggleDisabled(p.key);
      head.append(name,sw);
      const meta=document.createElement('div'); meta.className='val';
      meta.textContent = val ? (inferType(val).startsWith('json')? JSON.stringify(JSON.parse(val),null,2): val) : '—';
      wrap.append(head,meta); grid.append(wrap);
    });
  };

  const addImagePreview = (key,src)=>{ const g=$('#imgGrid'); if(!g) return; const card=document.createElement('div'); card.className='img-card'; const cap=document.createElement('div'); cap.className='meta'; cap.textContent=key; const im=new Image(); im.src=src; im.loading='lazy'; card.append(cap,im); g.append(card); };

  const renderLS = ()=>{
    const list=$('#lsList'); if(!list) return; list.innerHTML=''; const imgGrid=$('#imgGrid'); if(imgGrid) imgGrid.innerHTML='';
    const entries=lsEntries(); const count=$('#lsCount'); if(count) count.textContent = entries.length+' chave(s)';
    const size=$('#lsSize'); if(size) size.textContent = prettyBytes(lsSizeBytes());
    const dis=disabledSet();
    entries.forEach(({key,val})=>{
      if(key===DISABLED_KEY) return;
      const it=document.createElement('div'); it.className='item';
      const head=document.createElement('div'); head.className='head';
      const left=document.createElement('div');
      left.innerHTML=`<div class="key">${key}${dis.has(key)?' <span class="type">(desativado)</span>':''}</div><div class="type">${inferType(val)} • ${prettyBytes((val||'').length)}</div>`;
      const ctr=document.createElement('div'); ctr.style.display='flex'; ctr.style.gap='8px'; ctr.style.flexWrap='wrap';
      const sw=document.createElement('div'); sw.className='switch'+(!dis.has(key)?' on':''); sw.title = (!dis.has(key)?'Desativar':'Ativar'); sw.onclick=()=>toggleDisabled(key);
      const bEdit=document.createElement('button'); bEdit.textContent='Editar'; bEdit.onclick=()=>{ const next=prompt('Editar valor de\n'+key, val ?? ''); if(next==null) return; localStorage.setItem(key,String(next)); renderAll(); };
      const bDel=document.createElement('button'); bDel.textContent='Apagar'; bDel.onclick=()=>{ if(confirm('Apagar '+key+'?')){ localStorage.removeItem(key); renderAll(); } };
      if(inferType(val)==='image'){ const bImg=document.createElement('button'); bImg.textContent='Ver imagem'; bImg.onclick=()=>addImagePreview(key,val); ctr.append(bImg); }
      ctr.append(sw,bEdit,bDel); head.append(left,ctr);
      const v=document.createElement('div'); v.className='val'; v.textContent = inferType(val).startsWith('json')? JSON.stringify(JSON.parse(val),null,2): (val??'—');
      it.append(head,v); list.append(it);
    });
  };

  const exportLS = ()=>{ const dump={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k===DISABLED_KEY) continue; dump[k]=localStorage.getItem(k); } const blob=new Blob([JSON.stringify(dump,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='localstorage_export.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 2000); };
  const importLS = (file)=>{ const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result||'{}'); Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,String(v))); alert('Importado com sucesso.'); renderAll(); }catch(e){ alert('JSON inválido.'); } }; r.readAsText(file); };

  const openLS = ()=>{ const m=$('#lsModal'); if(!m) return; m.classList.add('open'); m.setAttribute('aria-hidden','false'); renderAll(); renderWallet(); };
  const closeLS = ()=>{ const m=$('#lsModal'); if(!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden','true'); };
  const renderAll = ()=>{ renderPresets(); renderLS(); };

  const ready = () => {
    // Unify LS button (clone -> only our modal)
    const btn = document.getElementById('btnLS');
    if(btn && !btn.dataset._lsUnified){
      const c=btn.cloneNode(true);
      c.removeAttribute('onclick'); c.removeAttribute('href');
      c.dataset._lsUnified='1';
      c.addEventListener('click', (ev)=>{
        ev.preventDefault(); ev.stopPropagation();
        try{
          document.querySelectorAll('.modal,[role="dialog"],[class*="modal"]').forEach(el=>{ if(el.id!=='lsModal'){ el.style.display='none'; el.classList.remove('open','show','visible'); el.setAttribute('aria-hidden','true'); } });
        }catch(e){}
        openLS();
      }, {passive:false});
      btn.parentNode.replaceChild(c, btn);
    }

    const c = $('#lsClose'); if(c) c.onclick = closeLS;
    const r = $('#lsRescan'); if(r) r.onclick = renderAll;
    const e = $('#lsExport'); if(e) e.onclick = exportLS;
    const imp = $('#lsImportFile'); if(imp) imp.addEventListener('change', ev=>{ const f=ev.target.files?.[0]; if(f) importLS(f); ev.target.value=''; });
    const clr = $('#lsClearDisabled'); if(clr) clr.onclick = ()=>{ localStorage.setItem(DISABLED_KEY,'[]'); renderAll(); };

    const modal = $('#lsModal'); if(modal) modal.addEventListener('click', (evt)=>{ if(evt.target===modal) closeLS(); });
    const skAdd = $('#skAdd'); if(skAdd) skAdd.onclick = ()=>{ const name=$('#skName').value.trim(); const key=$('#skValue').value.trim(); if(!name||!key) return alert('Informe nome e chave.'); addWalletItem(name,key); $('#skName').value=''; $('#skValue').value=''; };

    // Overlay control in LS
    const KEY='infodose:arch.overlay.level';
    const LEVELS={"0":"16%","-1":"12%","-2":"8%"};
    const apply=(lvl)=>{
      const force=LEVELS[String(lvl)]||LEVELS["-1"];
      document.documentElement.style.setProperty('--arch-overlay-strength', force);
      if(window.ArchTint&&typeof ArchTint.set==='function'){ try{ ArchTint.set(null, String(lvl)); }catch(e){} }
      document.querySelectorAll('.ls-ov[data-level]').forEach(b=>b.classList.toggle('on', b.dataset.level===String(lvl)));
    };
    const saved=localStorage.getItem(KEY)||"-1";
    apply(saved);
    $$('.ls-ov[data-level]').forEach(b=> b.addEventListener('click',()=>{ const lvl=b.dataset.level; localStorage.setItem(KEY, String(lvl)); apply(lvl); }, {passive:true}));
  };
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', ready); } else { ready(); }

  window.DualLS = { open: openLS, close: closeLS, render: renderAll };
})();
