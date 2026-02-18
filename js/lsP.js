/* localstorage-panel.js
   Versão: 1.0
   Insere no document um painel modal para gerenciar localStorage (abrir, exportar, importar, limpar desativados, ver imagens).
   Expondo: window.NebulaLS.open(), window.NebulaLS.close(), window.NebulaLS.renderAll()
*/
(function _nebula_ls_panel(){
  if(window.NebulaLS) return; // não duplicar

  /* ---------- Helpers ---------- */
  const LS = { DISABLED_KEY: 'infodose:presets.disabled' };
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  function saveFile(name,str){
    const blob=new Blob([str],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.style.display='none'; a.href=url; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },800);
  }
  function prettyBytes(n){ if(!Number.isFinite(n)||n<=0) return '0 B'; const u=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<u.length-1){n/=1024;i++} return n.toFixed(2)+' '+u[i] }
  function isJson(v){ try{ JSON.parse(v); return true }catch{ return false } }
  function inferType(v){
    if(v==null||v==='') return 'empty';
    if(isJson(v)){ const p=JSON.parse(v); if(Array.isArray(p)) return 'json[array]'; if(p&&typeof p==='object') return 'json[object]'; return 'json['+(typeof p)+']' }
    if(/^data:image\//i.test(v)||/\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(v)) return 'image';
    if(/^(true|false|1|0)$/i.test(v)) return 'boolean-like';
    if(/^https?:\/\//i.test(v)) return 'url';
    if(/^data:/i.test(v)) return 'data-url';
    return 'string';
  }

  /* ---------- Inject CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
  /* Minimal styles for LS panel */
  .nebula-ls-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99999;background:rgba(0,0,0,.55);backdrop-filter:blur(6px)}
  .nebula-ls-modal.open{display:flex}
  .nebula-ls-panel{width:min(920px,95vw);max-height:86vh;overflow:auto;background:#0f1118;color:#fff;border-radius:12px;padding:12px;box-shadow:0 12px 34px rgba(0,0,0,.6);font-family:system-ui,Segoe UI,Helvetica,Arial}
  .nebula-ls-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .nebula-ls-actions{display:flex;gap:8px;flex-wrap:wrap}
  .nebula-ls-actions button{padding:8px 10px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}
  .nebula-ls-presets{border-radius:10px;padding:8px;background:rgba(255,255,255,.03);margin-bottom:8px}
  .nebula-ls-grid{display:grid;gap:10px}
  .nebula-ls-item{background:rgba(255,255,255,.03);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.04);margin-bottom:8px}
  .nebula-ls-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
  .nebula-ls-key{font-weight:700;max-width:70% ;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nebula-ls-val{font-family:ui-monospace,monospace;background:#07101a;padding:8px;border-radius:8px;max-height:140px;overflow:auto}
  .nebula-ls-switch{display:inline-block;width:46px;height:26px;border-radius:999px;background:rgba(255,255,255,.08);position:relative;cursor:pointer}
  .nebula-ls-switch.on{background:rgba(25,226,123,.22)}
  .nebula-ls-switch::after{content:'';position:absolute;left:4px;top:4px;width:18px;height:18px;border-radius:50%;background:#fff;transition:all .18s}
  .nebula-ls-switch.on::after{left:24px}
  .nebula-ls-img-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:8px}
  .nebula-ls-img-card img{width:100%;height:auto;border-radius:8px;display:block}
  .nebula-ls-meta{color:rgba(255,255,255,.55);font-size:.9rem;margin-bottom:6px}
  .nebula-ls-hidden{display:none}
  @media (max-width:560px){ .nebula-ls-key{max-width:50%} }
  `;
  document.head.appendChild(style);

  /* ---------- Inject HTML ---------- */
  const modal = document.createElement('div');
  modal.id = 'lsModal';
  modal.className = 'nebula-ls-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML = `
    <div class="nebula-ls-panel" role="dialog" aria-modal="true">
      <div class="nebula-ls-hdr">
        <div style="font-weight:900">LocalStorage • Painel</div>
        <div class="nebula-ls-actions">
          <button id="lsRescanBtn">Re-scan</button>
          <button id="lsExportBtn">Exportar</button>
          <label style="margin:0"><button id="lsImportBtn">Importar</button><input id="lsImportFile" type="file" accept="application/json" class="nebula-ls-hidden"></label>
          <button id="lsClearDisabledBtn">Limpar desativados</button>
          <button id="lsCloseBtn">Fechar</button>
        </div>
      </div>

      <div class="nebula-ls-presets">
        <strong>Presets (exemplo)</strong>
        <div id="presetsGrid" style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px"></div>
      </div>

      <div class="nebula-ls-meta"><span id="lsCount">—</span> • <span id="lsSize">—</span></div>
      <div id="lsList" class="nebula-ls-grid"></div>

      <details style="margin-top:10px" open>
        <summary style="cursor:pointer">Pré-visualização de imagens</summary>
        <div id="imgGrid" class="nebula-ls-img-grid"></div>
      </details>
    </div>
  `;
  document.body.appendChild(modal);

  /* ---------- State & Presets (can be adapted) ---------- */
  const PRESETS = [
    { key:'infodose:userName', label:'Usuário' },
    { key:'infodose:assistantName', label:'Assistente' },
    { key:'uno:theme', label:'Tema' },
    { key:'infodose:cssCustom', label:'CSS Custom' },
    { key:'infodose:voices', label:'Vozes' }
  ];

  /* ---------- Utility: disabledSet ---------- */
  function disabledSet(){ try{ return new Set(JSON.parse(localStorage.getItem(LS.DISABLED_KEY)||'[]')) }catch{ return new Set() } }
  function saveDisabled(set){ localStorage.setItem(LS.DISABLED_KEY, JSON.stringify(Array.from(set))) }

  /* ---------- Renderers ---------- */
  function lsEntries(){ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; out.push({key:k,val:v}) } return out.sort((a,b)=>a.key.localeCompare(b.key)) }
  function lsSizeBytes(){ let sum=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const v=localStorage.getItem(k)||''; sum += (k.length + (v?v.length:0)) } return sum }

  function renderPresets(){
    const grid = $('#presetsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const dis = disabledSet();
    PRESETS.forEach(p=>{
      const val = localStorage.getItem(p.key)||'';
      const on = !dis.has(p.key);
      const wrap = document.createElement('div'); wrap.style.background='rgba(255,255,255,.02)'; wrap.style.padding='8px'; wrap.style.borderRadius='8px';
      const name = document.createElement('div'); name.innerHTML = `<strong>${p.label}</strong><div style="font-size:.8rem;color:rgba(255,255,255,.5)">${p.key}</div>`;
      const sw = document.createElement('div'); sw.className='nebula-ls-switch'+(on?' on':''); sw.title = on?'Desativar':'Ativar'; sw.onclick = ()=>{ toggleDisabled(p.key) };
      const meta = document.createElement('pre'); meta.style.margin='8px 0 0'; meta.style.whiteSpace='pre-wrap'; meta.style.fontFamily='ui-monospace,monospace';
      meta.textContent = val ? (inferType(val).startsWith('json')? JSON.stringify(JSON.parse(val),null,2): val) : '—';
      wrap.appendChild(name); wrap.appendChild(sw); wrap.appendChild(meta);
      grid.appendChild(wrap);
    });
  }

  function renderLS(){
    const list = $('#lsList'); if(!list) return;
    list.innerHTML = ''; $('#imgGrid').innerHTML='';
    const entries = lsEntries();
    $('#lsCount').textContent = entries.length+' chave(s)';
    $('#lsSize').textContent = prettyBytes(lsSizeBytes());
    const dis = disabledSet();
    entries.forEach(({key,val})=>{
      if(key === LS.DISABLED_KEY) return;
      const it = document.createElement('div'); it.className='nebula-ls-item';
      const row = document.createElement('div'); row.className='nebula-ls-row';
      const left = document.createElement('div'); left.innerHTML = `<div class="nebula-ls-key">${key}${dis.has(key)?' <span style="opacity:.7">(desativado)</span>':''}</div><div style="font-size:.85rem;color:rgba(255,255,255,.55)">${inferType(val)} • ${prettyBytes((val||'').length)}</div>`;
      const ctr = document.createElement('div'); ctr.style.display='flex'; ctr.style.gap='8px';
      const sw = document.createElement('div'); sw.className='nebula-ls-switch'+(!dis.has(key)?' on':''); sw.title = (!dis.has(key)?'Desativar':'Ativar'); sw.onclick = ()=>toggleDisabled(key);
      const bEdit = document.createElement('button'); bEdit.textContent='Editar'; bEdit.onclick = ()=>{ const next = prompt(`Editar valor de\n${key}`, val ?? ''); if(next==null) return; localStorage.setItem(key,String(next)); renderAll(); };
      const bDel = document.createElement('button'); bDel.textContent='Apagar'; bDel.onclick = ()=>{ if(confirm('Apagar '+key+'?')){ localStorage.removeItem(key); renderAll(); } };
      ctr.append(sw,bEdit,bDel);
      if(inferType(val)==='image'){ const bImg = document.createElement('button'); bImg.textContent='Ver imagem'; bImg.onclick=()=>addImagePreview(key,val); ctr.append(bImg); }
      row.append(left,ctr);
      const v = document.createElement('div'); v.className='nebula-ls-val'; v.textContent = inferType(val).startsWith('json')? JSON.stringify(JSON.parse(val),null,2): (val??'—');
      it.append(row,v); list.append(it);
    });
  }

  function addImagePreview(key,src){
    const g = $('#imgGrid');
    const card = document.createElement('div'); card.className='nebula-ls-img-card';
    const cap = document.createElement('div'); cap.style.fontSize='.85rem'; cap.style.marginBottom='6px'; cap.textContent = key;
    const im = new Image(); im.src = src; im.loading = 'lazy'; im.alt = key;
    card.append(cap,im); g.append(card);
  }

  /* ---------- Actions ---------- */
  function exportLS(){
    const dump = {};
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k===LS.DISABLED_KEY) continue; dump[k]=localStorage.getItem(k); }
    saveFile('localstorage_export.json', JSON.stringify(dump,null,2));
  }
  function importLS(file){
    if(!(file instanceof File)) return;
    const r=new FileReader();
    r.onload = ()=>{ try{ const data = JSON.parse(r.result||'{}'); Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,String(v))); alert('Importado com sucesso.'); renderAll(); } catch(e){ alert('JSON inválido.'); } };
    r.readAsText(file);
  }
  function exportLSviaPrompt(){
    const dump = {};
    for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k===LS.DISABLED_KEY) continue; dump[k]=localStorage.getItem(k); }
    saveFile('localstorage_export.json', JSON.stringify(dump,null,2));
  }
  function clearDisabled(){ localStorage.setItem(LS.DISABLED_KEY,'[]'); renderAll(); }

  function toggleDisabled(k){
    const s = disabledSet();
    if(s.has(k)) s.delete(k); else s.add(k);
    saveDisabled(s);
    renderPresets();
    renderLS();
    window.dispatchEvent(new CustomEvent('ls:disabled-changed',{detail:{key:k,disabled:s.has(k)}}));
  }

  /* ---------- Modal controls ---------- */
  function openLS(){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); renderAll(); }
  function closeLS(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
  function renderAll(){ renderPresets(); renderLS(); }

  /* ---------- Bind buttons & events ---------- */
  // Buttons
  modal.querySelector('#lsRescanBtn').addEventListener('click', renderAll);
  modal.querySelector('#lsExportBtn').addEventListener('click', exportLS);
  modal.querySelector('#lsClearDisabledBtn').addEventListener('click', clearDisabled);
  modal.querySelector('#lsCloseBtn').addEventListener('click', closeLS);

  // import file input
  const fileInput = modal.querySelector('#lsImportFile');
  modal.querySelector('#lsImportBtn').addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', ev=>{
    const f = ev.target.files?.[0]; if(f) importLS(f); ev.target.value='';
  });

  // Close modal by clicking backdrop
  document.addEventListener('click', (ev)=>{ if(ev.target && ev.target.id === 'lsCloseBtn') closeLS(); });
  window.addEventListener('click', e=>{ if(e.target && e.target.id === 'lsModal') closeLS(); });

  // storage changes from other tabs
  window.addEventListener('storage', renderAll);
  window.addEventListener('ls:disabled-changed', ()=>{ /* hook disponível */ });

  // expose API
  window.NebulaLS = {
    open: openLS,
    close: closeLS,
    renderAll,
    export: exportLS,
    importFromFile: importLS
  };

  // auto-attach small toggle on page (optional): um botão discreto no canto que abre o painel
  (function addFloatingBtn(){
    const b = document.createElement('button');
    b.innerHTML = 'LS';
    Object.assign(b.style,{position:'fixed',right:'14px',bottom:'14px',zIndex:999999,padding:'10px 12px',borderRadius:'10px',background:'rgba(0,0,0,.5)',color:'#fff',border:'1px solid rgba(255,255,255,.06)',cursor:'pointer'});
    b.title = 'Abrir LocalStorage Panel';
    b.addEventListener('click', openLS);
    document.body.appendChild(b);
  })();

  // initial render if modal opened later
  renderAll();

})(); // fim IIFE