const mongoose = require('mongoose');
const { authenticate } = require('../../lib/utils/auth');
const { Progress } = require('../../lib/models/index');

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
    const studyMinutes = Number(req.body.studyMinutes || 0);
    const activitiesCompleted = Number(req.body.activitiesCompleted || 0);
    const coursesWorkedOn = Array.isArray(req.body.coursesWorkedOn) ? req.body.coursesWorkedOn : [];
    const rawDate = req.body.date ? new Date(req.body.date) : new Date();
    const date = new Date(rawDate.toISOString().slice(0, 10));

    if (!Number.isFinite(studyMinutes) || studyMinutes < 0) {
      return res.status(400).json({ message: 'studyMinutes must be a non-negative number' });
    }

    const progress = await Progress.findOneAndUpdate(
      { student: user._id, date },
      {
        $inc: { studyMinutes, activitiesCompleted },
        $addToSet: { coursesWorkedOn: { $each: coursesWorkedOn } }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(progress);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};