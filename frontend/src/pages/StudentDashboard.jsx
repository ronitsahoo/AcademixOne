import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import AssignmentCard from '../components/AssignmentCard'
import AttendanceTable from '../components/AttendanceTable'
import logo from '../assets/logo.png'

function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData && userData.role === 'student') {
      setUser(userData)
    } else {
      navigate('/')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    navigate('/')
  }

  const handleCourseClick = (courseName) => {
    // Convert course name to URL-friendly format
    const courseId = courseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    navigate(`/course/${courseId}`)
  }

  const handleJoinCourse = (courseName) => {
    // Implement join course logic here
    console.log(`Joining course: ${courseName}`)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
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
                { title: 'Next Class', value: '2:30 PM', color: 'purple', icon: '⏰' }
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
                  { action: 'Assignment submitted', course: 'Mathematics 101', time: '2 hours ago' },
                  { action: 'Grade posted', course: 'Physics Lab', time: '1 day ago' },
                  { action: 'New course material', course: 'Computer Science', time: '2 days ago' }
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
                {[
                  { name: 'Full Stack Development', instructor: 'Ms. Rupali Kale', progress: 75, semester: 'Fall 2024', department: 'Computer Science', credits: 4 },
                  { name: 'Data Mining and Business Intelligence', instructor: 'Dr. Ravita Mishra', progress: 60, semester: 'Fall 2024', department: 'Computer Science', credits: 3 },
                  { name: 'Computer Network and Security', instructor: 'Mr. Abhishek Chaudhari', progress: 90, semester: 'Fall 2024', department: 'Computer Science', credits: 4 }
                ].map((course) => (
                  <CourseCard
                    key={course.name}
                    course={course}
                    userRole="student"
                  />
                ))}
              </div>
            </div>

            {/* Available Courses */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Agile Software Development', instructor: 'Dr.(Mrs.) Shalu Chopra', semester: 'Fall 2024', department: 'Computer Science', credits: 3 },
                  { name: 'Cloud Computing and Services', instructor: 'Mr. Krishnaji Salgaonkar', semester: 'Fall 2024', department: 'Computer Science', credits: 4 },
                  { name: 'Solid and Hazardous Waste', instructor: 'Mrs. Anuradha Jadiya', semester: 'Fall 2024', department: 'Computer Science', credits: 2 }
                ].map((course) => (
                  <CourseCard
                    key={course.name}
                    course={course}
                    userRole="student"
                    onJoin={handleJoinCourse}
                  />
                ))}
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
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Submitted</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Assignments</h3>
              {[
                { 
                  id: 1,
                  title: 'REST API Development', 
                  description: 'Create a RESTful API using Node.js and Express with database integration',
                  course: 'Full Stack Development', 
                  dueDate: '2024-03-10',
                  status: 'pending',
                  maxMarks: 100
                },
                { 
                  id: 2,
                  title: 'Data Analysis Report', 
                  description: 'Analyze the provided dataset and create a comprehensive report',
                  course: 'Data Mining and Business Intelligence', 
                  dueDate: '2024-03-15',
                  status: 'not_started',
                  maxMarks: 80
                }
              ].map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  userRole="student"
                  onSubmit={(assignment) => console.log('Submit:', assignment.title)}
                />
              ))}
            </div>

            {/* Submitted Assignments */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Submitted Assignments</h3>
              {[
                { 
                  id: 3,
                  title: 'Portfolio Website', 
                  description: 'Create a responsive portfolio website using HTML, CSS, and JavaScript',
                  course: 'Full Stack Development', 
                  dueDate: '2024-01-20',
                  submissionDate: '2024-01-18',
                  status: 'submitted',
                  grade: 'A-',
                  maxMarks: 100,
                  obtainedMarks: 92
                },
                { 
                  id: 4,
                  title: 'React Todo App', 
                  description: 'Build a todo application using React with CRUD operations',
                  course: 'Full Stack Development', 
                  dueDate: '2024-02-15',
                  submissionDate: '2024-02-14',
                  status: 'submitted',
                  grade: 'A',
                  maxMarks: 100,
                  obtainedMarks: 95
                }
              ].map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  userRole="student"
                />
              ))}
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
    </div>
  )
}

export default StudentDashboard