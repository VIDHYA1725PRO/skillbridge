const mongoose = require('mongoose');
const Course = require('../../lib/models/Course');
const User = require('../../lib/models/User');
const { Notification } = require('../../lib/models/index');
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

  if (req.method === 'GET') {
    try {
      if (req.query.teacher === 'true') {
        if (user.role !== 'teacher' && user.role !== 'admin') {
          return res.status(403).json({ message: 'Not authorized' });
        }
        const courses = await Course.find({ teacher: user._id })
          .populate('enrolledStudents.student', 'name email avatar studentId')
          .sort({ createdAt: -1 });
        return res.json(courses);
      }

      if (req.query.id) {
        const course = await Course.findById(req.query.id)
          .populate('teacher', 'name avatar department bio')
          .populate('enrolledStudents.student', 'name email avatar studentId');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        return res.json(course);
      }

      const courses = await Course.find({ isPublished: true })
        .populate('teacher', 'name avatar department')
        .sort({ createdAt: -1 });
      return res.json(courses);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, id } = req.query;

      if (action === 'enroll') {
        if (user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        const alreadyEnrolled = course.enrolledStudents.some(e => e.student.toString() === user._id.toString());
        if (alreadyEnrolled) return res.status(400).json({ message: 'Already enrolled' });
        course.enrolledStudents.push({ student: user._id });
        course.totalEnrollments += 1;
        await course.save();
        await User.findByIdAndUpdate(user._id, { $push: { enrolledCourses: course._id } });
        return res.json({ message: 'Enrolled successfully', course });
      }

      if (action === 'unenroll') {
        if (user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });
        await Course.findByIdAndUpdate(id, {
          $pull: { enrolledStudents: { student: user._id } },
          $inc: { totalEnrollments: -1 }
        });
        await User.findByIdAndUpdate(user._id, { $pull: { enrolledCourses: id } });
        return res.json({ message: 'Unenrolled successfully' });
      }

      if (user.role !== 'teacher' && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const course = await Course.create({ ...req.body, teacher: user._id });
      await User.findByIdAndUpdate(user._id, { $push: { createdCourses: course._id } });
      return res.status(201).json(course);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ message: 'Course ID required' });
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      if (course.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const updated = await Course.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id;
      if (!id) return res.status(400).json({ message: 'Course ID required' });
      const course = await Course.findById(id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      if (course.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      await course.deleteOne();
      await User.updateMany({ enrolledCourses: id }, { $pull: { enrolledCourses: id } });
      return res.json({ message: 'Course deleted' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};