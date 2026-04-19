const mongoose = require('mongoose');
const User = require('../../lib/models/User');
const { connectDB, authenticate, authorize } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const user = await authenticate(req);
      authorize(user, 'admin');

      const { role, search } = req.query;
      let query = {};
      if (role) query.role = role;
      if (search) query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
      const users = await User.find(query).select('-password')
        .populate('enrolledCourses', 'title')
        .populate('createdCourses', 'title')
        .sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};