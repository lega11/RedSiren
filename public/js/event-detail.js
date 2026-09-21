// CODE BY OisinMccarthy(LEGA11)
/* Event details page: shows one event and lets the user pick quantities
   per ticket type before adding them to the basket. */
(function () {
  'use strict';

  const root = document.getElementById('event-root');
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  // Chosen quantities live here until "Add to basket" is pressed.
  const chosen = {};
  let event = null;

  function notFound(message) {
    root.innerHTML =
      '<div class="empty-state"><h3>Event not found</h3>' +
      '<p class="muted">' + message + '</p>' +
      '<p><a class="btn" href="events.html">Browse all events</a></p></div>';
  }

  function runningTotal() {
    if (!event) return 0;
    return event.ticketTypes.reduce((sum, type) => {
      return sum + type.priceCents * (chosen[type.typeId] || 0);
    }, 0);
  }

  function totalChosen() {
    return Object.values(chosen).reduce((sum, n) => sum + n, 0);
  }

  // The ticket rows are built before the total box exists, so this has to
  // cope with the box not being on the page yet. render() calls it again
  // once everything has been added.
  function updateTotals() {
    const totalEl = document.getElementById('select-total');
    const countEl = document.getElementById('select-count');
    if (!totalEl || !countEl) return;

    totalEl.textContent = Events.price(runningTotal());
    const count = totalChosen();
    countEl.textContent = count === 1 ? '1 ticket selected' : count + ' tickets selected';
  }

  // One row per ticket type, with a stepper that respects what's left.
  function ticketRow(type) {
    const inBasket = Basket.quantityOf(event.id, type.typeId);
    const ceiling = Math.min(Basket.MAX_PER_TYPE - inBasket, type.remaining);

    const row = document.createElement('div');
    row.className = 'ticket-row';

    const info = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = type.name;
    const detail = document.createElement('p');
    detail.className = 'muted';
    detail.style.margin = '0';
    detail.style.fontSize = '.85rem';
    if (type.remaining <= 0) {
      detail.textContent = 'Sold out';
    } else if (ceiling <= 0) {
      detail.textContent = 'Maximum already in your basket';
    } else {
      detail.textContent = type.remaining + ' left \u00B7 max ' + ceiling + ' per order';
    }
    info.append(name, detail);

    const right = document.createElement('div');
    right.className = 'ticket-row-right';

    const priceEl = document.createElement('p');
    priceEl.className = 'ticket-price';
    priceEl.textContent = Events.price(type.priceCents);

    const stepper = document.createElement('div');
    stepper.className = 'qty';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.innerHTML = '<span>&minus;</span>';
    minus.setAttribute('aria-label', 'One fewer ' + type.name + ' ticket');

    const output = document.createElement('output');
    output.textContent = '0';
    output.setAttribute('aria-live', 'polite');

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.innerHTML = '<span>+</span>';
    plus.setAttribute('aria-label', 'One more ' + type.name + ' ticket');

    function refresh() {
      const value = chosen[type.typeId] || 0;
      output.textContent = value;
      minus.disabled = value <= 0;
      plus.disabled = value >= ceiling;
      updateTotals();
    }

    minus.addEventListener('click', () => {
      chosen[type.typeId] = Math.max(0, (chosen[type.typeId] || 0) - 1);
      refresh();
    });
    plus.addEventListener('click', () => {
      const next = (chosen[type.typeId] || 0) + 1;
      if (next > ceiling) {
        Site.toast('Only ' + ceiling + ' of that ticket can be added.', 'error');
        return;
      }
      chosen[type.typeId] = next;
      refresh();
    });

    if (ceiling <= 0) {
      minus.disabled = true;
      plus.disabled = true;
      row.classList.add('ticket-row-out');
    }

    stepper.append(minus, output, plus);
    right.append(priceEl, stepper);
    row.append(info, right);
    refresh();
    return row;
  }

  function addToBasket() {
    if (totalChosen() === 0) {
      Site.toast('Please select at least one ticket.', 'error');
      return false;
    }

    let added = 0;
    let failure = null;

    event.ticketTypes.forEach(type => {
      const quantity = chosen[type.typeId] || 0;
      if (quantity < 1) return;

      const result = Basket.add({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.dateISO,
        venue: event.venue + ', ' + event.location,
        typeId: type.typeId,
        typeName: type.name,
        priceCents: type.priceCents,
        quantity: quantity,
        available: type.remaining
      });

      if (result.ok) added += quantity;
      else failure = result.message;
    });

    if (failure) Site.toast(failure, 'error');
    if (added === 0) return false;

    Site.toast(added === 1 ? 'Ticket added to basket.' : added + ' tickets added to basket.', 'ok');
    // Reset the steppers so the page reflects what's left to add.
    Object.keys(chosen).forEach(key => { chosen[key] = 0; });
    render();
    return true;
  }

  function render() {
    const parts = Events.dateParts(event.dateISO);
    const state = Events.status(event);

    root.innerHTML = '';

    const banner = document.createElement('div');
    banner.className = 'event-banner';
    const img = document.createElement('img');
    img.src = 'img/' + (event.image || 'city-night.webp');
    img.alt = 'Poster artwork for ' + event.name;
    banner.appendChild(img);

    const head = document.createElement('div');
    head.className = 'event-head';

    const badges = document.createElement('p');
    badges.className = 'event-badges';
    const cat = document.createElement('span');
    cat.className = 'badge badge-cat';
    cat.textContent = event.category;
    badges.appendChild(cat);
    if (state) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-' + state.key;
      badge.textContent = state.label;
      badges.appendChild(badge);
    }

    const title = document.createElement('h1');
    title.textContent = event.name;

    const facts = document.createElement('dl');
    facts.className = 'event-facts';
    [
      ['Date', parts.full],
      ['Start', parts.time + (event.doorsLabel ? ' \u00B7 ' + event.doorsLabel : '')],
      ['Venue', event.venue],
      ['Location', event.location]
    ].forEach(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      facts.append(dt, dd);
    });

    const description = document.createElement('p');
    description.className = 'lede';
    description.textContent = event.description;

    head.append(badges, title, facts, description);

    const picker = document.createElement('section');
    picker.className = 'panel ticket-picker';
    picker.style.padding = 'clamp(1.2rem,3vw,2rem)';

    const pickerHead = document.createElement('h2');
    pickerHead.textContent = 'Select tickets';
    picker.appendChild(pickerHead);

    if (event.totalRemaining <= 0) {
      const out = document.createElement('div');
      out.className = 'empty-state';
      out.innerHTML = '<h3>This event is sold out</h3>' +
        '<p class="muted">Nothing is returned to sale once the door list closes.</p>';
      picker.appendChild(out);
    } else {
      event.ticketTypes.forEach(type => picker.appendChild(ticketRow(type)));

      const summary = document.createElement('div');
      summary.className = 'select-summary';
      summary.innerHTML =
        '<p class="muted" id="select-count" style="margin:0">0 tickets selected</p>' +
        '<p class="select-total">Total <span id="select-total">' + Events.price(0) + '</span></p>';
      picker.appendChild(summary);

      const actions = document.createElement('div');
      actions.className = 'btn-row';

      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'btn';
      add.textContent = 'Add to basket';
      add.addEventListener('click', addToBasket);

      const goBasket = document.createElement('button');
      goBasket.type = 'button';
      goBasket.className = 'btn btn-secondary';
      goBasket.textContent = 'Add and go to basket';
      goBasket.addEventListener('click', () => {
        if (addToBasket()) window.location.href = 'basket.html';
      });

      const keepBrowsing = document.createElement('a');
      keepBrowsing.className = 'btn btn-ghost';
      keepBrowsing.href = 'events.html';
      keepBrowsing.textContent = 'Continue browsing';

      actions.append(add, goBasket, keepBrowsing);
      picker.appendChild(actions);
    }

    root.append(banner, head, picker);
    updateTotals();
    document.title = event.name + ' — Red Siren';
  }

  async function load() {
    if (!eventId) {
      notFound('No event was specified.');
      return;
    }
    // Loading and drawing are kept apart, so a bug while drawing the page
    // can't be misreported to the customer as "Event not found".
    try {
      event = await Events.one(eventId);
    } catch (err) {
      notFound(err.message);
      return;
    }

    try {
      render();
    } catch (err) {
      console.error(err);
      root.innerHTML =
        '<div class="empty-state"><h3>Something went wrong showing this event</h3>' +
        '<p class="muted">Refresh the page to try again.</p>' +
        '<p><a class="btn" href="events.html">Browse all events</a></p></div>';
    }
  }

  load();
})();
// CODE BY OisinMccarthy(LEGA11)
