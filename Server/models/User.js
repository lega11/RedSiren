// CODE BY OisinMccarthy(LEGA11)
const mongoose = require('mongoose');

// We store passwordHash, never the plain password. bcrypt.hash() (see
// routes/auth.js) turns "hunter2" into a one-way scrambled string that
// can be checked against but never reversed back into the password.
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
// CODE BY OisinMccarthy(LEGA11)
