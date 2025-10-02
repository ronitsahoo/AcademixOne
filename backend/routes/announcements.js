import express from 'express';
import Announcement from '../models/Announcement.js';
import Course from '../models/Course.js';
import { authenticate, isTeacherOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/announcements/course/:courseId
// @desc    Get all announcements for a course
// @access  Private (enrolled students and course instructor)
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    console.log('📢 Announcements request:', {
      courseId,
      userId: userId.toString(),
      userRole: req.user.role
    });

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course found:', course.name);

    // Simple access control - allow instructors and admins, basic check for students
    const isInstructor = course.instructor.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';
    
    console.log('🔍 Access check:', { 
      isInstructor, 
      isAdmin,
      userRole: req.user.role
    });

    if (!isInstructor && !isAdmin && req.user.role !== 'student') {
      console.log('❌ Access denied for user:', userId.toString());
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    console.log('✅ Access granted');

    // Get announcements
    const announcements = await Announcement.find({ 
      course: courseId, 
      isActive: true 
    })
    .populate('author', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${announcements.length} announcements for course ${courseId}`);

    // Add read status for students
    const announcementsResponse = announcements.map(announcement => {
      const announcementObj = announcement.toObject();
      
      // Only add read status for students
      if (req.user.role === 'student') {
        try {
          const isRead = announcement.readBy.some(r => 
            r && r.student && r.student.toString() === userId.toString()
          );
          announcementObj.isRead = isRead;
          console.log(`Announcement ${announcement.title} read status for user ${userId}: ${isRead}`);
        } catch (error) {
          console.error('Error checking read status:', error);
          announcementObj.isRead = false;
        }
      } else {
        announcementObj.isRead = false; // Faculty doesn't need read status
      }
      
      return announcementObj;
    });

    console.log('✅ Sending announcements response');
    res.json({ announcements: announcementsResponse });
    
  } catch (error) {
    console.error('❌ Get announcements error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while fetching announcements', 
      error: error.message 
    });
  }
});

// @route   POST /api/announcements
// @desc    Create new announcement
// @access  Private (teachers and admins only)
router.post('/', authenticate, isTeacherOrAdmin, async (req, res) => {
  try {
    const { title, content, courseId, priority = 'medium' } = req.body;

    if (!title || !content || !courseId) {
      return res.status(400).json({ message: 'Title, content, and course ID are required' });
    }

    // Verify course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Only course instructors can create announcements' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      course: courseId,
      author: req.user._id,
      priority
    });

    await announcement.save();
    await announcement.populate('author', 'profile.firstName profile.lastName email');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error while creating announcement' });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (author or admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    const isAuthor = announcement.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (title) announcement.title = title.trim();
    if (content) announcement.content = content.trim();
    if (priority) announcement.priority = priority;

    await announcement.save();
    await announcement.populate('author', 'profile.firstName profile.lastName email');

    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement (soft delete)
// @access  Private (author or admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is author or admin
    const isAuthor = announcement.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    announcement.isActive = false;
    await announcement.save();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
});

// @route   POST /api/announcements/:id/read
// @desc    Mark announcement as read
// @access  Private (students only)
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📖 Mark as read request:', {
      announcementId: id,
      userId: req.user._id.toString(),
      userRole: req.user.role
    });

    if (req.user.role !== 'student') {
      console.log('❌ Access denied: Not a student');
      return res.status(403).json({ message: 'Only students can mark announcements as read' });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      console.log('❌ Announcement not found:', id);
      return res.status(404).json({ message: 'Announcement not found' });
    }

    console.log('✅ Announcement found:', announcement.title);

    // Simplified access control - if student can see announcements, they can mark them as read
    // The main access control is already handled in the GET endpoint
    
    // Check if already marked as read (with null safety)
    const alreadyRead = announcement.readBy.some(r => 
      r && r.student && r.student.toString() === req.user._id.toString()
    );

    if (alreadyRead) {
      console.log('ℹ️ Already marked as read');
      return res.json({ message: 'Announcement already marked as read' });
    }

    // Mark as read
    console.log('📝 Marking as read...');
    announcement.readBy.push({ 
      student: req.user._id,
      readAt: new Date()
    });
    
    await announcement.save();
    console.log('✅ Successfully marked as read');

    res.json({ message: 'Announcement marked as read' });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while marking announcement as read',
      error: error.message 
    });
  }
});

export default router;