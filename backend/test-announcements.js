// Test announcements
import mongoose from 'mongoose';
import Announcement from './models/Announcement.js';
import Course from './models/Course.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academixone';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testAnnouncements() {
  try {
    console.log('=== Testing Announcements ===');
    
    // Find course and teacher
    const course = await Course.findOne();
    const teacher = await User.findOne({ role: 'teacher' });
    
    if (!course || !teacher) {
      console.log('❌ Missing course or teacher');
      return;
    }
    
    console.log(`📚 Course: ${course.name} (ID: ${course._id})`);
    console.log(`👨‍🏫 Teacher: ${teacher.email}`);
    
    // Check existing announcements
    const existingAnnouncements = await Announcement.find({ course: course._id });
    console.log(`📢 Existing announcements: ${existingAnnouncements.length}`);
    
    if (existingAnnouncements.length === 0) {
      // Create test announcements
      const testAnnouncement1 = new Announcement({
        title: 'Welcome to the Course',
        content: 'Welcome to our course! Please check the course materials and assignments.',
        course: course._id,
        author: teacher._id,
        priority: 'high',
        isActive: true
      });
      
      const testAnnouncement2 = new Announcement({
        title: 'Assignment Reminder',
        content: 'Don\'t forget to submit your assignments on time.',
        course: course._id,
        author: teacher._id,
        priority: 'medium',
        isActive: true
      });
      
      await testAnnouncement1.save();
      await testAnnouncement2.save();
      
      console.log('✅ Created 2 test announcements');
    }
    
    // Test the API query
    const announcements = await Announcement.find({ 
      course: course._id, 
      isActive: true 
    })
    .populate('author', 'profile.firstName profile.lastName email')
    .sort({ createdAt: -1 });
    
    console.log(`\n📋 Found ${announcements.length} announcements:`);
    announcements.forEach((announcement, index) => {
      console.log(`  ${index + 1}. ${announcement.title}`);
      console.log(`     Priority: ${announcement.priority}`);
      console.log(`     Author: ${announcement.author?.email || 'Unknown'}`);
      console.log(`     Active: ${announcement.isActive}`);
      console.log(`     Date: ${announcement.createdAt.toDateString()}`);
    });
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  mongoose.disconnect();
}

testAnnouncements();