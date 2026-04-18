const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  category: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ 
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 }
  }],
  modules: [{
    title: { type: String },
    description: { type: String },
    duration: { type: String },
    order: { type: Number }
  }],
  duration: { type: String, default: '' },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: true },
  totalEnrollments: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  color: { type: String, default: '#A8D8EA' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);