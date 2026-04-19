const mongoose = require('mongoose');
const User = require('../../lib/models/User');
const Course = require('../../lib/models/Course');
const { connectDB, authenticate, authorize } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  const { action } = req.query;

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      if (action === 'users') {
        // /api/admin/users
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
        return res.json(users);
      } else if (action === 'courses') {
        // /api/admin/courses
        authorize(user, 'admin');
        const courses = await Course.find()
          .populate('teacher', 'name email')
          .sort({ createdAt: -1 });
        return res.json(courses);
      } else {
        // /api/admin/stats
        authorize(user, 'admin');
        const Quiz = require('../../lib/models/Quiz');
        const Assignment = require('../../lib/models/Assignment');

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

        return res.json({
          students, teachers, admins, courses, assignments, quizzes,
          totalEnrollments: totalEnrollments[0]?.total || 0,
          recentUsers
        });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};;