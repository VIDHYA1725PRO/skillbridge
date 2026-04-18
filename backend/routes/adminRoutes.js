const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// Dashboard stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [students, teachers, admins, courses, assignments, quizzes] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Assignment.countDocuments(),
      Quiz.countDocuments(),
    ]);
    const totalEnrollments = await Course.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEnrollments' } } }
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role avatar createdAt');
    res.json({
      students, teachers, admins, courses, assignments, quizzes,
      totalEnrollments: totalEnrollments[0]?.total || 0,
      recentUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(query).select('-password')
      .populate('enrolledCourses', 'title')
      .populate('createdCourses', 'title')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add user
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete/deactivate user
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanently delete user
router.delete('/users/:id/permanent', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all courses
router.get('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email avatar')
      .populate('enrolledStudents.student', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add course (admin)
router.post('/courses', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete course
router.delete('/courses/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    await User.updateMany({ enrolledCourses: req.params.id }, { $pull: { enrolledCourses: req.params.id } });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send announcement to all users
router.post('/announce', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;
    let query = {};
    if (targetRole && targetRole !== 'all') query.role = targetRole;
    const users = await User.find(query).select('_id');
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    const notifs = await Notification.insertMany(
      users.map(u => ({ recipient: u._id, sender: req.user._id, title, message, type: 'announcement' }))
    );
    users.forEach(u => {
      const socketId = onlineUsers.get(u._id.toString());
      if (socketId) io.to(socketId).emit('receive_notification', { title, message, type: 'announcement' });
    });
    res.json({ message: `Announcement sent to ${users.length} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
