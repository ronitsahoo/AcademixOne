// Simple test script to verify course details functionality
// Run this with: node test-course-details.js

const API_BASE_URL = 'http://localhost:5000/api';

async function testCourseDetails() {
  console.log('🧪 Testing Course Details Functionality...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing API health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData.status);

    // Test 2: Get courses (public endpoint)
    console.log('\n2. Testing get courses...');
    const coursesResponse = await fetch(`${API_BASE_URL}/courses`);
    const coursesData = await coursesResponse.json();
    console.log('✅ Courses endpoint working, found', coursesData.courses?.length || 0, 'courses');

    if (coursesData.courses && coursesData.courses.length > 0) {
      const firstCourse = coursesData.courses[0];
      console.log('📚 Sample course:', firstCourse.name, `(ID: ${firstCourse._id})`);

      // Test 3: Get specific course details
      console.log('\n3. Testing get course by ID...');
      const courseResponse = await fetch(`${API_BASE_URL}/courses/${firstCourse._id}`);
      const courseData = await courseResponse.json();
      
      if (courseResponse.ok) {
        console.log('✅ Course details endpoint working');
        console.log('📖 Course:', courseData.course.name);
        console.log('👨‍🏫 Instructor:', courseData.course.instructor?.email || 'Unknown');
        console.log('🎓 Department:', courseData.course.department);
        console.log('📊 Enrolled:', courseData.course.enrolledCount || 0, 'students');
      } else {
        console.log('❌ Course details failed:', courseData.message);
      }

      // Test 4: Test assignments endpoint (will fail without auth, but should return proper error)
      console.log('\n4. Testing assignments endpoint (without auth)...');
      const assignmentsResponse = await fetch(`${API_BASE_URL}/courses/${firstCourse._id}/assignments`);
      const assignmentsData = await assignmentsResponse.json();
      
      if (assignmentsResponse.status === 401) {
        console.log('✅ Assignments endpoint properly protected (401 Unauthorized)');
      } else if (assignmentsResponse.ok) {
        console.log('✅ Assignments endpoint working, found', assignmentsData.assignments?.length || 0, 'assignments');
      } else {
        console.log('⚠️ Assignments endpoint returned:', assignmentsResponse.status, assignmentsData.message);
      }

      // Test 5: Test attendance endpoint (will fail without auth, but should return proper error)
      console.log('\n5. Testing attendance endpoint (without auth)...');
      const attendanceResponse = await fetch(`${API_BASE_URL}/courses/${firstCourse._id}/attendance`);
      const attendanceData = await attendanceResponse.json();
      
      if (attendanceResponse.status === 401) {
        console.log('✅ Attendance endpoint properly protected (401 Unauthorized)');
      } else if (attendanceResponse.ok) {
        console.log('✅ Attendance endpoint working');
      } else {
        console.log('⚠️ Attendance endpoint returned:', attendanceResponse.status, attendanceData.message);
      }
    } else {
      console.log('⚠️ No courses found to test with');
    }

    console.log('\n🎉 Course Details API Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the backend server: npm run dev (in backend folder)');
    console.log('2. Start the frontend server: npm run dev (in frontend folder)');
    console.log('3. Register/login as a student or teacher');
    console.log('4. Navigate to course details by clicking "View Details" on any course card');
    console.log('5. Test the different tabs: Overview, Assignments, Attendance');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the backend server is running on http://localhost:5000');
  }
}

// Run the test
testCourseDetails();