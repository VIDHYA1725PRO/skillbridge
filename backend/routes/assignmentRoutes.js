const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Get assignments for student (their enrolled courses)
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const user = require('../models/User');
    const u = await user.findById(req.user._id).select('enrolledCourses');
    const assignments = await Assignment.find({ 
      course: { $in: u.enrolledCourses }, isActive: true 
    }).populate('course', 'title color').populate('teacher', 'name avatar')
      .sort({ deadline: 1 });
    
    const withStatus = assignments.map(a => {
      const submission = a.submissions.find(s => s.student.toString() === req.user._id.toString());
      return { ...a.toObject(), mySubmission: submission || null };
    });
    res.json(withStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get assignments for teacher
router.get('/teacher', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id })
      .populate('course', 'title color')
      .populate('submissions.student', 'name email avatar studentId')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create assignment
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, teacher: req.user._id });
    
    // Notify enrolled students
    const Course = require('../models/Course');
    const course = await Course.findById(req.body.course).populate('enrolledStudents.student', '_id name');
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    for (const enrollment of course.enrolledStudents) {
      const notif = await Notification.create({
        recipient: enrollment.student._id,
        sender: req.user._id,
        title: 'New Assignment',
        message: `New assignment "${assignment.title}" posted in ${course.title}`,
        type: 'assignment'
      });
      const socketId = onlineUsers.get(enrollment.student._id.toString());
      if (socketId) io.to(socketId).emit('receive_notification', notif);
    }
    
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit assignment (student)
router.post('/:id/submit', protect, authorize('student'), upload.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    const alreadySubmitted = assignment.submissions.find(
      s => s.student.toString() === req.user._id.toString()
    );
    if (alreadySubmitted) return res.status(400).json({ message: 'Already submitted' });

    const result = await uploadToCloudinary(req.file.buffer, 'assignments');
    const fileUrl = result.secure_url;
    const fileName = req.file.originalname;

    const isLate = new Date() > new Date(assignment.deadline);
    assignment.submissions.push({
      student: req.user._id,
      fileUrl, fileName,
      status: isLate ? 'late' : 'submitted'
    });
    await assignment.save();

    // Best-effort notify teacher. Submission should not fail if notifications cannot be sent.
    if (assignment.teacher) {
      try {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const notif = await Notification.create({
          recipient: assignment.teacher,
          sender: req.user._id,
          title: 'Assignment Submitted',
          message: `${req.user.name} submitted "${assignment.title}"`,
          type: 'assignment'
        });
        const socketId = onlineUsers?.get?.(assignment.teacher.toString());
        if (socketId && io) io.to(socketId).emit('receive_notification', notif);
      } catch (notifyErr) {
        console.error('Assignment submit notification error:', notifyErr.message);
      }
    }

    res.json({ message: 'Assignment submitted successfully' });
  } catch (err) {
    console.error('Assignment submit error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Grade submission
router.put('/:id/grade/:studentId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    const submission = assignment.submissions.find(
      s => s.student.toString() === req.params.studentId
    );
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await assignment.save();

    // Notify student
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const notif = await Notification.create({
      recipient: req.params.studentId,
      sender: req.user._id,
      title: 'Assignment Graded',
      message: `Your assignment "${assignment.title}" has been graded. Score: ${grade}/${assignment.maxMarks}`,
      type: 'grade'
    });
    const socketId = onlineUsers.get(req.params.studentId);
    if (socketId) io.to(socketId).emit('receive_notification', notif);

    res.json({ message: 'Graded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete assignment
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
