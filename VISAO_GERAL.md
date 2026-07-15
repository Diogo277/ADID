## VISAO GERAL DO PROJETO

ADID e uma extensao Chrome focada em acessibilidade visual para daltonismo.

### Arquitetura atual

1. popup.html + popup.js
- Interface para selecionar o modo e acionar Adaptar/Reset

2. content_script.js
- Varre elementos visiveis
- Detecta cores problemáticas para o modo selecionado
- Aplica badges visuais e legenda
- Restaura estilos no reset

3. manifest.json
- Permissoes da extensao
- Registro do content script

### Fluxo

1. Usuario abre o popup
2. Seleciona modo
3. Clica em Adaptar
4. Script aplica marcacao local
5. Usuario pode resetar a qualquer momento

### Tecnologias

- JavaScript
- Chrome Extensions (Manifest V3)
- HTML/CSS

### Status

Projeto local-only (sem backend).
