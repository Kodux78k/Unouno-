
(() => {
  const uploadBtn = document.getElementById('btnStackUpload');
  const uploadInput = document.getElementById('stackUpload');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result || '');
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        openApp({ title: file.name.replace(/\.(html?|txt)$/i,''), url });
      };
      reader.readAsText(file);
      // Permite escolher o mesmo arquivo novamente
      ev.target.value = '';
    });
  }
  const btnAddGroup = document.getElementById('btnAddGroup');
  const stackWrapEl = document.getElementById('stackWrap');
  window.currentGroupId = null;
  if (btnAddGroup && stackWrapEl) {
      btnAddGroup.addEventListener('click', () => {
      const name = prompt('Nome do grupo:');
      if (!name) return;
      const gid = 'g_' + Math.random().toString(36).slice(2);
      const details = document.createElement('details');
      details.className = 'stack-group';
      details.setAttribute('data-group-id', gid);
      details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = name;
      const content = document.createElement('div');
      content.className = 'group-content';
      details.appendChild(summary);
      details.appendChild(content);
      stackWrapEl.prepend(details);
      window.currentGroupId = gid;
      // Salve o estado após criar um novo grupo
      try { saveStackState(); } catch {}
    });
  }
})();
