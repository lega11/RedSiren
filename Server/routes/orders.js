// CODE BY OisinMccarthy(LEGA11)
const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Order = require('../models/Order');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const BOOKING_FEE_CENTS = 300;   // must match BOOKING_FEE_CENTS in public/js/basket.js
const MAX_PER_TYPE = 8;

// Short, readable booking reference: RS-4F9K2Q
function makeReference() {
  const body = Math.random().toString(36).slice(2, 8).toUpperCase();
  return 'RS-' + body;
}

/* Takes every ticket for one event off sale in a single update.

   The filter requires each requested type to still have enough remaining,
   and the $inc applies in the same operation. If two people buy the last
   pair of tickets at the same moment, MongoDB applies the updates one
   after the other — the second one matches nothing and fails cleanly
   instead of overselling. */
async function reserveForEvent(eventId, items) {
  const conditions = items.map(item => ({
    ticketTypes: { $elemMatch: { typeId: item.typeId, remaining: { $gte: item.quantity } } }
  }));

  const inc = {};
  const arrayFilters = [];
  items.forEach((item, i) => {
    inc[`ticketTypes.$[t${i}].remaining`] = -item.quantity;
    inc[`ticketTypes.$[t${i}].sold`] = item.quantity;
    arrayFilters.push({ [`t${i}.typeId`]: item.typeId });
  });

  return Event.findOneAndUpdate(
    { _id: eventId, $and: conditions },
    { $inc: inc },
    { arrayFilters, new: true }
  );
}

// Puts tickets back if a later event in the same order failed.
async function releaseForEvent(eventId, items) {
  const inc = {};
  const arrayFilters = [];
  items.forEach((item, i) => {
    inc[`ticketTypes.$[t${i}].remaining`] = item.quantity;
    inc[`ticketTypes.$[t${i}].sold`] = -item.quantity;
    arrayFilters.push({ [`t${i}.typeId`]: item.typeId });
  });
  await Event.updateOne({ _id: eventId }, { $inc: inc }, { arrayFilters });
}

// Create an order. Login required — this is the only way to buy.
router.post('/', requireAuth, async (req, res) => {
  const customer = req.body.customer || {};
  const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

  if (rawItems.length === 0) {
    return res.status(400).json({ error: 'Your basket is empty.' });
  }
  if (!customer.firstName || !customer.lastName || !customer.email) {
    return res.status(400).json({ error: 'Customer details are incomplete.' });
  }

  // Group the requested lines by event, validating shape as we go.
  const byEvent = new Map();
  for (const item of rawItems) {
    const quantity = parseInt(item.quantity, 10);
    if (!mongoose.isValidObjectId(item.eventId)) {
      return res.status(400).json({ error: 'That event no longer exists.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_TYPE) {
      return res.status(400).json({ error: 'Ticket quantities must be between 1 and ' + MAX_PER_TYPE + '.' });
    }
    const key = String(item.eventId);
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key).push({ typeId: String(item.typeId), quantity });
  }

  /* Prices come from the database, never from the browser. A tampered
     basket can change what is requested but not what it costs. */
  const events = await Event.find({ _id: { $in: [...byEvent.keys()] } });
  if (events.length !== byEvent.size) {
    return res.status(404).json({ error: 'One of those events no longer exists.' });
  }

  const orderItems = [];
  for (const event of events) {
    for (const line of byEvent.get(String(event._id))) {
      const type = event.ticketTypes.find(t => t.typeId === line.typeId);
      if (!type) {
        return res.status(400).json({ error: 'That ticket type is no longer on sale.' });
      }
      orderItems.push({
        eventId: event._id,
        eventName: event.name,
        eventDate: event.dateSort,
        venue: event.venue,
        typeId: type.typeId,
        typeName: type.name,
        priceCents: type.priceCents,
        quantity: line.quantity
      });
    }
  }

  // Reserve event by event, rolling back if any of them can't be filled.
  const reserved = [];
  for (const [eventId, items] of byEvent) {
    const updated = await reserveForEvent(eventId, items);
    if (!updated) {
      for (const done of reserved) await releaseForEvent(done.eventId, done.items);
      const event = events.find(e => String(e._id) === eventId);
      return res.status(409).json({
        error: 'Not enough tickets left for ' + (event ? event.name : 'one of those events') + '.'
      });
    }
    reserved.push({ eventId, items });
  }

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const totalCents = subtotalCents + BOOKING_FEE_CENTS;

  // Retry on the very unlikely chance of a duplicate reference.
  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await Order.create({
        reference: makeReference(),
        user: req.userId,
        customer: {
          firstName: String(customer.firstName).trim(),
          lastName: String(customer.lastName).trim(),
          email: String(customer.email).trim().toLowerCase(),
          phone: customer.phone ? String(customer.phone).trim() : ''
        },
        items: orderItems,
        subtotalCents,
        feeCents: BOOKING_FEE_CENTS,
        totalCents
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }

  if (!order) {
    for (const done of reserved) await releaseForEvent(done.eventId, done.items);
    return res.status(500).json({ error: 'Could not save your booking. Nothing was charged.' });
  }

  res.status(201).json({ ok: true, order });
});

// The logged-in customer's own bookings, newest first.
router.get('/', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(orders);
});

// One booking by reference, for the confirmation page after a refresh.
router.get('/:reference', requireAuth, async (req, res) => {
  const order = await Order.findOne({
    reference: req.params.reference.toUpperCase(),
    user: req.userId
  });
  if (!order) return res.status(404).json({ error: 'Booking not found.' });
  res.json(order);
});

module.exports = router;
// CODE BY OisinMccarthy(LEGA11)
