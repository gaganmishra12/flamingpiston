// FlamingPiston — Google Analytics 4 (GA4) with consent gating
// Measurement ID: G-QE7WZ5DCC6

(function () {
  var CONSENT_KEY = 'fp_analytics_consent';
  var stored = localStorage.getItem(CONSENT_KEY);

  // If user has already made a choice, act on it
  if (stored === 'granted') {
    loadGA();
    return;
  }
  if (stored === 'denied') return;

  // Show consent banner
  var banner = document.createElement('div');
  banner.id = 'fpCookieBanner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<div class="fp-cookie-inner">' +
      '<p>We use analytics cookies to understand how you use our site. No personal data is sold or shared with advertisers.</p>' +
      '<div class="fp-cookie-actions">' +
        '<button id="fpCookieAccept" class="fp-cookie-btn fp-cookie-accept">Accept</button>' +
        '<button id="fpCookieDeny" class="fp-cookie-btn fp-cookie-deny">Decline</button>' +
      '</div>' +
    '</div>';

  var style = document.createElement('style');
  style.textContent =
    '#fpCookieBanner{position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#18140F;color:#F4F1EA;padding:16px 20px;font-family:Manrope,system-ui,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 -2px 12px rgba(0,0,0,.15);}' +
    '.fp-cookie-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap;}' +
    '.fp-cookie-inner p{margin:0;flex:1;min-width:240px;}' +
    '.fp-cookie-actions{display:flex;gap:8px;}' +
    '.fp-cookie-btn{padding:8px 20px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;}' +
    '.fp-cookie-accept{background:#F4F1EA;color:#18140F;}' +
    '.fp-cookie-deny{background:transparent;color:#F4F1EA;border:1px solid rgba(244,241,234,.3);}' +
    '.fp-cookie-btn:hover{opacity:.85;}';

  function showBanner() {
    document.head.appendChild(style);
    document.body.appendChild(banner);
    document.getElementById('fpCookieAccept').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'granted');
      banner.remove();
      loadGA();
    });
    document.getElementById('fpCookieDeny').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'denied');
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }

  function loadGA() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QE7WZ5DCC6';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', 'G-QE7WZ5DCC6');
  }
})();
