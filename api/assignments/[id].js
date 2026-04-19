const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../lib/models/User');
const Assignment = require('../../lib/models/Assignment');

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

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const assignment = await Assignment.findById(req.query.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await assignment.deleteOne();
    return res.json({ message: 'Assignment deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};