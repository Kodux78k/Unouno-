HORUS DUAL • Patch (HUB UNO Revo)
==================================
O que vem pronto:
- Tema Blue‑1 aplicado (UI do chat e do hub).
- Overlay 3D com Sólidos Platônicos (mesh + wireframe + partículas) sobre a bolinha de arquétipos.
- Horus Multi‑Agent ativável com prefixo @horus no chat (usa OpenRouter).

Como usar no Chat:
1) Abra a aba Chat no HUB UNO.
2) Digite uma mensagem normal (vai responder via camada Blue‑1). 
   Para orquestração multi‑agente, comece com: @horus Quero os 12 trabalhando em XYZ.
3) Defina sua chave em localStorage:
     localStorage.setItem('dual.keys.openrouter', JSON.stringify('sk-or-v1-...'))
   (ou use a UI do HUB se houver campo de API key).

Overlay de cor (tema colorido vs. "super overlay"):
- O overlay de tinte foi desativado por padrão. A variável CSS --arch-overlay está em 'rgba(0,0,0,0)'.
- O patch UNO_ARCH3D.disableTint = true mantém a tela sem tingimento global.

Pastas:
- HUB-UNO-Revo_HORUSDUAL.html     → arquivo principal do hub
- archetypes/                     → HTMLs dos 12 arquétipos (mantidos como enviados)
- blue-1.css / blue-1.js          → skin e integração do chat Blue‑1
- UNO_patch_arch3d*.js            → overlay 3D e partículas
- dual_multiagent_v12_locked_fixed.js → Horus Dual (prefixo @horus)