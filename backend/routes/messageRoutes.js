const express = require('express');
const router = express.Router();
const { Message } = require('../models/index');
const { protect } = require('../middleware/auth');

// Get conversations list
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).populate('sender', 'name avatar role').populate('receiver', 'name avatar role')
      .sort({ createdAt: -1 });

    const conversations = {};
    messages.forEach(msg => {
      const otherId = msg.sender._id.toString() === req.user._id.toString()
        ? msg.receiver._id.toString() : msg.sender._id.toString();
      if (!conversations[otherId]) {
        const other = msg.sender._id.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
        conversations[otherId] = { user: other, lastMessage: msg, unreadCount: 0 };
      }
      if (!msg.isRead && msg.receiver._id.toString() === req.user._id.toString()) {
        conversations[otherId].unreadCount++;
      }
    });
    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages with specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).populate('sender', 'name avatar').populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });
    
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content, subject, courseContext } = req.body;
    const message = await Message.create({
      sender: req.user._id, receiver: receiverId, content, subject, courseContext
    });
    const populated = await message.populate('sender', 'name avatar');
    
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const socketId = onlineUsers.get(receiverId);
    if (socketId) io.to(socketId).emit('receive_message', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
