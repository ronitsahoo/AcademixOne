import express from 'express';
import Message from '../models/Message.js';
import Course from '../models/Course.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';

const router = express.Router();

// @route   GET /api/chat/course/:courseId/messages
// @desc    Get messages for a course
// @access  Private (Enrolled students or Course instructor)
router.get('/course/:courseId/messages', authenticate, validateObjectId('courseId'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    // Get messages
    const messages = await Message.getRecentMessages(courseId, parseInt(limit), before ? new Date(before) : null);

    // Mark messages as read by current user
    const unreadMessages = messages.filter(msg => !msg.isReadBy(req.user._id) && msg.sender._id.toString() !== req.user._id.toString());
    await Promise.all(unreadMessages.map(msg => msg.markAsRead(req.user._id)));

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// @route   POST /api/chat/course/:courseId/messages
// @desc    Send a message to a course
// @access  Private (Enrolled students or Course instructor)
router.post('/course/:courseId/messages', authenticate, validateObjectId('courseId'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, type = 'text', replyTo, isAnnouncement = false } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    // Only instructors can send announcements
    if (isAnnouncement && !isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'Only instructors can send announcements' });
    }

    // Create message
    const message = new Message({
      course: courseId,
      sender: req.user._id,
      content: content.trim(),
      type,
      replyTo: replyTo || undefined,
      isAnnouncement
    });

    await message.save();
    
    // Populate sender info
    await message.populate('sender', 'profile.firstName profile.lastName email role');
    
    if (replyTo) {
      await message.populate({
        path: 'replyTo',
        select: 'content sender',
        populate: {
          path: 'sender',
          select: 'profile.firstName profile.lastName email'
        }
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// @route   PUT /api/chat/messages/:messageId
// @desc    Edit a message
// @access  Private (Message sender only)
router.put('/messages/:messageId', authenticate, validateObjectId('messageId'), async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: 'Message is too old to edit' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate('sender', 'profile.firstName profile.lastName email role');

    res.json({ message });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error while editing message' });
  }
});

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete a message
// @access  Private (Message sender or Course instructor)
router.delete('/messages/:messageId', authenticate, validateObjectId('messageId'), async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user can delete this message
    const course = await Course.findById(message.course);
    const isMessageSender = message.sender.toString() === req.user._id.toString();
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isMessageSender && !isInstructor && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own messages or instructor can delete any message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

// @route   POST /api/chat/messages/:messageId/react
// @desc    React to a message
// @access  Private (Enrolled students or Course instructor)
router.post('/messages/:messageId/react', authenticate, validateObjectId('messageId'), async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;

    if (!['like', 'love', 'laugh', 'wow', 'sad', 'angry'].includes(reaction)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user has access to the course
    const course = await Course.findById(message.course);
    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add or update reaction
    const existingReaction = message.reactions.find(r => r.user.toString() === req.user._id.toString());
    
    if (existingReaction) {
      if (existingReaction.type === reaction) {
        // Remove reaction if same type
        message.reactions = message.reactions.filter(r => r.user.toString() !== req.user._id.toString());
      } else {
        // Update reaction type
        existingReaction.type = reaction;
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        type: reaction
      });
    }

    await message.save();

    res.json({ 
      reactions: message.reactions,
      reactionCounts: message.reactionCounts
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error while reacting to message' });
  }
});

// @route   GET /api/chat/course/:courseId/search
// @desc    Search messages in a course
// @access  Private (Enrolled students or Course instructor)
router.get('/course/:courseId/search', authenticate, validateObjectId('courseId'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({ message: 'Search term must be at least 2 characters' });
    }

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const messages = await Message.searchMessages(courseId, searchTerm.trim(), parseInt(limit));

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error while searching messages' });
  }
});

// @route   GET /api/chat/course/:courseId/unread-count
// @desc    Get unread message count for a course
// @access  Private (Enrolled students or Course instructor)
router.get('/course/:courseId/unread-count', authenticate, validateObjectId('courseId'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user._id.toString();
    const isEnrolled = course.isStudentEnrolled(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const unreadCount = await Message.getUnreadCount(courseId, req.user._id);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

export default router;