import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'announcement'],
    default: 'text'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ course: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ course: 1, isDeleted: 1 });

// Virtual for reaction counts
messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method to get unread count for a course
messageSchema.statics.getUnreadCount = async function(courseId, userId) {
  return this.countDocuments({
    course: courseId,
    isDeleted: false,
    'readBy.user': { $ne: userId },
    sender: { $ne: userId } // Don't count own messages
  });
};

// Method to get recent messages for a course
messageSchema.statics.getRecentMessages = async function(courseId, limit = 50, before = null) {
  const query = {
    course: courseId,
    isDeleted: false
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .populate('sender', 'profile.firstName profile.lastName email role')
    .populate('replyTo', 'content sender')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'profile.firstName profile.lastName email'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Method to search messages in a course
messageSchema.statics.searchMessages = async function(courseId, searchTerm, limit = 20) {
  return this.find({
    course: courseId,
    isDeleted: false,
    content: { $regex: searchTerm, $options: 'i' }
  })
    .populate('sender', 'profile.firstName profile.lastName email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware to handle mentions
messageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract mentions from content (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1]);
    }
    
    // You could resolve usernames to user IDs here
    // For now, we'll leave mentions as is
  }
  next();
});

// Transform output to include virtual fields
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

export default mongoose.model('Message', messageSchema);