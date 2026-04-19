const mongoose = require('mongoose');
const User = require('../../lib/models/User');
const { connectDB, authenticate } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      await authenticate(req);
      const teachers = await User.find({ role: 'teacher' }).select('name email avatar');
      res.json(teachers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};