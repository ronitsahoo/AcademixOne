import express from 'express';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import { authenticate, isTeacher } from '../middleware/auth.js';
import { 
  validateCreateAssignment, 
  validateUpdateAssignment,
  validateSubmitAssignment,
  validateGradeAssignment, 
  validatePagination, 
  validateObjectId 
} from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/assignments
// @desc    Get assignments (filtered by user role)
// @access  Private
router.get('/', authenticate, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { course, status, search } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      // Students see assignments from their enrolled courses
      const enrolledCourses = req.user.enrolledCourses;
      query.course = { $in: enrolledCourses };
    } else if (req.user.role === 'teacher') {
      // Teachers see assignments from their courses
      query.instructor = req.user._id;
    }
    
    if (course) {
      query.course = course;
    }
    
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    const assignments = await Assignment.find(query)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Assignment.countDocuments(query);
    
    // Add submission status for students
    const assignmentsWithStatus = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      assignmentObj.submissionCount = assignment.submissionCount;
      assignmentObj.gradedCount = assignment.gradedCount;
      assignmentObj.averageScore = assignment.averageScore;
      assignmentObj.isOverdue = assignment.isOverdue;
      
      if (req.user.role === 'student') {
        const studentSubmission = assignment.getStudentSubmission(req.user._id);
        assignmentObj.hasSubmitted = !!studentSubmission;
        assignmentObj.submission = studentSubmission;
      }
      
      return assignmentObj;
    });
    
    res.json({
      assignments: assignmentsWithStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error while fetching assignments' });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (Teacher only)
router.post('/', authenticate, isTeacher, validateCreateAssignment, async (req, res) => {
  try {
    const { course: courseId } = req.body;
    
    // Verify that the teacher is the instructor of the course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only create assignments for your courses.' });
    }
    
    const assignmentData = {
      ...req.body,
      instructor: req.user._id
    };
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email');
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error while creating assignment' });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get assignment by ID
// @access  Private (Enrolled students or Course instructor)
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email')
      .populate('submissions.student', 'profile.firstName profile.lastName email profile.rollNumber');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check access permissions
    const course = await Course.findById(assignment.course._id);
    const isInstructor = assignment.instructor._id.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    const assignmentObj = assignment.toObject();
    assignmentObj.submissionCount = assignment.submissionCount;
    assignmentObj.gradedCount = assignment.gradedCount;
    assignmentObj.averageScore = assignment.averageScore;
    assignmentObj.isOverdue = assignment.isOverdue;
    
    if (req.user.role === 'student') {
      const studentSubmission = assignment.getStudentSubmission(req.user._id);
      assignmentObj.hasSubmitted = !!studentSubmission;
      assignmentObj.submission = studentSubmission;
    }
    
    res.json({ assignment: assignmentObj });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error while fetching assignment' });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Assignment instructor only)
router.put('/:id', authenticate, validateObjectId('id'), validateUpdateAssignment, async (req, res) => {
  try {
    console.log('Assignment update request:', {
      assignmentId: req.params.id,
      userId: req.user._id,
      updateData: req.body
    });

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the instructor
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only assignment instructor can update assignments.' });
    }
    
    // Update assignment with validation
    const allowedFields = ['title', 'description', 'instructions', 'dueDate', 'maxScore', 'submissionType', 'allowLateSubmission', 'lateSubmissionPenalty'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    console.log('Filtered update data:', updateData);
    
    Object.assign(assignment, updateData);
    await assignment.save();
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email');
    
    console.log('Assignment updated successfully:', assignment.title);
    
    res.json({
      message: 'Assignment updated successfully',
      assignment: populatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    
    // Send detailed error information
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ message: 'Server error while updating assignment' });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Assignment instructor only)
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the instructor
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only assignment instructor can delete assignments.' });
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error while deleting assignment' });
  }
});

// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment
// @access  Private (Enrolled students only)
router.post('/:id/submit', authenticate, validateObjectId('id'), validateSubmitAssignment, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const course = await Course.findById(assignment.course);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if student is enrolled
    if (!course.isStudentEnrolled(req.user._id)) {
      return res.status(403).json({ message: 'You must be enrolled in this course to submit assignments' });
    }
    
    const { content } = req.body;
    
    // Validate submission content
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Submission content is required' });
    }
    
    const submissionData = {
      content: content.trim()
    };
    
    await assignment.submitAssignment(req.user._id, submissionData);
    
    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error while submitting assignment' });
  }
});

// @route   PUT /api/assignments/:id/grade/:studentId
// @desc    Grade student submission
// @access  Private (Assignment instructor only)
router.put('/:id/grade/:studentId', authenticate, validateObjectId('id'), validateObjectId('studentId'), validateGradeAssignment, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the instructor
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only assignment instructor can grade submissions.' });
    }
    
    const { score, feedback } = req.body;
    
    // Validate score
    if (score > assignment.maxScore) {
      return res.status(400).json({ message: `Score cannot exceed maximum score of ${assignment.maxScore}` });
    }
    
    const gradeData = { score, feedback };
    
    await assignment.gradeSubmission(req.params.studentId, gradeData, req.user._id);
    
    res.json({ message: 'Assignment graded successfully' });
  } catch (error) {
    console.error('Grade assignment error:', error);
    res.status(500).json({ message: error.message || 'Server error while grading assignment' });
  }
});

// @route   PUT /api/assignments/submissions/:submissionId/grade
// @desc    Grade a submission by submission ID
// @access  Private (Assignment instructor)
router.put('/submissions/:submissionId/grade', authenticate, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    
    // Find the assignment that contains this submission
    const assignment = await Assignment.findOne({ 'submissions._id': req.params.submissionId });
    
    if (!assignment) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user is the instructor
    if (assignment.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the specific submission
    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Validate grade
    if (grade < 0 || grade > assignment.maxScore) {
      return res.status(400).json({ 
        message: `Grade must be between 0 and ${assignment.maxScore}` 
      });
    }

    // Update the submission
    submission.grade.score = grade;
    submission.grade.feedback = feedback;
    submission.grade.gradedBy = req.user.id;
    submission.grade.gradedAt = new Date();
    submission.status = 'graded';

    await assignment.save();

    res.json({ 
      message: 'Submission graded successfully', 
      submission 
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assignments/:id/submissions
// @desc    Get assignment submissions
// @access  Private (Assignment instructor only)
router.get('/:id/submissions', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.student', 'profile.firstName profile.lastName email profile.rollNumber')
      .populate('submissions.grade.gradedBy', 'profile.firstName profile.lastName email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the instructor
    if (assignment.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only assignment instructor can view submissions.' });
    }
    
    const submissions = assignment.submissions.map(submission => {
      const submissionObj = submission.toObject();
      submissionObj.isLate = submission.isLate;
      return submissionObj;
    });
    
    res.json({
      submissions,
      stats: {
        total: assignment.submissionCount,
        graded: assignment.gradedCount,
        averageScore: assignment.averageScore
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error while fetching submissions' });
  }
});

// @route   GET /api/assignments/:id/submissions/:studentId
// @desc    Get specific student submission
// @access  Private (Assignment instructor or the student)
router.get('/:id/submissions/:studentId', authenticate, validateObjectId('id'), validateObjectId('studentId'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.student', 'profile.firstName profile.lastName email profile.rollNumber')
      .populate('submissions.grade.gradedBy', 'profile.firstName profile.lastName email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check permissions
    const isInstructor = assignment.instructor.toString() === req.user._id.toString();
    const isStudent = req.user._id.toString() === req.params.studentId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const submission = assignment.getStudentSubmission(req.params.studentId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json({ submission });
  } catch (error) {
    console.error('Get student submission error:', error);
    res.status(500).json({ message: 'Server error while fetching submission' });
  }
});

export default router;