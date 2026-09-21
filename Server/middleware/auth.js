// CODE BY OisinMccarthy(LEGA11)
const jwt = require('jsonwebtoken');

// Protects a route: the browser must send "Authorization: Bearer <token>",
// the token we handed out at login/register. No token, or a bad/expired
// one, means no booking — this is what makes an account required to buy.
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Log in to do that.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Log in again.' });
  }
};
// CODE BY OisinMccarthy(LEGA11)
