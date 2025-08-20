import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
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
              { id: 'marks', name: 'Marks', icon: '📈' },
              { id: 'schedule', name: 'Schedule', icon: '📅' },
              { id: 'resources', name: 'Resources', icon: '📁' }
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
                  { name: 'Full Stack Development', instructor: 'Ms. Rupali Kale', progress: 75, semester: 'Fall 2024', department: 'Computer Science' },
                  { name: 'Data Mining and Business Intelligence', instructor: 'Dr. Ravita Mishra', progress: 60, semester: 'Fall 2024', department: 'Computer Science' },
                  { name: 'Computer Network and Security', instructor: 'Mr. Abhishek Chaudhari', progress: 90, semester: 'Fall 2024', department: 'Computer Science' }
                ].map((course) => (
                  <div 
                    key={course.name} 
                    onClick={() => handleCourseClick(course.name)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Instructor: {course.instructor}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Click to view course details →
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Courses */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Agile Software Development', instructor: 'Dr.(Mrs.) Shalu Chopra', semester: 'Fall 2024', department: 'Computer Science' },
                  { name: 'Cloud Computing and Services', instructor: 'Mr. Krishnaji Salgaonkar', semester: 'Fall 2024', department: 'Computer Science' },
                  { name: 'Solid and Hazardous Waste', instructor: 'Mrs. Anuradha Jadiya', semester: 'Fall 2024', department: 'Computer Science' }
                ].filter(course => course.semester === 'Fall 2024' && course.department === 'Computer Science')
                .map((course) => (
                  <div key={course.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Instructor: {course.instructor}</p>
                    <button
                      onClick={() => handleJoinCourse(course.name)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Join Course
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h2>
            
            {/* Pending Assignments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white p-6">Pending Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      { name: 'Calculus Problem Set', course: 'Mathematics 101', dueDate: '2024-01-15' },
                      { name: 'Programming Assignment', course: 'Computer Science', dueDate: '2024-01-20' }
                    ].map((assignment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{assignment.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{assignment.course}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{assignment.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submitted Assignments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white p-6">Submitted Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submission Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[
                      { name: 'Lab Report', course: 'Physics Lab', submissionDate: '2024-01-12', grade: 'A-' },
                      { name: 'Essay Draft', course: 'English Literature', submissionDate: '2024-01-18', grade: 'B+' }
                    ].map((assignment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{assignment.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{assignment.course}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{assignment.submissionDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{assignment.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Marks</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assessment Marks</h3>
              <div className="space-y-6">
                {[
                  {
                    course: 'Full Stack Development',
                    midTerm: 18,
                    assessments: [
                      { type: 'PPT Presentation', marks: '23/25 '},
                      { type: 'Quiz 1', marks: '8/10' },
                      { type: 'Quiz 2', marks: '9/10' }
                    ]
                  },
                  {
                    course: 'Data Mining and Business Intelligence',
                    midTerm: 18,
                    assessments: [
                      { type: 'PPT Presentation', marks: '23/25 '},
                      { type: 'Quiz 1', marks: '8/10' },
                      { type: 'Quiz 2', marks: '9/10' }
                    ]
                  }
                ].map((course, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.course}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mid-Term</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{course.midTerm}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Continuous Assessments</p>
                        {course.assessments.map((assessment, idx) => (
                          <p key={idx} className="text-sm text-gray-900 dark:text-white">
                            {assessment.type}: {assessment.marks}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Class Schedule</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {[
                  { time: '9:00 AM - 10:30 AM', course: 'Mathematics 101', room: 'Room 201', instructor: 'Dr. Smith' },
                  { time: '11:00 AM - 12:30 PM', course: 'Physics Lab', room: 'Lab 105', instructor: 'Prof. Johnson' },
                  { time: '2:00 PM - 3:30 PM', course: 'Computer Science', room: 'Room 301', instructor: 'Dr. Williams' },
                  { time: '4:00 PM - 5:30 PM', course: 'English Literature', room: 'Room 102', instructor: 'Prof. Brown' }
                ].map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">📚</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{classItem.course}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{classItem.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{classItem.room}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{classItem.instructor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Resources</h2>
            <div className="space-y-8">
              {[
                {
                  course: 'Full Stack Development',
                  resources: [
                    { title: 'Lecture Notes', type: 'PDF', count: '8 files' },
                    { title: 'Video Lectures', type: 'Video', count: '4 videos' },
                    { title: 'Practice Tests', type: 'PDF', count: '3 tests' }
                  ]
                },
                {
                  course: 'Data Mining and Business Intelligence',
                  resources: [
                    { title: 'Study Guides', type: 'PDF', count: '5 guides' },
                    { title: 'Research Papers', type: 'PDF', count: '2 papers' },
                    { title: 'Tutorial Videos', type: 'Video', count: '3 videos' }
                  ]
                }
              ].map((subject, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{subject.course}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subject.resources.map((resource) => (
                      <div key={resource.title} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                        <div className="text-2xl mb-2">{resource.type === 'PDF' ? '📄' : '🎥'}</div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{resource.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{resource.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default StudentDashboard