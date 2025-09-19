import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';

import AttendanceTable from '../components/AttendanceTable';
import apiService from '../services/api';
import logo from '../assets/logo.png';

function TeacherCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});

  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [modules, setModules] = useState([]);
  const [gradingModal, setGradingModal] = useState({ isOpen: false, submission: null, assignment: null });
  const [attendanceSummary, setAttendanceSummary] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.role === 'teacher') {
          setUser(userData);
        } else {
          navigate('/');
          return;
        }

        // Fetch course data from API
        console.log('Fetching course data for ID:', courseId);
        const courseResponse = await apiService.getCourseById(courseId);
        console.log('Course response:', courseResponse);
        const courseData = courseResponse.course;

        if (!courseData) {
          throw new Error('Course not found');
        }

        if (courseData.instructor._id !== userData._id) {
          throw new Error('Access denied: Not your course');
        }

        setCourse(courseData);



        // Fetch assignments for this course with error handling
        try {
          const assignmentsResponse = await apiService.getCourseAssignments(courseId);
          const assignmentsWithSubmissions = await Promise.all(
            (assignmentsResponse.assignments || []).map(async (assignment) => {
              try {
                const submissionsResponse = await apiService.getAssignmentSubmissions(assignment._id);
                return { ...assignment, submissions: submissionsResponse.submissions || [] };
              } catch (error) {
                console.warn(`Failed to fetch submissions for assignment ${assignment._id}:`, error);
                return { ...assignment, submissions: [] };
              }
            })
          );
          setAssignments(assignmentsWithSubmissions);
        } catch (assignmentError) {
          console.warn('Failed to fetch assignments:', assignmentError);
          setAssignments([]);
        }

        // Fetch resources with safe fallback
        setResources(Array.isArray(courseData.resources) ? courseData.resources : []);

        // Fetch announcements with safe fallback
        setAnnouncements(Array.isArray(courseData.announcements) ? courseData.announcements : []);

        // Fetch students for this course with error handling
        try {
          const studentsResponse = await apiService.getCourseStudents(courseId);
          setStudents(studentsResponse.students || []);
        } catch (studentError) {
          console.warn('Failed to fetch students:', studentError);
          setStudents([]);
        }

        // Fetch attendance summary
        try {
          const attendanceResponse = await apiService.getAttendanceSummary(courseId);
          setAttendanceSummary(attendanceResponse.summary || []);
        } catch (attendanceError) {
          console.warn('Failed to fetch attendance summary:', attendanceError);
          setAttendanceSummary([]);
        }

        // Fetch modules for this course with safe fallback
        setModules(Array.isArray(courseData.modules) ? courseData.modules : []);

      } catch (err) {
        setError(err.message || 'Failed to load course data. Please try again.');
        console.error('Error fetching course data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    }
  };

  const startEditing = (section, item = null) => {
    setEditingSection(section);
    
    // Provide default values for different sections
    let defaultData = {};
    if (!item) {
      switch (section) {
        case 'announcement':
          defaultData = {
            title: '',
            content: '',
            priority: 'medium',
            isActive: true
          };
          break;
        case 'resource':
          defaultData = {
            title: '',
            type: 'link',
            url: ''
          };
          break;
        default:
          defaultData = {};
      }
    }
    
    setFormData(item || defaultData);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setFormData({});
  };

  const saveChanges = async () => {
    try {
      let updatedCourse = { ...course };
      let updateData = {};

      switch (editingSection) {
        case 'basic':
          updateData = { ...formData };
          await apiService.updateCourse(courseId, updateData);
          setCourse({ ...updatedCourse, ...updateData });
          break;

        case 'assignment': {
          const assignmentData = formData;
          if (formData._id) {
            await apiService.updateAssignment(formData._id, assignmentData);
          } else {
            assignmentData.course = courseId;
            const newAssignment = await apiService.createAssignment(assignmentData);
            assignmentData._id = newAssignment._id;
          }
          setAssignments(prev =>
            prev.some(a => a._id === formData._id)
              ? prev.map(a => a._id === formData._id ? assignmentData : a)
              : [...prev, assignmentData]
          );
          break;
        }
        case 'resource': {
          const resourceData = formData;
          // Assume resources are updated via course update
          const currentIndex = updatedCourse.resources.findIndex(r => r.title === formData.title);
          if (currentIndex > -1) {
            updatedCourse.resources[currentIndex] = resourceData;
          } else {
            updatedCourse.resources.push(resourceData);
          }
          setResources(updatedCourse.resources);
          updateData = { resources: updatedCourse.resources };
          await apiService.updateCourse(courseId, updateData);
          break;
        }
        case 'announcement': {
          const announcementData = { 
            ...formData, 
            date: new Date().toISOString(),
            isActive: formData.isActive !== undefined ? formData.isActive : true
          };
          // Ensure announcements array exists
          if (!updatedCourse.announcements) {
            updatedCourse.announcements = [];
          }
          // Check if editing existing announcement
          if (formData._id) {
            const currentIndex = updatedCourse.announcements.findIndex(a => a._id === formData._id);
            if (currentIndex > -1) {
              updatedCourse.announcements[currentIndex] = announcementData;
            } else {
              updatedCourse.announcements.push(announcementData);
            }
          } else {
            // Add new announcement
            announcementData._id = Date.now().toString(); // Temporary ID
            updatedCourse.announcements.push(announcementData);
          }

          // Update both local state and course object
          setAnnouncements(updatedCourse.announcements);
          setCourse(updatedCourse);
          updateData = { announcements: updatedCourse.announcements };
          
          console.log('Updating course with announcements:', updateData);
          await apiService.updateCourse(courseId, updateData);

          // Refresh course data to ensure consistency
          const refreshedCourse = await apiService.getCourseById(courseId);
          setCourse(refreshedCourse.course);
          setAnnouncements(refreshedCourse.course.announcements || []);
          break;
        }
        default:
          break;
      }

      cancelEditing();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      setError(error.message || 'Failed to save changes');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAttendanceChange = async (studentId, status) => {
    try {
      await apiService.markAttendance(courseId, studentId, status);
      // Optionally refresh student data or show success message
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error.message || 'Failed to mark attendance');
    }
  };

  const deleteItem = async (section, itemId) => {
    try {
      let updatedCourse = { ...course };
      let updateData = {};

      switch (section) {

        case 'assignment':
          await apiService.deleteAssignment(itemId);
          setAssignments(prev => prev.filter(a => a._id !== itemId));
          return; // No course update needed
        case 'resource':
          updatedCourse.resources = updatedCourse.resources.filter(r => r.title !== itemId);
          setResources(updatedCourse.resources);
          updateData = { resources: updatedCourse.resources };
          break;
        case 'announcement':
          if (!updatedCourse.announcements) {
            updatedCourse.announcements = [];
          }
          updatedCourse.announcements = updatedCourse.announcements.filter(a =>
            (a._id && a._id !== itemId) || (a.title && a.title !== itemId)
          );
          setAnnouncements(updatedCourse.announcements);
          updateData = { announcements: updatedCourse.announcements };
          break;
        default:
          break;
      }

      await apiService.updateCourse(courseId, updateData);
      setCourse(updatedCourse);
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message || 'Failed to delete item');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{error || 'Course not found'}</h2>
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Back to Dashboard
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
            <div className="flex items-center">
              <button
                onClick={() => navigate('/teacher-dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
                aria-label="Back to dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src={logo} alt="AcademixOne Logo" className="h-12 w-auto" />
              <h1 className="ml-4 text-2xl font-bold text-gray-900 dark:text-white">Manage Course</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">Welcome, {user.email}</span>
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
              { id: 'modules', name: 'Modules', icon: '📖' },
              { id: 'assignments', name: 'Assignments', icon: '📝' },
              { id: 'resources', name: 'Resources', icon: '📎' },
              { id: 'announcements', name: 'Announcements', icon: '📢' },
              { id: 'students', name: 'Students', icon: '👥' },
              { id: 'grades', name: 'Grades', icon: '📊' },
              { id: 'attendance', name: 'Attendance', icon: '📅' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="mr-2" aria-hidden="true">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => startEditing('basic', course)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Edit course information"
              >
                Edit Course Info
              </button>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                    try {
                      await apiService.deleteCourse(courseId);
                      navigate('/teacher-dashboard');
                    } catch (error) {
                      setError(error.message || 'Failed to delete course');
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Delete course"
              >
                Delete Course
              </button>
            </div>
          </div>
          {editingSection === 'basic' ? (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
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
                    value={formData.code}
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
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Course description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Semester
                  </label>
                  <input
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder="Semester"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Department"
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
                    value={formData.credits}
                    onChange={handleInputChange}
                    placeholder="Credits"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={saveChanges}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400">{course.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Instructor</p>
                  <p className="text-gray-900 dark:text-white">{course.instructor?.profile?.firstName} {course.instructor?.profile?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Semester</p>
                  <p className="text-gray-900 dark:text-white">{course.semester}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credits</p>
                  <p className="text-gray-900 dark:text-white">{course.credits}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.progress}% Complete</p>
              </div>
            </>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Modules</h2>
              <button
                onClick={() => startEditing('module')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Add new module"
              >
                Add Module
              </button>
            </div>

            {/* Course Progress Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Progress</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{course.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${course.progress || 0}%` }}
                ></div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{modules?.length || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Modules</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {modules?.filter(m => m.status === 'completed')?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {modules?.filter(m => m.status === 'in_progress')?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                </div>
              </div>
            </div>


            {editingSection === 'module' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Module Title
                    </label>
                    <input
                      name="title"
                      value={formData.title || ''}
                      onChange={handleInputChange}
                      placeholder="Module Title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Module description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Module Status
                    </label>
                    <select
                      name="status"
                      value={formData.status || 'not_started'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (formData._id) {
                            // Update existing module
                            await apiService.updateCourseModule(courseId, formData._id, formData);
                          } else {
                            // Create new module
                            await apiService.createCourseModule(courseId, formData);
                          }
                          // Refresh course data
                          const courseResponse = await apiService.getCourseById(courseId);
                          setCourse(courseResponse.course);
                          setModules(courseResponse.course.modules || []);
                          cancelEditing();
                        } catch (error) {
                          setError(error.message || 'Failed to save module');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      {formData._id ? 'Update Module' : 'Save Module'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
              {modules && modules.length > 0 ? modules.map((module, index) => (
                <div key={module._id || index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{module.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <select
                        value={module.status || 'not_started'}
                        onChange={async (e) => {
                          try {
                            const updatedModule = { ...module, status: e.target.value };
                            await apiService.updateCourseModule(courseId, module._id, updatedModule);
                            setModules(prev => prev.map(m => m._id === module._id ? updatedModule : m));
                            // Update course progress
                            const courseResponse = await apiService.getCourseById(courseId);
                            setCourse(courseResponse.course);
                          } catch (error) {
                            setError(error.message || 'Failed to update module status');
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${module.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : module.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => startEditing('module', module)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this module?')) {
                            try {
                              await apiService.deleteCourseModule(courseId, module._id);
                              setModules(prev => prev.filter(m => m._id !== module._id));
                            } catch (error) {
                              setError(error.message || 'Failed to delete module');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Module Content */}
                  {module.content && module.content.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content:</h4>
                      <div className="space-y-2">
                        {module.content.map((content, contentIndex) => (
                          <div key={contentIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                                {content.type === 'video' ? '🎥' :
                                  content.type === 'document' ? '📄' :
                                    content.type === 'quiz' ? '❓' :
                                      content.type === 'assignment' ? '📝' : '📖'}
                              </span>
                              <span className="text-sm text-gray-900 dark:text-white">{content.title}</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await apiService.markContentCompleted(courseId, module._id, content._id, !content.isCompleted);
                                  // Refresh course data
                                  const courseResponse = await apiService.getCourseById(courseId);
                                  setCourse(courseResponse.course);
                                  setModules(courseResponse.course.modules || []);
                                } catch (error) {
                                  setError(error.message || 'Failed to update content status');
                                }
                              }}
                              className={`text-xs px-2 py-1 rounded ${content.isCompleted
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                }`}
                            >
                              {content.isCompleted ? 'Completed' : 'Mark Complete'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )) : null}

              {(!modules || modules.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No modules created yet. Click "Add Module" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Other tabs similar to above - Assignments, Resources, etc. */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
              <button
                onClick={() => startEditing('assignment')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Add new assignment"
              >
                Add Assignment
              </button>
            </div>
            {editingSection === 'assignment' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      name="title"
                      value={formData.title || ''}
                      onChange={handleInputChange}
                      placeholder="Assignment Title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Assignment Description"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructions
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions || ''}
                      onChange={handleInputChange}
                      placeholder="Detailed instructions for students"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Due Date
                      </label>
                      <input
                        name="dueDate"
                        type="datetime-local"
                        value={formData.dueDate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Score
                      </label>
                      <input
                        name="maxScore"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.maxScore || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Submission Type
                      </label>
                      <select
                        name="submissionType"
                        value={formData.submissionType || 'both'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="text">Text Only</option>
                        <option value="file">File Only</option>
                        <option value="both">Text & File</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="allowLateSubmission"
                          checked={formData.allowLateSubmission || false}
                          onChange={(e) => setFormData({...formData, allowLateSubmission: e.target.checked})}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Late Submission</span>
                      </label>
                    </div>
                    {formData.allowLateSubmission && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Late Penalty (%)
                        </label>
                        <input
                          name="lateSubmissionPenalty"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.lateSubmissionPenalty || 0}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={saveChanges}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Save Assignment
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => startEditing('assignment', assignment)}
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
                        onClick={() => navigate(`/teacher-course/${courseId}/assignment/${assignment._id}/grade`)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Grade
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar structure for other tabs: Resources, Announcements, Grades, Attendance */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h2>
              <button
                onClick={() => startEditing('resource')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Add new resource"
              >
                Add Resource
              </button>
            </div>
            {editingSection === 'resource' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Resource Title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type
                      </label>
                      <select
                        name="type"
                        value={formData.type || 'pdf'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="pdf">PDF</option>
                        <option value="link">Link</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {formData.type === 'link' ? 'Link URL' : 'File URL'}
                      </label>
                      <input
                        name="url"
                        type={formData.type === 'link' ? 'url' : 'text'}
                        value={formData.url || ''}
                        onChange={handleInputChange}
                        placeholder={formData.type === 'link' ? 'https://example.com' : 'Resource URL'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={saveChanges}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Save Resource
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  {editingSection === 'resource' && formData.title === resource.title ? (
                    <form className="space-y-4">
                      {/* Similar form as above for editing */}
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={saveChanges}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resource.title}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing('resource', resource)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            aria-label="Edit resource"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem('resource', resource.title)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            aria-label="Delete resource"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">Type: {resource.type}</p>
                      {resource.size && <p className="text-sm text-gray-500 dark:text-gray-400">Size: {resource.size}</p>}
                      {resource.duration && <p className="text-sm text-gray-500 dark:text-gray-400">Duration: {resource.duration}</p>}
                      {resource.uploadDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Uploaded: {new Date(resource.uploadDate).toLocaleDateString()}
                        </p>
                      )}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Access Resource
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
              <button
                onClick={() => startEditing('announcement')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                aria-label="Add new announcement"
              >
                Add Announcement
              </button>
            </div>
            {editingSection === 'announcement' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Announcement Title"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Announcement content"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={saveChanges}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Save Announcement
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-4">
              {announcements && announcements.length > 0 ? announcements.map((announcement, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  {editingSection === 'announcement' && formData.title === announcement.title ? (
                    <form className="space-y-4">
                      {/* Similar form as above for editing */}
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={saveChanges}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${announcement.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                            announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            }`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                          <button
                            onClick={() => startEditing('announcement', announcement)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            aria-label="Edit announcement"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem('announcement', announcement._id || announcement.title)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            aria-label="Delete announcement"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">{announcement.content}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Posted on: {new Date(announcement.date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No announcements yet. Click "Add Announcement" to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h2>
            </div>
            
            {/* Enrolled Students */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enrolled Students ({students.length})</h3>
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.profile.firstName} {student.profile.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to remove this student?')) {
                          try {
                            await apiService.removeStudentFromCourse(courseId, student._id);
                            setStudents(prev => prev.filter(s => s._id !== student._id));
                          } catch (error) {
                            setError(error.message || 'Failed to remove student');
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No students enrolled yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grades</h2>
            
            {/* Assignments with Submissions */}
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()} | Max Score: {assignment.maxScore}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const response = await apiService.getAssignmentSubmissions(assignment._id);
                          // Handle submissions display
                          console.log('Submissions:', response.submissions);
                        } catch (error) {
                          console.error('Error fetching submissions:', error);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      View Submissions ({assignment.submissions?.length || 0})
                    </button>
                  </div>
                  
                  {/* Show submissions if available */}
                  {assignment.submissions && assignment.submissions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Recent Submissions:</h4>
                      {assignment.submissions.slice(0, 3).map((submission) => (
                        <div key={submission._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {submission.student?.profile?.firstName} {submission.student?.profile?.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {submission.status === 'graded' ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {submission.grade?.score}/{assignment.maxScore}
                              </span>
                            ) : (
                              <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                            )}
                            <button
                              onClick={() => setGradingModal({ 
                                isOpen: true, 
                                submission: submission, 
                                assignment: assignment 
                              })}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              {submission.status === 'graded' ? 'Edit Grade' : 'Grade'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {assignments.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No assignments created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h2>
              <button
                onClick={async () => {
                  // Mark attendance for today
                  const today = new Date().toISOString().split('T')[0];
                  const session = `Session ${new Date().toLocaleDateString()}`;
                  const attendanceData = students.map(student => ({
                    studentId: student._id,
                    status: 'present', // Default to present, teacher can modify
                    notes: ''
                  }));
                  
                  try {
                    await apiService.markAttendance(courseId, today, session, 'Regular Class', attendanceData);
                    alert('Attendance marked successfully!');
                  } catch (error) {
                    setError(error.message || 'Failed to mark attendance');
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Mark Today's Attendance
              </button>
            </div>
            
            {/* Attendance Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                {attendanceSummary.length > 0 ? attendanceSummary.map((summary) => (
                  <div key={summary.student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {summary.student.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{summary.student.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{summary.percentage}%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {summary.presentCount}/{summary.totalClasses} classes
                      </p>
                    </div>
                  </div>
                )) : students.map((student) => (
                  <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {student.profile.firstName} {student.profile.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">No data</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Attendance</p>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No students enrolled yet.</p>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Attendance</h3>
              <AttendanceTable
                coursesOrStudents={students}
                userRole="teacher"
                onMarkAttendance={handleAttendanceChange}
                attendanceSummary={{}}
              />
            </div>
          </div>
        )}
      </main>

      {/* Grading Modal */}
      {gradingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Grade Submission
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student: {gradingModal.submission?.student?.profile?.firstName} {gradingModal.submission?.student?.profile?.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assignment: {gradingModal.assignment?.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Max Score: {gradingModal.assignment?.maxScore}
              </p>
            </div>

            {gradingModal.submission?.textSubmission && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Submission:
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {gradingModal.submission.textSubmission}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const grade = parseInt(formData.get('grade'));
              const feedback = formData.get('feedback');

              try {
                await apiService.gradeSubmission(gradingModal.submission._id, grade, feedback);
                
                // Update the assignments state
                setAssignments(prev => prev.map(assignment => {
                  if (assignment._id === gradingModal.assignment._id) {
                    return {
                      ...assignment,
                      submissions: assignment.submissions.map(sub => {
                        if (sub._id === gradingModal.submission._id) {
                          return {
                            ...sub,
                            status: 'graded',
                            grade: { ...sub.grade, score: grade, feedback }
                          };
                        }
                        return sub;
                      })
                    };
                  }
                  return assignment;
                }));

                setGradingModal({ isOpen: false, submission: null, assignment: null });
              } catch (error) {
                setError(error.message || 'Failed to grade submission');
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade (0-{gradingModal.assignment?.maxScore})
                </label>
                <input
                  type="number"
                  name="grade"
                  min="0"
                  max={gradingModal.assignment?.maxScore}
                  defaultValue={gradingModal.submission?.grade?.score || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  name="feedback"
                  rows="3"
                  defaultValue={gradingModal.submission?.grade?.feedback || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter feedback for the student..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setGradingModal({ isOpen: false, submission: null, assignment: null })}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

TeacherCoursePage.propTypes = {
  courseId: PropTypes.string,
  navigate: PropTypes.func,
};

export default TeacherCoursePage;