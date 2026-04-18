const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// Get quizzes for student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const User = require('../models/User');
    const u = await User.findById(req.user._id).select('enrolledCourses');
    const now = new Date();
    const quizzes = await Quiz.find({ course: { $in: u.enrolledCourses } })
      .populate('course', 'title color').populate('teacher', 'name avatar')
      .select('-questions.correctAnswer -attempts.answers');
    
    const withStatus = quizzes.map(q => {
      const myAttempt = q.attempts.find(a => a.student && a.student.toString() === req.user._id.toString());
      const isActive = q.isActive && q.startTime <= now && q.endTime >= now;
      return { ...q.toObject(), myAttempt: myAttempt || null, isLive: isActive };
    });
    res.json(withStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get quiz for attempting (with questions, no answers)
router.get('/:id/attempt', protect, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title').populate('teacher', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
    const now = new Date();
    if (!quiz.isActive || now < quiz.startTime || now > quiz.endTime) {
      return res.status(400).json({ message: 'Quiz is not currently active' });
    }
    const alreadyAttempted = quiz.attempts.find(a => a.student && a.student.toString() === req.user._id.toString());
    if (alreadyAttempted) return res.status(400).json({ message: 'Already attempted this quiz' });

    const sanitized = { ...quiz.toObject(), questions: quiz.questions.map(q => ({ ...q.toObject(), correctAnswer: undefined })) };
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit quiz attempt
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const now = new Date();
    if (now > quiz.endTime) return res.status(400).json({ message: 'Quiz time has expired' });

    let score = 0;
    const totalMarks = quiz.questions.reduce((acc, q) => acc + q.marks, 0);
    answers.forEach(ans => {
      const q = quiz.questions[ans.questionIndex];
      if (q && q.correctAnswer === ans.selectedAnswer) score += q.marks;
    });
    const percentage = Math.round((score / totalMarks) * 100);

    quiz.attempts.push({ student: req.user._id, answers, score, totalMarks, percentage, timeTaken });
    await quiz.save();

    // Notify teacher
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const notif = await Notification.create({
      recipient: quiz.teacher,
      sender: req.user._id,
      title: 'Quiz Submitted',
      message: `${req.user.name} completed quiz "${quiz.title}" with ${percentage}%`,
      type: 'quiz'
    });
    const socketId = onlineUsers.get(quiz.teacher.toString());
    if (socketId) io.to(socketId).emit('receive_notification', notif);

    res.json({ score, totalMarks, percentage, passed: percentage >= quiz.passingScore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teacher: get quizzes
router.get('/teacher', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacher: req.user._id })
      .populate('course', 'title color')
      .populate('attempts.student', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create quiz
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, teacher: req.user._id });

    // Notify enrolled students
    const Course = require('../models/Course');
    const course = await Course.findById(req.body.course).populate('enrolledStudents.student', '_id');
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    for (const enrollment of course.enrolledStudents) {
      const notif = await Notification.create({
        recipient: enrollment.student._id,
        sender: req.user._id,
        title: 'New Quiz',
        message: `A new quiz "${quiz.title}" has been scheduled in ${course.title}`,
        type: 'quiz'
      });
      const socketId = onlineUsers.get(enrollment.student._id.toString());
      if (socketId) io.to(socketId).emit('receive_notification', notif);
    }

    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle quiz active
router.put('/:id/toggle', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    quiz.isActive = !quiz.isActive;
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete quiz
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
