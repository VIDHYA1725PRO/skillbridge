const mongoose = require('mongoose');
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
      if (req.query.teachers === 'true') {
        const teachers = await User.find({ role: 'teacher', isActive: true })
          .select('name email avatar department bio');
        return res.json(teachers);
      }

      if (req.query.id) {
        const profileUser = await User.findById(req.query.id)
          .select('-password')
          .populate('enrolledCourses', 'title thumbnail category color')
          .populate('createdCourses', 'title totalEnrollments');
        if (!profileUser) return res.status(404).json({ message: 'User not found' });
        return res.json(profileUser);
      }

      // Get current user profile
      const currentUser = await User.findById(user._id)
        .populate('enrolledCourses', 'title thumbnail category teacher color')
        .populate('createdCourses', 'title thumbnail category enrolledStudents');
      return res.json(currentUser);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}