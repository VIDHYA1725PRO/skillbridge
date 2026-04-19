const mongoose = require('mongoose');
const { authenticate } = require('../../lib/utils/auth');
const User = require('../../lib/models/User');

module.exports = async function handler(req, res) {
  await mongoose.connect(process.env.MONGODB_URI);

  if (req.method === 'GET') {
    try {
      const user = await authenticate(req);
      res.json(user);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};