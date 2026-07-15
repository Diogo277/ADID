# 🎨 Demonstração de Acessibilidade - Deuteranopia

Um projeto educacional que demonstra como escolhas de design afetam pessoas com deuteranopia (daltonismo vermelho-verde) e oferece uma solução com **Machine Learning** para adaptar cores automaticamente.

## 📋 Conteúdo do Projeto

```
├── chrome_extension/
│   ├── manifest.json              # Configuração da extensão Chrome
│   ├── popup.html                 # Interface da extensão
│   ├── popup.js                   # Lógica dos botões
│   ├── content_script.js          # Script injetado nas páginas
│   ├── background.js              # Service worker
│   └── images/                    # Ícones
│
├── server/
│   ├── app.py                     # Backend Flask
│   ├── modelo.py                  # Modelo ML de acessibilidade
│   ├── treinar_modelo.py          # Script para treinar o modelo
│   ├── dados.csv                  # Dataset pequeno
│   ├── dados_gerados.csv          # Dataset completo (3000 exemplos)
│   ├── modelo_acessibilidade.pkl  # Modelo treinado (Gradient Boosting)
│   ├── scaler.pkl                 # Normalizador de features
│   └── metadata_modelo.json       # Metadados do modelo
│
└── diagramas/                     # Diagramas do projeto
```

## 🚀 Como Executar

### 1️⃣ Pré-requisitos
Instale as dependências:
```bash
pip install flask flask-cors scikit-learn joblib pandas numpy
```

### 2️⃣ Treinar o Modelo (Primeira Vez)
Se ainda não tiver o modelo treinado:
```bash
python treinar_modelo.py
```

Este comando:
- Gera 3000 exemplos de pares de cores
- Simula visão com deuteranopia (matriz de Brettel et al.)
- Treina um modelo Gradient Boosting
- Salva o modelo em `modelo_acessibilidade.pkl`

**Resultado esperado:**
```
📊 MÉTRICAS DO MODELO
Acurácia:   1.0000
Precisão:   1.0000
Recall:     1.0000
F1-Score:   1.0000
ROC-AUC:    1.0000
```

### 3️⃣ Iniciar o Servidor Flask
Em um terminal, execute:
```bash
cd "C:\Users\User\Desktop\MBA USP\TCC MBA\ADID\server"
python app.py
```

Você verá:
```
🚀 Servidor de Acessibilidade de Cores
📍 Rodando em: http://127.0.0.1:5000
```

### 4️⃣ Abrir o Site
Como a interface foi convertida para uma extensão Chrome, não há mais a tela `index.html` usada diretamente.

Instale a extensão no Chrome (modo desenvolvedor):

1. Abra `chrome://extensions/` no Chrome
2. Ative o "Modo do desenvolvedor" no canto superior direito
3. Clique em "Carregar sem compactação" e selecione a pasta deste projeto
4. Abra qualquer página e clique no ícone da extensão (ADID) para usar os botões "Adaptar página" e "Resetar cores"

Observação: o backend Flask ainda deve estar rodando em `http://127.0.0.1:5000` para que a adaptação funcione.

## 🎯 Como Usar

### Visualizar o Problema
1. Abra o site normalmente
2. **Você conseguirá ler** (visão normal)
3. Observe os elementos vermelhos/verdes confusos para deuteranopia

### Testar a Adaptação
1. Clique no botão **"Adaptar página"**
2. O servidor Flask processará as cores
3. **As cores se adaptem automaticamente** para melhor legibilidade
4. Você verá uma mensagem de sucesso no canto superior direito

### Resetar
1. Clique em **"Resetar"** para voltar às cores originais

## 🧠 Como o Modelo Funciona

### Simulação de Deuteranopia
O projeto usa a **matriz de transformação científica de Brettel et al. (1997)** para simular como não afeta pessoas com deuteranopia:

```
Cores originais → Aplicar matriz → Cores simuladas (visão deuteranopia)
```

### Features do Modelo ML
O modelo Gradient Boosting usa 6 features:

1. **Contraste WCAG** (normal) - 70% importance
2. **Contraste em Deuteranopia** - 30% importance
3. Luminância do texto
4. Luminância do fundo
5. Distância RGB entre cores
6. Distância HSV (perceptual)

### Decisão
Para cada cor problemática, o modelo:
1. Testa todas as 7 cores seguras disponíveis
2. Calcula score de acessibilidade para cada uma
3. **Escolhe a cor com maior score**

Cores seguras:
- `#000000` (Preto)
- `#ffffff` (Branco)
- `#0087be` (Azul)
- `#ffd700` (Ouro)
- `#ff4500` (Laranja-vermelho)
- `#228b22` (Verde floresta)
- `#4169e1` (Azul real)

## 📊 Dataset

O projeto inclui:
- **dados.csv** - 10 exemplos pequenos (original)
- **dados_gerados.csv** - 3000 exemplos gerados sinteticamente

Distribuição no dataset de 3000 exemplos:
- 433 combinações acessíveis (14.4%)
- 2567 combinações inacessíveis (85.6%)

## 🔍 Endpoints da API

### POST /adaptar
Adapta as cores de uma página para melhor legibilidade

**Request:**
```json
{
  "elementos": [
    {"color": "#ff0000", "background": "#e6ffe6"},
    {"color": "#000000", "background": "#ffffff"}
  ]
}
```

**Response:**
```json
{
  "cores": [
    {"text": "#0087be", "background": "#e6ffe6"},
    {"text": "#000000", "background": "#ffffff"}
  ]
}
```

### GET /info
Informações do modelo treinado

**Response:**
```json
{
  "status": "ok",
  "modelo": {
    "features": ["contraste", "contraste_deuteranopia", ...],
    "modelo_tipo": "GradientBoostingClassifier",
    "n_samples_treino": 3000,
    "versao": "1.0"
  }
}
```

### GET /health
Verifica status do servidor

## 🎓 O Que Aprender

1. **Deuteranopia**: Afeta ~1% dos homens, 0.4% das mulheres
2. **Design Inacessível**: Como cores erradas excluem pessoas
3. **Machine Learning**: Treinar modelos para resolver problemas reais
4. **WCAG**: Padrões de acessibilidade web
5. **Simulação Científica**: Matrizes de transformação de cores

## 📚 Referências

- [WCAG 2.1 - Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Brettel et al. (1997) - Color Vision Deficiency Simulation](https://vision.psyche.tu-dresden.de/color-blindness)
- [Coblis Color Blind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## ⚙️ Troubleshooting

### "Erro: Certifique-se que o servidor Flask está rodando"
**Solução:** Execute `python app.py` em outro terminal

### "ModuleNotFoundError: No module named 'modelo'"
**Solução:** Certifique-se de estar no diretório correto: `cd "C:\Users\User\Desktop\MBA USP\TCC MBA\ADID\server"`

### "Arquivo scaler.pkl não encontrado"
**Solução:** Execute `python treinar_modelo.py` para gerar o modelo

### Cores não mudam ao clicar em "Adaptar"
1. Abra o Console do Navegador (F12)
2. Verifique se há erros de rede
3. Confirme que Flask está rodando em `http://127.0.0.1:5000`
4. Tente executar `python app.py` novamente

### Erro ao injetar script / páginas não suportadas
- Não é possível injetar scripts em URLs internas do navegador (por exemplo, `chrome://extensions`, `chrome://settings`, `edge://` ou `chrome-extension://...`). Abra uma página web normal (ex.: `https://example.com` ou `http://127.0.0.1:5000`) e tente novamente.
- Se estiver testando um arquivo local (`file://`), vá em `chrome://extensions/`, localize a extensão ADID e habilite "Allow access to file URLs" antes de recarregar a aba.


## 🔐 Segurança

Este é um projeto educacional. Para produção:
1. Adicionar autenticação
2. Validar todas as inputs
3. Adicionar rate limiting
4. Usar HTTPS

## 📝 Licença

Projeto educacional para demonstração de acessibilidade web.

---

**Desenvolvido para o TCC MBA - Análise de Deficiências e Inovação Digital (ADID)**

🎯 **Objetivo:** Demonstrar como Machine Learning pode melhorar a acessibilidade web para pessoas com deficiências visuais.
