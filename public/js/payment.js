// CODE BY OisinMccarthy(LEGA11)
/* Payment page — simulated.

   IMPORTANT: no card detail is ever stored or transmitted. The fields are
   validated in the browser, then thrown away when the page unloads. The
   request sent to the server contains only the basket lines and the
   customer's contact details. A real site would hand card entry to a
   provider such as Stripe, which returns a token the server can charge. */
(function () {
  'use strict';

  const form = document.getElementById('payment-form');
  const totalEls = document.querySelectorAll('[data-order-total]');
  const emptyBox = document.getElementById('payment-empty');
  const payButton = document.getElementById('pay-button');

  const details = (function () {
    try { return JSON.parse(sessionStorage.getItem('rs_checkout') || 'null'); }
    catch { return null; }
  })();

  // Arriving here directly, or after the basket emptied, is a dead end.
  if (Basket.isEmpty() || !details) {
    form.hidden = true;
    emptyBox.hidden = false;
    document.getElementById('payment-summary').hidden = true;
    return;
  }

  /* ---------- summary ---------- */

  function renderSummary() {
    const totals = Basket.totals();
    totalEls.forEach(el => { el.textContent = Basket.formatPrice(totals.totalCents); });

    const list = document.getElementById('payment-lines');
    list.innerHTML = '';
    Basket.lines().forEach(item => {
      const row = document.createElement('div');
      row.className = 'line';
      const left = document.createElement('span');
      left.textContent = item.quantity + ' \u00D7 ' + item.typeName;
      const right = document.createElement('span');
      right.textContent = Basket.formatPrice(item.priceCents * item.quantity);
      row.append(left, right);
      list.appendChild(row);
    });

    [['Subtotal', totals.subtotalCents, ''],
     ['Booking fee', totals.feeCents, ''],
     ['Total', totals.totalCents, 'line-total']].forEach(([label, cents, cls]) => {
      const row = document.createElement('div');
      row.className = 'line' + (cls ? ' ' + cls : '');
      const left = document.createElement('span');
      left.textContent = label;
      const right = document.createElement('span');
      right.textContent = Basket.formatPrice(cents);
      row.append(left, right);
      list.appendChild(row);
    });

    document.getElementById('payment-name').textContent =
      details.firstName + ' ' + details.lastName + ' \u00B7 ' + details.email;
  }

  /* ---------- input formatting ---------- */

  const cardInput = document.getElementById('pay-card');
  const expiryInput = document.getElementById('pay-expiry');
  const cvvInput = document.getElementById('pay-cvv');

  // Group digits in fours as they type; easier to read and to check.
  cardInput.addEventListener('input', () => {
    const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
    cardInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
  });

  // Insert the slash automatically, and never let them type a third digit.
  expiryInput.addEventListener('input', () => {
    const digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
    expiryInput.value = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
  });

  cvvInput.addEventListener('input', () => {
    cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 3);
  });

  /* ---------- validation ---------- */

  function expiryError(value) {
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return 'Use the format MM/YY.';

    const month = parseInt(match[1], 10);
    const year = 2000 + parseInt(match[2], 10);
    if (month < 1 || month > 12) return 'Month must be between 01 and 12.';

    // A card is valid through the last day of its expiry month.
    const expires = new Date(year, month, 1);
    if (expires <= new Date()) return 'That card has expired.';
    return '';
  }

  const rules = {
    name: value => value.trim().length >= 2 ? '' : 'Enter the name printed on the card.',
    card: value => {
      const digits = value.replace(/\D/g, '');
      if (digits.length === 0) return 'Enter your card number.';
      return digits.length === 16 ? '' : 'Card number must be 16 digits.';
    },
    expiry: expiryError,
    cvv: value => /^\d{3}$/.test(value) ? '' : 'CVV must be 3 digits.',
    address: value => value.trim().length >= 5 ? '' : 'Enter your billing address.'
  };

  function validateField(field) {
    const input = document.getElementById('pay-' + field);
    const errorEl = document.getElementById('error-pay-' + field);
    const message = rules[field](input.value);
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  Object.keys(rules).forEach(field => {
    const input = document.getElementById('pay-' + field);
    input.addEventListener('blur', () => validateField(field));
    input.addEventListener('input', () => {
      if (document.getElementById('error-pay-' + field).textContent) validateField(field);
    });
  });

  /* ---------- submit ---------- */

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      Site.toast('Check the highlighted payment fields.', 'error');
      document.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    if (Basket.isEmpty()) {
      Site.toast('Your basket is empty.', 'error');
      window.location.href = 'basket.html';
      return;
    }

    const loggedIn = await Site.requireLogin('Log in to finish your booking.');
    if (!loggedIn) return;

    payButton.disabled = true;
    payButton.textContent = 'Processing…';

    // The card fields stop here. Only items and contact details are sent.
    const result = await Site.apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: details,
        items: Basket.lines().map(l => ({
          eventId: l.eventId,
          typeId: l.typeId,
          quantity: l.quantity
        }))
      })
    });

    payButton.disabled = false;
    payButton.textContent = 'Pay ' + Basket.formatPrice(Basket.totals().totalCents);

    if (!result.ok) {
      Site.toast(result.body.error || 'Payment could not be completed.', 'error');
      return;
    }

    // Booked. Clear the basket and the saved details, keep the reference.
    sessionStorage.setItem('rs_last_order', result.body.order.reference);
    sessionStorage.removeItem('rs_checkout');
    Basket.clear();
    window.location.href = 'confirmation.html';
  });

  renderSummary();
  payButton.textContent = 'Pay ' + Basket.formatPrice(Basket.totals().totalCents);
})();
// CODE BY OisinMccarthy(LEGA11)
