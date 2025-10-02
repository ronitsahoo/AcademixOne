import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import apiService from '../services/api';
import logo from '../assets/logo.png';

function GradeAssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingModal, setGradingModal] = useState({ isOpen: false, submission: null });
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.role === 'teacher') {
      setUser(userData);
      loadAssignmentData();
    } else {
      navigate('/');
    }
  }, [courseId, assignmentId, navigate]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load assignment details
      const assignmentResponse = await apiService.getAssignmentById(assignmentId);
      setAssignment(assignmentResponse.assignment);

      // Load submissions
      const submissionsResponse = await apiService.getAssignmentSubmissions(assignmentId);
      setSubmissions(submissionsResponse.submissions || []);
    } catch (error) {
      console.error('Error loading assignment data:', error);
      setError('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    
    if (!gradeData.score || gradeData.score < 0) {
      setError('Please enter a valid score');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await apiService.gradeAssignment(
        assignmentId,
        gradingModal.submission.student._id,
        {
          score: parseFloat(gradeData.score),
          feedback: gradeData.feedback.trim()
        }
      );

      // Reset form and close modal
      setGradeData({ score: '', feedback: '' });
      setGradingModal({ isOpen: false, submission: null });
      
      // Reload submissions
      await loadAssignmentData();
    } catch (error) {
      console.error('Error grading submission:', error);
      setError(error.message || 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  const openGradingModal = (submission) => {
    setGradingModal({ isOpen: true, submission });
    setGradeData({
      score: submission.grade?.score || '',
      feedback: submission.grade?.feedback || ''
    });
  };

  const closeGradingModal = () => {
    setGradingModal({ isOpen: false, submission: null });
    setGradeData({ score: '', feedback: '' });
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                onClick={() => navigate(`/course/${courseId}`)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src={logo} alt="AcademixOne" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Grade Assignment</h1>
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
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Assignment Info */}
        {assignment && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {assignment.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {assignment.description}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              <span>📊 Max Score: {assignment.maxScore}</span>
              <span>📝 Submissions: {submissions.length}</span>
            </div>
          </div>
        )}

        {/* Submissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Student Submissions
          </h3>

          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No students have submitted this assignment yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {submission.student?.profile?.firstName} {submission.student?.profile?.lastName || submission.student?.email}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                      {submission.student?.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.student.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      {submission.grade?.score !== undefined ? (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                          Graded: {submission.grade.score}/{submission.grade.maxScore}
                        </span>
                      ) : (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                          Pending
                        </span>
                      )}
                      <button
                        onClick={() => openGradingModal(submission)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                      >
                        {submission.grade?.score !== undefined ? 'Update Grade' : 'Grade'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission:</h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {submission.content}
                    </div>
                  </div>

                  {submission.grade?.feedback && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Feedback:</h5>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {submission.grade.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Grading Modal */}
      {gradingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Grade Submission
                </h2>
                <button
                  onClick={closeGradingModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Student: {gradingModal.submission?.student?.profile?.firstName} {gradingModal.submission?.student?.profile?.lastName || gradingModal.submission?.student?.email}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Submitted: {new Date(gradingModal.submission?.submittedAt).toLocaleString()}
                  </p>
                </div>

                {/* Submission Content */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Submission:</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {gradingModal.submission?.content}
                    </p>
                  </div>
                </div>

                {/* Grading Form */}
                <form onSubmit={handleGradeSubmission} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Score (out of {assignment?.maxScore || 100})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={assignment?.maxScore || 100}
                      step="0.1"
                      value={gradeData.score}
                      onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Feedback (optional)
                    </label>
                    <textarea
                      value={gradeData.feedback}
                      onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Provide feedback to the student..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeGradingModal}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
                    >
                      {loading ? 'Saving...' : 'Save Grade'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GradeAssignmentPage;