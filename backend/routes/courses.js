import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import { authenticate, isTeacher, isTeacherOrAdmin, optionalAuth } from '../middleware/auth.js';
import { 
  validateCreateCourse, 
  validateUpdateCourse, 
  validatePagination, 
  validateObjectId 
} from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Public (with optional auth for personalized results)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { department, semester, search, instructor } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (department) {
      query.department = new RegExp(department, 'i');
    }
    
    if (semester) {
      query.semester = new RegExp(semester, 'i');
    }
    
    if (instructor) {
      query.instructor = instructor;
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    const courses = await Course.find(query)
      .populate('instructor', 'profile.firstName profile.lastName email')
      .populate('students.student', 'profile.firstName profile.lastName email profile.rollNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Course.countDocuments(query);
    
    // Add enrollment status for authenticated users
    const coursesWithStatus = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.enrolledCount = course.enrolledCount;
      courseObj.progress = course.progress;
      
      if (req.user && req.user._id) {
        try {
          courseObj.isEnrolled = course.isStudentEnrolled(req.user._id);
          courseObj.isInstructor = course.instructor && course.instructor._id.toString() === req.user._id.toString();
        } catch (error) {
          console.error('Error checking enrollment status:', error);
          courseObj.isEnrolled = false;
          courseObj.isInstructor = false;
        }
      }
      
      return courseObj;
    });
    
    res.json({
      courses: coursesWithStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error while fetching courses' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Teachers only)
router.post('/', authenticate, isTeacher, validateCreateCourse, async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      department,
      semester,
      credits,
      maxStudents,
      startDate,
      endDate
    } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    // Create new course
    const course = new Course({
      name,
      code,
      description,
      department,
      semester,
      credits: parseInt(credits),
      maxStudents: parseInt(maxStudents) || 50,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instructor: req.user._id,
      isActive: true
    });

    await course.save();

    // Add course to teacher's teaching courses
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { teachingCourses: course._id } }
    );

    // Populate instructor details for response
    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'profile.firstName profile.lastName email');

    res.status(201).json({
      message: 'Course created successfully',
      course: populatedCourse
    });
  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Server error while creating course' });
  }
});

// Get all announcements for a course
export const getAnnouncements = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json(course.announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

// Add an announcement
export const addAnnouncement = async (req, res) => {
  try {
    const { title, content, priority = 'medium', isActive = true } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const newAnnouncement = { title, content, priority, isActive, date: new Date() };
    course.announcements.push(newAnnouncement);
    await course.save();

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Error adding announcement', error: error.message });
  }
};

// Delete an announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.announcements = course.announcements.filter(
      (a) => a._id.toString() !== req.params.announcementId
    );
    await course.save();

    res.json({ message: 'Announcement deleted', announcements: course.announcements });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public (with optional auth for personalized results)
router.get('/:id', optionalAuth, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'profile.firstName profile.lastName email profile.department')
      .populate('students.student', 'profile.firstName profile.lastName email profile.rollNumber profile.department');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const courseObj = course.toObject();
    courseObj.enrolledCount = course.enrolledCount;
    courseObj.progress = course.progress;
    
    if (req.user) {
      courseObj.isEnrolled = course.isStudentEnrolled(req.user._id);
      courseObj.isInstructor = course.instructor._id.toString() === req.user._id.toString();
    }
    
    res.json({ course: courseObj });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error while fetching course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course instructor or Admin)
router.put('/:id', authenticate, validateObjectId('id'), validateUpdateCourse, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can update course.' });
    }
    
    // Update course
    Object.assign(course, req.body);
    await course.save();
    
    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'profile.firstName profile.lastName email');
    
    res.json({
      message: 'Course updated successfully',
      course: populatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Server error while updating course' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Course instructor or Admin)
router.delete('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can delete course.' });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    // Remove course from users' enrolled/teaching lists
    await User.updateMany(
      { $or: [{ enrolledCourses: req.params.id }, { teachingCourses: req.params.id }] },
      { $pull: { enrolledCourses: req.params.id, teachingCourses: req.params.id } }
    );
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error while deleting course' });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (req.user.role !== 'student') {
      return res.status(400).json({ message: 'Only students can enroll in courses' });
    }
    
    // Check if already enrolled
    if (course.isStudentEnrolled(req.user._id)) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    
    // Enroll student
    await course.enrollStudent(req.user._id);
    
    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { enrolledCourses: course._id } }
    );
    
    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({ message: error.message || 'Server error while enrolling in course' });
  }
});

// @route   DELETE /api/courses/:id/enroll
// @desc    Drop from a course
// @access  Private
router.delete('/:id/enroll', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if enrolled
    if (!course.isStudentEnrolled(req.user._id)) {
      return res.status(400).json({ message: 'You are not enrolled in this course' });
    }
    
    // Drop student
    await course.dropStudent(req.user._id);
    
    // Remove course from user's enrolled courses
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { enrolledCourses: course._id } }
    );
    
    res.json({ message: 'Successfully dropped from course' });
  } catch (error) {
    console.error('Drop from course error:', error);
    res.status(500).json({ message: error.message || 'Server error while dropping from course' });
  }
});

// @route   GET /api/courses/:id/students
// @desc    Get course students
// @access  Private (Course instructor or Admin)
router.get('/:id/students', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('students.student', 'profile.firstName profile.lastName email profile.rollNumber profile.department profile.semester');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor, admin, or enrolled student
    const isInstructor = course.instructor && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isEnrolledStudent = course.students.some(s => 
      s.student && s.student._id.toString() === req.user._id.toString() && s.status === 'enrolled'
    );
    
    if (!isInstructor && !isAdmin && !isEnrolledStudent) {
      return res.status(403).json({ message: 'Access denied. Only course instructor, admin, or enrolled students can view students.' });
    }
    
    const enrolledStudents = course.students
      .filter(s => s.status === 'enrolled' && s.student) // Filter out null students
      .map(s => s.student);
    
    res.json({ students: enrolledStudents });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({ message: 'Server error while fetching course students' });
  }
});

// @route   GET /api/courses/:id/assignments
// @desc    Get course assignments
// @access  Private (Enrolled students or Course instructor)
router.get('/:id/assignments', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    const assignments = await Assignment.find({ course: req.params.id })
      .populate('instructor', 'profile.firstName profile.lastName email')
      .populate('course', 'name code')
      .sort({ dueDate: 1 });
    
    // For students, add their submission status
    if (req.user.role === 'student') {
      const assignmentsWithStatus = assignments.map(assignment => {
        const assignmentObj = assignment.toObject();
        const studentSubmission = assignment.getStudentSubmission(req.user._id);
        
        assignmentObj.hasSubmitted = !!studentSubmission;
        assignmentObj.submission = studentSubmission;
        assignmentObj.isOverdue = assignment.isOverdue;
        
        return assignmentObj;
      });
      
      return res.json({ assignments: assignmentsWithStatus });
    }
    
    res.json({ assignments });
  } catch (error) {
    console.error('Get course assignments error:', error);
    res.status(500).json({ message: 'Server error while fetching course assignments' });
  }
});

// @route   GET /api/courses/:id/attendance
// @desc    Get course attendance records
// @access  Private (Enrolled students or Course instructor)
router.get('/:id/attendance', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    if (req.user.role === 'student') {
      // Return student's attendance summary
      const attendanceSummary = await Attendance.getStudentAttendanceSummary(req.user._id, req.params.id);
      return res.json({ attendance: attendanceSummary });
    }
    
    // Return course attendance overview for instructors
    const { startDate, endDate } = req.query;
    const attendanceOverview = await Attendance.getCourseAttendanceOverview(req.params.id, startDate, endDate);
    
    res.json({ attendance: attendanceOverview });
  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({ message: 'Server error while fetching course attendance' });
  }
});

// @route   GET /api/courses/:id/modules
// @desc    Get course modules
// @access  Private (Enrolled students or Course instructor)
router.get('/:id/modules', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    res.json({ 
      modules: course.modules,
      moduleProgress: course.moduleProgress,
      overallProgress: course.progress
    });
  } catch (error) {
    console.error('Get course modules error:', error);
    res.status(500).json({ message: 'Server error while fetching course modules' });
  }
});

// @route   POST /api/courses/:id/modules
// @desc    Create course module
// @access  Private (Course instructor or Admin)
router.post('/:id/modules', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can create modules.' });
    }
    
    await course.addModule(req.body);
    
    res.status(201).json({
      message: 'Module created successfully',
      modules: course.modules,
      moduleProgress: course.moduleProgress
    });
  } catch (error) {
    console.error('Create course module error:', error);
    res.status(500).json({ message: 'Server error while creating course module' });
  }
});

// @route   PUT /api/courses/:id/modules/:moduleId
// @desc    Update course module
// @access  Private (Course instructor or Admin)
router.put('/:id/modules/:moduleId', authenticate, validateObjectId('id'), validateObjectId('moduleId'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can update modules.' });
    }
    
    await course.updateModule(req.params.moduleId, req.body);
    
    res.json({
      message: 'Module updated successfully',
      modules: course.modules,
      moduleProgress: course.moduleProgress
    });
  } catch (error) {
    console.error('Update course module error:', error);
    res.status(500).json({ message: error.message || 'Server error while updating course module' });
  }
});

// @route   DELETE /api/courses/:id/modules/:moduleId
// @desc    Delete course module
// @access  Private (Course instructor or Admin)
router.delete('/:id/modules/:moduleId', authenticate, validateObjectId('id'), validateObjectId('moduleId'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can delete modules.' });
    }
    
    await course.deleteModule(req.params.moduleId);
    
    res.json({
      message: 'Module deleted successfully',
      modules: course.modules,
      moduleProgress: course.moduleProgress
    });
  } catch (error) {
    console.error('Delete course module error:', error);
    res.status(500).json({ message: error.message || 'Server error while deleting course module' });
  }
});

// @route   PUT /api/courses/:id/modules/:moduleId/content/:contentId/complete
// @desc    Mark content as completed
// @access  Private (Enrolled students or Course instructor)
router.put('/:id/modules/:moduleId/content/:contentId/complete', authenticate, validateObjectId('id'), validateObjectId('moduleId'), validateObjectId('contentId'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    const { isCompleted = true } = req.body;
    await course.markContentCompleted(req.params.moduleId, req.params.contentId, isCompleted);
    
    res.json({
      message: `Content marked as ${isCompleted ? 'completed' : 'incomplete'}`,
      modules: course.modules,
      moduleProgress: course.moduleProgress,
      overallProgress: course.progress,
      courseStatus: course.courseStatus
    });
  } catch (error) {
    console.error('Mark content completed error:', error);
    res.status(500).json({ message: error.message || 'Server error while updating content status' });
  }
});

// @route   PUT /api/courses/:id/status
// @desc    Update course status
// @access  Private (Course instructor or Admin)
router.put('/:id/status', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only course instructor or admin can update course status.' });
    }
    
    const { status } = req.body;
    await course.updateCourseStatus(status);
    
    res.json({
      message: 'Course status updated successfully',
      courseStatus: course.courseStatus,
      overallProgress: course.progress
    });
  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({ message: error.message || 'Server error while updating course status' });
  }
});

// @route   GET /api/courses/:id/progress
// @desc    Get course progress
// @access  Private (Enrolled students or Course instructor)
router.get('/:id/progress', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You must be enrolled in this course or be the instructor.' });
    }
    
    res.json({
      overallProgress: course.progress,
      moduleProgress: course.moduleProgress,
      courseStatus: course.courseStatus,
      totalModules: course.modules.length,
      completedModules: course.moduleProgress.filter(m => m.isCompleted).length
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ message: 'Server error while fetching course progress' });
  }
});

// @route   POST /api/courses/:id/attendance
// @desc    Mark attendance for a class
// @access  Private (Course instructor)
router.post('/:id/attendance', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { date, session, topic, attendanceData } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if attendance already exists for this date and session
    const existingAttendance = await Attendance.findOne({ 
      course: req.params.id, 
      date: new Date(date),
      session: session
    });

    if (existingAttendance) {
      // Update existing attendance
      await existingAttendance.bulkMarkAttendance(attendanceData, req.user.id);
      res.json({ message: 'Attendance updated successfully', attendance: existingAttendance });
    } else {
      // Create new attendance record
      const newAttendance = new Attendance({
        course: req.params.id,
        date: new Date(date),
        session: session,
        topic: topic,
        instructor: req.user.id,
        records: attendanceData.map(data => ({
          student: data.studentId,
          status: data.status,
          markedBy: req.user.id,
          notes: data.notes || ''
        }))
      });
      await newAttendance.save();
      res.json({ message: 'Attendance marked successfully', attendance: newAttendance });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/enroll-student
// @desc    Enroll a student in course
// @access  Private (Course instructor or Admin)
router.post('/:id/enroll-student', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { studentEmail } = req.body;
    
    if (!studentEmail) {
      return res.status(400).json({ message: 'Student email is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find student by email
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student is already enrolled
    if (course.enrolledStudents.includes(student._id)) {
      return res.status(400).json({ message: 'Student is already enrolled' });
    }

    // Add student to course
    course.enrolledStudents.push(student._id);
    await course.save();

    res.json({ 
      message: 'Student enrolled successfully',
      student: {
        _id: student._id,
        email: student.email,
        profile: student.profile
      }
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/approve-student
// @desc    Approve pending student
// @access  Private (Course instructor only)
router.post('/:id/approve-student', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Move student from pending to enrolled
    course.pendingStudents = course.pendingStudents.filter(id => id.toString() !== studentId);
    if (!course.enrolledStudents.includes(studentId)) {
      course.enrolledStudents.push(studentId);
    }

    await course.save();
    res.json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id/remove-student
// @desc    Remove student from course
// @access  Private (Course instructor only)
router.delete('/:id/remove-student', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove student from enrolled list
    course.enrolledStudents = course.enrolledStudents.filter(id => id.toString() !== studentId);
    await course.save();
    
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id/attendance-summary
// @desc    Get attendance summary for all students
// @access  Private (Course instructor)
router.get('/:id/attendance-summary', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledStudents', 'profile.firstName profile.lastName email');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attendanceRecords = await Attendance.find({ course: req.params.id });
    const totalClasses = attendanceRecords.length;

    const summary = course.enrolledStudents.map(student => {
      const presentCount = attendanceRecords.reduce((count, record) => {
        const studentRecord = record.records.find(
          rec => rec.student.toString() === student._id.toString()
        );
        return count + (studentRecord && (studentRecord.status === 'present' || studentRecord.status === 'late') ? 1 : 0);
      }, 0);

      const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

      return {
        student: {
          _id: student._id,
          name: `${student.profile.firstName} ${student.profile.lastName}`,
          email: student.email
        },
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        percentage
      };
    });

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;