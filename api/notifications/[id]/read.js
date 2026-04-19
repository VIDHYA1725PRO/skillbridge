const mongoose = require('mongoose');
const { authenticate } = require('../../../lib/utils/auth');
const { Notification } = require('../../../lib/models/index');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticate(req);
    const { id } = req.query;
    const notification = await Notification.findOne({ _id: id, recipient: user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isRead = true;
    await notification.save();
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};