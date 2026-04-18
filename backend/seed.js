require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

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
  console.log('✅ Admin created:', admin.email);

  // Create Teacher
  const teacher = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'teacher@demo.com',
    password: 'demo123',
    role: 'teacher',
    department: 'Computer Science',
    bio: 'Senior professor with 10+ years in software engineering education.',
  });
  console.log('✅ Teacher created:', teacher.email);

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
  console.log('✅ Student created:', student.email);

  // Create Demo Courses
  const courses = await Course.insertMany([
    {
      title: 'Introduction to Python Programming',
      description: 'Learn Python from scratch. This comprehensive course covers variables, loops, functions, OOP, and real-world projects.',
      category: 'Programming',
      level: 'Beginner',
      teacher: teacher._id,
      duration: '8 weeks',
      color: '#A8D8EA',
      tags: ['python', 'programming', 'beginner'],
      isPublished: true,
    },
    {
      title: 'Data Structures & Algorithms',
      description: 'Master essential DSA concepts including arrays, linked lists, trees, graphs, sorting, and searching algorithms.',
      category: 'Programming',
      level: 'Intermediate',
      teacher: teacher._id,
      duration: '10 weeks',
      color: '#B5EAD7',
      tags: ['dsa', 'algorithms', 'computer science'],
      isPublished: true,
    },
    {
      title: 'Web Development with React',
      description: 'Build modern web applications using React, hooks, context API, and connect to real backends.',
      category: 'Programming',
      level: 'Intermediate',
      teacher: teacher._id,
      duration: '12 weeks',
      color: '#C7CEEA',
      tags: ['react', 'javascript', 'web'],
      isPublished: true,
    },
    {
      title: 'Database Design & SQL',
      description: 'Learn relational database design, normalization, complex SQL queries, and database optimization.',
      category: 'Data Science',
      level: 'Beginner',
      teacher: teacher._id,
      duration: '6 weeks',
      color: '#FFDAC1',
      tags: ['sql', 'database', 'mysql'],
      isPublished: true,
    },
    {
      title: 'Machine Learning Fundamentals',
      description: 'Introduction to ML concepts, supervised and unsupervised learning, model evaluation, and scikit-learn.',
      category: 'Data Science',
      level: 'Advanced',
      teacher: teacher._id,
      duration: '14 weeks',
      color: '#FFB7B2',
      tags: ['ml', 'python', 'ai'],
      isPublished: true,
    },
  ]);

  // Update teacher's created courses
  await User.findByIdAndUpdate(teacher._id, { createdCourses: courses.map(c => c._id) });

  // Enroll student in first 2 courses
  for (let i = 0; i < 2; i++) {
    await Course.findByIdAndUpdate(courses[i]._id, {
      $push: { enrolledStudents: { student: student._id } },
      $inc: { totalEnrollments: 1 },
    });
  }
  await User.findByIdAndUpdate(student._id, {
    enrolledCourses: [courses[0]._id, courses[1]._id],
  });

  console.log('✅ Created', courses.length, 'courses');
  console.log('✅ Enrolled student in 2 courses');
  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('   Admin:   admin@demo.com  / demo123');
  console.log('   Teacher: teacher@demo.com / demo123');
  console.log('   Student: student@demo.com / demo123');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
