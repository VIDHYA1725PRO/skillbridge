const mongoose = require('mongoose');
const Course = require('../backend/models/Course');
const User = require('../backend/models/User');
const jwt = require('jsonwebtoken');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = async function handler(req, res) {
  await connectDB();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  if (req.method === 'GET') {
    try {
      if (req.query.id) {
        const course = await Course.findById(req.query.id)
          .populate('teacher', 'name avatar department bio')
          .populate('enrolledStudents.student', 'name email avatar studentId');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        return res.json(course);
      }

      const courses = await Course.find({ isPublished: true })
        .populate('teacher', 'name avatar department')
        .sort({ createdAt: -1 });
      return res.json(courses);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}