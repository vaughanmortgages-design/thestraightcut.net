/* Sitewide affiliate outbound-click measurement; never sends visitor personal data. */
(function () {
  'use strict';
  const retailerDomains = [
    ['amazon', 'Amazon'], ['amzn.to', 'Amazon'], ['ebay', 'eBay'],
    ['temu', 'Temu'], ['benable', 'Benable'], ['dhgate', 'DHgate'],
    ['etsy', 'Etsy'], ['gumroad', 'Gumroad'],
    ['dpbolvw.net', 'CJ Affiliate'], ['anrdoezrs.net', 'CJ Affiliate'],
    ['jdoqocy.com', 'CJ Affiliate'], ['tkqlhce.com', 'CJ Affiliate'],
    ['awin1.com', 'Awin'], ['shareasale.com', 'ShareASale'],
    ['impact.com', 'Impact'], ['prf.hn', 'Partnerize'],
    ['booking.com', 'Booking'], ['hotels.com', 'Hotels'],
    ['vrbo.com', 'Vrbo'], ['linksynergy.com', 'Rakuten']
  ];
  function getRetailer(host) {
    const h = host.toLowerCase();
    const item = retailerDomains.find(function (entry) {
      return h === entry[0] || h.endsWith('.' + entry[0]) || h.includes(entry[0] + '.');
    });
    return item ? item[1] : '';
  }
  document.addEventListener('click', function (event) {
    const anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const internal = url.origin === location.origin;
    const affiliateRoute = internal && /^\/go\//.test(url.pathname);
    const rel = (anchor.getAttribute('rel') || '').toLowerCase();
    const retailer = affiliateRoute
      ? (/gumroad/.test(url.pathname) ? 'Gumroad' : 'Etsy')
      : getRetailer(url.hostname);
    if (!affiliateRoute && (internal || (!retailer && !rel.includes('sponsored')))) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        retailer: retailer || url.hostname,
        link_domain: url.hostname,
        source_page: location.pathname
      });
    }
  }, {capture: true});
})();
