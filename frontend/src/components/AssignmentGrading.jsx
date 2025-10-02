import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiService from '../services/api';

function AssignmentGrading({ courseId, user }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingModal, setGradingModal] = useState({ isOpen: false, submission: null });
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadAssignments();
    }
  }, [courseId, user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCourseAssignments(courseId);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getAssignmentSubmissions(assignmentId);
      setSubmissions(response.submissions || []);
      setSelectedAssignment(assignmentId);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions');
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
        selectedAssignment,
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
      await loadSubmissions(selectedAssignment);
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

  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Only teachers can access assignment grading.
        </p>
      </div>
    );
  }

  if (loading && !selectedAssignment) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Assignment Selection */}
      {!selectedAssignment && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Select Assignment to Grade
          </h3>

          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create assignments to start grading student submissions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                  onClick={() => loadSubmissions(assignment._id)}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {assignment.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {assignment.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    <span>{assignment.submissionCount || 0} submissions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions List */}
      {selectedAssignment && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assignment Submissions
            </h3>
            <button
              onClick={() => {
                setSelectedAssignment(null);
                setSubmissions([]);
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Back to Assignments
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
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
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {submission.student?.profile?.firstName} {submission.student?.profile?.lastName || submission.student?.email}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {submission.grade?.score !== undefined ? (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
                          Graded: {submission.grade.score}/{submission.grade.maxScore}
                        </span>
                      ) : (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-sm">
                          Pending
                        </span>
                      )}
                      <button
                        onClick={() => openGradingModal(submission)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        {submission.grade?.score !== undefined ? 'Update Grade' : 'Grade'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission:</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {submission.content}
                    </p>
                  </div>

                  {submission.grade?.feedback && (
                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
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
      )}

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
                      Score (out of {gradingModal.submission?.grade?.maxScore || 100})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={gradingModal.submission?.grade?.maxScore || 100}
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

AssignmentGrading.propTypes = {
  courseId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired
};

export default AssignmentGrading;