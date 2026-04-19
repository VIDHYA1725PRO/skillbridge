const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../lib/models/User');
const { Certificate } = require('../../lib/models/index');
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  if (user.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    await runMulter(req, res);
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await uploadToCloudinary(req.file.buffer, 'certificates');
    const cert = await Certificate.create({
      student: user._id,
      title: req.body.title,
      issuer: req.body.issuer,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      course: req.body.course || null,
    });

    return res.status(201).json(cert);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};