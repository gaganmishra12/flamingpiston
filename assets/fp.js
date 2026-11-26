/* FlamingPiston — site behaviour (every page)
   Masthead dropdowns + drawer, back-to-top, card dates, letterboxing, tables, listing filters, article
   helpers and search. Homepage-only behaviour (carousel, car finder) is in fp-home.js. No dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement.getAttribute('data-root') || '/';
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  /* ---------- 1. Masthead: Cars / Tools dropdowns (global header, Phase 2A) ---------- */
  var dds = $$('.mh-dd-btn');
  function closeAll(except) {
    dds.forEach(function (b) { if (b !== except) { b.setAttribute('aria-expanded', 'false'); $('#' + b.getAttribute('aria-controls')).classList.remove('is-open'); } });
  }
  dds.forEach(function (b) {
    var menu = $('#' + b.getAttribute('aria-controls')), li = b.parentNode, t;
    function set(open) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); menu.classList.toggle('is-open', open); }
    var hoverAt = 0;
    b.addEventListener('click', function () { if (Date.now() - hoverAt < 600) { hoverAt = 0; return; } var open = b.getAttribute('aria-expanded') !== 'true'; closeAll(b); set(open); if (open) { var f = $('a', menu); if (f && b.dataset.kb) f.focus(); } b.dataset.kb = ''; });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { b.dataset.kb = '1'; hoverAt = 0; if (e.key === 'ArrowDown') { e.preventDefault(); if (b.getAttribute('aria-expanded') === 'true') { var f = $('a', menu); if (f) f.focus(); } else b.click(); } } });
    li.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) { clearTimeout(t); if (b.getAttribute('aria-expanded') !== 'true') hoverAt = Date.now(); closeAll(b); set(true); } });
    li.addEventListener('mouseleave', function () { hoverAt = 0; if (window.matchMedia('(hover: hover)').matches) { t = setTimeout(function () { set(false); }, 150); } });
    menu.addEventListener('keydown', function (e) {
      var links = $$('a', menu), i = links.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
    });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) set(false); });
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.has-dd')) closeAll(); });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = dds.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    if (open) { closeAll(); open.focus(); }
  });

  /* ---------- 1b. Masthead: menu drawer (≤1279px) ---------- */
  var mhMenuBtn = $('#fpMenuBtn'), mhDrawer = $('#fpDrawer'), mhCloseBtn = $('#fpMenuClose');
  if (mhMenuBtn && mhDrawer) {
    var setMhDrawer = function (open) {
      mhDrawer.hidden = !open;
      mhMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.classList.toggle('drawer-open', open);
      if (open) mhCloseBtn.focus(); else mhMenuBtn.focus();
    };
    mhMenuBtn.addEventListener('click', function () { setMhDrawer(true); });
    mhCloseBtn.addEventListener('click', function () { setMhDrawer(false); });
    mhDrawer.addEventListener('click', function (e) { if (e.target === mhDrawer) setMhDrawer(false); });
    $$('a', mhDrawer).forEach(function (a) { a.addEventListener('click', function () { mhDrawer.hidden = true; doc.body.classList.remove('drawer-open'); mhMenuBtn.setAttribute('aria-expanded', 'false'); }); });
    mhDrawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setMhDrawer(false); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a, button', mhDrawer), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- 2. Back to top ---------- */
  var top = $('#backToTop');
  if (top) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { top.classList.toggle('is-visible', window.scrollY > 900); ticking = false; });
    }, { passive: true });
    top.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 3. Card dates: "Today / Yesterday / 3 days ago" + New marker (≤ 3 days) ---------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var now = new Date(); var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  function label(iso) {
    var p = iso.split('-'); if (p.length !== 3) return null;
    var t = Date.UTC(+p[0], +p[1] - 1, +p[2]); var days = Math.round((today - t) / 864e5);
    var abs = MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
    var rel = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : (days > 1 && days < 7) ? days + ' days ago' : abs;
    return { abs: abs, rel: rel, isNew: days >= 0 && days <= 3, iso: iso };
  }
  $$('.card[data-date]').forEach(function (card) {
    var foot = $('.card-foot', card); if (!foot || $('.card-date', foot)) return;
    var l = label(card.getAttribute('data-date')); if (!l) return;
    var t = doc.createElement('time'); t.className = 'card-date'; t.dateTime = l.iso; t.textContent = l.rel; if (l.rel !== l.abs) t.title = l.abs;
    foot.insertBefore(t, foot.firstChild);
    if (l.isNew) { var n = doc.createElement('span'); n.className = 'card-new'; n.textContent = 'New'; foot.insertBefore(n, foot.firstChild); }
  });

  /* ---------- 4. Images: letterbox anything that is not ~16:9 instead of cropping baked-in text ---------- */
  $$('.card-media img, main.content > .hero-image').forEach(function (img) {
    function check(w, h) { if (w && h && Math.abs(w / h - 16 / 9) > 0.04) img.classList.add('is-letterbox'); }
    var w = +img.getAttribute('width'), h = +img.getAttribute('height');
    if (w && h) check(w, h); else if (img.complete) check(img.naturalWidth, img.naturalHeight);
    else img.addEventListener('load', function () { check(img.naturalWidth, img.naturalHeight); });
  });

  /* ---------- 5. Tables: wrap for horizontal scroll on small screens ---------- */
  $$('main.content table').forEach(function (t) {
    if (t.parentNode.classList.contains('table-scroll')) return;
    var w = doc.createElement('div'); w.className = 'table-scroll'; w.tabIndex = 0;
    w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Scrollable table');
    t.parentNode.insertBefore(w, t); w.appendChild(t);
    var cols = t.rows[0] ? t.rows[0].cells.length : 0; if (cols <= 3) w.classList.add('fits');
  });

  /* ---------- 6. Listing pages: featured first card only when unfiltered ---------- */
  $$('.review-row.has-lead, .card-grid.has-lead').forEach(function (grid) {
    function sync() { var f = (location.hash || '').replace('#', ''); grid.classList.toggle('has-lead', !f || f === 'all'); }
    window.addEventListener('hashchange', sync);
    $$('.chip').forEach(function (c) { c.addEventListener('click', function () { setTimeout(sync, 0); }); });
    sync();
  });

  /* ---------- 6b. Paragraphs that are entirely one italic note (e.g. "Sources: …") get a quiet style ---------- */
  $$('main.content > p').forEach(function (p) {
    var em = p.children.length === 1 && p.firstElementChild.tagName === 'EM' ? p.firstElementChild : null;
    if (em && p.textContent.trim() === em.textContent.trim()) p.classList.add('note-line');
  });

  $$('main.content p').forEach(function (p) {   /* Q&A written as <strong>Question</strong><br>Answer */
    var n = p.firstChild; while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling;
    if (!n || n.tagName !== 'STRONG') return;
    var b = n.nextSibling; while (b && b.nodeType === 3 && !b.textContent.trim()) b = b.nextSibling;
    if (b && b.tagName === 'BR') { p.classList.add('qa'); b.classList.add('qa-br'); }
  });

  /* ---------- 7. Search (same scoring as site-search.js; adds loading + type label + footer hints) ---------- */
  var overlay = $('#fpSearchOverlay'), input = $('#fpSearchInput'), results = $('#fpSearchResults'), trig = $('#fpSearchTrigger'), closeBtn = $('#fpSearchClose');
  if (!overlay || !input) return;
  var data = null, active = -1, current = [], lastFocus = null;
  function load() {
    if (data) return Promise.resolve(data);
    if (window.FP_INDEX) { data = window.FP_INDEX; return Promise.resolve(data); }
    return fetch(root + 'search-index.json').then(function (r) { return r.json(); }).then(function (d) { data = d; return d; }).catch(function () { data = []; return data; });
  }
  function score(e, q) {
    q = q.toLowerCase(); var t = e.title.toLowerCase(), c = (e.car || '').toLowerCase(), g = (e.tags || []).join(' ').toLowerCase(), s = 0;
    if (t.indexOf(q) === 0) s += 100; else if (t.indexOf(q) !== -1) s += 60;
    if (c.indexOf(q) !== -1) s += 50; if (g.indexOf(q) !== -1) s += 30; return s;
  }
  function esc(s) { var d = doc.createElement('div'); d.textContent = s; return d.innerHTML; }
  function href(u) { if (root === '/' || !/^\//.test(u)) return u; u = u.slice(1); if (u === '' || /\/$/.test(u)) u += 'index.html'; return root + u; }
  var TYPES = { brief: 'Buyer’s Brief', review: 'Buyer’s Brief', news: 'News', guide: 'Guide', comparison: 'Comparison', article: 'Explainer' };
  function render(q) {
    if (!q.trim()) { results.innerHTML = '<div class="fp-search-hint">Search by car or topic, e.g. <b>Brezza automatic</b>, <b>Nexon</b>, <b>Bharat NCAP</b></div>'; current = []; active = -1; return; }
    if (!data) results.innerHTML = '<div class="fp-search-loading">Loading the index…</div>';
    load().then(function (d) {
      current = d.map(function (e) { return { e: e, s: score(e, q) }; }).filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (r) { return r.e; });
      active = -1;
      if (!current.length) { results.innerHTML = '<div class="fp-search-empty">Nothing matches “' + esc(q) + '”. Try a model name such as <b>Seltos</b> or a topic such as <b>CNG</b>.</div>'; return; }
      results.innerHTML = current.map(function (e, i) {
        var ty = TYPES[(e.type || '').toLowerCase()] || e.type || '';
        return '<a href="' + esc(href(e.url)) + '" class="fp-search-result" data-index="' + i + '"><span class="fp-search-result-tag">' + esc(ty) + '</span><span class="fp-search-result-text"><span class="fp-search-result-title">' + esc(e.title) + '</span>' + (e.car ? '<span class="fp-search-result-car">' + esc(e.car) + '</span>' : '') + '</span></a>';
      }).join('');
    });
  }
  function setActive(i) { var it = $$('.fp-search-result', results); it.forEach(function (el) { el.classList.remove('is-active'); }); if (it[i]) { it[i].classList.add('is-active'); it[i].scrollIntoView({ block: 'nearest' }); } active = i; }
  function open() { lastFocus = doc.activeElement; overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false'); input.value = ''; render(''); setTimeout(function () { input.focus(); }, 30); load(); doc.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); doc.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  window.fpSearch = { open: open, close: close, render: function (q) { input.value = q; render(q); } };
  if (trig) trig.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  var timer; input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { render(input.value); }, 120); });
  doc.addEventListener('keydown', function (e) {
    var isOpen = overlay.classList.contains('is-open');
    if (e.key === '/' && !isOpen && !/input|textarea|select/i.test((doc.activeElement || {}).tagName || '')) { e.preventDefault(); open(); return; }
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(active + 1, current.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0 && current[active]) { location.href = href(current[active].url); }
    else if (e.key === 'Tab') { /* keep focus inside the dialog */
      var f = $$('input, button, a', overlay); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
