import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import logo from '../assets/logo.png'

function CourseDetails() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('syllabus')
  const [course, setCourse] = useState(null)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData && userData.role === 'student') {
      setUser(userData)
    } else {
      navigate('/')
    }

    // Mock course data - in real app, fetch from API
    const courseData = getCourseData(courseId)
    setCourse(courseData)
  }, [courseId, navigate])

  const getCourseData = (id) => {
    const courses = {
      'full-stack-development': {
        id: 'full-stack-development',
        name: 'Full Stack Development',
        instructor: 'Ms. Rupali Kale',
        semester: 'Fall 2024',
        department: 'Computer Science',
        credits: 4,
        progress: 75,
        description: 'Comprehensive course covering modern web development technologies including frontend and backend development.',
        syllabus: [
          {
            unit: 'Unit 1: Introduction to Web Development',
            topics: [
              'HTML5 and CSS3 Fundamentals',
              'Responsive Design Principles',
              'JavaScript ES6+ Features',
              'DOM Manipulation'
            ],
            completed: true,
            completionDate: '2024-01-15'
          },
          {
            unit: 'Unit 2: Frontend Frameworks',
            topics: [
              'React.js Fundamentals',
              'Component Architecture',
              'State Management',
              'React Hooks'
            ],
            completed: true,
            completionDate: '2024-02-10'
          },
          {
            unit: 'Unit 3: Backend Development',
            topics: [
              'Node.js and Express.js',
              'RESTful API Design',
              'Database Integration',
              'Authentication & Authorization'
            ],
            completed: false,
            currentTopic: 'RESTful API Design'
          },
          {
            unit: 'Unit 4: Advanced Topics',
            topics: [
              'Deployment Strategies',
              'Performance Optimization',
              'Testing Methodologies',
              'DevOps Basics'
            ],
            completed: false
          }
        ],
        assignments: [
          {
            id: 1,
            title: 'Portfolio Website',
            description: 'Create a responsive portfolio website using HTML, CSS, and JavaScript',
            dueDate: '2024-01-20',
            status: 'submitted',
            grade: 'A-',
            submissionDate: '2024-01-18',
            maxMarks: 100,
            obtainedMarks: 92
          },
          {
            id: 2,
            title: 'React Todo App',
            description: 'Build a todo application using React with CRUD operations',
            dueDate: '2024-02-15',
            status: 'submitted',
            grade: 'A',
            submissionDate: '2024-02-14',
            maxMarks: 100,
            obtainedMarks: 95
          },
          {
            id: 3,
            title: 'REST API Development',
            description: 'Create a RESTful API using Node.js and Express with database integration',
            dueDate: '2024-03-10',
            status: 'pending',
            maxMarks: 100
          },
          {
            id: 4,
            title: 'Full Stack Project',
            description: 'Complete full stack application with frontend and backend',
            dueDate: '2024-04-15',
            status: 'not_started',
            maxMarks: 150
          }
        ],
        resources: [
          {
            title: 'Course Lecture Notes',
            type: 'PDF',
            size: '2.5 MB',
            uploadDate: '2024-01-10',
            url: '#'
          },
          {
            title: 'React Documentation',
            type: 'Link',
            url: 'https://reactjs.org/docs',
            description: 'Official React documentation'
          },
          {
            title: 'Node.js Tutorial Videos',
            type: 'Video',
            duration: '3 hours',
            uploadDate: '2024-02-01',
            url: '#'
          }
        ],
        announcements: [
          {
            title: 'Assignment 3 Guidelines',
            content: 'Please refer to the updated guidelines for the REST API assignment.',
            date: '2024-02-20',
            priority: 'high'
          },
          {
            title: 'Class Schedule Change',
            content: 'Next week\'s class will be held in Lab 201 instead of Room 301.',
            date: '2024-02-18',
            priority: 'medium'
          }
        ]
      }
    }
    return courses[id] || null
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    navigate('/')
  }

  if (!user || !course) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-300">
      <ThemeToggle />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to Dashboard
              </button>
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto" />
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

      {/* Course Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>👨‍🏫 {course.instructor}</span>
                <span>📅 {course.semester}</span>
                <span>🏫 {course.department}</span>
                <span>📚 {course.credits} Credits</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{course.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'syllabus', name: 'Syllabus', icon: '📋' },
              { id: 'assignments', name: 'Assignments', icon: '📝' },
              { id: 'resources', name: 'Resources', icon: '📁' },
              { id: 'announcements', name: 'Announcements', icon: '📢' },
              { id: 'grades', name: 'Grades', icon: '📊' }
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
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Description</h2>
              <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Syllabus</h2>
              <div className="space-y-6">
                {course.syllabus.map((unit, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{unit.unit}</h3>
                      <div className="flex items-center space-x-2">
                        {unit.completed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Completed
                          </span>
                        ) : unit.currentTopic ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            🔄 In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            ⏳ Not Started
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      {unit.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            unit.completed ? 'bg-green-500' : 
                            unit.currentTopic === topic ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}></span>
                          <span className={`text-sm ${
                            unit.completed ? 'text-gray-700 dark:text-gray-300' :
                            unit.currentTopic === topic ? 'text-yellow-700 dark:text-yellow-300 font-medium' :
                            'text-gray-500 dark:text-gray-400'
                          }`}>
                            {topic}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {unit.completionDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Completed on: {new Date(unit.completionDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {unit.currentTopic && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3">
                        Currently studying: {unit.currentTopic}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}        {
activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📝</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.assignments.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {course.assignments.filter(a => a.status === 'submitted').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {course.assignments.filter(a => a.status === 'pending' || a.status === 'not_started').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {course.assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'submitted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {assignment.status === 'submitted' ? '✓ Submitted' :
                           assignment.status === 'pending' ? '⏳ Pending' : '📋 Not Started'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{assignment.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>📊 Max Marks: {assignment.maxMarks}</span>
                        {assignment.submissionDate && (
                          <span>📤 Submitted: {new Date(assignment.submissionDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6">
                      {assignment.grade ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{assignment.grade}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.obtainedMarks}/{assignment.maxMarks}
                          </div>
                        </div>
                      ) : assignment.status === 'pending' ? (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                          Submit Assignment
                        </button>
                      ) : (
                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                          Start Assignment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {course.resources.map((resource, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">
                        {resource.type === 'PDF' ? '📄' : 
                         resource.type === 'Video' ? '🎥' : '🔗'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          {resource.size && <div>Size: {resource.size}</div>}
                          {resource.duration && <div>Duration: {resource.duration}</div>}
                          {resource.uploadDate && <div>Uploaded: {new Date(resource.uploadDate).toLocaleDateString()}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200">
                        {resource.type === 'Link' ? 'Open Link' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Announcements</h2>
              <div className="space-y-4">
                {course.announcements.map((announcement, index) => (
                  <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
                    announcement.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    announcement.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          announcement.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {announcement.priority === 'high' ? '🔴 High' :
                           announcement.priority === 'medium' ? '🟡 Medium' : '🔵 Normal'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(announcement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📊</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Grade</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">A-</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📈</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">93.5%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🏆</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Class Rank</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">3/45</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Grade Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {course.assignments.filter(a => a.grade).map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          Assignment
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {assignment.obtainedMarks}/{assignment.maxMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assignment.grade.startsWith('A') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            assignment.grade.startsWith('B') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {assignment.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(assignment.submissionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CourseDetails