import numpy as np
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

cores_seguras = [
    "#000000",
    "#ffffff",
    "#0087be",
    "#ffd700",
    "#ff4500",
    "#228b22",
    "#4169e1"
]

# Carrega o modelo treinado se existir
modelo_treinado = None
scaler = None

try:
    if os.path.exists(os.path.join(BASE_DIR, 'modelo_acessibilidade.pkl')):
        modelo_treinado = joblib.load(os.path.join(BASE_DIR, 'modelo_acessibilidade.pkl'))
        scaler = joblib.load(os.path.join(BASE_DIR, 'scaler.pkl'))
except:
    pass

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return np.array([int(hex_color[i:i+2], 16)/255 for i in (0,2,4)])

def linearize(c):
    return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4

def luminancia(rgb):
    r,g,b = rgb
    return (
        0.2126 * linearize(r) +
        0.7152 * linearize(g) +
        0.0722 * linearize(b)
    )

def contraste(c1, c2):
    l1 = luminancia(c1)
    l2 = luminancia(c2)
    return (max(l1,l2)+0.05)/(min(l1,l2)+0.05)

def simular_daltonismo(rgb, mode='deuteranopia'):
    """Simula como a cor aparece para o tipo de daltonismo especificado"""
    matrices = {
        'deuteranopia': np.array([
            [0.625, 0.375, 0.0],
            [0.7,   0.3,   0.0],
            [0.0,   0.3,   0.7]
        ]),
        'protanopia': np.array([
            [0.567, 0.433, 0.0],
            [0.558, 0.442, 0.0],
            [0.0,   0.242, 0.758]
        ]),
        'tritanopia': np.array([
            [0.95,  0.05,  0.0],
            [0.0,   0.433, 0.567],
            [0.0,   0.475, 0.525]
        ])
    }
    M = matrices.get(mode, matrices['deuteranopia'])
    return np.clip(M @ rgb, 0, 1)

def distancia_hsv(rgb1, rgb2):
    """Distância no espaço HSV (mais perceptual)"""
    from colorsys import rgb_to_hsv
    h1, s1, v1 = rgb_to_hsv(rgb1[0], rgb1[1], rgb1[2])
    h2, s2, v2 = rgb_to_hsv(rgb2[0], rgb2[1], rgb2[2])
    
    dh = min(abs(h1 - h2), 1 - abs(h1 - h2))
    ds = abs(s1 - s2)
    dv = abs(v1 - v2)
    
    return np.sqrt(dh**2 + ds**2 + dv**2)

def distancia_euclidiana(c1, c2):
    """Distância euclidiana entre cores"""
    return np.sqrt(np.sum((c1 - c2)**2))

def is_redish_rgb(rgb, threshold=0.15):
    return rgb[0] > rgb[1] + threshold and rgb[0] > rgb[2] + threshold


def is_greenish_rgb(rgb, threshold=0.15):
    return rgb[1] > rgb[0] + threshold and rgb[1] > rgb[2] + threshold


def is_red_green_pair(texto_hex, fundo_hex):
    try:
        texto_rgb = hex_to_rgb(texto_hex)
        fundo_rgb = hex_to_rgb(fundo_hex)
        return (
            (is_redish_rgb(texto_rgb) and is_greenish_rgb(fundo_rgb)) or
            (is_greenish_rgb(texto_rgb) and is_redish_rgb(fundo_rgb))
        )
    except Exception:
        return False


def predizer_acessibilidade(texto_rgb, fundo_rgb):
    """Usa modelo ML treinado para predizer se a combinação é acessível"""
    
    global modelo_treinado, scaler
    
    if modelo_treinado is None or scaler is None:
        c = contraste(texto_rgb, fundo_rgb)
        c_sim = contraste(
            simular_daltonismo(texto_rgb),
            simular_daltonismo(fundo_rgb)
        )
        return 1 if (c >= 4.5 and c_sim >= 3.0) else 0

    try:
        c = contraste(texto_rgb, fundo_rgb)
        c_sim = contraste(
            simular_daltonismo(texto_rgb),
            simular_daltonismo(fundo_rgb)
        )
        dist_rgb = distancia_euclidiana(texto_rgb, fundo_rgb)
        dist_hsv = distancia_hsv(texto_rgb, fundo_rgb)
        
        # Features devem estar na mesma ordem usada no treinamento
        features = np.array([[
            c,
            c_sim,
            luminancia(texto_rgb),
            luminancia(fundo_rgb),
            dist_rgb,
            dist_hsv
        ]])
        
        features_scaled = scaler.transform(features)
        pred = modelo_treinado.predict(features_scaled)[0]
        
        return int(pred)
    except:
        # Fallback se der erro
        c = contraste(texto_rgb, fundo_rgb)
        return 1 if c >= 4.5 else 0

def melhorar_cor(texto, fundo, mode='deuteranopia'):
    """Seleciona a melhor cor da paleta segura para o modo de daltonismo"""
    rgb_fundo = hex_to_rgb(fundo)
    melhor = texto
    melhor_score = -1

    for cor in cores_seguras:
        rgb_cor = hex_to_rgb(cor)
        acessibilidade = predizer_acessibilidade(rgb_cor, rgb_fundo)
        c = contraste(rgb_cor, rgb_fundo)
        c_sim = contraste(
            simular_daltonismo(rgb_cor, mode),
            simular_daltonismo(rgb_fundo, mode)
        )
        score = (acessibilidade * 2) + (c / 4.5) + (c_sim / 3.0)
        if score > melhor_score:
            melhor = cor
            melhor_score = score

    return melhor
