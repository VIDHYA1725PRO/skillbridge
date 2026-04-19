const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../lib/utils/auth');
const { Notification } = require('../../lib/models/index');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticate(req);
    authorize(user, 'teacher', 'admin');

    const { recipients, title, message, type } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients are required' });
    }

    const notifs = await Notification.insertMany(
      recipients.map(r => ({ recipient: r, sender: user._id, title, message, type: type || 'announcement' }))
    );

    return res.json({ message: `Sent to ${recipients.length} users`, count: notifs.length });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};