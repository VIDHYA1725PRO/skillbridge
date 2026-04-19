const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

const authenticate = async (req) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new Error('Not authorized, no token');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  } catch (err) {
    throw new Error('Not authorized, token failed');
  }
};

const authorize = (user, ...roles) => {
  if (!roles.includes(user.role)) {
    throw new Error(`Role ${user.role} is not authorized`);
  }
};

module.exports = { connectDB, authenticate, authorize };