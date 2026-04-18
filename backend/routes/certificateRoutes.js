const express = require('express');
const router = express.Router();
const { Certificate } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

// Get student certificates
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const certs = await Certificate.find({ student: req.user._id })
      .populate('course', 'title').populate('verifiedBy', 'name');
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload certificate
router.post('/upload', protect, authorize('student'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.buffer, 'certificates');
    const cert = await Certificate.create({
      student: req.user._id,
      title: req.body.title,
      issuer: req.body.issuer,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      course: req.body.course || null,
    });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teacher: get all certificates of enrolled students
router.get('/students', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    let certs;
    if (req.user.role === 'admin') {
      certs = await Certificate.find().populate('student', 'name email avatar studentId')
        .populate('course', 'title').sort({ createdAt: -1 });
    } else {
      const Course = require('../models/Course');
      const courses = await Course.find({ teacher: req.user._id }).select('enrolledStudents');
      const studentIds = courses.flatMap(c => c.enrolledStudents.map(e => e.student));
      certs = await Certificate.find({ student: { $in: studentIds } })
        .populate('student', 'name email avatar studentId')
        .populate('course', 'title').sort({ createdAt: -1 });
    }
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify certificate
router.put('/:id/verify', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(req.params.id,
      { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
