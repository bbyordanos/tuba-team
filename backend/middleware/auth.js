const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tuba_secret_2024';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user?.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
  next();
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch {}
  }
  next();
};

module.exports = { authMiddleware, ownerOnly, optionalAuth, JWT_SECRET };
