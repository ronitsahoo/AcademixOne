
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';
import AssignmentCard from '../components/AssignmentCard';
import AttendanceTable from '../components/AttendanceTable';
import logo from '../assets/logo.png';
import apiService from '../services/api';

function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      loadCourseData(userData);
    } else {
      navigate('/');
    }
  }, [courseId, navigate]);

  const loadCourseData = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Load course details
      const courseResponse = await apiService.getCourseById(courseId);
      setCourse(courseResponse.course);

      // Load assignments
      const assignmentsResponse = await apiService.getCourseAssignments(courseId);
      setAssignments(assignmentsResponse.assignments || []);

      // Load attendance
      if (userData.role === 'student') {
        const attendanceResponse = await apiService.getCourseAttendance(courseId);
        setAttendanceData({
          coursesOrStudents: [{
            id: courseId,
            name: courseResponse.course.name,
            attendanceSummary: attendanceResponse.attendance || {
              presentCount: 0,
              lateCount: 0,
              absentCount: 0,
              totalClasses: 0,
            },
          }],
        });
      } else if (userData.role === 'teacher') {
        const attendanceResponse = await apiService.getCourseAttendanceOverview(courseId);
        setAttendanceData({
          coursesOrStudents: (attendanceResponse.students || []).map(student => ({
            ...student,
            attendanceSummary: student.attendanceSummary || {
              presentCount: 0,
              lateCount: 0,
              totalClasses: 0,
            },
          })),
        });
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setError(error.message || 'Failed to load course details');
      if (error.message?.includes('not found')) {
        setCourse(null);
      }
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

  const handleEnrollCourse = async () => {
    try {
      setLoading(true);
      await apiService.enrollInCourse(courseId);
      alert('Successfully enrolled in course!');
      loadCourseData(user);
    } catch (error) {
      setError(error.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const handleDropCourse = async () => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      try {
        setLoading(true);
        await apiService.dropFromCourse(courseId);
        alert('Successfully dropped from course!');
        navigate('/student-dashboard');
      } catch (error) {
        setError(error.message || 'Failed to drop from course');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGradeAssignment = async (assignment) => {
    navigate(`/teacher-course/${courseId}/assignment/${assignment._id}/grade`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src={logo} alt="AcademixOne" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Course Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.email}</span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {course.code && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                    {course.code}
                  </span>
                )}
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-sm">
                  {course.department}
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
                  {course.semester}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Instructor: {course.instructor?.profile?.firstName} {course.instructor?.profile?.lastName || course.instructor?.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{course.credits} Credits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{course.enrolledCount || 0} Students</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {user?.role === 'student' && (
              <div className="mt-4 md:mt-0">
                {course.isEnrolled ? (
                  <button
                    onClick={handleDropCourse}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Drop Course
                  </button>
                ) : (
                  <button
                    onClick={handleEnrollCourse}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Enroll in Course
                  </button>
                )}
              </div>
            )}
            {user?.role === 'teacher' && (
              <div className="mt-4 md:mt-0 flex space-x-4">
                <button
                  onClick={() => navigate(`/teacher-course/${courseId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Manage Course
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'assignments', name: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { id: 'attendance', name: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {course.description || 'No description available for this course.'}
                  </p>
                </div>

                {course.schedule && course.schedule.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Schedule</h3>
                    <div className="space-y-3">
                      {course.schedule.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-900 dark:text-white">{schedule.day}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.startTime} - {schedule.endTime}
                            {schedule.room && ` • ${schedule.room}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Assignments</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{assignments.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Enrolled Students</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.enrolledCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Course Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Assignments</h2>
                {user?.role === 'teacher' && (
                  <button
                    onClick={() => navigate(`/teacher-course/${courseId}/create-assignment`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Create Assignment
                  </button>
                )}
              </div>

              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment._id}
                      assignment={{
                        ...assignment,
                        course: course.name,
                        hasSubmitted: assignment.hasSubmitted || false,
                        isOverdue: new Date(assignment.dueDate) < new Date() && !assignment.hasSubmitted,
                        submission: {
                          status: assignment.hasSubmitted ? (assignment.submission?.status || 'submitted') : 'pending',
                          submittedAt: assignment.submission?.submittedAt,
                          grade: assignment.submission?.grade,
                        },
                        maxScore: assignment.maxScore,
                      }}
                      userRole={user?.role}
                      onSubmit={(assignment) => console.log('Submit:', assignment.title)}
                      onGrade={user?.role === 'teacher' ? handleGradeAssignment : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Assignments Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Assignments will appear here when the instructor creates them.</p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.role === 'teacher' ? 'Course Attendance' : 'My Attendance'}
                </h2>
                {user?.role === 'teacher' && (
                  <button
                    onClick={() => navigate('/attendance')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Mark Attendance
                  </button>
                )}
              </div>

              {attendanceData && attendanceData.coursesOrStudents.length > 0 ? (
                <AttendanceTable
                  coursesOrStudents={attendanceData.coursesOrStudents}
                  userRole={user?.role}
                  onMarkAttendance={user?.role === 'teacher' ? handleAttendanceChange : undefined}
                  attendanceSummary={attendanceData.coursesOrStudents.reduce((acc, item) => ({
                    ...acc,
                    [item.id]: item.attendanceSummary?.status || 'present',
                  }), {})}
                />
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Attendance Records</h3>
                  <p className="text-gray-500 dark:text-gray-400">Attendance records will appear here once classes begin.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

CourseDetails.propTypes = {
  courseId: PropTypes.string,
  navigate: PropTypes.func,
};

export default CourseDetails;
