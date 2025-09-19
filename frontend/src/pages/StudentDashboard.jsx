import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import AssignmentCard from '../components/AssignmentCard'
import AttendanceTable from '../components/AttendanceTable'
import ProfileSettings from '../components/ProfileSettings'
import FirstTimeSetup from '../components/FirstTimeSetup'
import logo from '../assets/logo.png'
import apiService from '../services/api'

function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [needsFirstTimeSetup, setNeedsFirstTimeSetup] = useState(false)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData && userData.role === 'student') {
      setUser(userData)
      // Check if student needs to complete profile setup
      if (!userData.profile?.department || !userData.profile?.semester) {
        setNeedsFirstTimeSetup(true)
        setLoading(false)
      } else {
        loadDashboardData()
      }
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
      setCourses(coursesResponse.courses || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty arrays on error to prevent crashes
      setAssignments([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
      navigate('/')
    }
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

  // Show first-time setup if needed
  if (needsFirstTimeSetup && user) {
    return (
      <FirstTimeSetup
        onComplete={(updatedUser) => {
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setNeedsFirstTimeSetup(false)
          loadDashboardData()
        }}
      />
    )
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
            <div className="flex items-center">
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto mx-auto" />
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
                { title: 'Enrolled Courses', value: '3', color: 'blue', icon: '📚' },
                { title: 'Pending Assignments', value: '3', color: 'yellow', icon: '📝' },
                { title: 'Average Attendance', value: '79%', color: 'yellow', icon: '📒' },
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
                {[
                  { action: 'Assignment submitted', course: 'Full Stack Web Development', time: '2 hours ago' },
                  { action: 'Assignment Graded', course: 'Computer Networks and Security', time: '1 day ago' },
                  { action: 'New course material', course: 'Data Mining and Business Intelligence', time: '2 days ago' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.course}</p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
                  </div>
                ))}
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
                {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                  user.enrolledCourses.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={{
                        ...course,
                        name: course.name,
                        instructor: course.instructor ?
                          `${course.instructor.profile?.firstName || ''} ${course.instructor.profile?.lastName || ''}`.trim() || course.instructor.email
                          : 'Unknown Instructor',
                        progress: course.progress || 0
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => !course.isEnrolled).length > 0 ? (
                  courses.filter(course => !course.isEnrolled).map((course) => (
                    <CourseCard
                      key={course._id}
                      course={{
                        ...course,
                        instructor: course.instructor ?
                          `${course.instructor.profile?.firstName || ''} ${course.instructor.profile?.lastName || ''}`.trim() || course.instructor.email
                          : 'Unknown Instructor'
                      }}
                      userRole="student"
                      onJoin={() => handleJoinCourse(course._id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No available courses to join.</p>
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
              <button
                onClick={() => navigate('/attendance')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                View Detailed Attendance
              </button>
            </div>

            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">85%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Attendance Overview */}
            <AttendanceTable
              students={[
                {
                  id: 'fsd',
                  name: 'Full Stack Development',
                  attendanceRecord: [
                    { date: '2024-01-15', present: true },
                    { date: '2024-01-17', present: true },
                    { date: '2024-01-19', present: false },
                    { date: '2024-01-22', present: true },
                    { date: '2024-01-24', present: true }
                  ]
                },
                {
                  id: 'dmbi',
                  name: 'Data Mining and Business Intelligence',
                  attendanceRecord: [
                    { date: '2024-01-16', present: true },
                    { date: '2024-01-18', present: true },
                    { date: '2024-01-23', present: false },
                    { date: '2024-01-25', present: true }
                  ]
                },
                {
                  id: 'cns',
                  name: 'Computer Network and Security',
                  attendanceRecord: [
                    { date: '2024-01-17', present: true },
                    { date: '2024-01-19', present: true },
                    { date: '2024-01-24', present: true },
                    { date: '2024-01-26', present: true }
                  ]
                }
              ]}
              userRole="student"
            />
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
          }}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  )
}

export default StudentDashboard