
if ('serviceWorker' in navigator) {
  addEventListener('load', ()=>((location.protocol==='https:'||location.protocol==='http:')?navigator.serviceWorker.register:()=>Promise.reject('sw_disabled'))('./sw.js').catch(()=>{}));
}
