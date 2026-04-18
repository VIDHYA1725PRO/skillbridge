const mongoose = require('mongoose');
const User = require('../lib/models/User');

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = async function handler(req, res) {
  // Only allow GET to trigger seed (for demo purposes)
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Clear existing demo data
    await User.deleteMany({ email: { $in: ['admin@demo.com', 'teacher@demo.com', 'student@demo.com'] } });

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'admin',
      department: 'Administration',
      bio: 'Platform administrator',
    });

    // Create Teacher
    const teacher = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'teacher@demo.com',
      password: 'demo123',
      role: 'teacher',
      department: 'Computer Science',
      bio: 'Senior professor with 10+ years in software engineering education.',
    });

    // Create Student
    const student = await User.create({
      name: 'Alex Kumar',
      email: 'student@demo.com',
      password: 'demo123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STU-2024-001',
      bio: 'Passionate about learning new technologies.',
    });

    res.json({
      message: 'Seed data created successfully',
      accounts: [
        { email: admin.email, password: 'demo123', role: 'admin' },
        { email: teacher.email, password: 'demo123', role: 'teacher' },
        { email: student.email, password: 'demo123', role: 'student' },
      ]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
