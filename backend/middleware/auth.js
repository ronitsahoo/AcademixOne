import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not found.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Check if user has required role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    
    next();
  };
};

// Check if user is student
export const isStudent = authorize('student');

// Check if user is teacher
export const isTeacher = authorize('teacher');

// Check if user is admin
export const isAdmin = authorize('admin');

// Check if user is teacher or admin
export const isTeacherOrAdmin = authorize('teacher', 'admin');

// Check if user owns the resource or is admin
export const isOwnerOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserField] || req.params.userId || req.user._id;
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
    }
    
    next();
  };
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify token without throwing error (for optional authentication)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};