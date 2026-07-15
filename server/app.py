from flask import Flask, request, jsonify
from flask_cors import CORS
from modelo import melhorar_cor, hex_to_rgb, is_red_green_pair
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
CORS(app)

@app.route("/adaptar", methods=["POST"])
def adaptar():
    """Adapta cores para acessibilidade (deuteranopia, protanopia, tritanopia)"""
    try:
        dados = request.json
        elementos = dados["elementos"]
        mode = dados.get("mode", "deuteranopia")

        resultado = []

        for el in elementos:
            texto = el.get("color")
            fundo = el.get("background")

            # Evita processar cores inválidas
            if not texto or not fundo or texto.startswith("rgba"):
                resultado.append({"id": el.get("id"), "text": texto, "background": fundo})
                continue

            if mode == "tritanopia":
                # Tritanopia: sem modelo ML — retorna cores originais (marcação feita no cliente)
                resultado.append({"id": el.get("id"), "text": texto, "background": fundo})
                continue

            red_green_pair = el.get("redGreenPair", False)
            if not red_green_pair and not is_red_green_pair(texto, fundo):
                resultado.append({"id": el.get("id"), "text": texto, "background": fundo})
                continue

            try:
                nova_cor = melhorar_cor(texto, fundo, mode=mode)
                resultado.append({"id": el.get("id"), "text": nova_cor, "background": fundo})
            except Exception:
                resultado.append({"id": el.get("id"), "text": texto, "background": fundo})

        return jsonify({"cores": resultado}), 200

    except Exception as e:
        print(f"Erro ao adaptar cores: {e}")
        return jsonify({"erro": str(e)}), 400

@app.route("/info", methods=["GET"])
def info():
    """Retorna informações do modelo"""
    try:
        with open(os.path.join(BASE_DIR, 'metadata_modelo.json'), 'r') as f:
            metadata = json.load(f)
        return jsonify({
            "status": "ok",
            "modelo": metadata,
            "mensagem": "Servidor de adaptação de cores operacional"
        }), 200
    except:
        return jsonify({
            "status": "modelo_nao_encontrado",
            "mensagem": "Modelo ainda não foi treinado. Execute treinar_modelo.py"
        }), 200

@app.route("/health", methods=["GET"])
def health():
    """Verificação de saúde do servidor"""
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Servidor de Acessibilidade de Cores")
    print("=" * 60)
    print("📍 Rodando em: http://127.0.0.1:5000")
    print("📍 CORS ativado para: http://localhost:*")
    print("\n🔗 Endpoints disponíveis:")
    print("   POST /adaptar - Adapta cores para deuteranopia")
    print("   GET  /info   - Informações do modelo")
    print("   GET  /health - Status do servidor")
    print("=" * 60)
    print("\n⚠️  Certifique-se que o arquivo 'modelo_acessibilidade.pkl' existe")
    print("   Execute: python treinar_modelo.py\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
