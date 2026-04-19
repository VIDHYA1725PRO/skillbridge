const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../lib/models/User');
const Course = require('../../lib/models/Course');
const { Certificate } = require('../../lib/models/index');

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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  if (user.role !== 'teacher' && user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    let certs;
    if (user.role === 'admin') {
      certs = await Certificate.find()
        .populate('student', 'name email avatar studentId')
        .populate('course', 'title')
        .sort({ createdAt: -1 });
    } else {
      const courses = await Course.find({ teacher: user._id }).select('enrolledStudents');
      const studentIds = courses.flatMap(c => c.enrolledStudents.map(e => e.student));
      certs = await Certificate.find({ student: { $in: studentIds } })
        .populate('student', 'name email avatar studentId')
        .populate('course', 'title')
        .sort({ createdAt: -1 });
    }
    return res.json(certs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};