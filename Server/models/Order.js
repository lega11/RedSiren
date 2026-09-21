// CODE BY OisinMccarthy(LEGA11)
const mongoose = require('mongoose');

/* One order per completed checkout. Items are stored with the name and
   price as they were at the time of purchase, so a later price change on
   the event doesn't rewrite someone's past receipt.

   No card data is stored. Payment is simulated in the browser; nothing
   about the card is ever sent to this server. */
const orderItemSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventName: String,
  eventDate: Date,
  venue: String,
  typeId: String,
  typeName: String,
  priceCents: Number,
  quantity: { type: Number, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },   // e.g. RS-7KQ2P4
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  items: { type: [orderItemSchema], required: true },
  subtotalCents: { type: Number, required: true },
  feeCents: { type: Number, required: true },
  totalCents: { type: Number, required: true },
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
// CODE BY OisinMccarthy(LEGA11)
