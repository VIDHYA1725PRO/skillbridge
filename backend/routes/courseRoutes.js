const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// Get all published courses
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('teacher', 'name avatar department')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single course
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name avatar department bio')
      .populate('enrolledStudents.student', 'name email avatar studentId');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create course (teacher/admin)
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, teacher: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $push: { createdCourses: course._id } });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update course
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete course
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await course.deleteOne();
    await User.updateMany({ enrolledCourses: req.params.id }, { $pull: { enrolledCourses: req.params.id } });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enroll in course (student)
router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const alreadyEnrolled = course.enrolledStudents.some(
      e => e.student.toString() === req.user._id.toString()
    );
    if (alreadyEnrolled) return res.status(400).json({ message: 'Already enrolled' });

    course.enrolledStudents.push({ student: req.user._id });
    course.totalEnrollments += 1;
    await course.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });

    // Best-effort notify teacher. Enrollment should not fail if notifications cannot be sent.
    const teacherId = course.teacher?._id || course.teacher;
    if (teacherId) {
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const notification = await Notification.create({
          recipient: teacherId,
          sender: req.user._id,
          title: 'New Enrollment',
          message: `${req.user.name} enrolled in your course "${course.title}"`,
          type: 'course'
        });
        const teacherSocket = onlineUsers?.get?.(teacherId.toString());
        if (teacherSocket && io) {
          io.to(teacherSocket).emit('receive_notification', notification);
        }
      } catch (notifyErr) {
        console.error('Enroll notification error:', notifyErr.message);
      }
    }

    res.json({ message: 'Enrolled successfully', course });
  } catch (err) {
    console.error('Enroll route error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Unenroll from course
router.post('/:id/unenroll', protect, authorize('student'), async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, {
      $pull: { enrolledStudents: { student: req.user._id } },
      $inc: { totalEnrollments: -1 }
    });
    await User.findByIdAndUpdate(req.user._id, { $pull: { enrolledCourses: req.params.id } });
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get teacher's courses
router.get('/teacher/my-courses', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
      .populate('enrolledStudents.student', 'name email avatar studentId');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
