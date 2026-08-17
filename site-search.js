/* FlamingPiston Site Search
   Fetches /search-index.json once, then does live client-side filtering.
   No backend, no build step — just keep search-index.json updated when you publish. */

(function () {
  var INDEX_URL = '/search-index.json';
  var indexData = null;
  var activeIndex = -1;
  var currentResults = [];

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  function loadIndex() {
    if (indexData) return Promise.resolve(indexData);
    return fetch(INDEX_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { indexData = data; return data; })
      .catch(function () { indexData = []; return indexData; });
  }

  function score(entry, query) {
    var q = query.toLowerCase();
    var title = entry.title.toLowerCase();
    var car = (entry.car || '').toLowerCase();
    var tags = (entry.tags || []).join(' ').toLowerCase();
    var s = 0;
    if (title.indexOf(q) === 0) s += 100;
    else if (title.indexOf(q) !== -1) s += 60;
    if (car.indexOf(q) !== -1) s += 50;
    if (tags.indexOf(q) !== -1) s += 30;
    return s;
  }

  function runSearch(query) {
    var resultsEl = document.getElementById('fpSearchResults');
    if (!query.trim()) {
      resultsEl.innerHTML = '<div class="fp-search-hint">Search by car name — e.g. "Brezza automatic" or "Nexon"</div>';
      currentResults = [];
      activeIndex = -1;
      return;
    }
    loadIndex().then(function (data) {
      var scored = data
        .map(function (entry) { return { entry: entry, s: score(entry, query) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 8)
        .map(function (r) { return r.entry; });

      currentResults = scored;
      activeIndex = -1;

      if (!scored.length) {
        resultsEl.innerHTML = '<div class="fp-search-empty">No results for "' + escapeHtml(query) + '". Try a different car name.</div>';
        return;
      }

      resultsEl.innerHTML = scored.map(function (entry, i) {
        return '<a href="' + entry.url + '" class="fp-search-result" data-index="' + i + '">' +
          '<span class="fp-search-result-tag" data-type="' + entry.type + '">' + entry.type + '</span>' +
          '<span class="fp-search-result-text">' +
            '<div class="fp-search-result-title">' + escapeHtml(entry.title) + '</div>' +
            (entry.car ? '<div class="fp-search-result-car">' + escapeHtml(entry.car) + '</div>' : '') +
          '</span>' +
        '</a>';
      }).join('');
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setActive(i) {
    var items = document.querySelectorAll('.fp-search-result');
    items.forEach(function (el) { el.classList.remove('is-active'); });
    if (items[i]) {
      items[i].classList.add('is-active');
      items[i].scrollIntoView({ block: 'nearest' });
    }
    activeIndex = i;
  }

  function openSearch() {
    var overlay = document.getElementById('fpSearchOverlay');
    var input = document.getElementById('fpSearchInput');
    overlay.classList.add('is-open');
    input.value = '';
    runSearch('');
    setTimeout(function () { input.focus(); }, 30);
    loadIndex();
  }

  function closeSearch() {
    document.getElementById('fpSearchOverlay').classList.remove('is-open');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var trigger = document.getElementById('fpSearchTrigger');
    var overlay = document.getElementById('fpSearchOverlay');
    var input = document.getElementById('fpSearchInput');
    var closeBtn = document.getElementById('fpSearchClose');

    if (!trigger || !overlay || !input) return;

    trigger.addEventListener('click', openSearch);
    closeBtn.addEventListener('click', closeSearch);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !overlay.classList.contains('is-open')) {
        e.preventDefault();
        openSearch();
      }
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(Math.min(activeIndex + 1, currentResults.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
      }
      if (e.key === 'Enter' && activeIndex >= 0 && currentResults[activeIndex]) {
        window.location.href = currentResults[activeIndex].url;
      }
    });

    input.addEventListener('input', debounce(function () {
      runSearch(input.value);
    }, 120));
  });
})();
