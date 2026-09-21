# Red Siren

A ticket-booking site for a Cork gig promoter. Node + Express + MongoDB on the back,
plain HTML/CSS/JavaScript on the front — no frameworks or build step.

## Running it

Needs Node 18+ and a MongoDB you can reach (local `mongod`, or a free Atlas cluster).

```bash
cd server
npm install
cp .env.example .env        # then edit it (see below)
npm run seed                # loads the six events
npm start
```

Open http://localhost:3000.

In `.env` set `MONGO_URI` (`mongodb://127.0.0.1:27017/red-siren` for a local server) and
`JWT_SECRET` to a long random string from
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

`npm run seed` wipes and reloads the events collection, so don't re-run it once real
bookings exist — it would reset the remaining-ticket counts.

## The customer journey

```
Home  ->  Events  ->  Event details  ->  Select tickets  ->  Basket
      ->  Checkout (details)  ->  Payment  ->  Confirmation  ->  My tickets
```

Browsing needs no account. An account is required only to complete a booking; the
checkout asks for it at the point it's needed and then resumes where you left off.

## Structure

```
public/
  index.html        home: search, featured, categories, upcoming
  events.html       browse: search, filter by category/location/date/price, sort
  event.html        one event (?id=...), ticket types and quantity pickers
  basket.html       edit quantities, remove lines or events, totals
  checkout.html     customer details + order summary
  payment.html      simulated card entry with validation
  confirmation.html booking reference and ticket stub
  my-tickets.html   past bookings for the logged-in account
  about.html  contact.html  faq.html
  terms.html  privacy.html  refunds.html
  styles.css        one shared stylesheet for every page
  img/              event posters + city background
  js/
    site.js         nav, footer, auth modal, toasts, apiFetch  (every page)
    basket.js       basket state and ALL money calculations    (every page)
    events.js       fetching, formatting, event card builder
    home.js  browse.js  event-detail.js  basket-page.js
    checkout.js  payment.js  confirmation.js  my-tickets.js  contact.js
server/
  server.js  seed.js  package.json  .env.example
  models/     User.js  Event.js  Order.js
  routes/     auth.js  events.js  orders.js
  middleware/ auth.js
```

Every page loads `basket.js` and `site.js`; nav, footer and the login modal are built by
`site.js` rather than copy-pasted into each HTML file. Each page sets
`<body data-page="events">` so the matching nav link is marked as current.

## API

| Method | Path                  | Auth | Does |
|--------|-----------------------|------|------|
| POST   | `/api/auth/register`  | no   | Create account, returns a token |
| POST   | `/api/auth/login`     | no   | Returns a token |
| GET    | `/api/auth/me`        | yes  | The logged-in email |
| GET    | `/api/events`         | no   | All events with live per-type availability |
| GET    | `/api/events/:id`     | no   | One event |
| POST   | `/api/orders`         | yes  | Place an order |
| GET    | `/api/orders`         | yes  | The user's bookings |
| GET    | `/api/orders/:ref`    | yes  | One booking by reference |

## How the important parts work

**Passwords.** Mongo stores a bcrypt hash at cost 12, never the password. Login returns
the same error for a wrong email and a wrong password, so it can't be used to discover
which addresses have accounts.

**Money is calculated once.** `public/js/basket.js` is the only place totals are worked
out, from `priceCents x quantity` plus a flat EUR 3 booking fee. Every page reads from it,
so the basket, checkout, payment and confirmation can't disagree.

**Prices are re-checked on the server.** `POST /api/orders` ignores the prices the browser
sends and looks each ticket type up in the database. A tampered basket can change what is
requested but not what it costs.

**Stock can't oversell.** Each ticket type stores `remaining`, and the booking route puts
the availability check inside the update filter:

```js
Event.findOneAndUpdate(
  { _id: eventId, $and: conditions },   // each type must still have enough
  { $inc: inc },                        // decrement in the same operation
  { arrayFilters, new: true }
)
```

Because the check and the decrement are one atomic update, two people buying the last
tickets at the same instant can't both succeed — the second matches nothing and gets a
409 with the real remaining count. An order spanning several events reserves them one at
a time and rolls back the successful ones if a later event can't be filled.

## Payment

Payment is **simulated**. The card fields are validated in the browser (16 digits, MM/YY
that hasn't passed, 3-digit CVV, required fields) and then discarded. Nothing about the
card is sent to the server, saved to `localStorage`, or written to the database. A real
site would hand card entry to a provider such as Stripe, which returns a token the server
charges — the card never touches your own code.

## What this deliberately doesn't do

- No real payments, and no confirmation emails.
- No password reset.
- No admin area for creating events — they come from `seed.js`.
- The contact form validates and confirms locally; there's no mail server.
- No rate limiting on login. Add `express-rate-limit` before this faces the internet.
- Tokens live in `localStorage`, which is fine here but worth moving to an httpOnly
  cookie if anything sensitive is added to an account.
