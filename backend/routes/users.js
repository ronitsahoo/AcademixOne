import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { authenticate, isTeacherOrAdmin, isOwnerOrAdmin } from '../middleware/auth.js';
import { validateUpdateProfile, validatePagination, validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses', 'name code department semester credits instructor')
      .populate('teachingCourses', 'name code department semester credits')
      .populate({
        path: 'enrolledCourses',
        populate: {
          path: 'instructor',
          select: 'profile.firstName profile.lastName email'
        }
      });
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, validateUpdateProfile, async (req, res) => {
  try {
    const { profile } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Update profile fields
    if (profile) {
      Object.keys(profile).forEach(key => {
        if (profile[key] !== undefined) {
          user.profile[key] = profile[key];
        }
      });
    }
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// @route   GET /api/users
// @desc    Get all users (teachers and admins only)
// @access  Private (Teacher/Admin)
router.get('/', authenticate, isTeacherOrAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, department, search } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query['profile.department'] = new RegExp(department, 'i');
    }
    
    if (search) {
      query.$or = [
        { email: new RegExp(search, 'i') },
        { 'profile.firstName': new RegExp(search, 'i') },
        { 'profile.lastName': new RegExp(search, 'i') },
        { 'profile.rollNumber': new RegExp(search, 'i') }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Owner or Teacher/Admin)
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('enrolledCourses', 'name code department semester credits')
      .populate('teachingCourses', 'name code department semester credits');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user can access this profile
    if (req.user._id.toString() !== user._id.toString() && 
        !['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (Admin only)
router.put('/:id/status', authenticate, isTeacherOrAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deactivating self
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// @route   GET /api/users/:id/courses
// @desc    Get user's courses
// @access  Private (Owner or Teacher/Admin)
router.get('/:id/courses', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check access permissions
    if (req.user._id.toString() !== user._id.toString() && 
        !['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let courses = [];
    
    if (user.role === 'student') {
      courses = await Course.find({ 
        'students.student': user._id,
        'students.status': 'enrolled'
      })
      .populate('instructor', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    } else if (user.role === 'teacher') {
      courses = await Course.find({ instructor: user._id })
        .populate('students.student', 'profile.firstName profile.lastName email profile.rollNumber')
        .sort({ createdAt: -1 });
    }
    
    res.json({ courses });
  } catch (error) {
    console.error('Get user courses error:', error);
    res.status(500).json({ message: 'Server error while fetching user courses' });
  }
});

// @route   POST /api/users/:id/enroll
// @desc    Enroll user in a course
// @access  Private (Teacher/Admin)
router.post('/:id/enroll', authenticate, isTeacherOrAdmin, validateObjectId('id'), validateObjectId('courseId'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    const user = await User.findById(req.params.id).session(session);
    const course = await Course.findById(courseId).session(session);
    
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Ensure user is a student
    if (user.role !== 'student') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Only students can be enrolled in courses' });
    }
    
    // Check if already enrolled
    if (course.isStudentEnrolled(user._id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }
    
    // Check course capacity
    if (course.maxStudents && course.enrolledCount >= course.maxStudents) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Course has reached maximum enrollment capacity' });
    }
    
    // Enroll student in course
    await course.enrollStudent(user._id, session);
    
    // Add course to user's enrolledCourses
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ message: 'User enrolled in course successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Enroll user error:', error);
    res.status(500).json({ message: 'Server error while enrolling user' });
  }
});

export default router;