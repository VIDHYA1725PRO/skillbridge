const mongoose = require('mongoose');
const Assignment = require('../../lib/models/Assignment');
const User = require('../../lib/models/User');
const jwt = require('jsonwebtoken');
const { upload, uploadToCloudinary } = require('../../backend/middleware/upload');

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

const runMulter = (req, res) => new Promise((resolve, reject) => {
  upload.single('file')(req, res, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

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

  if (req.method === 'POST') {
    try {
      await runMulter(req, res);
      const { assignmentId, content } = req.body;

      if (!assignmentId) {
        return res.status(400).json({ message: 'Assignment ID required' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (!user.enrolledCourses.map(c => c.toString()).includes(assignment.course.toString())) {
        return res.status(403).json({ message: 'Not enrolled in this course' });
      }

      const submission = {
        student: user._id,
        fileUrl: null,
        fileName: null,
        content: content || '',
        submittedAt: new Date(),
        status: 'submitted'
      };

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'assignments');
        submission.fileUrl = uploadResult.secure_url;
        submission.fileName = req.file.originalname;
      }

      assignment.submissions = assignment.submissions.filter(
        (s) => s.student.toString() !== user._id.toString()
      );
      assignment.submissions.push(submission);
      await assignment.save();

      return res.status(201).json({ message: 'Submission successful' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
