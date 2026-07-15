import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================
# 1. CONVERSÃO PARA DEUTERANOPIA
# ============================================

def hex_to_rgb(hex_color):
    """Converte hex para RGB (0-1)"""
    hex_color = hex_color.lstrip('#')
    return np.array([int(hex_color[i:i+2], 16)/255 for i in (0,2,4)])

def rgb_to_hex(rgb):
    """Converte RGB (0-1) para hex"""
    rgb = np.clip(rgb, 0, 1)
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))

def simular_deuteranopia(rgb):
    """
    Simula como a cor aparece para pessoas com deuteranopia
    Usa a matriz de simulação científica de Brettel et al. (1997)
    """
    # Matriz de transformação para deuteranopia
    M = np.array([
        [0.625, 0.375, 0.0],
        [0.7, 0.3, 0.0],
        [0.0, 0.3, 0.7]
    ])
    
    rgb_sim = M @ rgb
    return np.clip(rgb_sim, 0, 1)

def linearize(c):
    """Lineariza componente de cor para cálculo de luminância"""
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4

def luminancia(rgb):
    """Calcula luminância relativa (WCAG)"""
    r, g, b = rgb
    return (
        0.2126 * linearize(r) +
        0.7152 * linearize(g) +
        0.0722 * linearize(b)
    )

def contraste(c1, c2):
    """Calcula razão de contraste (WCAG)"""
    l1 = luminancia(c1)
    l2 = luminancia(c2)
    return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

def distancia_euclidiana(c1, c2):
    """Distância euclidiana entre cores no espaço RGB"""
    return np.sqrt(np.sum((c1 - c2)**2))

def distancia_hsv(rgb1, rgb2):
    """Distância no espaço HSV (mais perceptual)"""
    from colorsys import rgb_to_hsv
    h1, s1, v1 = rgb_to_hsv(rgb1[0], rgb1[1], rgb1[2])
    h2, s2, v2 = rgb_to_hsv(rgb2[0], rgb2[1], rgb2[2])
    
    # Distância circular em hue
    dh = min(abs(h1 - h2), 1 - abs(h1 - h2))
    ds = abs(s1 - s2)
    dv = abs(v1 - v2)
    
    return np.sqrt(dh**2 + ds**2 + dv**2)

# ============================================
# 2. GERAÇÃO DE DATASET
# ============================================

def gerar_dataset(n_samples=3000):
    """Gera dataset de pares cor_texto/cor_fundo com labels de acessibilidade"""
    
    cores_base = [
        "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
        "#ffff00", "#00ffff", "#ff00ff", "#808080", "#c0c0c0",
        "#800000", "#008000", "#000080", "#808000", "#008080",
        "#800080", "#ffa500", "#ffc0cb", "#a52a2a", "#daa520",
        "#0087be", "#ffd700", "#ff4500", "#228b22", "#4169e1",
        "#dc143c", "#00ced1", "#696969", "#bdb76b", "#cd5c5c",
        "#556b2f", "#8b4513", "#2f4f4f", "#483d8b", "#8b0000"
    ]
    
    dados = []
    
    for _ in range(n_samples):
        # Seleciona cores aleatoriamente
        cor_texto = np.random.choice(cores_base)
        cor_fundo = np.random.choice(cores_base)
        
        # Evita cores iguais
        while cor_texto == cor_fundo:
            cor_fundo = np.random.choice(cores_base)
        
        rgb_texto = hex_to_rgb(cor_texto)
        rgb_fundo = hex_to_rgb(cor_fundo)
        
        # Calcula métricas
        c = contraste(rgb_texto, rgb_fundo)
        
        # Simula deuteranopia
        rgb_texto_sim = simular_deuteranopia(rgb_texto)
        rgb_fundo_sim = simular_deuteranopia(rgb_fundo)
        c_sim = contraste(rgb_texto_sim, rgb_fundo_sim)
        
        dist_rgb = distancia_euclidiana(rgb_texto, rgb_fundo)
        dist_hsv = distancia_hsv(rgb_texto, rgb_fundo)
        
        # Label: é acessível mesmo para deuteranopia?
        # Critérios: 
        # - Contraste >= 4.5 (normal)
        # - Contraste em deuteranopia >= 3.0
        # - Distância de cor >= 0.2
        boa_acessibilidade = 1 if (
            c >= 4.5 and c_sim >= 3.0 and (dist_rgb >= 0.2 or dist_hsv >= 0.15)
        ) else 0
        
        dados.append({
            'cor_texto': cor_texto,
            'cor_fundo': cor_fundo,
            'contraste': c,
            'contraste_deuteranopia': c_sim,
            'luminancia_texto': luminancia(rgb_texto),
            'luminancia_fundo': luminancia(rgb_fundo),
            'distancia_rgb': dist_rgb,
            'distancia_hsv': dist_hsv,
            'boa_acessibilidade': boa_acessibilidade
        })
    
    return pd.DataFrame(dados)

# ============================================
# 3. PREPARAÇÃO DE DADOS
# ============================================

def preparar_dados(df):
    """Prepara dados para treinamento"""
    
    # Features numéricas
    X = df[[
        'contraste',
        'contraste_deuteranopia',
        'luminancia_texto',
        'luminancia_fundo',
        'distancia_rgb',
        'distancia_hsv'
    ]].values
    
    y = df['boa_acessibilidade'].values
    
    # Normaliza features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler, X

# ============================================
# 4. TREINO DO MODELO
# ============================================

def treinar_modelo(X, y):
    """Treina o modelo com Gradient Boosting"""
    
    # Divisão train/test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Cria e treina modelo
    model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        verbose=1
    )
    
    print("🚀 Treinando Gradient Boosting...")
    model.fit(X_train, y_train)
    
    # Predições
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Avaliação
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"\n{'='*60}")
    print(f"📊 MÉTRICAS DO MODELO")
    print(f"{'='*60}")
    print(f"Acurácia:   {accuracy:.4f}")
    print(f"Precisão:   {precision:.4f}")
    print(f"Recall:     {recall:.4f}")
    print(f"F1-Score:   {f1:.4f}")
    print(f"ROC-AUC:    {roc_auc:.4f}")
    print(f"{'='*60}\n")
    
    # Importância das features
    feature_names = [
        'contraste',
        'contraste_deuteranopia',
        'luminancia_texto',
        'luminancia_fundo',
        'distancia_rgb',
        'distancia_hsv'
    ]
    
    print("🎯 IMPORTÂNCIA DAS FEATURES")
    print(f"{'='*60}")
    for name, importance in zip(feature_names, model.feature_importances_):
        print(f"{name:30s}: {importance:.4f}")
    print(f"{'='*60}\n")
    
    return model, (X_test, y_test)

# ============================================
# 5. EXECUÇÃO
# ============================================

if __name__ == "__main__":
    print("🔄 Gerando dataset...")
    df = gerar_dataset(n_samples=3000)
    
    distribuicao = df['boa_acessibilidade'].value_counts()
    print(f"📊 Dataset criado com {len(df)} exemplos")
    print(f"   - Acessíveis: {distribuicao.get(1, 0)} ({100*distribuicao.get(1, 0)/len(df):.1f}%)")
    print(f"   - Inacessíveis: {distribuicao.get(0, 0)} ({100*distribuicao.get(0, 0)/len(df):.1f}%)")
    
    print("\n🔄 Preparando dados...")
    X_scaled, y, scaler, X_original = preparar_dados(df)
    
    print("🏗️  Treinando modelo...")
    model, test_data = treinar_modelo(X_scaled, y)
    
    print("💾 Salvando modelo...")
    joblib.dump(model, os.path.join(BASE_DIR, 'modelo_acessibilidade.pkl'))
    joblib.dump(scaler, os.path.join(BASE_DIR, 'scaler.pkl'))
    
    print("✅ Modelo treinado e salvo com sucesso!")
    
    # Salva o dataset para referência
    df.to_csv(os.path.join(BASE_DIR, 'dados_gerados.csv'), index=False)
    print("📁 Dataset salvo em dados_gerados.csv")
    
    # Salva metadados
    metadata = {
        'features': ['contraste', 'contraste_deuteranopia', 'luminancia_texto', 
                     'luminancia_fundo', 'distancia_rgb', 'distancia_hsv'],
        'modelo_tipo': 'GradientBoostingClassifier',
        'n_samples_treino': 3000,
        'versao': '1.0'
    }
    
    with open(os.path.join(BASE_DIR, 'metadata_modelo.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("📋 Metadados salvos em metadata_modelo.json")
