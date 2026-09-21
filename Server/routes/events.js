// CODE BY OisinMccarthy(LEGA11)
const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');

const router = express.Router();

/* Turns a database document into the shape the browser uses. Dates go out
   as ISO strings and are formatted in the browser, so the server doesn't
   need to know about locales. */
function toPublic(event) {
  return {
    id: event._id,
    slug: event.slug,
    name: event.name,
    description: event.description,
    category: event.category,
    image: event.image,
    venue: event.venue,
    location: event.location,
    dateISO: event.dateSort.toISOString(),
    doorsLabel: event.doorsLabel,
    ticketTypes: event.ticketTypes.map(t => ({
      typeId: t.typeId,
      name: t.name,
      priceCents: t.priceCents,
      capacity: t.capacity,
      remaining: t.remaining
    })),
    totalRemaining: event.totalRemaining,
    fromPriceCents: event.fromPriceCents
  };
}

// Public — no login needed. Anyone can browse and see availability.
router.get('/', async (req, res) => {
  const events = await Event.find().sort({ dateSort: 1 });
  res.json(events.map(toPublic));
});

// Public — a single event for the details page.
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Event not found.' });
  }
  const event = await Event.findById(id);
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  res.json(toPublic(event));
});

module.exports = router;
// CODE BY OisinMccarthy(LEGA11)
