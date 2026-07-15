# 🈵 GUIA RÁPIDO - PORTUGUES

## ✅ Tudo Pronto!

Seu projeto está **100% funcional**. Aqui está o guia rápido para usar:

### 🚀 PASSO 1: Iniciar o Servidor
Abra um terminal na pasta do projeto e execute:

```
python app.py
```

Você verá a mensagem:
```
🚀 Servidor de Acessibilidade de Cores
📍 Rodando em: http://127.0.0.1:5000
```

### 📱 PASSO 2: Abrir o Site
Em OUTRO terminal (ou abra no navegador):
- **Opção A:** Abra `index.html` diretamente no Firefox/Chrome
- **Opção B:** Execute em outro terminal:
  ```
  python -m http.server 8000
  ```
  Depois acesse: `http://localhost:8000`

### 🎯 PASSO 3: Testar o Botão
1. Veja como o site está **com cores ruins para deuteranopia**
2. Clique no botão **"Adaptar página"**
3. **Observe as cores mudarem** para melhor legibilidade
4. Veja o feedback de sucesso no canto superior direito

### 🔄 Resetar
Clique em **"Resetar"** para voltar às cores originais

---

## 📊 O que Vai Acontecer

### ANTES (Clica em "Adaptar página")
- Cores vermelhas e verdes (problema para deuteranopia)
- Texto quase invisível em verde claro
- Muito inacessível

### DEPOIS (Após "Adaptar página")
- Cores adaptadas para melhor contraste
- Texto preto/cores seguras
- Muito mais legível!
- Feedback visual confirmando a adaptação

---

## 🤖 Como Funciona o ML

1. **Analisa** cada elemento da página
2. **Simula** como aparece para quem tem deuteranopia
3. **Treina** modelo que prevê melhores cores
4. **Adapta** cores automaticamente
5. **Resultado:** Site acessível!

---

## ⚙️ Arquivos Importantes

- `app.py` - Backend (servidor que adapta cores)
- `script.js` - Frontend (comunica com servidor)
- `modelo.py` - Lógica do ML
- `modelo_acessibilidade.pkl` - Modelo treinado (AI!)
- `index.html` - Site com cores ruins

---

## 🆘 Problemas?

### "Erro: Certifique-se que Flask está rodando"
→ Você abriu o site sem iniciar `python app.py`
→ Solução: Execute `python app.py` em outro terminal

### "Nada acontece ao clicar no botão"
→ Abra Console do Navegador (F12) e procure por erros
→ Verifique se Flask está rodando em http://127.0.0.1:5000

### Cores não mudam
→ Aguarde 2-3 segundos (o servidor está processando)
→ Verifique se não há mensagem de erro no console

---

## 📚 Saiba Mais

- Leia o **README.md** para documentação completa
- Execute **verificar_projeto.py** para diagnóstico
- Pesquise sobre "Deuteranopia" na internet
- Teste seu site com simuladores: [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/)

---

## 🎯 Resumo Rápido

```
Terminal 1:              Terminal 2:
$ python app.py    →     $ python -m http.server 8000
                         $ # Abra http://localhost:8000
                         $ # Clique em "Adaptar página"
                         $ # Veja as cores mudarem! ✨
```

---

**Pronto! Seu projeto de acessibilidade está funcionando! 🚀**
