const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../lib/models/User');
const { Message } = require('../../lib/models/index');

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

  try {
    const messages = await Message.find({
      $or: [{ sender: user._id }, { receiver: user._id }]
    }).populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role')
      .sort({ createdAt: -1 });

    const conversations = {};
    messages.forEach(msg => {
      const otherId = msg.sender._id.toString() === user._id.toString()
        ? msg.receiver._id.toString() : msg.sender._id.toString();
      if (!conversations[otherId]) {
        const other = msg.sender._id.toString() === user._id.toString() ? msg.receiver : msg.sender;
        conversations[otherId] = { user: other, lastMessage: msg, unreadCount: 0 };
      }
      if (!msg.isRead && msg.receiver._id.toString() === user._id.toString()) {
        conversations[otherId].unreadCount++;
      }
    });

    return res.json(Object.values(conversations));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};