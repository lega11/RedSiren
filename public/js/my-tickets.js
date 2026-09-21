// CODE BY OisinMccarthy(LEGA11)
/* My tickets: every booking belonging to the logged-in account. */
(function () {
  'use strict';

  const root = document.getElementById('tickets-root');

  function render(orders) {
    root.innerHTML = '';

    if (orders.length === 0) {
      root.innerHTML =
        '<div class="empty-state"><h3>No bookings yet</h3>' +
        '<p class="muted">Tickets you buy will appear here with their reference numbers.</p>' +
        '<p><a class="btn" href="events.html">Browse events</a></p></div>';
      return;
    }

    orders.forEach(order => {
      const card = document.createElement('article');
      card.className = 'panel panel-paper booking-card';

      const head = document.createElement('div');
      head.className = 'booking-head';
      const ref = document.createElement('p');
      ref.className = 'ticket-ref';
      ref.style.fontSize = '1.1rem';
      ref.textContent = order.reference;
      const status = document.createElement('span');
      status.className = 'badge';
      status.textContent = order.status;
      head.append(ref, status);
      card.appendChild(head);

      const booked = document.createElement('p');
      booked.className = 'muted';
      booked.style.fontSize = '.8rem';
      booked.style.margin = '0 0 .8rem';
      booked.textContent = 'Booked ' + Events.shortDate(order.createdAt);
      card.appendChild(booked);

      order.items.forEach(item => {
        const block = document.createElement('div');
        block.className = 'booking-item';
        const name = document.createElement('p');
        name.style.fontWeight = '700';
        name.style.margin = '0';
        name.textContent = item.eventName;
        const meta = document.createElement('p');
        meta.style.margin = '0';
        meta.style.fontSize = '.85rem';
        meta.textContent = Events.shortDate(item.eventDate) + ' \u00B7 ' + item.venue;
        const tickets = document.createElement('p');
        tickets.style.margin = '.2rem 0 0';
        tickets.style.fontSize = '.85rem';
        tickets.textContent = item.quantity + ' \u00D7 ' + item.typeName +
          ' \u00B7 ' + Basket.formatPrice(item.priceCents * item.quantity);
        block.append(name, meta, tickets);
        card.appendChild(block);
      });

      const total = document.createElement('div');
      total.className = 'line line-total';
      const left = document.createElement('span');
      left.textContent = 'Total paid';
      const right = document.createElement('span');
      right.textContent = Basket.formatPrice(order.totalCents);
      total.append(left, right);
      card.appendChild(total);

      root.appendChild(card);
    });
  }

  async function load() {
    if (!Site.auth.isLoggedIn()) {
      root.innerHTML =
        '<div class="empty-state"><h3>Log in to see your tickets</h3>' +
        '<p class="muted">Bookings are tied to the account that made them.</p></div>';
      const loggedIn = await Site.requireLogin('Log in to see your bookings.');
      if (!loggedIn) return;
    }

    root.innerHTML = '<p class="loading">Loading your bookings…</p>';
    const result = await Site.apiFetch('/api/orders');

    if (!result.ok) {
      root.innerHTML = '<div class="empty-state"><h3>Couldn\'t load bookings</h3>' +
        '<p class="muted">' + (result.body.error || 'Try again shortly.') + '</p></div>';
      return;
    }
    render(result.body);
  }

  // Logging in from the nav while on this page should load the bookings.
  document.addEventListener('auth:changed', load);
  load();
})();
// CODE BY OisinMccarthy(LEGA11)
