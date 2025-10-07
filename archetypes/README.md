
# Archetypes Vox Client

Inclua este script **dentro de cada arquivo** `./archetypes/<nome>.html` para permitir que o micro‑app peça fala ao HUB:

```html
<script src="./archetype-voice-client.js"></script>
<script>
  // Exemplo: falar algo usando o nome do próprio arquétipo
  (window.ArchetypeSpeak || { speak:()=>{} }).speak('Olá! Pronto para agir.');
</script>
```
