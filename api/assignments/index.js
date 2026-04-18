const mongoose = require('mongoose');
const Assignment = require('../backend/models/Assignment');
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
      let assignments;
      if (user.role === 'student') {
        assignments = await Assignment.find({
          course: { $in: user.enrolledCourses },
          isActive: true
        }).populate('course', 'title color').populate('teacher', 'name avatar')
          .sort({ deadline: 1 });

        const withStatus = assignments.map(a => {
          const submission = a.submissions.find(s => s.student.toString() === user._id.toString());
          return { ...a.toObject(), mySubmission: submission || null };
        });
        return res.json(withStatus);
      } else {
        assignments = await Assignment.find({ teacher: user._id })
          .populate('course', 'title color')
          .populate('submissions.student', 'name email avatar studentId')
          .sort({ createdAt: -1 });
        return res.json(assignments);
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'POST') {
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    try {
      const assignment = await Assignment.create({ ...req.body, teacher: user._id });
      return res.status(201).json(assignment);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}