// utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.CLERK_SECRET_KEY || 'saksham-ndma-secret-key-2024';

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken, JWT_SECRET };