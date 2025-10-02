import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import AssignmentCard from '../components/AssignmentCard'
import AttendanceTable from '../components/AttendanceTable'
import ProfileSettings from '../components/ProfileSettings'

import logo from '../assets/logo.png'
import apiService from '../services/api'
import { logout } from '../utils/auth'

function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    averageAttendance: 0,
    totalClasses: 0,
    attendanceBySubject: []
  })


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData && userData.role === 'student') {
      setUser(userData)
      loadDashboardData()
    } else {
      navigate('/')
    }
  }, [navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load user profile with enrolled courses
      const profileResponse = await apiService.getUserProfile()
      setUser(profileResponse.user)

      // Load assignments for enrolled courses
      const assignmentsResponse = await apiService.getAssignments()
      setAssignments(assignmentsResponse.assignments || [])

      // Load all courses to show enrolled and available
      const coursesResponse = await apiService.getCourses()
      const allCourses = coursesResponse.courses || []
      
      // Get enrolled course IDs for comparison
      const enrolledCourseIds = profileResponse.user.enrolledCourses?.map(course => 
        course._id || course
      ) || []
      
      // Filter courses based on student's department and semester (if available)
      const studentDept = profileResponse.user.profile?.department
      const studentSem = profileResponse.user.profile?.semester
      
      // Helper function to extract semester number for flexible matching
      const extractSemesterNumber = (semesterString) => {
        if (!semesterString) return null;
        const match = semesterString.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
      };
      
      const studentSemNumber = extractSemesterNumber(studentSem);
      
      const coursesWithStatus = allCourses.map(course => {
        const isEnrolled = enrolledCourseIds.includes(course._id)
        
        // If student has no department/semester set, show all courses
        if (!studentDept || !studentSem) {
          return {
            ...course,
            isEnrolled,
            isEligible: true,
            progress: isEnrolled ? (course.progress || 75) : 0
          }
        }
        
        // Department must match exactly
        const deptMatch = course.department === studentDept;
        
        // Semester matching - flexible (extract numbers and compare)
        const courseSemNumber = extractSemesterNumber(course.semester);
        const semMatch = studentSemNumber && courseSemNumber && studentSemNumber === courseSemNumber;
        
        // Course is eligible if dept and semester match, OR if already enrolled
        const isEligible = (deptMatch && semMatch) || isEnrolled;
        
        return {
          ...course,
          isEnrolled,
          isEligible,
          progress: isEnrolled ? (course.progress || 75) : 0
        }
      })
      
      // Debug logging
      console.log('=== Course Filtering Debug ===')
      console.log('Student profile:', { studentDept, studentSem, studentSemNumber })
      console.log('Enrolled course IDs:', enrolledCourseIds)
      console.log('All courses from API:', allCourses.map(c => ({ 
        id: c._id, 
        name: c.name, 
        dept: c.department, 
        sem: c.semester 
      })))
      console.log('Courses with filtering results:')
      coursesWithStatus.forEach(course => {
        const courseSemNumber = extractSemesterNumber(course.semester);
        console.log(`- ${course.name}: dept="${course.department}" sem="${course.semester}" (${courseSemNumber}) enrolled=${course.isEnrolled} eligible=${course.isEligible}`)
      })
      console.log('Enrolled courses:', coursesWithStatus.filter(c => c.isEnrolled).length)
      console.log('Available eligible courses:', coursesWithStatus.filter(c => !c.isEnrolled && c.isEligible).length)
      
      // Calculate dashboard statistics
      const enrolledCourses = coursesWithStatus.filter(c => c.isEnrolled)
      const pendingAssignments = assignmentsResponse.assignments?.filter(a => 
        !a.hasSubmitted && new Date(a.dueDate) > new Date()
      ).length || 0

      // Load attendance data for enrolled courses
      let totalAttendancePercentage = 0
      let attendanceBySubject = []
      
      try {
        for (const course of enrolledCourses) {
          try {
            const attendanceResponse = await apiService.getStudentAttendanceSummary(profileResponse.user._id, course._id)
            const summary = attendanceResponse.summary || {}
            attendanceBySubject.push({
              courseId: course._id,
              courseName: course.name,
              attendancePercentage: summary.attendancePercentage || 0,
              totalClasses: summary.totalClasses || 0,
              presentCount: summary.presentCount || 0,
              absentCount: summary.absentCount || 0
            })
            totalAttendancePercentage += summary.attendancePercentage || 0
          } catch (attendanceError) {
            console.log(`No attendance data for course ${course.name}`)
            attendanceBySubject.push({
              courseId: course._id,
              courseName: course.name,
              attendancePercentage: 0,
              totalClasses: 0,
              presentCount: 0,
              absentCount: 0
            })
          }
        }
      } catch (error) {
        console.error('Error loading attendance data:', error)
      }

      const averageAttendance = enrolledCourses.length > 0 ? 
        Math.round(totalAttendancePercentage / enrolledCourses.length) : 0

      setDashboardStats({
        enrolledCourses: enrolledCourses.length,
        pendingAssignments,
        averageAttendance,
        totalClasses: attendanceBySubject.reduce((sum, subject) => sum + subject.totalClasses, 0),
        attendanceBySubject
      })
      
      setCourses(coursesWithStatus)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty arrays on error to prevent crashes
      setAssignments([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout(navigate)
  }

  const handleJoinCourse = async (courseId) => {
    try {
      await apiService.enrollInCourse(courseId)
      alert('Successfully enrolled in course!')
      loadDashboardData() // Reload data
    } catch (error) {
      console.error('Error enrolling in course:', error)
      alert(error.message || 'Failed to enroll in course')
    }
  }



  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-300">
      <ThemeToggle />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user.email}</span>
              <button
                onClick={() => setShowProfileSettings(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'courses', name: 'Courses', icon: '📚' },
              { id: 'assignments', name: 'Assignments', icon: '📝' },
              { id: 'attendance', name: 'Attendance', icon: '📅' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Enrolled Courses', value: dashboardStats.enrolledCourses.toString(), color: 'blue', icon: '📚' },
                { title: 'Pending Assignments', value: dashboardStats.pendingAssignments.toString(), color: 'yellow', icon: '📝' },
                { title: 'Average Attendance', value: `${dashboardStats.averageAttendance}%`, color: 'green', icon: '📒' },
              ].map((stat) => (
                <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{stat.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  assignments
                    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
                    .slice(0, 3)
                    .map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {assignment.hasSubmitted ? 
                              (assignment.submission?.grade?.score !== undefined ? 'Assignment Graded' : 'Assignment Submitted') :
                              'New Assignment'
                            }
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.course?.name || assignment.title}</p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(assignment.updatedAt || assignment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Courses</h2>

            {/* Enrolled Courses */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Enrolled Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => course.isEnrolled).length > 0 ? (
                  courses.filter(course => course.isEnrolled).map((course) => (
                    <CourseCard
                      key={course._id}
                      course={{
                        ...course,
                        progress: course.progress // Use the progress from the processed courses array
                      }}
                      userRole="student"
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No enrolled courses yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Courses */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Courses</h3>
              {user.profile?.department && user.profile?.semester ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing courses for {user.profile.department} - {user.profile.semester}
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing all available courses. Complete your profile to see filtered courses.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => !course.isEnrolled && course.isEligible).length > 0 ? (
                  courses.filter(course => !course.isEnrolled && course.isEligible).map((course) => (
                    <CourseCard
                      key={course._id}
                      course={{
                        ...course,
                        // Keep instructor as object, CourseCard will handle the display logic
                        progress: 0 // Available courses should show 0% progress
                      }}
                      userRole="student"
                      onJoin={() => handleJoinCourse(course._id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      {!user.profile?.department || !user.profile?.semester ? (
                        <div>
                          <p className="mb-2">Complete your profile to see filtered courses</p>
                          <button
                            onClick={() => setShowProfileSettings(true)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Update Profile →
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">No available courses found for your department and semester.</p>
                          <p className="text-sm">Try updating your profile or contact your administrator.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📝</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {assignments.filter(assignment => !assignment.hasSubmitted && new Date(assignment.dueDate) > new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {assignments.filter(assignment => assignment.hasSubmitted).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Assignments</h3>
              {assignments.filter(assignment => !assignment.hasSubmitted && !assignment.isOverdue).length > 0 ? (
                assignments.filter(assignment => !assignment.hasSubmitted && !assignment.isOverdue).map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={{
                      ...assignment,
                      course: assignment.course?.name || 'Unknown Course',
                      status: 'pending',
                      maxMarks: assignment.maxScore
                    }}
                    userRole="student"
                    onSubmit={(assignment) => console.log('Submit:', assignment.title)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No pending assignments.</p>
                </div>
              )}
            </div>

            {/* Submitted Assignments */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Submitted Assignments</h3>
              {assignments.filter(assignment => assignment.hasSubmitted).length > 0 ? (
                assignments.filter(assignment => assignment.hasSubmitted).map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={{
                      ...assignment,
                      course: assignment.course?.name || 'Unknown Course',
                      status: assignment.submission?.status || 'submitted',
                      maxMarks: assignment.maxScore,
                      obtainedMarks: assignment.submission?.grade?.score,
                      grade: assignment.submission?.grade?.score ?
                        (assignment.submission.grade.score >= assignment.maxScore * 0.9 ? 'O' :
                          assignment.submission.grade.score >= assignment.maxScore * 0.8 ? 'A' :
                            assignment.submission.grade.score >= assignment.maxScore * 0.7 ? 'B' :
                              assignment.submission.grade.score >= assignment.maxScore * 0.6 ? 'C' : 'D') : null,
                      submissionDate: assignment.submission?.submittedAt
                    }}
                    userRole="student"
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No submitted assignments yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h2>

            </div>

            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.enrolledCourses}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.averageAttendance}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Attendance Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {dashboardStats.attendanceBySubject.filter(subject => subject.attendancePercentage < 75).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject-wise Attendance Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subject-wise Attendance</h3>
              {dashboardStats.attendanceBySubject.length > 0 ? (
                <div className="space-y-4">
                  {dashboardStats.attendanceBySubject.map((subject) => (
                    <div key={subject.courseId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{subject.courseName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subject.presentCount} present out of {subject.totalClasses} classes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          subject.attendancePercentage >= 85 ? 'text-green-600 dark:text-green-400' :
                          subject.attendancePercentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {subject.attendancePercentage}%
                        </div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              subject.attendancePercentage >= 85 ? 'bg-green-600' :
                              subject.attendancePercentage >= 75 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${subject.attendancePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No attendance data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Attendance data will appear here once classes begin
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          user={user}
          onUpdate={(updatedUser) => {
            setUser(updatedUser)
            localStorage.setItem('user', JSON.stringify(updatedUser))
            // Reload dashboard data to refresh course filtering
            loadDashboardData()
          }}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  )
}

export default StudentDashboard