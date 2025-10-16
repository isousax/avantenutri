// Utilitário para carregar o script do Google AdSense apenas quando necessário
// Evita múltiplas inserções e respeita SSR/safe DOM

const ADSENSE_CLIENT = 'ca-pub-1311079139046549';
const SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

let injected = false;

export function ensureAdSenseLoaded() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (injected) return;
  // já existe na página?
  const existing = document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`);
  if (existing) {
    injected = true;
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = SCRIPT_SRC;
  s.crossOrigin = 'anonymous';
  s.onload = () => {
    // opcional: inicialização
    try {
      // @ts-expect-error adsbygoogle ainda não tipado no Window
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* noop */
    }
  };
  document.head.appendChild(s);
  injected = true;
}
