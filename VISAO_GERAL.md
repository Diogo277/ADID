## VISAO GERAL DO PROJETO

ADID e uma extensao Chrome focada em acessibilidade visual para daltonismo.

### Arquitetura atual

O sistema, no estado atual deste repositorio, e composto apenas pela extensao Chrome (modo local), sem servidor Flask ativo no fluxo de execucao.

1. popup.html + popup.js
- Interface para selecao do modo de analise.
- Disparo das acoes Adaptar e Reset para a aba ativa.

2. content_script.js
- Varredura dos elementos visiveis do DOM.
- Deteccao local de cores potencialmente problemáticas por heuristicas.
- Marcacao visual com badges (R/G para vermelho-verde, B/Y para azul-amarelo).
- Exibicao de legenda e atualizacao dinamica dos badges durante scroll, resize, mousemove e mutacoes do DOM.
- Restauracao de estilo original e limpeza completa ao reset.

3. manifest.json
- Permissoes da extensao (activeTab e scripting).
- Registro do popup e do content script.

### Fluxo funcional

1. O usuario abre o popup da extensao e escolhe o modo.
2. O modo vermelho-verde cobre deuteranopia e protanopia (alias para o mesmo conjunto de regras).
3. Ao clicar em Adaptar, o content script percorre body * e ignora elementos sem area visivel.
4. Para cada elemento, o script avalia principalmente background proprio e cor de texto direta (quando ha texto direto no elemento).
5. Apenas elementos classificados como problematicos no modo selecionado recebem marcacao.
6. A marcacao e feita localmente com badges sobrepostos:
- R e G no modo vermelho-verde.
- B e Y no modo tritanopia.
7. Nenhuma chamada a servidor e realizada nesta versao: toda decisao de deteccao/marcacao ocorre no cliente.
8. Ao clicar em Reset, os estilos originais salvos sao restaurados e badges/legenda sao removidos.

### Diagramas

- Arquitetura e funcionamento detalhados: diagramas/ARQUITETURA_E_FUNCIONAMENTO.md

### Origem das cores em data/

- data/dados.csv:
conjunto base com pares de cores de referencia para teste, incluindo combinacoes classicas de alto contraste e combinacoes propositalmente problematicas para daltonismo.
- data/dados_gerados.csv:
base expandida com pares adicionais e metricas derivadas (contraste, contraste_deuteranopia, luminancia e distancias de cor).
- Rastreamento:
no estado atual deste repositorio nao existe script versionado de geracao dos pares, entao a proveniencia exata de cada combinacao da base expandida nao pode ser reconstruida integralmente apenas pelo codigo fonte presente.
- Relacao com a extensao:
parte das cores presentes no projeto aparece tambem na paleta usada no content script (por exemplo #000000, #ffffff, #0087be, #ffd700, #ff4500, #228b22 e #4169e1).

### Tecnologias

- JavaScript
- Chrome Extensions (Manifest V3)
- HTML/CSS

### Status

Projeto local-only (sem backend no fluxo atual).
