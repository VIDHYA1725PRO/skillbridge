const mongoose = require('mongoose');
const { authenticate } = require('../../lib/utils/auth');
const { Progress } = require('../../lib/models/index');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = async function handler(req, res) {
  await connectDB();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const user = await authenticate(req);
    const days = Number(req.query.days) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const rangeDate = new Date(startDate.toISOString().slice(0, 10));

    const progress = await Progress.find({
      student: user._id,
      date: { $gte: rangeDate }
    }).sort({ date: 1 });

    return res.json(progress);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};