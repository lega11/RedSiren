// CODE BY OisinMccarthy(LEGA11)
/* Checkout: collect customer details, show the order summary, and hold the
   details in sessionStorage so the payment page can pick them up. */
(function () {
  'use strict';

  const form = document.getElementById('checkout-form');
  const summary = document.getElementById('checkout-summary');
  const emptyBox = document.getElementById('checkout-empty');

  // If the basket emptied (another tab, or a back-button return), there is
  // nothing to check out — say so instead of showing a dead form.
  if (Basket.isEmpty()) {
    form.hidden = true;
    summary.hidden = true;
    emptyBox.hidden = false;
    return;
  }

  /* ---------- order summary ---------- */

  function renderSummary() {
    const totals = Basket.totals();
    summary.innerHTML = '<h2 style="font-size:1.3rem">Order summary</h2>';

    Basket.groupedByEvent().forEach(group => {
      const heading = document.createElement('h3');
      heading.style.fontSize = '1rem';
      heading.style.marginTop = '1rem';
      heading.textContent = group.eventName;
      summary.appendChild(heading);

      const date = document.createElement('p');
      date.className = 'muted';
      date.style.fontSize = '.8rem';
      date.style.margin = '0 0 .4rem';
      date.textContent = Events.shortDate(group.eventDate) + ' \u00B7 ' + group.venue;
      summary.appendChild(date);

      group.lines.forEach(item => {
        const row = document.createElement('div');
        row.className = 'line';
        const left = document.createElement('span');
        left.textContent = item.quantity + ' \u00D7 ' + item.typeName;
        const right = document.createElement('span');
        right.textContent = Basket.formatPrice(item.priceCents * item.quantity);
        row.append(left, right);
        summary.appendChild(row);
      });
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
      summary.appendChild(row);
    });
  }

  /* ---------- validation ---------- */

  const rules = {
    firstName: value => value.trim() ? '' : 'Enter your first name.',
    lastName: value => value.trim() ? '' : 'Enter your last name.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? '' : 'Enter a valid email address, e.g. you@example.com.',
    // Irish numbers with or without spaces; 7 to 15 digits covers international too.
    phone: value => {
      const digits = value.replace(/[^\d]/g, '');
      if (!digits) return 'Enter a contact phone number.';
      return digits.length >= 7 && digits.length <= 15 ? '' : 'Enter a phone number between 7 and 15 digits.';
    }
  };

  function showError(field, message) {
    const input = document.getElementById('checkout-' + field);
    const errorEl = document.getElementById('error-' + field);
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  function validateField(field) {
    const input = document.getElementById('checkout-' + field);
    return showError(field, rules[field](input.value));
  }

  Object.keys(rules).forEach(field => {
    const input = document.getElementById('checkout-' + field);
    // Clear the error as soon as they start fixing it.
    input.addEventListener('input', () => {
      if (document.getElementById('error-' + field).textContent) validateField(field);
    });
    input.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      Site.toast('Please complete all required fields.', 'error');
      document.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    if (Basket.isEmpty()) {
      Site.toast('Your basket is empty.', 'error');
      window.location.href = 'basket.html';
      return;
    }

    // Booking requires an account, so ask now rather than after card entry.
    const loggedIn = await Site.requireLogin('Log in or create an account to complete your booking.');
    if (!loggedIn) {
      Site.toast('You need an account to book tickets.', 'error');
      return;
    }

    const details = {
      firstName: document.getElementById('checkout-firstName').value.trim(),
      lastName: document.getElementById('checkout-lastName').value.trim(),
      email: document.getElementById('checkout-email').value.trim(),
      phone: document.getElementById('checkout-phone').value.trim()
    };

    sessionStorage.setItem('rs_checkout', JSON.stringify(details));
    window.location.href = 'payment.html';
  });

  // Pre-fill from a previous visit or the logged-in account.
  function prefill() {
    const saved = sessionStorage.getItem('rs_checkout');
    if (saved) {
      try {
        const details = JSON.parse(saved);
        Object.keys(rules).forEach(field => {
          if (details[field]) document.getElementById('checkout-' + field).value = details[field];
        });
      } catch { /* ignore malformed saved details */ }
    } else if (Site.auth.isLoggedIn()) {
      document.getElementById('checkout-email').value = Site.auth.email();
    }
  }

  renderSummary();
  prefill();
})();
// CODE BY OisinMccarthy(LEGA11)
