import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CourseCard from '../components/CourseCard'
import AssignmentCard from '../components/AssignmentCard'
import AttendanceTable from '../components/AttendanceTable'
import logo from '../assets/logo.png'

function TeacherDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: '',
    department: '',
    semester: '',
    credits: ''
  })

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData && userData.role === 'teacher') {
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

  const handleCreateCourse = (e) => {
    e.preventDefault()
    // Save course to localStorage (in real app, send to API)
    const courses = JSON.parse(localStorage.getItem('teacherCourses') || '[]')
    const courseData = {
      ...newCourse,
      id: Date.now().toString(),
      teacherId: user.id,
      students: 0,
      progress: 0,
      createdAt: new Date().toISOString()
    }
    courses.push(courseData)
    localStorage.setItem('teacherCourses', JSON.stringify(courses))
    
    // Reset form
    setNewCourse({ name: '', department: '', semester: '', credits: '' })
    setShowCreateCourse(false)
    alert('Course created successfully!')
  }

  const handleEditCourse = (course) => {
    // Navigate to course edit page (would be implemented)
    console.log('Edit course:', course.name)
  }

  const handleApproveStudent = (studentId, courseId) => {
    // Handle student approval logic
    console.log('Approve student:', studentId, 'for course:', courseId)
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
              <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">Faculty Portal</h1>
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
              { id: 'courses', name: 'My Courses', icon: '📚' },
              { id: 'students', name: 'Students', icon: '👥' },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Active Courses', value: '4', color: 'blue', icon: '📚' },
                { title: 'Total Students', value: '120', color: 'green', icon: '👥' },
                { title: 'Pending Reviews', value: '8', color: 'yellow', icon: '📝' },
                { title: 'Office Hours', value: '2:00 PM', color: 'purple', icon: '⏰' }
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
                  { action: 'Assignment graded', course: 'Mathematics 101', time: '1 hour ago' },
                  { action: 'New student enrolled', course: 'Physics Lab', time: '3 hours ago' },
                  { action: 'Course material uploaded', course: 'Computer Science', time: '1 day ago' }
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
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h2>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                + Create Course
              </button>
            </div>

            {/* Create Course Modal */}
            {showCreateCourse && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Course</h3>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Course Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        value={newCourse.department}
                        onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Semester
                      </label>
                      <input
                        type="text"
                        required
                        value={newCourse.semester}
                        onChange={(e) => setNewCourse({...newCourse, semester: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Credits
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="6"
                        value={newCourse.credits}
                        onChange={(e) => setNewCourse({...newCourse, credits: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-200"
                      >
                        Create Course
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateCourse(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Full Stack Development', students: 35, progress: 75, semester: 'Fall 2024', department: 'Computer Science', credits: 4 },
                { name: 'Data Mining and Business Intelligence', students: 28, progress: 60, semester: 'Fall 2024', department: 'Computer Science', credits: 3 },
                { name: 'Computer Network and Security', students: 42, progress: 90, semester: 'Fall 2024', department: 'Computer Science', credits: 4 },
                { name: 'Advanced Database Systems', students: 15, progress: 45, semester: 'Fall 2024', department: 'Computer Science', credits: 3 }
              ].map((course) => (
                <CourseCard
                  key={course.name}
                  course={course}
                  userRole="teacher"
                  onEdit={handleEditCourse}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Student Management</h2>
            
            {/* Approval Pending Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Approval Pending</h3>
              <div className="space-y-3">
                {[
                  { name: 'Alex Johnson', course: 'Full Stack Development', requestDate: '2024-01-20' },
                  { name: 'Maria Garcia', course: 'Data Mining and Business Intelligence', requestDate: '2024-01-19' }
                ].map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{request.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested to join: {request.course}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Request date: {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveStudent(request.name, request.course)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        Approve
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student List by Course */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Students by Course</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      { name: 'John Doe', course: 'Full Stack Development', attendance: '95%', grade: 'A-', status: 'Active' },
                      { name: 'Jane Smith', course: 'Full Stack Development', attendance: '88%', grade: 'B+', status: 'Active' },
                      { name: 'Mike Johnson', course: 'Data Mining and Business Intelligence', attendance: '92%', grade: 'A', status: 'Active' },
                      { name: 'Sarah Wilson', course: 'Computer Network and Security', attendance: '75%', grade: 'C+', status: 'At Risk' }
                    ].map((student, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{student.course}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{student.attendance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{student.grade}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.status === 'Active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assignment Management</h2>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                + Create Assignment
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📝</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📊</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Grading</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">15</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Graded</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Assignments</h3>
              {[
                { 
                  id: 1,
                  title: 'REST API Development', 
                  description: 'Create a RESTful API using Node.js and Express with database integration',
                  course: 'Full Stack Development', 
                  dueDate: '2024-03-10',
                  status: 'submitted',
                  maxMarks: 100,
                  submissions: '28/35'
                },
                { 
                  id: 2,
                  title: 'Data Analysis Report', 
                  description: 'Analyze the provided dataset and create a comprehensive report',
                  course: 'Data Mining and Business Intelligence', 
                  dueDate: '2024-03-15',
                  status: 'submitted',
                  maxMarks: 80,
                  submissions: '22/28'
                },
                { 
                  id: 3,
                  title: 'Network Security Assessment', 
                  description: 'Conduct a security assessment of the given network infrastructure',
                  course: 'Computer Network and Security', 
                  dueDate: '2024-03-20',
                  status: 'pending',
                  maxMarks: 120,
                  submissions: '15/42'
                }
              ].map((assignment) => (
                <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'submitted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {assignment.status === 'submitted' ? '📊 Needs Grading' : '⏰ Active'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{assignment.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>📊 Max Marks: {assignment.maxMarks}</span>
                        <span>📚 {assignment.course}</span>
                        <span>📤 Submissions: {assignment.submissions}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 md:ml-6">
                      {assignment.status === 'submitted' ? (
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                          Grade Submissions
                        </button>
                      ) : (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                          Manage Assignment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Management</h2>
              <button
                onClick={() => navigate('/attendance')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Mark Attendance
              </button>
            </div>
            
            {/* Attendance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">120</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Classes Today</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attendance Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Attendance Overview</h3>
              <div className="space-y-4">
                {[
                  { course: 'Full Stack Development', date: '2024-01-25', present: 32, total: 35, percentage: 91 },
                  { course: 'Data Mining and Business Intelligence', date: '2024-01-24', present: 25, total: 28, percentage: 89 },
                  { course: 'Computer Network and Security', date: '2024-01-23', present: 38, total: 42, percentage: 90 }
                ].map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{record.course}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.date).toLocaleDateString()} • {record.present}/{record.total} students present
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        record.percentage >= 85 ? 'text-green-600 dark:text-green-400' :
                        record.percentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {record.percentage}%
                      </div>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            record.percentage >= 85 ? 'bg-green-600' :
                            record.percentage >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${record.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TeacherDashboard 