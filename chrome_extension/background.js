// Background service worker for chrome_extension folder
console.log('ADID chrome_extension background worker started');

const DEFAULT_TIMEOUT_MS = 60000;
const ADAPT_URL = 'http://127.0.0.1:5000/adaptar';

function formatError(error) {
  if (!error) return 'erro desconhecido';
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return 'timeout';
  return error.message || String(error);
}

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      const timeoutError = new Error('timeout');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.action !== 'do_fetch_adapt') return;
  console.log('ADID chrome_extension background received message:', msg.action);

  (async () => {
    try {
      const response = await fetchWithTimeout(ADAPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementos: msg.elementos || [], mode: msg.mode || 'deuteranopia' })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('ADID chrome_extension background fetch error status:', response.status, text);
        sendResponse({ ok: false, error: 'Servidor respondeu: ' + response.status + ' - ' + text });
        return;
      }

      const json = await response.json();
      console.log('ADID chrome_extension background fetch success, items=', json.cores && json.cores.length);
      sendResponse({ ok: true, resultado: json });
    } catch (error) {
      const message = formatError(error);
      console.error('ADID chrome_extension background fetch exception:', message, error);
      sendResponse({ ok: false, error: message });
    }
  })();

  return true;
});
