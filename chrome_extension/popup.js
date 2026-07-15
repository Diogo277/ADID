const MODES = {
  'red-green': {
    desc: 'Deuteranopia e Protanopia — cegueira ao <strong>verde</strong> ou ao <strong>vermelho</strong>. Ambas confundem cores <strong style="color:#dc3545">vermelhas</strong> e <strong style="color:#198754">verdes</strong> entre si.',
    colors: [
      { letter: 'R', bg: '#dc3545', shape: '50%',  label: 'Red \u2014 vermelho' },
      { letter: 'G', bg: '#198754', shape: '3px',   label: 'Green \u2014 verde'  }
    ],
    btnClass: 'btn btn-rg',
    btnLabel: 'Adaptar \u2014 Vermelho/Verde'
  },
  tritanopia: {
    desc: 'Tritanopia \u2014 cegueira ao <strong>azul</strong>. Confunde cores <strong style="color:#0d6efd">azuis</strong> e <strong style="color:#b8860b">amarelas</strong> entre si.',
    colors: [
      { letter: 'B', bg: '#0d6efd', shape: '3px',  label: 'Blue \u2014 azul'     },
      { letter: 'Y', bg: '#ffc107', shape: '50%',   label: 'Yellow \u2014 amarelo', textColor: '#000' }
    ],
    btnClass: 'btn btn-t',
    btnLabel: 'Adaptar \u2014 Azul/Amarelo'
  }
};

let currentMode = 'red-green';

function renderMode(mode) {
  const m = MODES[mode];
  document.getElementById('mode-desc').innerHTML = m.desc;
  document.getElementById('legend').innerHTML = m.colors.map(c => `
    <div class="legend-item">
      <div class="badge-demo" style="background:${c.bg};border-radius:${c.shape};${c.textColor ? 'color:' + c.textColor : ''}">${c.letter}</div>
      <span>${c.label}</span>
    </div>
  `).join('');
  const btn = document.getElementById('adapt');
  btn.className = m.btnClass;
  btn.textContent = m.btnLabel;
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentMode = tab.dataset.mode;
    renderMode(currentMode);
  });
});

renderMode(currentMode);

function queryTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs && tabs[0]));
  });
}
function isPageAllowed(url) {
  return url && !url.startsWith('chrome://') && !url.startsWith('edge://') &&
         !url.startsWith('about:') && !url.startsWith('chrome-extension://');
}
function executeScript(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({ target: { tabId }, files }, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}
function sendMessageToTab(tabId, message) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, message, resp => {
      const err = chrome.runtime.lastError;
      resolve(err ? { ok: false, error: err.message } : (resp || { ok: false, error: 'sem resposta' }));
    });
  });
}
async function ensureAndSend(tab, action) {
  if (!tab) return;
  const url = tab.url || '';
  if (!isPageAllowed(url)) { alert('Nao e possivel injetar scripts em paginas do navegador. Abra uma pagina web e tente novamente.'); return; }
  if (url.startsWith('file://')) { alert('Esta aba e um arquivo local. Habilite "Allow access to file URLs" em chrome://extensions.'); return; }
  try { await executeScript(tab.id, ['content_script.js']); } catch (err) { alert('Erro ao injetar script: ' + err.message); return; }
  const resp = await sendMessageToTab(tab.id, { action, mode: currentMode });
  if (resp && !resp.ok) alert('Erro: ' + (resp.error || 'sem resposta'));
}
document.getElementById('adapt').addEventListener('click', async () => { ensureAndSend(await queryTab(), 'adapt'); });
document.getElementById('reset').addEventListener('click', async () => { ensureAndSend(await queryTab(), 'reset'); });
