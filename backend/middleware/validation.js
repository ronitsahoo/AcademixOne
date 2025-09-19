import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Auth validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  body('profile.rollNumber')
    .optional()
    .custom((value) => {
      if (value && !/^[A-Z]{2}\d{4}$/.test(value)) {
        throw new Error('Invalid roll number format');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// User validation rules
export const validateUpdateProfile = [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('profile.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('profile.department')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department must be between 1 and 100 characters'),
  body('profile.semester')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Semester must be between 1 and 20 characters'),
  body('profile.rollNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Roll number must be between 1 and 20 characters'),
  handleValidationErrors
];

// Course validation rules
export const validateCreateCourse = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Course name must be between 1 and 200 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Course code must be between 1 and 20 characters'),
  body('department')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department must be between 1 and 100 characters'),
  body('semester')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Semester must be between 1 and 20 characters'),
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max students must be between 1 and 500'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateUpdateCourse = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Course name must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Max students must be between 1 and 500'),
  body('announcements')
    .optional()
    .isArray()
    .withMessage('Announcements must be an array'),
  body('announcements.*.title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Announcement title must be between 1 and 200 characters'),
  body('announcements.*.content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Announcement content must be between 1 and 2000 characters'),
  body('announcements.*.priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Announcement priority must be low, medium, or high'),
  body('modules')
    .optional()
    .isArray()
    .withMessage('Modules must be an array'),
  body('resources')
    .optional()
    .isArray()
    .withMessage('Resources must be an array'),
  handleValidationErrors
];

// Assignment validation rules
export const validateCreateAssignment = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Assignment title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Assignment description must be between 1 and 2000 characters'),
  body('course')
    .custom(isValidObjectId)
    .withMessage('Invalid course ID'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((dueDate) => {
      if (new Date(dueDate) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  body('maxScore')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max score must be between 1 and 1000'),
  body('submissionType')
    .optional()
    .isIn(['file', 'text', 'both'])
    .withMessage('Submission type must be file, text, or both'),
  handleValidationErrors
];

export const validateGradeAssignment = [
  body('score')
    .isFloat({ min: 0 })
    .withMessage('Score must be a positive number'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  handleValidationErrors
];

// Attendance validation rules
export const validateCreateAttendance = [
  body('course')
    .custom(isValidObjectId)
    .withMessage('Invalid course ID'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('session')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Session must be between 1 and 100 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  handleValidationErrors
];

export const validateMarkAttendance = [
  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data must be a non-empty array'),
  body('attendanceData.*.studentId')
    .custom(isValidObjectId)
    .withMessage('Invalid student ID'),
  body('attendanceData.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Status must be present, absent, late, or excused'),
  handleValidationErrors
];

// Parameter validation
export const validateObjectId = (paramName) => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

// Query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];