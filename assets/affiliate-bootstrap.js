/* Reuses the site's existing GA4 property; loaded by both current and legacy templates. */
(function () {
  'use strict';
  if (window.__tscAnalyticsBootstrapped) return;
  window.__tscAnalyticsBootstrapped = true;
  const id = 'G-4JLT5L2ZD5';
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      document.head.appendChild(s);
    }
  }
  if (!document.querySelector('script[src*="/assets/affiliate-clicks.js"]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/assets/affiliate-clicks.js';
    document.head.appendChild(script);
  }
})();
