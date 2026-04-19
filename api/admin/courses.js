const mongoose = require('mongoose');
const Course = require('../../lib/models/Course');
const { connectDB, authenticate, authorize } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const user = await authenticate(req);
      authorize(user, 'admin');

      const courses = await Course.find()
        .populate('teacher', 'name email')
        .sort({ createdAt: -1 });
      res.json(courses);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};