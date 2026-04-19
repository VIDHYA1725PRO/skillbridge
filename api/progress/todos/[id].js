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
    const { id } = req.query;
    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    if (todo.user.toString() !== user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    if (req.method === 'PUT') {
      const updates = {
        title: req.body.title ?? todo.title,
        description: req.body.description ?? todo.description,
        priority: req.body.priority ?? todo.priority,
        dueDate: req.body.dueDate ?? todo.dueDate,
        isCompleted: typeof req.body.isCompleted === 'boolean' ? req.body.isCompleted : todo.isCompleted,
      };
      const updated = await Todo.findByIdAndUpdate(id, updates, { new: true });
      return res.json(updated);
    }

    if (req.method === 'DELETE') {
      await todo.deleteOne();
      return res.json({ message: 'Todo deleted' });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};