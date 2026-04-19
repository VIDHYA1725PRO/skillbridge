const mongoose = require('mongoose');
const User = require('../../lib/models/User');
const Course = require('../../lib/models/Course');
const Assignment = require('../../lib/models/Assignment');
const Quiz = require('../../lib/models/Quiz');
const { connectDB, authenticate, authorize } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    try {
      const user = await authenticate(req);
      authorize(user, 'admin');

      const [students, teachers, admins, courses, assignments, quizzes] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        User.countDocuments({ role: 'admin' }),
        Course.countDocuments(),
        Assignment.countDocuments(),
        Quiz.countDocuments(),
      ]);

      const totalEnrollments = await Course.aggregate([
        { $group: { _id: null, total: { $sum: '$totalEnrollments' } } }
      ]);

      const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role avatar createdAt');

      res.json({
        students, teachers, admins, courses, assignments, quizzes,
        totalEnrollments: totalEnrollments[0]?.total || 0,
        recentUsers
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};