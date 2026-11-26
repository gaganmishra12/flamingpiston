/* FlamingPiston homepage (Phase 1): lead carousel and car finder.
   The masthead (dropdowns, drawer), search, back-to-top and card dates live in fp.js. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Lead carousel ---------- */
  var lead = $('#fpLead');
  if (lead) {
    var slides = $$('.hl-slide', lead), dots = $$('.hl-dots button', lead), pause = $('#hlPause'), cur = 0, timer = null;
    var userStopped = reduced, hovering = false, focused = false;
    var interval = +lead.getAttribute('data-interval') || 8000;
    var show = function (i, focusDot) {
      i = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        $$('.hl-text a', s).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === i ? 'true' : 'false'); d.tabIndex = k === i ? 0 : -1; });
      if (focusDot && dots[i]) dots[i].focus();
      cur = i;
    };
    var tick = function () { clearTimeout(timer); if (!userStopped && !hovering && !focused && slides.length > 1 && !doc.hidden) timer = setTimeout(function () { show(cur + 1); tick(); }, interval); };
    var state = function () { lead.classList.toggle('is-stopped', userStopped); if (pause) { pause.setAttribute('aria-pressed', userStopped ? 'true' : 'false'); pause.setAttribute('aria-label', userStopped ? 'Play rotation' : 'Pause rotation'); } tick(); };
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { show(k); tick(); });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
        if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        if (e.key === 'End') { e.preventDefault(); show(slides.length - 1, true); }
      });
    });
    if (pause) pause.addEventListener('click', function () { userStopped = !userStopped; state(); });
    lead.addEventListener('mouseenter', function () { hovering = true; tick(); });
    lead.addEventListener('mouseleave', function () { hovering = false; tick(); });
    lead.addEventListener('focusin', function () { focused = true; tick(); });
    lead.addEventListener('focusout', function (e) { if (!lead.contains(e.relatedTarget)) { focused = false; tick(); } });
    doc.addEventListener('visibilitychange', tick);
    var x0 = null;
    lead.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lead.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { show(cur + (dx < 0 ? 1 : -1)); tick(); } x0 = null; });
    // warm the next slide's image after load
    window.addEventListener('load', function () { setTimeout(function () { $$('img[loading="lazy"]', lead).forEach(function (img) { img.loading = 'eager'; }); }, 1200); });
    state();
  }

  /* ---------- 2. Find Your Next Car ---------- */
  var form = $('#fpFinder'), out = $('#fpFinderResults'), dataEl = $('#fpCars');
  if (form && out && dataEl) {
    var cars = [];
    try { cars = JSON.parse(dataEl.textContent); } catch (e) { cars = []; }
    var esc = function (s) { var d = doc.createElement('div'); d.textContent = s; return d.innerHTML; };
    var lakh = function (n) { return n.toFixed(2); };
    var label = function (sel) { return sel.options[sel.selectedIndex].text; };
    var run = function (focus) {
      var b = form.budget.value, body = form.body.value, fuel = form.fuel.value;
      var lo = 0, hi = Infinity;
      if (b) { var p = b.split('-'); lo = +p[0]; hi = +p[1] >= 999 ? Infinity : +p[1]; }
      var hits = cars.filter(function (c) {
        return (!body || c.b === body) && (!fuel || c.f.indexOf(fuel) > -1) && (!b || (c.lo < hi && c.hi >= lo));
      }).sort(function (x, y) { return x.lo - y.lo; });
      var crit = [b && label(form.budget), body && label(form.body), fuel && label(form.fuel)].filter(Boolean).join(', ') || 'any car';
      var html = '<div class="fr-head"><p>' + (hits.length ? hits.length + (hits.length === 1 ? ' car' : ' cars') + ' we’ve assessed match ' + esc(crit) + '.' : 'None of the cars we’ve assessed so far match ' + esc(crit) + '.') +
        '</p><button type="button" id="fpFinderClear">Clear filters</button></div>';
      if (hits.length) {
        html += '<ul class="fr-list">' + hits.map(function (c) {
          var price = c.lo === c.hi ? '₹' + lakh(c.lo) + ' lakh' : '₹' + lakh(c.lo) + '–' + lakh(c.hi) + ' lakh';
          return '<li><a href="' + esc(c.u) + '"><span class="fr-n">' + esc(c.n) + '</span><span class="fr-p">' + price + '</span></a></li>';
        }).join('') + '</ul>';
      } else {
        html += '<p class="fr-note">Try a wider budget or another body or fuel type, or browse <a href="/reviews.html">all reviews and briefs</a>.</p>';
      }
      html += '<p class="fr-note">The finder covers the ' + cars.length + ' cars FlamingPiston has published buyer’s briefs for, and grows as we publish. Prices are ex-showroom ranges from each brief, with the date we checked them; confirm with a dealer.</p>';
      out.innerHTML = html;
      out.hidden = false;
      $('#fpFinderClear').addEventListener('click', function () { form.reset(); out.hidden = true; out.innerHTML = ''; if (history.replaceState) history.replaceState(null, '', location.pathname); form.budget.focus(); });
      if (history.replaceState) {
        var q = ['budget', 'body', 'fuel'].filter(function (k) { return form[k].value; }).map(function (k) { return k + '=' + encodeURIComponent(form[k].value); }).join('&');
        history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + '#fpFinder');
      }
      if (focus) out.setAttribute('tabindex', '-1'), out.focus({ preventScroll: false });
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });
    // restore a shared finder link: /?budget=10-15&body=suv#fpFinder
    var params = new URLSearchParams(location.search), any = false;
    ['budget', 'body', 'fuel'].forEach(function (k) { var v = params.get(k); if (v && form[k].querySelector('option[value="' + v.replace(/"/g, '') + '"]')) { form[k].value = v; any = true; } });
    if (any) run(false);
  }
})();
