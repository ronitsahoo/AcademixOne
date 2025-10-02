import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCoursePage from './pages/TeacherCoursePage';
import CourseDetails from './pages/CourseDetails';

import GradeAssignmentPage from './pages/GradeAssignmentPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import './styles/global.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state from localStorage
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    setIsAuthenticated(authStatus);
    setUser(userData);
    setLoading(false);

    // Listen for storage changes (when user logs out/in from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated') {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === 'user') {
        setUser(JSON.parse(e.newValue || '{}'));
      }
    };

    // Listen for custom auth state change events
    const handleAuthStateChange = (e) => {
      setIsAuthenticated(e.detail.isAuthenticated);
      setUser(e.detail.user || {});
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChange', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, []);

  // Function to update authentication state
  const updateAuthState = (authStatus, userData = {}) => {
    setIsAuthenticated(authStatus);
    setUser(userData);
    
    if (authStatus) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('authStateChange', {
      detail: { isAuthenticated: authStatus, user: userData }
    }));
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage updateAuthState={updateAuthState} />} />
        <Route
          path="/student-dashboard"
          element={
            isAuthenticated && user.role === 'student' ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/course/:courseId"
          element={isAuthenticated ? <CourseDetails /> : <Navigate to="/" replace />}
        />
        <Route
          path="/teacher-course/:courseId"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              <TeacherCoursePage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/course/:courseId/create-assignment"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              <CreateAssignmentPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/course/:courseId/assignment/:assignmentId/grade"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              <GradeAssignmentPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/profile-settings"
          element={isAuthenticated ? <ProfileSettingsPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

App.propTypes = {
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
};

export default App;