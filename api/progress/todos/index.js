const mongoose = require('mongoose');
const { authenticate } = require('../../../lib/utils/auth');
const { Todo } = require('../../../lib/models/index');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = async function handler(req, res) {
  await connectDB();

  try {
    const user = await authenticate(req);

    if (req.method === 'GET') {
      const todos = await Todo.find({ user: user._id }).sort({ createdAt: -1 });
      return res.json(todos);
    }

    if (req.method === 'POST') {
      const todo = await Todo.create({
        user: user._id,
        title: req.body.title,
        description: req.body.description || '',
        priority: req.body.priority || 'medium',
        dueDate: req.body.dueDate || null,
      });
      return res.status(201).json(todo);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};