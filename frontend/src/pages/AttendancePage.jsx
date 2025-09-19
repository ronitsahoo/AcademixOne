import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';
import AttendanceTable from '../components/AttendanceTable';
import apiService from '../services/api';
import logo from '../assets/logo.png';

function AttendancePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lectureCount, setLectureCount] = useState(1);
  const [coursesOrStudents, setCoursesOrStudents] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      loadCourses(userData);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const loadCourses = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      if (userData.role === 'teacher') {
        const response = await apiService.getCourses({ role: 'teacher' });
        setCourses(response.courses || []);
      } else {
        const response = await apiService.getUserCourses(userData.id);
        const studentCourses = response.courses.map(course => ({
          id: course._id,
          name: course.name,
          attendanceSummary: course.attendanceSummary || {
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            totalClasses: 0,
          },
        }));
        setCourses(studentCourses);
        setCoursesOrStudents(studentCourses);
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    if (user.role === 'teacher') {
      try {
        setLoading(true);
        const response = await apiService.getCourseStudents(courseId);
        const studentsWithSummary = response.students.map(student => ({
          ...student,
          attendanceSummary: student.attendanceSummary || {
            presentCount: 0,
            lateCount: 0,
            totalClasses: 0,
          },
        }));
        setCoursesOrStudents(studentsWithSummary);
        const initialAttendance = {};
        studentsWithSummary.forEach(student => {
          initialAttendance[student.id] = 'present';
        });
        setAttendanceSummary(initialAttendance);
      } catch (err) {
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAttendanceChange = async (studentId, status) => {
    setAttendanceSummary(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse || coursesOrStudents.length === 0) {
      alert('Please select a course and ensure students are loaded.');
      return;
    }

    try {
      setLoading(true);
      const attendanceData = {
        courseId: selectedCourse,
        date,
        lectureCount,
        attendance: Object.entries(attendanceSummary).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      };
      await apiService.createAttendanceSession(attendanceData);
      alert('Attendance saved successfully!');
      setAttendanceSummary({});
      setSelectedCourse('');
      setCoursesOrStudents([]);
    } catch (err) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => loadCourses(user)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
                      <option key={course._id} value={course._id}>{course.name}</option>
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
            {coursesOrStudents.length > 0 && (
              <>
                <AttendanceTable
                  coursesOrStudents={coursesOrStudents}
                  userRole="teacher"
                  onMarkAttendance={handleAttendanceChange}
                  attendanceSummary={attendanceSummary}
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
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
                      {courses.length > 0
                        ? Math.round(
                            courses.reduce((acc, course) => {
                              const summary = course.attendanceSummary || {};
                              const total = summary.totalClasses || 0;
                              const present = (summary.presentCount || 0) + (summary.lateCount || 0);
                              return acc + (total > 0 ? (present / total) * 100 : 0);
                            }, 0) / courses.length
                          )
                        : 0}%
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
                        const summary = course.attendanceSummary || {};
                        const total = summary.totalClasses || 0;
                        const present = (summary.presentCount || 0) + (summary.lateCount || 0);
                        return total > 0 && (present / total) * 100 < 75;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AttendanceTable
              coursesOrStudents={coursesOrStudents}
              userRole="student"
              attendanceSummary={attendanceSummary}
            />
          </div>
        )}
      </main>
    </div>
  );
}

AttendancePage.propTypes = {
  navigate: PropTypes.func,
};

export default AttendancePage;
