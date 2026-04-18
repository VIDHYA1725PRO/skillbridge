const mongoose = require('mongoose');
const Assignment = require('../backend/models/Assignment');
const User = require('../backend/models/User');
const jwt = require('jsonwebtoken');

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

export default async function handler(req, res) {
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

  if (req.method === 'POST') {
    try {
      const { assignmentId, content, fileUrl } = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      // Check if student is enrolled in the course
      if (!user.enrolledCourses.includes(assignment.course.toString())) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      // Remove existing submission if any
      assignment.submissions = assignment.submissions.filter(
        s => s.student.toString() !== user._id.toString()
      );

      // Add new submission
      assignment.submissions.push({
        student: user._id,
        content,
        fileUrl,
        submittedAt: new Date()
      });

      await assignment.save();

      return res.status(201).json({ message: 'Submission successful' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}