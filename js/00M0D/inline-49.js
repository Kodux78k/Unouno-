
// Local toast (Boost) — scoped to this page only
window.dualToast = (msg, ms=2000) => {
  try {
    let stack = document.getElementById('dual-toast-stack');
    if (!stack){ stack = document.createElement('div'); stack.id='dual-toast-stack'; document.body.appendChild(stack); }
    const el = document.createElement('div');
    el.className = 'dual-toast';
    el.textContent = msg;
    stack.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=>{
      el.classList.remove('show');
      setTimeout(()=> el.remove(), 250);
    }, ms);
  } catch(e){ console.log('[dualToast]', e); }
};
