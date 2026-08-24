// card-dates.js
// 1. Renders publish dates on every .card with data-date
// 2. Sorts the "Latest" section by date (newest first)
// 3. Updates the hero "Read the latest review" CTA to the most recent review

(function () {
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatDate(iso) {
    var parts = iso.split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    return MONTHS[m - 1] + ' ' + d + ', ' + y;
  }

  // Render dates
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

  // Sort Latest section by data-date descending
  var row = document.getElementById('latestReviewsRow');
  if (row) {
    var cards = Array.prototype.slice.call(row.querySelectorAll('.card[data-date]'));
    cards.sort(function (a, b) {
      return b.getAttribute('data-date').localeCompare(a.getAttribute('data-date'));
    });
    cards.forEach(function (card) { row.appendChild(card); });
  }

  // Update hero CTA to point to the most recent review
  // Reviews are identified by: URL starts with "reviews/" AND tag is NOT "Comparison"
  var cta = document.getElementById('latestReviewCta');
  if (cta && row) {
    var allCards = Array.prototype.slice.call(row.querySelectorAll('.card[data-date]'));
    allCards.sort(function (a, b) {
      return b.getAttribute('data-date').localeCompare(a.getAttribute('data-date'));
    });
    for (var i = 0; i < allCards.length; i++) {
      var link = allCards[i].querySelector('.card-media');
      if (!link) continue;
      var href = link.getAttribute('href') || '';
      var tag = allCards[i].querySelector('.tag');
      var tagText = tag ? tag.textContent.trim().toLowerCase() : '';
      if (href.indexOf('reviews/') === 0 && tagText !== 'comparison') {
        cta.setAttribute('href', href);
        break;
      }
    }
  }
})();
