const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Quiz = require('../../lib/models/Quiz');
const Course = require('../../lib/models/Course');
const User = require('../../lib/models/User');
const { Notification } = require('../../lib/models/index');

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
      if (req.query.role === 'teacher') {
        if (user.role !== 'teacher' && user.role !== 'admin') {
          return res.status(403).json({ message: 'Not authorized' });
        }
        const quizzes = await Quiz.find({ teacher: user._id })
          .populate('course', 'title color')
          .populate('attempts.student', 'name email avatar')
          .sort({ createdAt: -1 });
        return res.json(quizzes);
      }

      if (req.query.role === 'student') {
        if (user.role !== 'student') {
          return res.status(403).json({ message: 'Not authorized' });
        }
        const now = new Date();
        const quizzes = await Quiz.find({ course: { $in: user.enrolledCourses } })
          .populate('course', 'title color')
          .populate('teacher', 'name avatar')
          .select('-questions.correctAnswer -attempts.answers');

        const withStatus = quizzes.map(q => {
          const myAttempt = q.attempts.find(a => a.student && a.student.toString() === user._id.toString());
          const isActive = q.isActive && q.startTime <= now && q.endTime >= now;
          return { ...q.toObject(), myAttempt: myAttempt || null, isLive: isActive };
        });
        return res.json(withStatus);
      }

      if (req.query.attempt) {
        if (user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });
        const quiz = await Quiz.findById(req.query.attempt)
          .populate('course', 'title')
          .populate('teacher', 'name');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const now = new Date();
        if (!quiz.isActive || now < quiz.startTime || now > quiz.endTime) {
          return res.status(400).json({ message: 'Quiz is not currently active' });
        }
        const alreadyAttempted = quiz.attempts.find(a => a.student && a.student.toString() === user._id.toString());
        if (alreadyAttempted) return res.status(400).json({ message: 'Already attempted this quiz' });

        const sanitized = { ...quiz.toObject(), questions: quiz.questions.map(q => ({
          question: q.question,
          options: q.options,
          marks: q.marks
        })) };
        return res.json(sanitized);
      }

      return res.status(400).json({ message: 'Unsupported quiz request' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      if (req.query.submit) {
        if (user.role !== 'student') return res.status(403).json({ message: 'Not authorized' });
        const quiz = await Quiz.findById(req.query.submit);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const now = new Date();
        if (now > quiz.endTime) return res.status(400).json({ message: 'Quiz time has expired' });

        const { answers, timeTaken } = req.body;
        let score = 0;
        const totalMarks = quiz.questions.reduce((acc, q) => acc + q.marks, 0);
        answers.forEach(ans => {
          const q = quiz.questions[ans.questionIndex];
          if (q && q.correctAnswer === ans.selectedAnswer) score += q.marks;
        });
        const percentage = Math.round((score / totalMarks) * 100);

        quiz.attempts.push({ student: user._id, answers, score, totalMarks, percentage, timeTaken });
        await quiz.save();

        const course = await Course.findById(quiz.course).populate('enrolledStudents.student', '_id');
        if (course) {
          const notification = await Notification.create({
            recipient: quiz.teacher,
            sender: user._id,
            title: 'Quiz Submitted',
            message: `${user.name} completed quiz "${quiz.title}" with ${percentage}%`,
            type: 'quiz'
          });
          // no socket support in serverless environment
        }

        return res.json({ score, totalMarks, percentage, passed: percentage >= quiz.passingScore });
      }

      if (user.role !== 'teacher' && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const quiz = await Quiz.create({ ...req.body, teacher: user._id });
      return res.status(201).json(quiz);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const quizId = req.query.toggle;
      if (!quizId) return res.status(400).json({ message: 'Quiz ID required' });
      if (user.role !== 'teacher' && user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      if (quiz.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      quiz.isActive = !quiz.isActive;
      await quiz.save();
      return res.json(quiz);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const quizId = req.query.delete;
      if (!quizId) return res.status(400).json({ message: 'Quiz ID required' });
      if (user.role !== 'teacher' && user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
      if (quiz.teacher.toString() !== user._id.toString() && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
      await quiz.deleteOne();
      return res.json({ message: 'Quiz deleted' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};