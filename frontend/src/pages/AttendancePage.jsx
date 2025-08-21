import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import AttendanceTable from '../components/AttendanceTable'
import logo from '../assets/logo.png'

function AttendancePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lectureCount, setLectureCount] = useState(1)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData) {
      setUser(userData)
      loadCourses(userData)
    } else {
      navigate('/')
    }
  }, [navigate])

  const loadCourses = (userData) => {
    // Mock courses data - in real app, fetch from API
    const mockCourses = [
      {
        id: 'fsd',
        name: 'Full Stack Development',
        students: [
          { id: '1', name: 'John Doe', rollNumber: 'CS001', attendanceRecord: [
            { date: '2024-01-15', present: true },
            { date: '2024-01-17', present: true },
            { date: '2024-01-19', present: false }
          ]},
          { id: '2', name: 'Jane Smith', rollNumber: 'CS002', attendanceRecord: [
            { date: '2024-01-15', present: true },
            { date: '2024-01-17', present: false },
            { date: '2024-01-19', present: true }
          ]},
          { id: '3', name: 'Mike Johnson', rollNumber: 'CS003', attendanceRecord: [
            { date: '2024-01-15', present: false },
            { date: '2024-01-17', present: true },
            { date: '2024-01-19', present: true }
          ]}
        ]
      },
      {
        id: 'dmbi',
        name: 'Data Mining and Business Intelligence',
        students: [
          { id: '4', name: 'Sarah Wilson', rollNumber: 'CS004', attendanceRecord: [
            { date: '2024-01-16', present: true },
            { date: '2024-01-18', present: true }
          ]},
          { id: '5', name: 'Tom Brown', rollNumber: 'CS005', attendanceRecord: [
            { date: '2024-01-16', present: false },
            { date: '2024-01-18', present: true }
          ]}
        ]
      }
    ]

    if (userData.role === 'teacher') {
      setCourses(mockCourses)
    } else {
      // For students, show their enrolled courses with attendance data
      const studentCourses = mockCourses.map(course => ({
        id: course.id,
        name: course.name,
        attendanceRecord: course.students.find(s => s.id === userData.id)?.attendanceRecord || []
      }))
      setCourses(studentCourses)
    }
  }

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId)
    const course = courses.find(c => c.id === courseId)
    if (course && course.students) {
      setStudents(course.students)
      // Initialize attendance state
      const initialAttendance = {}
      course.students.forEach(student => {
        initialAttendance[student.id] = true // Default to present
      })
      setAttendance(initialAttendance)
    }
  }

  const handleAttendanceChange = (studentId, isPresent) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: isPresent
    }))
  }

  const handleSaveAttendance = () => {
    if (!selectedCourse || students.length === 0) {
      alert('Please select a course and ensure students are loaded.')
      return
    }

    // Save attendance to localStorage (in real app, send to API)
    const attendanceRecord = {
      courseId: selectedCourse,
      date: date,
      lectureCount: lectureCount,
      attendance: attendance,
      timestamp: new Date().toISOString()
    }

    const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
    existingRecords.push(attendanceRecord)
    localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords))

    alert('Attendance saved successfully!')
    
    // Reset form
    setAttendance({})
    setSelectedCourse('')
    setStudents([])
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    navigate('/')
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Back to Dashboard
              </button>
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.role === 'teacher' ? 'Mark Attendance' : 'My Attendance'}
              </h1>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'teacher' ? (
          <div className="space-y-6">
            {/* Teacher Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attendance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Lectures
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={lectureCount}
                    onChange={(e) => setLectureCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            {students.length > 0 && (
              <>
                <AttendanceTable
                  students={students}
                  userRole="teacher"
                  onMarkAttendance={handleAttendanceChange}
                  attendanceData={attendance}
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Save Attendance
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          // Student View
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📚</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">✅</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.length > 0 ? Math.round(
                        courses.reduce((acc, course) => {
                          const total = course.attendanceRecord.length
                          const present = course.attendanceRecord.filter(r => r.present).length
                          return acc + (total > 0 ? (present / total) * 100 : 0)
                        }, 0) / courses.length
                      ) : 0}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Attendance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.filter(course => {
                        const total = course.attendanceRecord.length
                        const present = course.attendanceRecord.filter(r => r.present).length
                        return total > 0 && (present / total) * 100 < 75
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AttendanceTable
              students={courses}
              userRole="student"
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default AttendancePage