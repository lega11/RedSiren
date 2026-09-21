// CODE BY OisinMccarthy(LEGA11)
/* =========================================================
   Events module — fetching, formatting and card building.
   Home and Events pages both use this so an event card is
   defined in exactly one place.
   ========================================================= */

const Events = (function () {
  'use strict';

  const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  let cache = null;   // avoids refetching the list when filtering

  async function all() {
    if (cache) return cache;
    const result = await Site.apiFetch('/api/events');
    if (!result.ok) throw new Error(result.body.error || 'Could not load events.');
    cache = result.body;
    return cache;
  }

  async function one(id) {
    const result = await Site.apiFetch('/api/events/' + id);
    if (!result.ok) throw new Error(result.body.error || 'Event not found.');
    return result.body;
  }

  /* ---------- formatting ---------- */

  function price(cents) {
    return euro.format(cents / 100);
  }

  function dateParts(iso) {
    const d = new Date(iso);
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: d.toLocaleDateString('en-IE', { month: 'short' }).toUpperCase(),
      weekday: d.toLocaleDateString('en-IE', { weekday: 'long' }),
      full: d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
      date: d
    };
  }

  // Short label used in the basket and on receipts.
  function shortDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- status ---------- */

  function status(event) {
    if (event.totalRemaining <= 0) return { key: 'out', label: 'Sold out' };
    if (event.totalRemaining <= 15) return { key: 'low', label: 'Almost sold out' };
    return null;
  }

  /* ---------- card ---------- */

  // Builds real DOM nodes rather than an HTML string, so event text can
  // never be mistaken for markup and no escaping helper is needed.
  function card(event) {
    const parts = dateParts(event.dateISO);
    const state = status(event);

    const link = document.createElement('a');
    link.className = 'event-card';
    link.href = 'event.html?id=' + encodeURIComponent(event.id);

    const media = document.createElement('div');
    media.className = 'event-card-media';

    const img = document.createElement('img');
    img.src = 'img/' + (event.image || 'city-night-small.webp');
    img.alt = 'Poster artwork for ' + event.name;
    img.loading = 'lazy';
    media.appendChild(img);

    const date = document.createElement('p');
    date.className = 'event-card-date';
    date.innerHTML = '<span class="d"></span><span class="m"></span>';
    date.querySelector('.d').textContent = parts.day;
    date.querySelector('.m').textContent = parts.month;
    media.appendChild(date);

    const badges = document.createElement('div');
    badges.className = 'event-card-badges';
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
    media.appendChild(badges);

    const body = document.createElement('div');
    body.className = 'event-card-body';

    const title = document.createElement('h3');
    title.textContent = event.name;

    const meta = document.createElement('p');
    meta.className = 'event-card-meta';
    meta.textContent = parts.weekday + ' ' + parts.day + ' ' + parts.month + ' \u00B7 ' + parts.time;

    const venue = document.createElement('p');
    venue.className = 'event-card-venue';
    venue.textContent = event.venue + ', ' + event.location;

    const foot = document.createElement('div');
    foot.className = 'event-card-foot';

    const priceEl = document.createElement('p');
    priceEl.className = 'event-card-price';
    priceEl.style.margin = '0';
    if (event.totalRemaining > 0) {
      priceEl.innerHTML = '<small>From</small>';
      priceEl.append(price(event.fromPriceCents));
    } else {
      priceEl.innerHTML = '<small>&nbsp;</small>';
      priceEl.append('Sold out');
    }

    const cta = document.createElement('span');
    cta.className = 'btn';
    cta.textContent = event.totalRemaining > 0 ? 'View event' : 'Details';

    foot.append(priceEl, cta);
    body.append(title, meta, venue, foot);
    link.append(media, body);
    return link;
  }

  function renderInto(container, events, emptyMessage) {
    container.innerHTML = '';
    if (events.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<h3>Nothing found</h3>';
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = emptyMessage || 'Try a different search or clear the filters.';
      empty.appendChild(p);
      container.appendChild(empty);
      return;
    }
    events.forEach(event => container.appendChild(card(event)));
  }

  return { all, one, price, dateParts, shortDate, status, card, renderInto };
})();
// CODE BY OisinMccarthy(LEGA11)
