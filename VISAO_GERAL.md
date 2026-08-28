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

### Metodologia de análise cromática

A identificação de cores potencialmente problemáticas é realizada localmente no navegador, por meio de heurísticas baseadas nos canais do modelo RGB. O modelo RGB representa cada cor por três componentes: R (*Red*, vermelho), G (*Green*, verde) e B (*Blue*, azul). Cada componente normalmente varia de 0 a 255, sendo que valores maiores representam maior intensidade daquele canal.

As regras utilizam os operadores `>` (maior que), `<` (menor que), `/` (divisão), `*` (multiplicação) e `min(R, G)` (menor valor entre R e G). Elas foram definidas para identificar predominância cromática e não constituem um modelo clinico completo de daltonismo.

#### Modo vermelho-verde

O modo vermelho-verde utiliza o mesmo conjunto de regras para os casos associados à deuteranopia e à protanopia. Uma cor e classificada como potencialmente avermelhada quando atende simultaneamente aos seguintes criterios:

```text
R > 120
G < R/2
B < R/2 + 20
```

Essas condições exigem uma intensidade relevante de vermelho, enquanto os canais verde e azul permanecem proporcionalmente menores. Por exemplo, em `rgb(200, 50, 40)`, o vermelho e 200, o verde e 50 e o azul e 40; portanto, a cor atende aos tres criterios.

Uma cor e classificada como potencialmente esverdeada quando atende a:

```text
G > 80
R < G/2
B < G/2 + 20
```

Nesse caso, o verde deve apresentar intensidade suficiente, enquanto vermelho e azul devem ser menores em relacao a ele. Por exemplo, `rgb(40, 180, 50)` atende a essas condicoes e e classificada como potencialmente esverdeada.

#### Modo azul-amarelo

O modo azul-amarelo e utilizado para a analise relacionada a tritanopia. Uma cor e classificada como potencialmente azulada quando atende a:

```text
B > 100
B > 1,8R
B > 1,5G
```

O primeiro criterio estabelece uma intensidade minima de azul. Os outros dois exigem que o azul seja significativamente maior que o vermelho e o verde. Assim, uma cor nao e considerada azul apenas por possuir B ligeiramente maior que os outros canais.

Uma cor e classificada como potencialmente amarelada quando atende a:

```text
R > 150
G > 120
B < 0,4 * min(R, G)
```

Essa regra procura identificar a combinacao de vermelho e verde elevados com baixa intensidade de azul, caracteristica da composicao RGB aproximada do amarelo. O uso do menor valor entre R e G torna o criterio mais restritivo, pois os dois canais precisam apresentar intensidade suficiente.

### Como os elementos da pagina sao analisados

Quando o usuario seleciona um modo e aciona a adaptacao, a extensao percorre os elementos descendentes do corpo da pagina. Elementos sem area visivel sao ignorados. Essa filtragem evita a analise de elementos ocultos ou sem dimensao na tela.

Para cada elemento visivel, sao consultadas as propriedades visuais calculadas pelo navegador. A extensao verifica principalmente:

1. A cor de fundo propria do elemento.
2. A existencia de texto diretamente dentro do elemento.
3. A cor do texto, quando o elemento possui texto direto.

Valores de cor em RGB ou RGBA sao convertidos para hexadecimal antes da avaliacao. Cores de fundo totalmente transparentes sao desconsideradas. A cor do texto nao e atribuida automaticamente a todos os descendentes quando ela e apenas herdada de um elemento-pai; ela e avaliada quando existe texto diretamente associado ao elemento.

Um elemento e considerado potencialmente problematico quando a cor de fundo ou a cor do texto atende a pelo menos uma regra do modo selecionado. A verificacao e feita com uma condicao logica do tipo OU: basta que uma das duas cores seja classificada para que o elemento seja selecionado.

### Aplicacao dos marcadores

Depois da classificacao, o elemento recebe um marcador visual correspondente a cor identificada:

- No modo vermelho-verde, cores potencialmente vermelhas recebem o marcador `R` e cores potencialmente verdes recebem o marcador `G`.
- No modo azul-amarelo, cores potencialmente azuis recebem o marcador `B` e cores potencialmente amarelas recebem o marcador `Y`.

Os marcadores sao sobrepostos a pagina e nao substituem a cor original do elemento. Eles funcionam como uma sinalizacao visual para indicar ao usuario qual categoria cromatica foi identificada. Quando um valor atende simultaneamente a mais de uma regra, a primeira condicao avaliada tem prioridade. No modo vermelho-verde, por exemplo, a verificacao da categoria vermelha ocorre antes da verificacao da categoria verde.

Antes da aplicacao das marcacoes, o estado visual original dos elementos selecionados e armazenado. Isso permite remover as classes auxiliares, os identificadores e os marcadores quando o usuario aciona a opcao de reset. A legenda inserida na pagina apresenta o significado das letras e das cores utilizadas em cada modo.

### Atualizacao dinamica dos marcadores

O posicionamento dos marcadores e calculado a partir da posicao atual dos elementos na janela do navegador. Para acompanhar mudancas na interface, a extensao atualiza os marcadores em resposta a:

- Rolagem da pagina.
- Redimensionamento da janela.
- Movimento do mouse.
- Alteracoes de atributos, inclusao ou remocao de elementos no DOM.

Tambem e verificado se o elemento esta dentro da area visivel da janela e se esta proximo do cursor. A distancia de proximidade utilizada e de 80 pixels. Com isso, os marcadores podem permanecer ocultos quando o elemento esta fora da tela ou distante do cursor, reduzindo a poluicao visual em paginas com muitos elementos classificados.

### Diferenca entre heuristica e avaliacao de contraste

As funcoes de luminancia e razao de contraste presentes no projeto servem como apoio para estudos e dados de avaliacao das combinacoes cromaticas. Entretanto, a marcacao efetiva da pagina utiliza as heuristicas RGB de predominancia descritas nesta secao. O contraste entre texto e fundo nao e, na versao atual, o criterio principal para decidir se um elemento recebera um marcador.

Consequentemente, a extensao nao realiza uma simulacao completa da visao de pessoas com deuteranopia, protanopia ou tritanopia e nao deve ser interpretada como um diagnostico clinico ou como um validador definitivo de conformidade. A classificacao indica uma possibilidade de confusao cromatica e orienta a inspecao dos elementos pelo usuario.

### Limites da abordagem

- As regras sao baseadas em limiares RGB fixos e podem produzir falsos positivos ou falsos negativos.
- A classificacao considera principalmente cores individuais, e nao todos os efeitos resultantes da combinacao entre texto, fundo, bordas, imagens e contexto visual.
- Gradientes, imagens, transparencias parciais e efeitos visuais complexos podem nao ser representados integralmente pela analise atual.
- Deuteranopia e protanopia sao agrupadas no mesmo modo, utilizando as mesmas regras de vermelho e verde.
- A ferramenta sinaliza elementos para avaliacao humana; ela nao substitui testes com usuarios, avaliacao especializada ou verificadores formais de acessibilidade.

### Status

Projeto local-only (sem backend no fluxo atual).
