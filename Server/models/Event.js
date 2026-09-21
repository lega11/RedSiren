// CODE BY OisinMccarthy(LEGA11)
const mongoose = require('mongoose');

/* Each event now sells several ticket types (General admission, Student,
   VIP...). `remaining` is stored rather than calculated because the booking
   route uses it inside the update filter — that is what makes the stock
   check and the decrement a single atomic operation. `sold` is kept
   alongside it for display and reporting. */
const ticketTypeSchema = new mongoose.Schema({
  typeId: { type: String, required: true },      // 'ga' | 'student' | 'vip'
  name: { type: String, required: true },
  priceCents: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 0 },
  remaining: { type: Number, required: true, min: 0 },
  sold: { type: Number, default: 0, min: 0 }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },    // Live music, Club night, Festival, Spoken word
  image: { type: String, default: '' },          // file inside public/img
  venue: { type: String, required: true },
  location: { type: String, required: true },    // city or area, used by the location filter
  dateSort: { type: Date, required: true },      // real date: ordering and date filters
  doorsLabel: { type: String, default: '' },     // e.g. 'Doors 23:00'
  ticketTypes: { type: [ticketTypeSchema], required: true }
});

// Total tickets left across every type — drives the sold-out badge.
eventSchema.virtual('totalRemaining').get(function () {
  return this.ticketTypes.reduce((sum, t) => sum + t.remaining, 0);
});

// Cheapest price still on sale, for the "from EUR x" line on cards.
eventSchema.virtual('fromPriceCents').get(function () {
  const onSale = this.ticketTypes.filter(t => t.remaining > 0);
  const pool = onSale.length ? onSale : this.ticketTypes;
  return pool.reduce((min, t) => Math.min(min, t.priceCents), Infinity);
});

eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
// CODE BY OisinMccarthy(LEGA11)
