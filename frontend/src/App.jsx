import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCoursePage from './pages/TeacherCoursePage';
import CourseDetails from './pages/CourseDetails';
import AttendancePage from './pages/AttendancePage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import './styles/global.css';

function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Early redirect for unauthenticated users
  if (!isAuthenticated && window.location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
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
          path="/teacher-course/:courseId/create-assignment"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              <CreateAssignmentPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/teacher-course/:courseId/assignment/:assignmentId/grade"
          element={
            isAuthenticated && user.role === 'teacher' ? (
              // Placeholder for GradeAssignmentPage - implement as needed
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Grade Assignment</h2>
                  <p>Grading interface goes here.</p>
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/attendance"
          element={isAuthenticated ? <AttendancePage /> : <Navigate to="/" replace />}
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