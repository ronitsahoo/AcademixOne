import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';
import CourseCard from '../components/CourseCard';

import AttendanceTable from '../components/AttendanceTable';

import apiService from '../services/api';
import logo from '../assets/logo.png';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    semester: '',
    credits: '',
    maxStudents: '',
    startDate: '',
    endDate: '',
  });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);

  // Define departments as a constant for maintainability
  const DEPARTMENTS = [
    'Information Technology',
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
  ];

  // Memoize loadDashboardData to prevent redefinition
  const loadDashboardData = useCallback(async () => {
    let isMounted = true; // Prevent memory leaks
    try {
      setLoading(true);
      setError(null);

      // Use existing user data from localStorage to avoid redundant API call
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || userData.role !== 'teacher') {
        throw new Error('Invalid user or role');
      }
      setUser(userData);

      // Load courses taught by this teacher
      const coursesResponse = await apiService.getCourses({ instructor: userData._id });
      if (isMounted) {
        setCourses(coursesResponse.courses || []);
      }

      // Load assignments for teacher's courses
      const assignmentsResponse = await apiService.getAssignments({ role: 'teacher' });
      if (isMounted) {
        setAssignments(assignmentsResponse.assignments || []);
      }

      // Load students from teacher's courses
      let allStudents = [];
      for (const course of coursesResponse.courses || []) {
        try {
          const studentsResponse = await apiService.getCourseStudents(course._id);
          allStudents = [...allStudents, ...studentsResponse.students];
        } catch (error) {
          console.error(`Error loading students for course ${course._id}:`, error);
        }
      }
      if (isMounted) {
        // Remove duplicates by student ID
        const uniqueStudents = allStudents.filter(
          (student, index, self) => index === self.findIndex((s) => s._id === student._id)
        );
        setStudents(uniqueStudents);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (isMounted) {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false; // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Validate required fields
      if (!newCourse.name || !newCourse.code || !newCourse.department || !newCourse.semester) {
        throw new Error('Please fill in all required fields');
      }
      
      const credits = parseInt(newCourse.credits);
      const maxStudents = parseInt(newCourse.maxStudents) || 50;

      // Validate inputs
      if (isNaN(credits) || credits < 1 || credits > 10) {
        throw new Error('Credits must be between 1 and 10');
      }
      if (isNaN(maxStudents) || maxStudents < 1 || maxStudents > 500) {
        throw new Error('Max students must be between 1 and 500');
      }
      if (!newCourse.startDate || !newCourse.endDate) {
        throw new Error('Please provide both start and end dates');
      }
      if (new Date(newCourse.startDate) >= new Date(newCourse.endDate)) {
        throw new Error('End date must be after start date');
      }

      const courseData = {
        ...newCourse,
        credits,
        maxStudents,
      };
      console.log('Creating course with data:', courseData);
      const response = await apiService.createCourse(courseData);

      // Reset form
      setNewCourse({
        name: '',
        code: '',
        description: '',
        department: '',
        semester: '',
        credits: '',
        maxStudents: '',
        startDate: '',
        endDate: '',
      });
      setShowCreateCourse(false);
      alert('Course created successfully!');
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.message || 'Failed to create course');
    }
  };

  const handleEditCourse = (course) => {
    navigate(`/teacher-course/${course._id}`);
  };

  const handleApproveStudent = async (studentId, courseId) => {
    try {
      await apiService.approveStudent(courseId, studentId);
      alert('Student approved successfully!');
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving student:', error);
      setError(error.message || 'Failed to approve student');
    }
  };

  const handleInputChange = (e) => {
    setNewCourse({
      ...newCourse,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
            <div className="flex items-center">
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto" />
              <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">Faculty Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.email || 'Teacher'}</span>

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Logout"
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
              { id: 'attendance', name: 'Attendance', icon: '📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="mr-2" aria-hidden="true">
                  {tab.icon}
                </span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              aria-label="Close error message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4" aria-hidden="true">
                    📚
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4" aria-hidden="true">
                    👥
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4" aria-hidden="true">
                    📝
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Assignments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {assignments.filter((a) => new Date(a.dueDate) >= new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4" aria-hidden="true">
                    📅
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses in Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {courses.filter((c) => new Date(c.endDate) >= new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  aria-label="Create new course"
                >
                  Create New Course
                </button>
                <button
                  onClick={() => navigate('/attendance')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  aria-label="Mark attendance"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h2>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Create new course"
              >
                Create Course
              </button>
            </div>

            {/* Create Course Form */}
            {showCreateCourse && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Course</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Course Name
                      </label>
                      <input
                        name="name"
                        value={newCourse.name}
                        onChange={handleInputChange}
                        placeholder="Course Name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Course Code
                      </label>
                      <input
                        name="code"
                        value={newCourse.code}
                        onChange={handleInputChange}
                        placeholder="Course Code"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newCourse.description}
                      onChange={handleInputChange}
                      placeholder="Course description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department
                      </label>
                      <select
                        name="department"
                        value={newCourse.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <input
                        name="semester"
                        value={newCourse.semester}
                        onChange={handleInputChange}
                        placeholder="Semester"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Credits
                      </label>
                      <input
                        name="credits"
                        type="number"
                        min="1"
                        max="10"
                        value={newCourse.credits}
                        onChange={handleInputChange}
                        placeholder="Credits"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Students
                      </label>
                      <input
                        name="maxStudents"
                        type="number"
                        min="1"
                        max="500"
                        value={newCourse.maxStudents}
                        onChange={handleInputChange}
                        placeholder="Max Students"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        name="startDate"
                        type="date"
                        value={newCourse.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        name="endDate"
                        type="date"
                        value={newCourse.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleCreateCourse}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Create Course
                    </button>
                    <button
                      onClick={() => setShowCreateCourse(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  userRole="teacher"
                  onEdit={() => handleEditCourse(course)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrolled Students</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {student.profile?.firstName} {student.profile?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {courses.find((c) => c.students?.includes(student._id))?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {courses.find((c) => c.students?.includes(student._id) && !c.approvedStudents?.includes(student._id)) ? (
                            <button
                              onClick={() =>
                                handleApproveStudent(
                                  student._id,
                                  courses.find((c) => c.students?.includes(student._id))?._id
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">Approved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assignments</h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{assignment.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span>📊 Max Score: {assignment.maxScore}</span>
                        {assignment.course && <span>📚 {assignment.course.name || assignment.course}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => navigate(`/teacher-course/${assignment.course._id || assignment.course}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this assignment?')) {
                            try {
                              await apiService.deleteAssignment(assignment._id);
                              setAssignments(prev => prev.filter(a => a._id !== assignment._id));
                            } catch (error) {
                              setError(error.message || 'Failed to delete assignment');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => navigate(`/teacher-course/${assignment.course._id || assignment.course}/assignment/${assignment._id}/grade`)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Grade
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p className="text-gray-600 dark:text-gray-400">No assignments found.</p>
              )}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Attendance</h3>
              <AttendanceTable
                coursesOrStudents={courses}
                userRole="teacher"
                onMarkAttendance={async (courseId, studentId, status) => {
                  try {
                    await apiService.markAttendance(courseId, studentId, status);
                    alert('Attendance updated successfully!');
                    loadDashboardData();
                  } catch (error) {
                    setError(error.message || 'Failed to update attendance');
                  }
                }}
                attendanceSummary={{}} // Adjust based on actual data structure
              />
            </div>
          </div>
        )}


      </main>
    </div>
  );
}

TeacherDashboard.propTypes = {
  navigate: PropTypes.func,
  user: PropTypes.object,
};

export default TeacherDashboard;