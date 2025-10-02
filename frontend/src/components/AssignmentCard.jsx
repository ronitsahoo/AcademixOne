import PropTypes from 'prop-types';

function AssignmentCard({ assignment, userRole, onGrade, onSubmit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'graded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted':
        return '✓ Submitted';
      case 'graded':
        return '✓ Graded';
      case 'pending':
        return '⏳ Pending';
      case 'overdue':
        return '🔴 Overdue';
      case 'not_started':
        return '📋 Not Started';
      default:
        return status;
    }
  };

  // Derive status from backend props (assume assignment has hasSubmitted, isOverdue from API)
  const derivedStatus = assignment.hasSubmitted ? (assignment.submission?.status || 'submitted') : 
                        (assignment.isOverdue ? 'overdue' : 'not_started');
  const isOverdue = new Date(assignment.dueDate) < new Date() && !assignment.hasSubmitted;

  // For grade, assume submission prop or derive
  const studentSubmission = assignment.submission; // From backend
  const showGrade = studentSubmission?.grade?.score !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
            {/* Only show status badges for students, not faculty */}
            {userRole === 'student' && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getStatusColor(derivedStatus)
              }`}>
                {getStatusText(derivedStatus)}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">{assignment.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📅 Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
            <span>📊 Max Score: {assignment.maxScore || 0}</span>
            {assignment.course && <span>📚 {assignment.course.name || assignment.course}</span>}
            {studentSubmission?.submittedAt && (
              <span>📤 Submitted: {new Date(studentSubmission.submittedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 md:ml-6">
          {showGrade ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {studentSubmission.grade.score}/{assignment.maxScore}
              </div>
              {studentSubmission.grade.feedback && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {studentSubmission.grade.feedback}
                </div>
              )}
            </div>
          ) : userRole === 'teacher' && assignment.hasSubmitted ? (
            <button 
              onClick={() => onGrade && onGrade(assignment)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Grade Assignment
            </button>
          ) : userRole === 'student' && !assignment.hasSubmitted ? (
            <button 
              onClick={() => onSubmit && onSubmit(assignment)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Submit Assignment
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

AssignmentCard.propTypes = {
  assignment: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    dueDate: PropTypes.string.isRequired,
    maxScore: PropTypes.number.isRequired,
    course: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ name: PropTypes.string })]),
    hasSubmitted: PropTypes.bool,
    isOverdue: PropTypes.bool,
    submission: PropTypes.shape({
      status: PropTypes.string,
      submittedAt: PropTypes.string,
      grade: PropTypes.shape({
        score: PropTypes.number,
        feedback: PropTypes.string,
      }),
    }),
  }).isRequired,
  userRole: PropTypes.oneOf(['student', 'teacher', 'admin']).isRequired,
  onGrade: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default AssignmentCard;