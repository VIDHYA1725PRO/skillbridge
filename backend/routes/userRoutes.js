const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Get all teachers (for student to message)
router.get('/teachers', protect, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true })
      .select('name email avatar department bio');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user by id
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses', 'title thumbnail category color')
      .populate('createdCourses', 'title totalEnrollments');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
