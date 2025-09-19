import express from 'express';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import { authenticate, isTeacher } from '../middleware/auth.js';
import { 
  validateCreateAttendance, 
  validateMarkAttendance, 
  validatePagination, 
  validateObjectId,
  validateDateRange 
} from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records (filtered by user role)
// @access  Private
router.get('/', authenticate, validatePagination, validateDateRange, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { course, startDate, endDate } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      // Students see attendance from their enrolled courses
      const enrolledCourses = req.user.enrolledCourses;
      query.course = { $in: enrolledCourses };
      query['records.student'] = req.user._id;
    } else if (req.user.role === 'teacher') {
      // Teachers see attendance from their courses
      query.instructor = req.user._id;
    }
    
    if (course) {
      query.course = course;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email')
      .populate('records.student', 'profile.firstName profile.lastName email profile.rollNumber')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Attendance.countDocuments(query);
    
    // For students, filter records to show only their attendance
    const filteredRecords = attendanceRecords.map(attendance => {
      const attendanceObj = attendance.toObject();
      attendanceObj.attendancePercentage = attendance.attendancePercentage;
      
      if (req.user.role === 'student') {
        attendanceObj.records = attendance.records.filter(
          record => record.student._id.toString() === req.user._id.toString()
        );
      }
      
      return attendanceObj;
    });
    
    res.json({
      attendance: filteredRecords,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error while fetching attendance records' });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance session
// @access  Private (Teacher only)
router.post('/', authenticate, isTeacher, validateCreateAttendance, async (req, res) => {
  try {
    const { course: courseId, date, session, topic, duration } = req.body;
    
    // Verify that the teacher is the instructor of the course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only create attendance for your courses.' });
    }
    
    // Check if attendance already exists for this course, date, and session
    const existingAttendance = await Attendance.findOne({
      course: courseId,
      date: new Date(date),
      session
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this course, date, and session' });
    }
    
    const attendanceData = {
      course: courseId,
      date: new Date(date),
      session,
      topic,
      duration,
      instructor: req.user._id,
      records: []
    };
    
    const attendance = new Attendance(attendanceData);
    await attendance.save();
    
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email');
    
    res.status(201).json({
      message: 'Attendance session created successfully',
      attendance: populatedAttendance
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance record already exists for this course, date, and session' });
    }
    res.status(500).json({ message: 'Server error while creating attendance session' });
  }
});

// @route   GET /api/attendance/:id
// @desc    Get attendance session by ID
// @access  Private (Enrolled students or Course instructor)
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('course', 'name code')
      .populate('instructor', 'profile.firstName profile.lastName email')
      .populate('records.student', 'profile.firstName profile.lastName email profile.rollNumber')
      .populate('records.markedBy', 'profile.firstName profile.lastName email');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Check access permissions
    const course = await Course.findById(attendance.course);
    const isInstructor = attendance.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    const attendanceObj = attendance.toObject();
    if (req.user.role === 'student') {
      attendanceObj.records = attendanceObj.records.filter(
        record => record.student._id.toString() === req.user._id.toString()
      );
    }
    
    res.json({ attendance: attendanceObj });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error while fetching attendance record' });
  }
});

// @route   PUT /api/attendance/:id/mark/:studentId
// @desc    Mark student attendance
// @access  Private (Course instructor only)
router.put('/:id/mark/:studentId', authenticate, validateObjectId('id'), validateObjectId('studentId'), validateMarkAttendance, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Check if user is the instructor
    if (attendance.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor can mark attendance.' });
    }
    
    if (attendance.isFinalized) {
      return res.status(400).json({ message: 'Cannot mark attendance for finalized session' });
    }
    
    const { status, notes } = req.body.attendanceData[0];
    
    // Verify student is enrolled
    const course = await Course.findById(attendance.course);
    if (!course.isStudentEnrolled(req.params.studentId)) {
      return res.status(400).json({ message: 'Student is not enrolled in this course' });
    }
    
    await attendance.markStudentAttendance(req.params.studentId, status, req.user._id, notes);
    
    res.json({ message: 'Student attendance marked successfully' });
  } catch (error) {
    console.error('Mark student attendance error:', error);
    res.status(500).json({ message: 'Server error while marking student attendance' });
  }
});

// @route   POST /api/attendance/:id/bulk-mark
// @desc    Bulk mark attendance
// @access  Private (Instructor only)
router.post('/:id/bulk-mark', authenticate, validateObjectId('id'), validateMarkAttendance, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    if (attendance.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor can mark attendance.' });
    }
    if (attendance.isFinalized) {
      return res.status(400).json({ message: 'Cannot mark attendance for finalized session' });
    }
    const { attendanceData } = req.body;
    
    // Verify all students are enrolled
    const course = await Course.findById(attendance.course);
    for (const { studentId } of attendanceData) {
      if (!course.isStudentEnrolled(studentId)) {
        return res.status(400).json({ message: `Student ${studentId} is not enrolled in this course` });
      }
    }
    
    await attendance.bulkMarkAttendance(attendanceData, req.user._id);
    res.json({ message: 'Bulk attendance marked successfully' });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ message: 'Server error while marking attendance' });
  }
});

// @route   PUT /api/attendance/:id/finalize
// @desc    Finalize attendance session
// @access  Private (Course instructor only)
router.put('/:id/finalize', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Check if user is the instructor
    if (attendance.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor can finalize attendance.' });
    }
    
    if (attendance.isFinalized) {
      return res.status(400).json({ message: 'Attendance session is already finalized' });
    }
    
    attendance.isFinalized = true;
    await attendance.save();
    
    res.json({ message: 'Attendance session finalized successfully' });
  } catch (error) {
    console.error('Finalize attendance error:', error);
    res.status(500).json({ message: 'Server error while finalizing attendance' });
  }
});

// @route   GET /api/attendance/student/:studentId/summary
// @desc    Get student attendance summary
// @access  Private (Student themselves, their instructors, or admin)
router.get('/student/:studentId/summary', authenticate, validateObjectId('studentId'), async (req, res) => {
  try {
    const { courseId } = req.query;
    
    // Check permissions
    const isOwnRecord = req.user._id.toString() === req.params.studentId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwnRecord && !isAdmin) {
      // Check if user is instructor of the course
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course || course.instructor.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    const attendanceSummary = await Attendance.getStudentAttendanceSummary(req.params.studentId, courseId);
    
    res.json({ summary: attendanceSummary });
  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ message: 'Server error while fetching attendance summary' });
  }
});

// @route   GET /api/attendance/course/:courseId/overview
// @desc    Get course attendance overview
// @access  Private (Course instructor or admin)
router.get('/course/:courseId/overview', authenticate, validateObjectId('courseId'), validateDateRange, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can view attendance overview.' });
    }
    
    const { startDate, endDate } = req.query;
    const attendanceOverview = await Attendance.getCourseAttendanceOverview(req.params.courseId, startDate, endDate);
    
    res.json({ overview: attendanceOverview });
  } catch (error) {
    console.error('Get course attendance overview error:', error);
    res.status(500).json({ message: 'Server error while fetching attendance overview' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance session
// @access  Private (Course instructor or admin)
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Check if user is the instructor or admin
    if (attendance.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can delete attendance records.' });
    }
    
    if (attendance.isFinalized) {
      return res.status(400).json({ message: 'Cannot delete finalized attendance session' });
    }
    
    await Attendance.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Attendance session deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error while deleting attendance session' });
  }
});

// @route   PUT /api/attendance/mark
// @desc    Mark student attendance (simplified)
// @access  Private (Course instructor only)
router.put('/mark', authenticate, async (req, res) => {
  try {
    const { courseId, studentId, status, notes = '' } = req.body;
    
    if (!courseId || !studentId || !status) {
      return res.status(400).json({ message: 'Course ID, student ID, and status are required' });
    }
    
    // Verify course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor can mark attendance.' });
    }
    
    // Verify student is enrolled
    if (!course.isStudentEnrolled(studentId)) {
      return res.status(400).json({ message: 'Student is not enrolled in this course' });
    }
    
    // Find or create today's attendance session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let attendance = await Attendance.findOne({
      course: courseId,
      date: { $gte: today, $lt: tomorrow },
      isFinalized: false
    });
    
    if (!attendance) {
      // Create new attendance session for today
      attendance = new Attendance({
        course: courseId,
        instructor: req.user._id,
        date: new Date(),
        attendanceData: []
      });
      await attendance.save();
    }
    
    // Mark student attendance
    await attendance.markStudentAttendance(studentId, status, req.user._id, notes);
    
    res.json({ 
      message: 'Student attendance marked successfully',
      attendanceId: attendance._id
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: error.message || 'Server error while marking attendance' });
  }
});

export default router;