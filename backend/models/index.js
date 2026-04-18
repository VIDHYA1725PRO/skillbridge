const mongoose = require('mongoose');

// Message Model
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  subject: { type: String, default: 'General Query' },
  courseContext: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['assignment', 'quiz', 'course', 'grade', 'message', 'system', 'announcement'], default: 'system' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
}, { timestamps: true });

// Certificate Model
const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  issuer: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Progress Model  
const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  studyMinutes: { type: Number, default: 0 },
  activitiesCompleted: { type: Number, default: 0 },
  coursesWorkedOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
}, { timestamps: true });

// Todo Model
const todoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);
const Progress = mongoose.model('Progress', progressSchema);
const Todo = mongoose.model('Todo', todoSchema);

module.exports = { Message, Notification, Certificate, Progress, Todo };
