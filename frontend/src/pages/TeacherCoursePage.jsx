import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';
import apiService from '../services/api';
import logo from '../assets/logo.png';

function TeacherCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Fetch basic course data
        const courseResponse = await apiService.getCourseById(courseId);
        const courseData = courseResponse.course;

        if (!courseData) {
          throw new Error('Course not found');
        }

        if (courseData.instructor._id !== userData._id) {
          throw new Error('Access denied: Not your course');
        }

        setCourse(courseData);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logo} alt="AcademixOne" className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {course?.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Course Code: {course?.code}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => navigate('/teacher-dashboard')}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Dashboard
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {course?.name}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                {course?.description}
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <span>Code: {course?.code}</span>
                <span>•</span>
                <span>Credits: {course?.credits}</span>
                <span>•</span>
                <span>Students: {course?.students?.length || 0}</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                All course management features have been moved to the Course Details page for better organization.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200"
                >
                  Manage Course
                </button>
                
                <button
                  onClick={() => navigate(`/course/${courseId}/create-assignment`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200"
                >
                  Create Assignment
                </button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Available in Course Details:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <span>📚 Modules</span>
                  <span>📝 Assignments</span>
                  <span>📄 Resources</span>
                  <span>📢 Announcements</span>
                  <span>👥 Students</span>
                  <span>📊 Grading</span>
                  <span>📅 Attendance</span>
                  <span>💬 Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

TeacherCoursePage.propTypes = {
  courseId: PropTypes.string,
  navigate: PropTypes.func,
};

export default TeacherCoursePage;