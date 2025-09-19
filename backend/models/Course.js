import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'pending', 'dropped'],
      default: 'enrolled'
    }
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    room: String
  }],
  syllabus: [{
    topic: String,
    description: String,
    week: Number
  }],
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    order: {
      type: Number,
      required: true
    },
    content: [{
      type: {
        type: String,
        enum: ['video', 'document', 'quiz', 'assignment', 'reading'],
        required: true
      },
      title: String,
      url: String,
      duration: Number, // in minutes
      isCompleted: {
        type: Boolean,
        default: false
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  courseStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'link']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  announcements: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ instructor: 1 });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ 'students.student': 1 });

// Virtual for enrolled student count
courseSchema.virtual('enrolledCount').get(function() {
  return this.students.filter(s => s.student && s.status === 'enrolled').length;
});

// Virtual for course progress based on modules
courseSchema.virtual('progress').get(function() {
  if (!this.modules || this.modules.length === 0) {
    // Fallback to time-based progress if no modules
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  }
  
  const totalModules = this.modules.length;
  const completedModules = this.modules.filter(module => module.status === 'completed').length;
  
  return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
});

// Virtual for module progress
courseSchema.virtual('moduleProgress').get(function() {
  if (!this.modules || this.modules.length === 0) return [];
  
  return this.modules.map(module => {
    const status = module.status || 'not_started';
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
    
    return {
      moduleId: module._id,
      title: module.title,
      status,
      progress,
      isCompleted: status === 'completed'
    };
  });
});

// Method to check if user is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.students.some(s => 
    s.student && s.student.toString() === studentId.toString() && s.status === 'enrolled'
  );
};

// Method to enroll student
courseSchema.methods.enrollStudent = function(studentId) {
  if (this.isStudentEnrolled(studentId)) {
    throw new Error('Student is already enrolled in this course');
  }
  
  if (this.enrolledCount >= this.maxStudents) {
    throw new Error('Course is full');
  }
  
  this.students.push({
    student: studentId,
    status: 'enrolled'
  });
  
  return this.save();
};

// Method to drop student
courseSchema.methods.dropStudent = function(studentId) {
  const studentIndex = this.students.findIndex(s => 
    s.student && s.student.toString() === studentId.toString()
  );
  
  if (studentIndex === -1) {
    throw new Error('Student is not enrolled in this course');
  }
  
  this.students[studentIndex].status = 'dropped';
  return this.save();
};

// Method to clean up null student references
courseSchema.methods.cleanupNullStudents = function() {
  this.students = this.students.filter(s => s.student !== null);
  return this.save();
};

// Method to add module
courseSchema.methods.addModule = function(moduleData) {
  const order = this.modules.length + 1;
  this.modules.push({
    ...moduleData,
    order
  });
  return this.save();
};

// Method to update module
courseSchema.methods.updateModule = function(moduleId, updateData) {
  const module = this.modules.id(moduleId);
  if (!module) {
    throw new Error('Module not found');
  }
  Object.assign(module, updateData);
  return this.save();
};

// Method to delete module
courseSchema.methods.deleteModule = function(moduleId) {
  this.modules.pull(moduleId);
  // Reorder remaining modules
  this.modules.forEach((module, index) => {
    module.order = index + 1;
  });
  return this.save();
};

// Method to mark content as completed
courseSchema.methods.markContentCompleted = function(moduleId, contentId, isCompleted = true) {
  const module = this.modules.id(moduleId);
  if (!module) {
    throw new Error('Module not found');
  }
  
  const content = module.content.id(contentId);
  if (!content) {
    throw new Error('Content not found');
  }
  
  content.isCompleted = isCompleted;
  
  // Update course status based on overall progress
  const progress = this.progress;
  if (progress === 0) {
    this.courseStatus = 'not_started';
  } else if (progress === 100) {
    this.courseStatus = 'completed';
  } else {
    this.courseStatus = 'in_progress';
  }
  
  return this.save();
};

// Method to update course status
courseSchema.methods.updateCourseStatus = function(status) {
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    throw new Error('Invalid course status');
  }
  this.courseStatus = status;
  return this.save();
};

export default mongoose.model('Course', courseSchema);