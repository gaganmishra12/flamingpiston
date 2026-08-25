// FlamingPiston — GA4 with Google Consent Mode v2
// Measurement ID: G-QE7WZ5DCC6
// GA4 loads immediately with consent denied (cookieless pings record session source).
// Full cookie-based tracking activates only after the user clicks Accept.

(function () {
  var CONSENT_KEY = 'fp_analytics_consent';
  var GA_ID = 'G-QE7WZ5DCC6';

  // 1. Initialize dataLayer and consent defaults BEFORE loading gtag.js
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var stored = localStorage.getItem(CONSENT_KEY);
  var hasConsent = stored === 'granted';

  gtag('consent', 'default', {
    analytics_storage: hasConsent ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  // 2. Load gtag.js immediately — consent mode controls what data is collected
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', GA_ID, {
    send_page_view: true,
    // Preserve organic source even for cookieless (consent-denied) pings
    url_passthrough: true
  });

  // Enable Consent Mode URL passthrough so gclid / source survives without cookies
  gtag('set', 'url_passthrough', true);

  // 3. If already decided, skip banner
  if (stored) return;

  // 4. Show consent banner for first-time visitors
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
      gtag('consent', 'update', { analytics_storage: 'granted' });
      banner.remove();
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
})();
