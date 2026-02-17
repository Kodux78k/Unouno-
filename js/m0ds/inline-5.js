
(() => {
  /**
   * Cria um grupo de stack com id e nome fornecidos. Usado ao restaurar grupos.
   * @param {string} gid
   * @param {string} name
   */
  function createStackGroup(gid, name) {
    const stackWrapEl = document.getElementById('stackWrap');
    if (!stackWrapEl) return;
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
  }

  /**
   * Salva a estrutura de grupos e sessões no LocalStorage.
   */
  function saveStackState() {
    try {
      // Salve grupos
      const groups = [];
      document.querySelectorAll('#stackWrap .stack-group').forEach(g => {
        const id = g.getAttribute('data-group-id');
        const name = g.querySelector('summary')?.textContent || '';
        if (id && name) groups.push({ id, name });
      });
      localStorage.setItem('unoStackGroups', JSON.stringify(groups));
      // Salve sessões (Stack e sessionsAnchor)
      const sess = [];
      document.querySelectorAll('#stackWrap .session, #sessionsAnchor .session').forEach(card => {
        const sid = card.dataset.sid;
        const meta = card.dataset.meta;
        const gid = card.dataset.gid || null;
        const min = card.classList.contains('min');
        const pinned = card.classList.contains('pinned');
        if (sid && meta) sess.push({ sid, meta, gid, min, pinned });
      });
      localStorage.setItem('unoStackSessions', JSON.stringify(sess));
    } catch (e) {
      console.warn('Erro ao salvar estado do stack', e);
    }
    // Salve apps fixados (o array já está armazenado em unoPinnedApps via add/remove)
  }
  window.saveStackState = saveStackState;

  /**
   * Garante que existam grupos de stack correspondentes a cada categoria de apps
   * (arquetipos).  Obtém os nomes de grupo da variável RAW.apps e cria
   * grupos com IDs fixos baseados no nome.  Se um grupo já existir, não o
   * duplica.  Use para organizar sessões automaticamente por arquetipo.
   */
  function ensureDefaultGroups() {
    try {
      const stackWrapEl = document.getElementById('stackWrap');
      if (!stackWrapEl) return;
      // Obtenha lista de nomes de grupos a partir dos apps embutidos
      const names = {};
      (RAW.apps || []).forEach(a => {
        if (a && a.title && a.title.includes('·')) {
          const parts = a.title.split('·');
          const gName = (parts[1] || '').trim();
          if (gName) names[gName] = true;
        }
      });
      // Para cada nome, crie grupo se não existir
      Object.keys(names).forEach(name => {
        const gid = 'g_' + name.toLowerCase().replace(/\s+/g, '_');
        if (!document.querySelector('#stackWrap .stack-group[data-group-id="' + gid + '"]')) {
          createStackGroup(gid, name);
        }
      });
    } catch (e) {
      console.warn('Falha ao garantir grupos padrão', e);
    }
  }
  // Exponha função globalmente para poder chamar de outros lugares
  window.ensureDefaultGroups = ensureDefaultGroups;

  /**
   * Restaura grupos e sessões do LocalStorage.
   */
  function restoreStackState() {
    try {
      const groups = JSON.parse(localStorage.getItem('unoStackGroups') || '[]');
      if (Array.isArray(groups)) {
        groups.forEach(g => {
          if (g && g.id && g.name) createStackGroup(g.id, g.name);
        });
      }
      const sessions = JSON.parse(localStorage.getItem('unoStackSessions') || '[]');
      if (Array.isArray(sessions)) {
        sessions.forEach(s => {
          try {
            const meta = JSON.parse(s.meta || '{}');
            openApp({ sid: s.sid, title: meta.title, url: meta.url, gid: s.gid, pinned: s.pinned });
            const card = document.querySelector('[data-sid="' + s.sid + '"]');
            if (card) {
              if (s.min) card.classList.add('min');
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      console.warn('Falha ao restaurar grupos/sessões', e);
    }
    updateDock();
  }
  window.restoreStackState = restoreStackState;

  /**
   * Obtém a lista de apps fixados a partir do LocalStorage.
   * @returns {Array<{title:string,url:string}>}
   */
  function getPinnedList() {
    try { return JSON.parse(localStorage.getItem('unoPinnedApps') || '[]') || []; } catch { return []; }
  }

  /**
   * Atualiza o LocalStorage e a UI com o novo item fixado.
   * Evita duplicatas com base no título e URL.
   * @param {{title:string,url:string}} meta
   */
  function addPinned(meta) {
    if (!meta || !meta.title) return;
    const list = getPinnedList();
    const exists = list.some(item => item.title === meta.title && item.url === meta.url);
    if (!exists) {
      list.push({ title: meta.title, url: meta.url });
      localStorage.setItem('unoPinnedApps', JSON.stringify(list));
    }
    updatePinnedNav();
  }
  window.addPinned = addPinned;

  /**
   * Remove um item fixado com base no título e URL.
   * @param {{title:string,url:string}} meta
   */
  function removePinnedByMeta(meta) {
    if (!meta) return;
    let list = getPinnedList();
    list = list.filter(item => !(item.title === meta.title && item.url === meta.url));
    localStorage.setItem('unoPinnedApps', JSON.stringify(list));
    updatePinnedNav();
  }
  window.removePinnedByMeta = removePinnedByMeta;

  /**
   * Atualiza a barra de navegação para refletir os itens fixados.
   * Cria botões dinâmicos para cada app fixado.
   */
  function updatePinnedNav() {
    const navInner = document.querySelector('.tabbar .inner');
    if (!navInner) return;
    // Remova botões fixados existentes
    navInner.querySelectorAll('button.tab[data-pinned]').forEach(btn => btn.remove());
    const list = getPinnedList();
    list.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'tab fx-trans fx-press ring';
      btn.setAttribute('data-pinned', 'true');
      btn.title = item.title;
      // Use a primeira letra do título como ícone
      const letter = (item.title || '?').trim().charAt(0).toUpperCase();
      btn.innerHTML = `<span class="pin-letter">${letter}</span><span class="ripple"></span>`;
      btn.onclick = () => {
        openApp({ title: item.title, url: item.url });
      };
      navInner.appendChild(btn);
    });
  }
  window.updatePinnedNav = updatePinnedNav;

  // Restaure o estado e pinte a navegação assim que o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.__RESTORING_CHAT = true;
      restoreStackState();
      updatePinnedNav();
    } catch (e) {
      console.warn(e);
    }
  });
})();
