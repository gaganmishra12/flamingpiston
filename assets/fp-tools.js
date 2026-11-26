/* FlamingPiston buying tools: EMI, fuel cost, petrol vs CNG, ownership cost.
   Pure arithmetic on the numbers the reader enters; nothing is sent anywhere. */
(function () {
  'use strict';
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var num = function (f, k) { var v = parseFloat(f.elements[k].value); return isFinite(v) ? v : 0; };
  var row = function (k, v) { return '<dt>' + k + '</dt><dd>' + v + '</dd>'; };
  function emi(P, ratePct, months) {
    if (P <= 0 || months <= 0) return 0;
    var r = ratePct / 1200;
    if (r === 0) return P / months;
    var x = Math.pow(1 + r, months);
    return P * r * x / (x - 1);
  }
  var calcs = {
    emi: function (f) {
      var loan = Math.max(0, num(f, 'price') - num(f, 'down')), n = Math.round(num(f, 'years') * 12), m = emi(loan, num(f, 'rate'), n);
      if (!loan) return '<p class="lbl">Monthly EMI</p><p class="big">₹0</p><p class="warn">The down payment covers the whole price, so there is no loan.</p>';
      return '<p class="lbl">Monthly EMI</p><p class="big">' + inr(m) + '</p><dl>' +
        row('Loan amount', inr(loan)) + row('Months', n) + row('Total interest', inr(m * n - loan)) + row('Total you repay', inr(m * n)) + '</dl>';
    },
    fuel: function (f) {
      var km = num(f, 'km'), mil = num(f, 'mileage'), p = num(f, 'price');
      if (mil <= 0) return '<p class="warn">Enter a mileage above zero.</p>';
      var month = km / mil * p;
      return '<p class="lbl">Fuel cost per month</p><p class="big">' + inr(month) + '</p><dl>' +
        row('Per year', inr(month * 12)) + row('Per km', '₹' + (p / mil).toFixed(2)) + row('Fuel used per month', (km / mil).toFixed(1)) + '</dl>';
    },
    cng: function (f) {
      var km = num(f, 'km'), pm = num(f, 'pm'), cm = num(f, 'cm');
      if (pm <= 0 || cm <= 0) return '<p class="warn">Enter both mileage figures above zero.</p>';
      var petrol = km / pm * num(f, 'pp'), cng = km / cm * num(f, 'cp'), save = petrol - cng, prem = num(f, 'premium');
      var out = '<p class="lbl">Monthly saving with CNG</p><p class="big">' + inr(save) + '</p><dl>' +
        row('Petrol per month', inr(petrol)) + row('CNG per month', inr(cng)) + row('Saving per year', inr(save * 12));
      if (save > 0 && prem > 0) {
        var months = prem / save;
        out += row('Pays back the extra price in', months < 1 ? 'under a month' : (Math.ceil(months) + ' months (about ' + Math.round(months * km).toLocaleString('en-IN') + ' km)'));
      }
      out += '</dl>';
      if (save <= 0) out += '<p class="warn">With these numbers CNG costs more to run than petrol, so it never pays back.</p>';
      return out;
    },
    ownership: function (f) {
      var price = num(f, 'price'), down = Math.min(num(f, 'down'), price), years = Math.max(1, num(f, 'years'));
      var loan = price - down, n = Math.round(num(f, 'loanYears') * 12), m = emi(loan, num(f, 'rate'), n), interest = loan > 0 ? m * n - loan : 0;
      var mil = num(f, 'mileage'), fuel = mil > 0 ? num(f, 'km') / mil * num(f, 'fuel') * years : 0;
      var ins = num(f, 'ins') * years, svc = num(f, 'service') * years, total = price + interest + fuel + ins + svc;
      var out = '<p class="lbl">Estimated cost over ' + years + (years === 1 ? ' year' : ' years') + '</p><p class="big">' + inr(total) + '</p><dl>' +
        row('Car (on-road)', inr(price)) + row('Loan interest', inr(interest)) + row('Fuel', inr(fuel)) + row('Insurance', inr(ins)) + row('Servicing', inr(svc)) +
        row('Average per month', inr(total / (years * 12))) + '</dl>';
      if (n / 12 > years) out += '<p class="warn">The loan runs longer than the years you entered; interest is counted for the whole loan.</p>';
      return out + '<p class="warn" style="color:var(--on-dark-2)">Excludes depreciation, tyres, repairs, parking and tolls.</p>';
    }
  };
  Array.prototype.forEach.call(document.querySelectorAll('form[data-calc]'), function (f) {
    var key = f.getAttribute('data-calc'), out = document.querySelector('[data-out="' + key + '"]');
    var run = function () { out.innerHTML = calcs[key](f); };
    f.addEventListener('input', run);
    f.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    run();
  });
})();
