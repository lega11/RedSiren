// CODE BY OisinMccarthy(LEGA11)
/* =========================================================
   Basket module — the only place basket data is read or written.
   Every page uses these functions instead of touching localStorage
   directly, so totals can never disagree between pages.

   Stored shape (one array of lines):
   [{ eventId, eventName, eventDate, venue, typeId,
      typeName, priceCents, quantity }]
   ========================================================= */

const Basket = (function () {
  'use strict';

  const KEY = 'rs_basket';
  const BOOKING_FEE_CENTS = 300;   // flat 3.00 per order
  const MAX_PER_TYPE = 8;          // matches the server's per-order limit

  const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  /* ---------- storage ---------- */

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const lines = raw ? JSON.parse(raw) : [];
      return Array.isArray(lines) ? lines : [];
    } catch {
      // Corrupted or unavailable storage shouldn't break the page.
      return [];
    }
  }

  function write(lines) {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      // Private browsing can refuse writes; the basket just won't persist.
    }
    // Let any listening page update its badge and totals.
    document.dispatchEvent(new CustomEvent('basket:changed'));
  }

  /* ---------- reading ---------- */

  function lines() {
    return read();
  }

  function isEmpty() {
    return read().length === 0;
  }

  // Total number of tickets, not number of lines — this is the nav badge.
  function count() {
    return read().reduce((sum, line) => sum + line.quantity, 0);
  }

  function quantityOf(eventId, typeId) {
    const line = read().find(l => l.eventId === eventId && l.typeId === typeId);
    return line ? line.quantity : 0;
  }

  // Lines grouped by event, so the basket page can show one block per event.
  function groupedByEvent() {
    const groups = [];
    read().forEach(line => {
      let group = groups.find(g => g.eventId === line.eventId);
      if (!group) {
        group = {
          eventId: line.eventId,
          eventName: line.eventName,
          eventDate: line.eventDate,
          venue: line.venue,
          lines: []
        };
        groups.push(group);
      }
      group.lines.push(line);
    });
    return groups;
  }

  /* ---------- totals ----------
     Always derived from price x quantity. Nothing is stored pre-calculated,
     so a quantity change updates every figure on every page. */

  function subtotalCents() {
    return read().reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  }

  function feeCents() {
    return isEmpty() ? 0 : BOOKING_FEE_CENTS;
  }

  function totalCents() {
    return subtotalCents() + feeCents();
  }

  function totals() {
    return {
      subtotalCents: subtotalCents(),
      feeCents: feeCents(),
      totalCents: totalCents(),
      count: count()
    };
  }

  /* ---------- writing ---------- */

  // Adds to an existing line rather than creating a duplicate.
  // Returns { ok, message } so the caller can show a toast.
  function add(item) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, message: 'Choose at least one ticket.' };
    }

    const lines = read();
    const existing = lines.find(l => l.eventId === item.eventId && l.typeId === item.typeId);
    const alreadyHave = existing ? existing.quantity : 0;
    const ceiling = Math.min(MAX_PER_TYPE, Number(item.available));

    if (alreadyHave + quantity > ceiling) {
      const room = Math.max(ceiling - alreadyHave, 0);
      return {
        ok: false,
        message: room === 0
          ? 'You already have the maximum for that ticket type.'
          : 'Only ' + room + ' more of that ticket can be added.'
      };
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      lines.push({
        eventId: item.eventId,
        eventName: item.eventName,
        eventDate: item.eventDate,
        venue: item.venue,
        typeId: item.typeId,
        typeName: item.typeName,
        priceCents: item.priceCents,
        quantity: quantity
      });
    }

    write(lines);
    return { ok: true, message: quantity + (quantity === 1 ? ' ticket' : ' tickets') + ' added to basket.' };
  }

  // Sets an exact quantity; 0 or less removes the line.
  function setQuantity(eventId, typeId, quantity, available) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity)) return { ok: false, message: 'Invalid quantity.' };

    if (quantity <= 0) {
      removeLine(eventId, typeId);
      return { ok: true, message: 'Ticket removed.' };
    }

    const ceiling = Math.min(MAX_PER_TYPE, available === undefined ? MAX_PER_TYPE : Number(available));
    if (quantity > ceiling) {
      return { ok: false, message: 'Only ' + ceiling + ' of that ticket are available.' };
    }

    const lines = read();
    const line = lines.find(l => l.eventId === eventId && l.typeId === typeId);
    if (!line) return { ok: false, message: 'That ticket is no longer in your basket.' };

    line.quantity = quantity;
    write(lines);
    return { ok: true, message: '' };
  }

  function removeLine(eventId, typeId) {
    write(read().filter(l => !(l.eventId === eventId && l.typeId === typeId)));
  }

  function removeEvent(eventId) {
    write(read().filter(l => l.eventId !== eventId));
  }

  function clear() {
    write([]);
  }

  /* ---------- helper ---------- */

  function formatPrice(cents) {
    return euro.format(cents / 100);
  }

  return {
    BOOKING_FEE_CENTS,
    MAX_PER_TYPE,
    lines,
    isEmpty,
    count,
    quantityOf,
    groupedByEvent,
    totals,
    add,
    setQuantity,
    removeLine,
    removeEvent,
    clear,
    formatPrice
  };
})();
// CODE BY OisinMccarthy(LEGA11)
