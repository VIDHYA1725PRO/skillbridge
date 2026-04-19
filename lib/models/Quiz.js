const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Number, required: true },
    marks: { type: Number, default: 1 }
  }],
  duration: { type: Number, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  isActive: { type: Boolean, default: false },
  attempts: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ questionIndex: Number, selectedAnswer: Number }],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    timeTaken: { type: Number, default: 0 }
  }],
  passingScore: { type: Number, default: 50 },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);