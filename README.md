# ADID - Acessibilidade de Cores (Extensao Chrome)

Projeto educacional para sinalizar combinacoes de cor problemáticas em paginas web para usuarios com daltonismo.

## Estrutura

- chrome_extension/: extensao Chrome (popup, content script, manifesto e icones)
- data/: arquivos CSV usados no estudo
- diagramas/: diagramas e material visual
- README.md, GUIA_RAPIDO.md, VISAO_GERAL.md: documentacao

## Como usar

1. Abra chrome://extensions/
2. Ative "Modo do desenvolvedor"
3. Clique em "Carregar sem compactacao"
4. Selecione a pasta chrome_extension
5. Abra qualquer pagina web e use o icone da extensao

## Fluxo da extensao

1. Usuario escolhe o modo (red-green ou tritanopia)
2. Clica em Adaptar pagina
3. O content script analisa elementos visiveis
4. Elementos com cores problemáticas recebem badge visual (R/G ou B/Y)
5. Usuario pode clicar em Resetar para restaurar o estilo original

## Modos disponiveis

- red-green: Deuteranopia e Protanopia (confusao vermelho/verde)
- tritanopia: confusao azul/amarelo

## Limites conhecidos

- Nao injeta scripts em paginas internas do navegador (chrome://, edge://, chrome-extension://)
- Em file://, habilite "Allow access to file URLs" na tela da extensao

## Troubleshooting

- "Erro ao injetar script": abra uma pagina web normal e tente novamente
- "Nada mudou": recarregue a aba e clique novamente em Adaptar pagina
- "Sem badges": a pagina pode nao conter elementos com cores classificadas como problemáticas pelo filtro atual

## Licenca

Projeto educacional para TCC MBA.
