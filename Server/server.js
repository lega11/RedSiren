// CODE BY OisinMccarthy(LEGA11)
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const orderRoutes = require('./routes/orders');

const app = express();

app.use(express.json());

// Serves the frontend (public/) and the API from one origin, so there's
// no CORS configuration to get wrong.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);

// Any unknown /api path gets JSON rather than the HTML index page.
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Red Siren server on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
// CODE BY OisinMccarthy(LEGA11)