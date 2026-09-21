// CODE BY OisinMccarthy(LEGA11)
// Run once with: npm run seed
// Wipes and repopulates the events collection with starting data.
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

// Helper so each ticket type starts with remaining = capacity.
function type(typeId, name, priceCents, capacity, sold = 0) {
  return { typeId, name, priceCents, capacity, remaining: capacity - sold, sold };
}

const events = [
  {
    slug: 'concrete-mercy',
    name: 'Concrete Mercy',
    category: 'Live music',
    image: 'concrete-mercy.webp',
    description: 'Four-piece noise rock from Limerick, touring behind their second record. ' +
      'Support from Sunken Lot, then a late DJ set from Halo until close. Expect it loud: ' +
      'the room runs around 105 dB at the barrier and earplugs are free at the box.',
    venue: 'Marina Warehouse 4',
    location: 'Cork',
    dateSort: new Date('2026-10-02T23:00:00'),
    doorsLabel: 'Doors 23:00',
    ticketTypes: [
      type('ga', 'General admission', 2500, 120, 96),
      type('student', 'Student', 1800, 40, 31),
      type('vip', 'VIP (balcony + early entry)', 4500, 20, 14)
    ]
  },
  {
    slug: 'bridewell-saints',
    name: 'Bridewell Saints',
    category: 'Live music',
    image: 'bridewell-saints.webp',
    description: 'Album launch for "Quay Wall Gospel", played front to back with a full band ' +
      'and a three-piece horn section. One night only, no tour to follow.',
    venue: 'The Old Bonded Store',
    location: 'Cork',
    dateSort: new Date('2026-10-10T22:30:00'),
    doorsLabel: 'Doors 22:30',
    ticketTypes: [
      type('ga', 'General admission', 2500, 90, 90),
      type('student', 'Student', 1800, 30, 30),
      type('vip', 'VIP (balcony + early entry)', 4500, 15, 15)
    ]
  },
  {
    slug: 'tape-hiss',
    name: 'Tape Hiss',
    category: 'Live music',
    image: 'tape-hiss.webp',
    description: 'Shoegaze and drone, two guitars and a reel-to-reel. Night Porter open, ' +
      'Ruaille close it out. A slower, quieter night than most of ours.',
    venue: 'Marina Warehouse 4',
    location: 'Cork',
    dateSort: new Date('2026-10-22T23:00:00'),
    doorsLabel: 'Doors 23:00',
    ticketTypes: [
      type('ga', 'General admission', 2000, 120, 22),
      type('student', 'Student', 1500, 50, 9),
      type('vip', 'VIP (balcony + early entry)', 3800, 20, 3)
    ]
  },
  {
    slug: 'blackout',
    name: 'Blackout: two rooms, nine acts',
    category: 'Festival',
    image: 'blackout.webp',
    description: 'Our Halloween all-nighter. Live upstairs until 01:00 across five bands, ' +
      'records downstairs until close with four DJs. One ticket covers both rooms, ' +
      'and you can move between them all night.',
    venue: 'Docklands Depot',
    location: 'Cork',
    dateSort: new Date('2026-10-31T22:00:00'),
    doorsLabel: 'Doors 22:00',
    ticketTypes: [
      type('ga', 'General admission', 3000, 240, 118),
      type('student', 'Student', 2200, 80, 44),
      type('vip', 'VIP (balcony + early entry)', 5500, 40, 12)
    ]
  },
  {
    slug: 'quay-sessions',
    name: 'Quay Sessions: spoken word',
    category: 'Spoken word',
    image: 'quay-sessions.webp',
    description: 'A seated evening of poetry and short readings from eight writers working ' +
      'in Cork and Waterford, with an open floor for the last half hour. Bar stays quiet ' +
      'during readings.',
    venue: 'The Old Bonded Store',
    location: 'Cork',
    dateSort: new Date('2026-11-07T19:30:00'),
    doorsLabel: 'Doors 19:30',
    ticketTypes: [
      type('ga', 'General admission', 1200, 80, 18),
      type('student', 'Student', 800, 40, 11)
    ]
  },
  {
    slug: 'docklands-allnighter',
    name: 'Docklands All-Nighter',
    category: 'Club night',
    image: 'docklands-allnighter.webp',
    description: 'Six hours of house and breaks across one long room, with a guest booth ' +
      'swap every ninety minutes. Doors close at 01:00 — no re-entry after that, so come early.',
    venue: 'Docklands Depot',
    location: 'Cork',
    dateSort: new Date('2026-11-21T23:00:00'),
    doorsLabel: 'Doors 23:00',
    ticketTypes: [
      type('ga', 'General admission', 1800, 300, 64),
      type('student', 'Student', 1400, 100, 27),
      type('vip', 'VIP (balcony + early entry)', 3500, 30, 5)
    ]
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Event.deleteMany({});
    await Event.insertMany(events);
    console.log(`Seeded ${events.length} events.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
// CODE BY OisinMccarthy(LEGA11)