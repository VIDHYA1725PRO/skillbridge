const express = require('express');
const router = express.Router();
const { Progress, Todo } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

// Log study activity
router.post('/log', protect, authorize('student'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let progress = await Progress.findOne({ student: req.user._id, date: today });
    if (progress) {
      progress.studyMinutes += req.body.studyMinutes || 0;
      progress.activitiesCompleted += req.body.activitiesCompleted || 0;
      if (req.body.courseId && !progress.coursesWorkedOn.includes(req.body.courseId)) {
        progress.coursesWorkedOn.push(req.body.courseId);
      }
      await progress.save();
    } else {
      progress = await Progress.create({ student: req.user._id, date: today, ...req.body });
    }
    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get heatmap data (last 12 weeks)
router.get('/heatmap', protect, authorize('student'), async (req, res) => {
  try {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 83);
    twelveWeeksAgo.setHours(0, 0, 0, 0);
    const data = await Progress.find({ student: req.user._id, date: { $gte: twelveWeeksAgo } })
      .sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Todos
router.get('/todos', protect, async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(todos);
});

router.post('/todos', protect, async (req, res) => {
  const todo = await Todo.create({ user: req.user._id, ...req.body });
  res.status(201).json(todo);
});

router.put('/todos/:id', protect, async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(todo);
});

router.delete('/todos/:id', protect, async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
