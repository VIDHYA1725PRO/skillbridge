const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, default: null },
  feedback: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  attachmentUrl: { type: String, default: '' },
  submissions: [submissionSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
