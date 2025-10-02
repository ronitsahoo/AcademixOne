import { useState } from 'react';
import PropTypes from 'prop-types';

function AttendanceTable({ coursesOrStudents = [], userRole, onMarkAttendance, attendanceSummary = {} }) {
  const [localAttendance, setLocalAttendance] = useState(attendanceSummary || {});
  const [error, setError] = useState(null);

  // Safety check for coursesOrStudents
  if (!Array.isArray(coursesOrStudents)) {
    console.error('AttendanceTable: coursesOrStudents must be an array, received:', typeof coursesOrStudents);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">Error: Invalid data format</p>
        </div>
      </div>
    );
  }

  const handleAttendanceChange = async (studentId, status) => {
    if (userRole !== 'teacher') return;
    
    try {
      setError(null);
      const updatedAttendance = {
        ...localAttendance,
        [studentId]: status // String: 'present', 'absent', etc.
      };
      setLocalAttendance(updatedAttendance);
      
      if (onMarkAttendance) {
        await onMarkAttendance(studentId, status);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error.message || 'Failed to mark attendance');
    }
  };

  const calculateAttendancePercentage = (summary) => {
    // Use backend summary structure with safety checks
    if (!summary || typeof summary !== 'object') return 0;
    const totalClasses = summary.totalClasses || 0;
    if (totalClasses === 0) return 0;
    const presentCount = summary.presentCount || 0;
    const lateCount = summary.lateCount || 0;
    return Math.round(((presentCount + lateCount) / totalClasses) * 100);
  };

  const getStatusClass = (percentage) => {
    if (percentage >= 75) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (userRole === 'teacher') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mark Attendance</h3>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Roll Number
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Overall %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coursesOrStudents.length > 0 ? coursesOrStudents.map((student) => {
                const studentId = student.id || student._id;
                const studentName = student.name || `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.trim() || student.email || 'Unknown Student';
                
                return (
                  <tr key={studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {student.rollNumber || student.profile?.rollNumber || studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={localAttendance[studentId] || ''}
                        onChange={(e) => handleAttendanceChange(studentId, e.target.value)}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {calculateAttendancePercentage(student.attendanceSummary || {})}%
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Student view (assume coursesOrStudents is courses with attendanceSummary)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Total Lectures
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {coursesOrStudents.length > 0 ? coursesOrStudents.map((course) => {
              const courseId = course.id || course._id;
              const courseName = course.name || 'Unknown Course';
              const percentage = calculateAttendancePercentage(course.attendanceSummary || {});
              
              return (
                <tr key={courseId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {courseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {course.attendanceSummary?.presentCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {course.attendanceSummary?.totalClasses || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusClass(percentage)
                    }`}>
                      {percentage >= 75 ? 'Good' : percentage >= 60 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

AttendanceTable.propTypes = {
  coursesOrStudents: PropTypes.array.isRequired,
  userRole: PropTypes.oneOf(['student', 'teacher', 'admin']).isRequired,
  onMarkAttendance: PropTypes.func,
  attendanceSummary: PropTypes.object,
};

export default AttendanceTable;