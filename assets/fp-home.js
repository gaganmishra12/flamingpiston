/* FlamingPiston homepage (Phase 1): car finder. The lead story is static (no carousel since the Nov 2026 refinement).
   The masthead (dropdowns, drawer), search, back-to-top and card dates live in fp.js. */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };

  /* ---------- 1. Find Your Next Car ---------- */
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
