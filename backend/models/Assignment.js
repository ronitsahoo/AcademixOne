import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  files: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  textSubmission: {
    type: String,
    trim: true
  },
  grade: {
    score: {
      type: Number,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true
    },
    feedback: {
      type: String,
      trim: true
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  isLate: {
    type: Boolean,
    default: false
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxScore: {
    type: Number,
    required: [true, 'Maximum score is required'],
    min: [1, 'Maximum score must be at least 1']
  },
  instructions: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  submissionType: {
    type: String,
    enum: ['file', 'text', 'both'],
    default: 'both'
  },
  allowedFileTypes: [{
    type: String
  }],
  maxFileSize: {
    type: Number,
    default: 5242880 // 5MB in bytes
  },
  submissions: [submissionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for better performance
assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

// Virtual for submission count
assignmentSchema.virtual('submissionCount').get(function() {
  return this.submissions.length;
});

// Virtual for graded count
assignmentSchema.virtual('gradedCount').get(function() {
  return this.submissions.filter(s => s.status === 'graded').length;
});

// Virtual for average score
assignmentSchema.virtual('averageScore').get(function() {
  const gradedSubmissions = this.submissions.filter(s => 
    s.status === 'graded' && s.grade.score !== undefined
  );
  
  if (gradedSubmissions.length === 0) return 0;
  
  const total = gradedSubmissions.reduce((sum, s) => sum + s.grade.score, 0);
  return Math.round((total / gradedSubmissions.length) * 100) / 100;
});

// Method to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Method to get student submission
assignmentSchema.methods.getStudentSubmission = function(studentId) {
  return this.submissions.find(s => 
    s.student.toString() === studentId.toString()
  );
};

// Method to submit assignment
assignmentSchema.methods.submitAssignment = function(studentId, submissionData) {
  const existingSubmission = this.getStudentSubmission(studentId);
  
  if (existingSubmission) {
    throw new Error('Assignment already submitted. Contact instructor to resubmit.');
  }
  
  const isLate = new Date() > this.dueDate;
  
  if (isLate && !this.allowLateSubmission) {
    throw new Error('Late submissions are not allowed for this assignment');
  }
  
  const submission = {
    student: studentId,
    ...submissionData,
    isLate,
    grade: {
      maxScore: this.maxScore
    }
  };
  
  this.submissions.push(submission);
  return this.save();
};

// Method to grade submission
assignmentSchema.methods.gradeSubmission = function(studentId, gradeData, graderId) {
  const submission = this.getStudentSubmission(studentId);
  
  if (!submission) {
    throw new Error('No submission found for this student');
  }
  
  submission.grade = {
    ...submission.grade,
    score: gradeData.score,
    feedback: gradeData.feedback,
    gradedBy: graderId,
    gradedAt: new Date()
  };
  
  submission.status = 'graded';
  
  return this.save();
};

export default mongoose.model('Assignment', assignmentSchema);