import { useState, useEffect } from 'react';

const useCookieConsent = () => {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookieConsent');
    setConsent(savedConsent || null);
  }, []);

  const grantConsent = (level = 'essential') => {
    localStorage.setItem('cookieConsent', level || 'essential');
    setConsent(level);

    if (level === 'all') {
      // Inicializar Google Analytics
      window.dataLayer = window.dataLayer || [];
      window.gtag = function (...args) {
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'SEU_ID_ANALYTICS');

      // Inicializar Facebook Pixel
      if (typeof window.fbq !== 'function') {
        (function (f, b, e, v, n, t, s) {
          const fbqFunc = function (...args) {
            if (fbqFunc.callMethod) {
              fbqFunc.callMethod(...args);
            } else {
              fbqFunc.queue.push(args);
            }
          };
          n = fbqFunc;
          if (!f._fbq) f._fbq = fbqFunc;
          fbqFunc.push = fbqFunc;
          fbqFunc.loaded = true;
          fbqFunc.version = '2.0';
          fbqFunc.queue = [];
          t = b.createElement(e);
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          if (s && s.parentNode && t) {
            s.parentNode.insertBefore(t, s);
          }
          f.fbq = fbqFunc;
        })(
          window,
          document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js'
        );
        window.fbq('init', 'SEU_PIXEL_ID');
        window.fbq('track', 'PageView');
      }
    }
  };

  const revokeConsent = () => {
    localStorage.removeItem('cookieConsent');
    setConsent(null);
    window.location.reload();
  };

  return { consent, grantConsent, revokeConsent };
};

export default useCookieConsent;