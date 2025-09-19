// Test script to verify announcement functionality
// Run this after starting the backend and seeding data

const API_BASE = 'http://localhost:5000/api';

async function testAnnouncements() {
  try {
    // Login as teacher
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Logged in successfully');

    // Get courses to find course ID
    const coursesResponse = await fetch(`${API_BASE}/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const coursesData = await coursesResponse.json();
    const courseId = coursesData.courses[0]._id;
    console.log('✅ Found course ID:', courseId);

    // Get current course data
    const courseResponse = await fetch(`${API_BASE}/courses/${courseId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const courseData = await courseResponse.json();
    console.log('✅ Current announcements:', courseData.course.announcements?.length || 0);

    // Add new announcement
    const newAnnouncement = {
      title: 'Test Announcement from Script',
      content: 'This is a test announcement created via API script to verify functionality.',
      priority: 'high',
      isActive: true,
      date: new Date().toISOString()
    };

    const currentAnnouncements = courseData.course.announcements || [];
    const updatedAnnouncements = [...currentAnnouncements, newAnnouncement];

    const updateResponse = await fetch(`${API_BASE}/courses/${courseId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        announcements: updatedAnnouncements
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Announcement added successfully');
      console.log('✅ Total announcements now:', updateData.course.announcements?.length || 0);
    } else {
      const errorData = await updateResponse.json();
      console.error('❌ Failed to add announcement:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAnnouncements();