const mongoose = require('mongoose');
const { Notification } = require('../../lib/models/index');
const { connectDB, authenticate, authorize } = require('../../lib/utils/auth');

module.exports = async function handler(req, res) {
  await connectDB();

  const { id } = req.query;

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const notifs = await Notification.find({ recipient: user._id })
        .populate('sender', 'name avatar role')
        .sort({ createdAt: -1 }).limit(50);
      res.json(notifs);
    } else if (req.method === 'PUT') {
      if (id === 'read-all') {
        await Notification.updateMany({ recipient: user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All marked as read' });
      } else if (id) {
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.json({ message: 'Marked as read' });
      } else {
        res.status(400).json({ message: 'Invalid request' });
      }
    } else if (req.method === 'POST') {
      authorize(user, 'admin', 'teacher');
      const { recipients, title, message, type } = req.body;

      const notifs = await Notification.insertMany(
        recipients.map(r => ({ recipient: r, sender: user._id, title, message, type: type || 'announcement' }))
      );

      res.json({ message: `Sent to ${recipients.length} users`, count: notifs.length });
    } else if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'Notification ID required' });
      await Notification.findByIdAndDelete(id);
      res.json({ message: 'Notification deleted' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};