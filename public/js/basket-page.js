// CODE BY OisinMccarthy(LEGA11)
/* Basket page: edit quantities, remove lines or whole events, see totals.
   All figures come from the Basket module so they match every other page. */
(function () {
  'use strict';

  const root = document.getElementById('basket-root');
  const summary = document.getElementById('basket-summary');

  function line(label, value, className) {
    const row = document.createElement('div');
    row.className = 'line' + (className ? ' ' + className : '');
    const left = document.createElement('span');
    left.textContent = label;
    const right = document.createElement('span');
    right.textContent = value;
    row.append(left, right);
    return row;
  }

  function ticketRow(item) {
    const row = document.createElement('div');
    row.className = 'basket-line';

    const info = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'basket-line-name';
    name.textContent = item.typeName;
    const each = document.createElement('p');
    each.className = 'muted';
    each.style.margin = '0';
    each.style.fontSize = '.82rem';
    each.textContent = Basket.formatPrice(item.priceCents) + ' each';
    info.append(name, each);

    const stepper = document.createElement('div');
    stepper.className = 'qty';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.innerHTML = '<span>&minus;</span>';
    minus.setAttribute('aria-label', 'One fewer ' + item.typeName + ' ticket');
    minus.addEventListener('click', () => {
      Basket.setQuantity(item.eventId, item.typeId, item.quantity - 1);
      render();
    });

    const output = document.createElement('output');
    output.textContent = item.quantity;

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.innerHTML = '<span>+</span>';
    plus.setAttribute('aria-label', 'One more ' + item.typeName + ' ticket');
    plus.disabled = item.quantity >= Basket.MAX_PER_TYPE;
    plus.addEventListener('click', () => {
      const result = Basket.setQuantity(item.eventId, item.typeId, item.quantity + 1);
      if (!result.ok) Site.toast(result.message, 'error');
      render();
    });

    stepper.append(minus, output, plus);

    const subtotal = document.createElement('p');
    subtotal.className = 'basket-line-subtotal';
    subtotal.textContent = Basket.formatPrice(item.priceCents * item.quantity);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'link-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + item.typeName + ' tickets');
    remove.addEventListener('click', () => {
      Basket.removeLine(item.eventId, item.typeId);
      Site.toast('Ticket removed.', 'ok');
      render();
    });

    row.append(info, stepper, subtotal, remove);
    return row;
  }

  function eventBlock(group) {
    const block = document.createElement('article');
    block.className = 'panel panel-paper basket-event';

    const head = document.createElement('div');
    head.className = 'basket-event-head';

    const heading = document.createElement('div');
    const title = document.createElement('h2');
    title.style.fontSize = '1.3rem';
    title.style.marginBottom = '.2rem';
    title.textContent = group.eventName;
    const meta = document.createElement('p');
    meta.style.margin = '0';
    meta.style.fontSize = '.85rem';
    meta.textContent = Events.shortDate(group.eventDate) + ' \u00B7 ' + group.venue;
    heading.append(title, meta);

    const removeAll = document.createElement('button');
    removeAll.type = 'button';
    removeAll.className = 'link-button';
    removeAll.textContent = 'Remove event';
    removeAll.addEventListener('click', () => {
      Basket.removeEvent(group.eventId);
      Site.toast('Event removed from basket.', 'ok');
      render();
    });

    head.append(heading, removeAll);
    block.appendChild(head);

    group.lines.forEach(item => block.appendChild(ticketRow(item)));

    const eventSubtotal = group.lines.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    block.appendChild(line('Subtotal for this event', Basket.formatPrice(eventSubtotal), 'line-total'));

    return block;
  }

  function render() {
    root.innerHTML = '';
    summary.innerHTML = '';

    if (Basket.isEmpty()) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML =
        '<h3>Your basket is empty</h3>' +
        '<p class="muted">Pick a night and add some tickets — they will stay here while you browse.</p>' +
        '<p><a class="btn" href="events.html">Browse events</a></p>';
      root.appendChild(empty);
      return;
    }

    Basket.groupedByEvent().forEach(group => root.appendChild(eventBlock(group)));

    const totals = Basket.totals();

    const box = document.createElement('div');
    box.className = 'panel basket-totals';
    const heading = document.createElement('h2');
    heading.style.fontSize = '1.3rem';
    heading.textContent = 'Order total';
    box.appendChild(heading);
    box.appendChild(line('Tickets (' + totals.count + ')', Basket.formatPrice(totals.subtotalCents)));
    box.appendChild(line('Booking fee', Basket.formatPrice(totals.feeCents)));
    box.appendChild(line('Total', Basket.formatPrice(totals.totalCents), 'line-total'));

    const actions = document.createElement('div');
    actions.className = 'btn-row';

    const checkout = document.createElement('a');
    checkout.className = 'btn';
    checkout.href = 'checkout.html';
    checkout.textContent = 'Proceed to checkout';

    const keep = document.createElement('a');
    keep.className = 'btn btn-ghost';
    keep.href = 'events.html';
    keep.textContent = 'Continue shopping';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'link-button';
    clear.textContent = 'Empty basket';
    clear.addEventListener('click', () => {
      Basket.clear();
      Site.toast('Basket emptied.', 'ok');
      render();
    });

    actions.append(checkout, keep);
    box.append(actions, clear);
    summary.appendChild(box);
  }

  render();
})();
// CODE BY OisinMccarthy(LEGA11)
