// CODE BY OisinMccarthy(LEGA11)
/* Confirmation page: reads the reference left by the payment page and
   fetches the saved order, so a refresh still shows the booking. */
(function () {
  'use strict';

  const root = document.getElementById('confirmation-root');
  const reference = sessionStorage.getItem('rs_last_order');

  function row(label, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'line';
    const dt = document.createElement('span');
    dt.textContent = label;
    const dd = document.createElement('span');
    dd.textContent = value;
    wrapper.append(dt, dd);
    return wrapper;
  }

  function showProblem(message) {
    root.innerHTML =
      '<div class="empty-state"><h3>No booking to show</h3>' +
      '<p class="muted">' + message + '</p>' +
      '<p><a class="btn" href="events.html">Browse events</a> ' +
      '<a class="btn btn-ghost" href="my-tickets.html">My tickets</a></p></div>';
  }

  function render(order) {
    root.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'confirm-banner';
    banner.innerHTML =
      '<h1>Booking confirmed</h1>' +
      '<p class="lede">A copy has been added to My tickets. Show the reference at the door.</p>';

    const ticket = document.createElement('div');
    ticket.className = 'ticket-stub';

    const stubMain = document.createElement('div');
    stubMain.className = 'ticket-stub-main';

    const ref = document.createElement('p');
    ref.className = 'ticket-ref';
    ref.textContent = order.reference;

    const who = document.createElement('p');
    who.style.margin = '0 0 .6rem';
    who.style.fontWeight = '700';
    who.textContent = order.customer.firstName + ' ' + order.customer.lastName + ' \u00B7 ' + order.customer.email;

    stubMain.append(ref, who);

    // Group the saved items by event for a readable receipt.
    const byEvent = [];
    order.items.forEach(item => {
      let group = byEvent.find(g => g.eventName === item.eventName);
      if (!group) {
        group = { eventName: item.eventName, eventDate: item.eventDate, venue: item.venue, lines: [] };
        byEvent.push(group);
      }
      group.lines.push(item);
    });

    byEvent.forEach(group => {
      const h2 = document.createElement('h2');
      h2.style.fontSize = '1.15rem';
      h2.style.marginTop = '1rem';
      h2.textContent = group.eventName;
      const meta = document.createElement('p');
      meta.style.margin = '0 0 .4rem';
      meta.style.fontSize = '.85rem';
      meta.textContent = Events.shortDate(group.eventDate) + ' \u00B7 ' + group.venue;
      stubMain.append(h2, meta);
      group.lines.forEach(item => {
        stubMain.appendChild(row(item.quantity + ' \u00D7 ' + item.typeName,
          Basket.formatPrice(item.priceCents * item.quantity)));
      });
    });

    stubMain.appendChild(row('Booking fee', Basket.formatPrice(order.feeCents)));
    const total = row('Total paid', Basket.formatPrice(order.totalCents));
    total.classList.add('line-total');
    stubMain.appendChild(total);

    // Placeholder for a QR code — a real site would render one here.
    const stubSide = document.createElement('div');
    stubSide.className = 'ticket-stub-side';
    stubSide.innerHTML =
      '<div class="qr-placeholder" role="img" aria-label="Placeholder for a scannable ticket code"></div>' +
      '<p class="muted" style="font-size:.72rem;margin:.5rem 0 0">Scan at the door</p>';

    ticket.append(stubMain, stubSide);

    const actions = document.createElement('div');
    actions.className = 'btn-row';
    actions.innerHTML =
      '<a class="btn" href="my-tickets.html">View my tickets</a>' +
      '<a class="btn btn-secondary" href="events.html">Browse more events</a>' +
      '<a class="btn btn-ghost" href="index.html">Return home</a>';

    const print = document.createElement('button');
    print.type = 'button';
    print.className = 'link-button';
    print.textContent = 'Print or save as PDF';
    print.addEventListener('click', () => window.print());

    root.append(banner, ticket, actions, print);
  }

  async function load() {
    if (!reference) {
      showProblem('Your confirmation link has expired. Past bookings are on the My tickets page.');
      return;
    }
    if (!Site.auth.isLoggedIn()) {
      const loggedIn = await Site.requireLogin('Log in to view your booking.');
      if (!loggedIn) {
        showProblem('Log in to see this booking.');
        return;
      }
    }

    const result = await Site.apiFetch('/api/orders/' + encodeURIComponent(reference));
    if (!result.ok) {
      showProblem(result.body.error || 'That booking could not be loaded.');
      return;
    }
    render(result.body);
  }

  load();
})();
// CODE BY OisinMccarthy(LEGA11)
