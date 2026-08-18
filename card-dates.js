// Renders a publish date on every .card that has a data-date="YYYY-MM-DD" attribute.
// Add data-date to any <article class="card" data-date="2026-08-18"> and it picks it up automatically — no other markup needed.
(function () {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatDate(iso) {
    var parts = iso.split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    return MONTHS[m - 1] + ' ' + d + ', ' + y;
  }

  document.querySelectorAll('.card[data-date]').forEach(function (card) {
    var foot = card.querySelector('.card-foot');
    if (!foot || foot.querySelector('.card-date')) return;
    var label = formatDate(card.getAttribute('data-date'));
    if (!label) return;
    var span = document.createElement('span');
    span.className = 'card-date';
    span.textContent = label;
    foot.insertBefore(span, foot.firstChild);
  });
})();
