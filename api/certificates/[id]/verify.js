const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../lib/models/User');
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

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
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
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Certificate ID required' });

    const cert = await Certificate.findByIdAndUpdate(
      id,
      { isVerified: true, verifiedBy: user._id, verifiedAt: new Date() },
      { new: true }
    ).populate('student', 'name email avatar studentId')
      .populate('course', 'title');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    return res.json(cert);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};