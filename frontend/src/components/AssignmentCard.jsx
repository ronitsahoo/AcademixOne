function AssignmentCard({ assignment, userRole, onGrade, onSubmit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted':
        return '✓ Submitted'
      case 'pending':
        return '⏳ Pending'
      case 'overdue':
        return '🔴 Overdue'
      case 'not_started':
        return '📋 Not Started'
      default:
        return status
    }
  }

  const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'submitted'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getStatusColor(isOverdue ? 'overdue' : assignment.status)
            }`}>
              {getStatusText(isOverdue ? 'overdue' : assignment.status)}
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">{assignment.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            <span>📊 Max Marks: {assignment.maxMarks}</span>
            {assignment.course && <span>📚 {assignment.course}</span>}
            {assignment.submissionDate && (
              <span>📤 Submitted: {new Date(assignment.submissionDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 md:ml-6">
          {assignment.grade ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{assignment.grade}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {assignment.obtainedMarks}/{assignment.maxMarks}
              </div>
            </div>
          ) : userRole === 'teacher' && assignment.status === 'submitted' ? (
            <button 
              onClick={() => onGrade && onGrade(assignment)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Grade Assignment
            </button>
          ) : userRole === 'student' && assignment.status === 'pending' ? (
            <button 
              onClick={() => onSubmit && onSubmit(assignment)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Submit Assignment
            </button>
          ) : userRole === 'student' && assignment.status === 'not_started' ? (
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
  )
}

export default AssignmentCard