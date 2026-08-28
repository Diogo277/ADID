if (window.__ADID_INJECTED) {
  console.log('ADID already injected (browser_extension)');
} else {
  window.__ADID_INJECTED = true;
  const coresOriginais = new Map();
  const adidBadges = [];
  if (!window.__ADID_COUNTER) window.__ADID_COUNTER = 0;
  console.log('ADID content_script (browser_extension) loaded');
  let adaptacaoAtiva = false;
  let lastMouse = { x: -9999, y: -9999 };
  const PROXIMITY_THRESHOLD = 80; // pixels

function getBackground(el) {
  let bg = window.getComputedStyle(el).backgroundColor;
  while (bg === "rgba(0, 0, 0, 0)" && el.parentElement) {
    el = el.parentElement;
    bg = window.getComputedStyle(el).backgroundColor;
  }
  return bg;
}

function rgbToHex(rgb) {
  const nums = rgb.match(/\d+/g);
  if (!nums) return "#000000";
  return "#" + nums.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, "0")).join("");
}

function mostrarMensagem(texto, tipo = "sucesso") {
  const existing = document.getElementById('adid-msg');
  if (existing) existing.remove();
  const msg = document.createElement('div');
  msg.id = 'adid-msg';
  msg.style.cssText = `position:fixed;top:16px;right:16px;z-index:2147483647;padding:10px 14px;border-radius:6px;color:#fff;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.25)`;
  msg.style.background = tipo === 'sucesso' ? '#4CAF50' : '#f44336';
  msg.textContent = texto;
  document.documentElement.appendChild(msg);
  setTimeout(() => { msg.remove(); }, 3000);
}

function injectStylesAndLegend() {
  if (document.getElementById('adid-style')) return;
  const style = document.createElement('style');
  style.id = 'adid-style';
  style.textContent = `
    .adid-underline { text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 3px; }
    #adid-legend { position: fixed; left: 12px; top: 12px; z-index:2147483647; background: rgba(255,255,255,0.93); color:#000; padding:6px 8px; border-radius:6px; box-shadow:0 6px 18px rgba(0,0,0,0.12); font-size:12px; font-weight:600; max-width:220px; }
    #adid-legend .item { display:flex; align-items:center; gap:6px; margin:3px 0; }
    #adid-legend .swatch { width:14px; height:10px; border-radius:3px; border:1px solid #888; }
    #adid-legend .label { text-decoration: none; font-weight:600; }
    #adid-legend .toggle { cursor:pointer; font-size:12px; color:#333; margin-bottom:4px; display:flex; align-items:center; gap:8px }
    #adid-legend.collapsed .details { display:none; }
    .adid-badge { position:fixed; width:16px; height:16px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:700; box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.3); z-index:2147483600; pointer-events:none; }
  `;
  document.head.appendChild(style);

  const existing = document.getElementById('adid-legend');
  if (existing) return;
  const legend = document.createElement('div');
  legend.id = 'adid-legend';
  legend.className = 'collapsed';
  const cfg = MODE_CONFIG[activeMode] || MODE_CONFIG.deuteranopia;
  const modeLabels = { 'red-green': 'Vermelho-Verde', tritanopia: 'Azul-Amarelo' };
  legend.innerHTML = `
    <div class="toggle">${modeLabels[activeMode]} ▸</div>
    <div class="details">
      <div class="item"><div class="swatch" style="background:${cfg.A.bg};border-radius:${cfg.A.shape}"></div><div class="label">${cfg.A.letter} — ${cfg.A.mark}</div></div>
      <div class="item"><div class="swatch" style="background:${cfg.B.bg};border-radius:${cfg.B.shape}"></div><div class="label">${cfg.B.letter} — ${cfg.B.mark}</div></div>
    </div>
  `;
  document.documentElement.appendChild(legend);
  try {
    const tog = legend.querySelector('.toggle');
    tog.addEventListener('click', () => {
      legend.classList.toggle('collapsed');
      tog.textContent = legend.classList.contains('collapsed') ? 'Legenda ▸' : 'Legenda ▾';
    });
  } catch(e) {}
}


function clearBadges() {
  try {
    while (adidBadges.length) {
      const b = adidBadges.pop();
      b && b.remove && b.remove();
    }
  } catch (e) {}
}

function removeBadgeForId(id) {
  try {
    for (let i = adidBadges.length - 1; i >= 0; i--) {
      const b = adidBadges[i];
      if (b && b.dataset && b.dataset.adidTarget === id) {
        b.remove && b.remove();
        adidBadges.splice(i, 1);
      }
    }
  } catch (e) {}
}

function updateBadgePosition(badge) {
  try {
    const id = badge.dataset.adidTarget;
    if (!id) return;
    const el = document.querySelector('[data-adid-id="' + id + '"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    badge.style.left = (Math.max(4, r.left + r.width - 8)) + 'px';
    badge.style.top = (Math.max(4, r.top + 2)) + 'px';
  } catch (e) {}
}

function updateAllBadges() {
  try {
    adidBadges.forEach(b => { updateBadgePosition(b); updateBadgeVisibility(b); });
  } catch (e) {}
}

function throttle(fn, wait) {
  let t = 0;
  let scheduled = null;
  return function() {
    const now = Date.now();
    const args = arguments;
    if (now - t > wait) {
      t = now;
      fn.apply(null, args);
    } else {
      clearTimeout(scheduled);
      scheduled = setTimeout(() => { t = Date.now(); fn.apply(null, args); }, wait - (now - t));
    }
  };
}

window.addEventListener('scroll', throttle(updateAllBadges, 80));
window.addEventListener('resize', throttle(updateAllBadges, 80));
window.addEventListener('mousemove', throttle((e)=>{ lastMouse.x = e.clientX; lastMouse.y = e.clientY; updateAllBadges(); }, 60));
const mo = new MutationObserver(throttle(updateAllBadges, 150));
try { mo.observe(document.body, { attributes: true, childList: true, subtree: true }); } catch(e) {}

function pointToRectDistance(x, y, r) {
  const dx = Math.max(r.left - x, 0, x - (r.left + r.width));
  const dy = Math.max(r.top - y, 0, y - (r.top + r.height));
  return Math.sqrt(dx*dx + dy*dy);
}

function updateBadgeVisibility(badge) {
  try {
    const id = badge.dataset.adidTarget;
    if (!id) { badge.style.display = 'none'; badge.setAttribute('aria-hidden','true'); return; }
    const el = document.querySelector('[data-adid-id="' + id + '"]');
    if (!el) { badge.style.display = 'none'; badge.setAttribute('aria-hidden','true'); return; }
    const r = el.getBoundingClientRect();
    const inViewport = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    const dist = pointToRectDistance(lastMouse.x, lastMouse.y, r);
    if (inViewport && dist <= PROXIMITY_THRESHOLD) { badge.style.display = 'flex'; badge.setAttribute('aria-hidden','false'); }
    else { badge.style.display = 'none'; badge.setAttribute('aria-hidden','true'); }
  } catch(e) { badge.style.display = 'none'; badge.setAttribute('aria-hidden','true'); }
}

function markElement(el, cfgItem) {
  try {
    ['red','green','blue','yellow'].forEach(m => el.classList.remove('adid-mark-' + m));
    el.classList.add('adid-mark-' + cfgItem.mark);
    el.setAttribute && el.setAttribute('data-adid-mark', cfgItem.mark);
    try {
      removeBadgeForId(el.dataset.adidId);
      const badge = document.createElement('div');
      badge.className = 'adid-badge';
      badge.style.background = cfgItem.bg;
      badge.style.borderRadius = cfgItem.shape;
      if (cfgItem.textColor) badge.style.color = cfgItem.textColor;
      badge.dataset.adidTarget = el.dataset.adidId;
      badge.textContent = cfgItem.letter;
      badge.setAttribute('aria-label', cfgItem.mark + ' marcado');
      document.documentElement.appendChild(badge);
      adidBadges.push(badge);
      updateBadgePosition(badge);
      updateBadgeVisibility(badge);
    } catch(e){}
  } catch(e){}
}
function removeStylesAndLegend() {
  const style = document.getElementById('adid-style');
  if (style) style.remove();
  const legend = document.getElementById('adid-legend');
  if (legend) legend.remove();
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
}

function parseRgbString(str) {
  if (!str) return null;
  if (typeof str !== 'string') return null;
  if (str.startsWith('#')) return str;
  const m = str.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; // totalmente transparente
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function getRelevantColorHex(el) {
  try {
    if (!el) return null;
    if (el instanceof SVGElement) {
      const f = el.getAttribute('fill') || el.style.fill;
      const parsed = parseRgbString(f);
      if (parsed) return parsed;
    }
    const estilo = window.getComputedStyle(el);
    // background-color própria do elemento (não transparente)
    const bg = estilo.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') {
      const bgHex = parseRgbString(bg);
      if (bgHex) return bgHex;
    }
    // cor do texto
    const c = estilo.color;
    const cHex = parseRgbString(c);
    if (cHex) return cHex;
    // borda
    const b = estilo.borderTopColor || estilo.borderColor;
    const bHex = parseRgbString(b);
    if (bHex) return bHex;
    const bs = estilo.boxShadow;
    if (bs) {
      const m = bs.match(/rgba?\((\d+,\s*\d+,\s*\d+)/);
      if (m) return rgbToHex('rgb(' + m[1] + ')');
    }
  } catch (e) {}
  return null;
}

function luminance(rgb) {
  const srgb = rgb.map(v => {
    v = v / 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

function isRedish(hex) {
  const [r,g,b] = hexToRgb(hex);
  return r > 120 && g < r / 2 && b < r / 2 + 20;
}
function isGreenish(hex) {
  const [r,g,b] = hexToRgb(hex);
  return g > 80 && r < g / 2 && b < g / 2 + 20;
}
function isBlueish(hex) {
  const [r,g,b] = hexToRgb(hex);
  return b > 100 && b > r * 1.8 && b > g * 1.5;
}
function isYellowish(hex) {
  const [r,g,b] = hexToRgb(hex);
  return r > 150 && g > 120 && b < Math.min(r, g) * 0.4;
}

const MODE_CONFIG = {
  'red-green': {
    A: { fn: isRedish,   mark: 'red',    letter: 'R', bg: '#dc3545', shape: '50%' },
    B: { fn: isGreenish, mark: 'green',  letter: 'G', bg: '#198754', shape: '3px'  }
  },
  tritanopia: {
    A: { fn: isBlueish,   mark: 'blue',   letter: 'B', bg: '#0d6efd', shape: '3px'  },
    B: { fn: isYellowish, mark: 'yellow', letter: 'Y', bg: '#ffc107', shape: '50%', textColor: '#000' }
  }
};
// aliases para retrocompatibilidade
MODE_CONFIG.deuteranopia = MODE_CONFIG['red-green'];
MODE_CONFIG.protanopia   = MODE_CONFIG['red-green'];

let activeMode = 'red-green';

function isRedGreenPair(textHex, bgHex) {
  if (!textHex || !bgHex) return false;
  try {
    return (isRedish(textHex) && isGreenish(bgHex)) || (isGreenish(textHex) && isRedish(bgHex));
  } catch (e) { return false; }
}

// Paleta segura preferida
const SAFE_PALETTE = ['#000000','#ffffff','#0087be','#ffd700','#ff4500','#228b22','#4169e1'];

function bestContrastAgainst(bgHex) {
  let best = SAFE_PALETTE[0];
  let bestRatio = 0;
  SAFE_PALETTE.forEach(c => {
    const r = contrastRatio(c, bgHex);
    if (r > bestRatio) { bestRatio = r; best = c; }
  });
  return best;
}

async function adaptarPagina(mode) {
  const requestedMode = mode || 'deuteranopia';
  const normalizedMode = MODE_CONFIG[requestedMode] ? requestedMode : 'deuteranopia';

  if (adaptacaoAtiva) {
    if (activeMode === normalizedMode) {
      mostrarMensagem('Adaptação já ativa', 'sucesso');
      return { ok: true };
    }

    // Troca de modo: limpa marcacoes atuais e reaplica no novo modo.
    resetarCores(true);
  }
  activeMode = normalizedMode;
  const modeCfg = MODE_CONFIG[activeMode] || MODE_CONFIG.deuteranopia;

  const todosElementos = Array.from(document.querySelectorAll('body *'));
  const elementos = [];
  const dados = [];

  // Filtra apenas elementos com cores problemáticas para o modo ativo
  todosElementos.forEach(el => {
    try {
      // Ignora elementos sem área visível
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

      const estilo = window.getComputedStyle(el);

      // Background-color PRÓPRIO do elemento (sem traversal para evitar falsos positivos por herança)
      const ownBg = estilo.backgroundColor;
      const backgroundHex = (ownBg && ownBg !== 'rgba(0, 0, 0, 0)') ? (parseRgbString(ownBg) || null) : null;

      // Cor do texto: só considera se o elemento tem texto direto (não herança de container)
      const hasDirectText = Array.from(el.childNodes).some(
        n => n.nodeType === 3 && n.textContent.trim().length > 0
      );
      const colorHex = hasDirectText ? parseRgbString(estilo.color) : null;

      const bgIsProblematic = backgroundHex && (modeCfg.A.fn(backgroundHex) || modeCfg.B.fn(backgroundHex));
      const colorIsProblematic = colorHex && (modeCfg.A.fn(colorHex) || modeCfg.B.fn(colorHex));
      if (!bgIsProblematic && !colorIsProblematic) return;

      if (!coresOriginais.has(el)) {
        const originalStyle = el.getAttribute && el.getAttribute('style');
        coresOriginais.set(el, { originalStyle, color: estilo.color, background: ownBg });
      }

      if (!el.dataset.adidId) el.dataset.adidId = 'adid-' + (++window.__ADID_COUNTER);
      elementos.push(el);
      dados.push({ id: el.dataset.adidId, color: colorHex || '#000000', background: backgroundHex || '#000000', redGreenPair: true });
    } catch (e) { /* ignorar elementos que lancem */ }
  });

  if (dados.length === 0) {
    injectStylesAndLegend();
    adaptacaoAtiva = true;
    mostrarMensagem('Nenhuma cor problemática encontrada na página', 'sucesso');
    return { ok: true };
  }

  handleAdaptResponse({ ok: true, resultado: { cores: [] } });
  return { ok: true };

  function handleAdaptResponse(resp) {
    // Marca elementos com base nas cores originais capturadas no cliente
    let marked = 0;
    dados.forEach((d, i) => {
      try {
        const el = elementos[i];
        if (!el) return;
        if (modeCfg.A.fn(d.color) || modeCfg.A.fn(d.background)) { markElement(el, modeCfg.A); marked++; }
        else if (modeCfg.B.fn(d.color) || modeCfg.B.fn(d.background)) { markElement(el, modeCfg.B); marked++; }
      } catch(e) {}
    });
    injectStylesAndLegend();
    adaptacaoAtiva = true;
    mostrarMensagem('Modo acessível ativado', 'sucesso');
  }
}

function resetarCores(silent = false) {
  coresOriginais.forEach((cores, el) => {
    try {
      if (cores && cores.originalStyle != null) el.setAttribute('style', cores.originalStyle);
      else el.removeAttribute && el.removeAttribute('style');
    } catch (e) {}
    try {
      ['adid-underline','adid-mark-red','adid-mark-green','adid-mark-blue','adid-mark-yellow'].forEach(c => el.classList.remove(c));
      el.removeAttribute && el.removeAttribute('data-adid-mark');
      el.removeAttribute && el.removeAttribute('data-adid-id');
    } catch(e){}
  });
  coresOriginais.clear();
  clearBadges();
  adaptacaoAtiva = false;
  removeStylesAndLegend();
  if (!silent) mostrarMensagem('Cores resetadas', 'sucesso');
  return { ok: true };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('ADID received message in content_script (browser_extension):', msg);
  if (msg && msg.action === 'adapt') {
    adaptarPagina(msg.mode || 'deuteranopia').then(r => sendResponse(r));
    return true;
  }
  if (msg && msg.action === 'reset') {
    const r = resetarCores();
    sendResponse(r);
    return false;
  }
});

}
