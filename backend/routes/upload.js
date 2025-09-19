import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../Uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const assignmentDir = path.join(uploadDir, 'assignments');
const resourceDir = path.join(uploadDir, 'resources');

[uploadDir, avatarDir, assignmentDir, resourceDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    if (req.route.path.includes('avatar')) {
      uploadPath = avatarDir;
    } else if (req.route.path.includes('assignment')) {
      uploadPath = assignmentDir;
    } else if (req.route.path.includes('resource')) {
      uploadPath = resourceDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    avatar: /jpeg|jpg|png|gif/,
    assignment: /pdf|doc|docx|txt|zip|rar|jpeg|jpg|png/,
    resource: /pdf|doc|docx|ppt|pptx|txt|zip|rar|jpeg|jpg|png|mp4|avi|mov/
  };
  
  let category = 'assignment'; // default
  if (req.route.path.includes('avatar')) {
    category = 'avatar';
  } else if (req.route.path.includes('resource')) {
    category = 'resource';
  }
  
  const filetypes = allowedTypes[category];
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${category}. Allowed types: ${filetypes.source}`));
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  },
  fileFilter: fileFilter
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/Uploads/avatars/${req.file.filename}`;
    
    // Update user profile with avatar URL
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(req.user._id, {
      'profile.avatar': fileUrl
    });
    
    res.json({
      message: 'Avatar uploaded successfully',
      fileUrl,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

// @route   POST /api/upload/assignment
// @desc    Upload assignment files
// @access  Private
router.post('/assignment', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/Uploads/assignments/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.json({
      message: 'Assignment files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Assignment upload error:', error);
    res.status(500).json({ message: 'Server error while uploading assignment files' });
  }
});

// @route   POST /api/upload/resource
// @desc    Upload course resource files
// @access  Private (Teachers only)
router.post('/resource', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can upload course resources' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/Uploads/resources/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.json({
      message: 'Resource files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Resource upload error:', error);
    res.status(500).json({ message: 'Server error while uploading resource files' });
  }
});

// @route   DELETE /api/upload/:category/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:category/:filename', authenticate, async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    const allowedCategories = ['avatars', 'assignments', 'resources'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid file category' });
    }
    
    const sanitizedFilename = path.basename(filename); // Prevent path traversal
    const filePath = path.join(uploadDir, category, sanitizedFilename);
    
    if (filename !== sanitizedFilename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // For avatars, only allow users to delete their own
    if (category === 'avatars') {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user._id);
      const userAvatarFilename = user.profile.avatar ? path.basename(user.profile.avatar) : null;
      
      if (userAvatarFilename !== sanitizedFilename && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    // If it's an avatar, update user profile
    if (category === 'avatars') {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(req.user._id, {
        'profile.avatar': null
      });
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ message: 'Server error while deleting file' });
  }
});

// @route   GET /api/upload/info/:category/:filename
// @desc    Get file information
// @access  Private
router.get('/info/:category/:filename', authenticate, async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    const allowedCategories = ['avatars', 'assignments', 'resources'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid file category' });
    }
    
    const sanitizedFilename = path.basename(filename); // Prevent path traversal
    const filePath = path.join(uploadDir, category, sanitizedFilename);
    
    if (filename !== sanitizedFilename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    
    res.json({
      filename: sanitizedFilename,
      category,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/Uploads/${category}/${sanitizedFilename}`
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ message: 'Server error while getting file information' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE || 5242880} bytes` 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: 'File upload error' });
});

export default router;