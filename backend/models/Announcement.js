import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  readBy: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ course: 1, createdAt: -1 });
announcementSchema.index({ author: 1 });

// Virtual for read count
announcementSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Method to mark as read by student
announcementSchema.methods.markAsRead = function(studentId) {
  const existingRead = this.readBy.find(r => r.student.toString() === studentId.toString());
  if (!existingRead) {
    this.readBy.push({ student: studentId });
  }
  return this.save();
};

// Method to check if read by student
announcementSchema.methods.isReadBy = function(studentId) {
  return this.readBy.some(r => r.student.toString() === studentId.toString());
};

export default mongoose.model('Announcement', announcementSchema);