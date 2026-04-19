const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../../../lib/models/User');
const Assignment = require('../../../../lib/models/Assignment');

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

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id, studentId } = req.query;
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const submission = assignment.submissions.find(sub => sub.student.toString() === studentId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const parsedGrade = Number(grade);
    if (!Number.isFinite(parsedGrade) || parsedGrade < 0 || parsedGrade > assignment.maxMarks) {
      return res.status(400).json({ message: `Grade must be a number between 0 and ${assignment.maxMarks}` });
    }

    submission.grade = parsedGrade;
    submission.feedback = typeof feedback === 'string' ? feedback : submission.feedback;
    submission.status = 'graded';
    await assignment.save();

    return res.json({ message: 'Submission graded', submission });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};