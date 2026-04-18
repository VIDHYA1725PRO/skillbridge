const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All marked as read' });
});

router.put('/:id/read', protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Marked as read' });
});

// Admin/Teacher: send broadcast notification
router.post('/broadcast', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { recipients, title, message, type } = req.body;
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    const notifs = await Notification.insertMany(
      recipients.map(r => ({ recipient: r, sender: req.user._id, title, message, type: type || 'announcement' }))
    );
    
    recipients.forEach(r => {
      const socketId = onlineUsers.get(r.toString());
      if (socketId) io.to(socketId).emit('receive_notification', { title, message });
    });
    
    res.json({ message: `Sent to ${recipients.length} users`, count: notifs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
