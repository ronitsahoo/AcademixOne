import { useState } from 'react'

function AttendanceTable({ students, userRole, onMarkAttendance, attendanceData = {} }) {
  const [localAttendance, setLocalAttendance] = useState(attendanceData)

  const handleAttendanceToggle = (studentId) => {
    if (userRole !== 'teacher') return
    
    const newStatus = !localAttendance[studentId]
    const updatedAttendance = {
      ...localAttendance,
      [studentId]: newStatus
    }
    setLocalAttendance(updatedAttendance)
    
    if (onMarkAttendance) {
      onMarkAttendance(studentId, newStatus)
    }
  }

  const calculateAttendancePercentage = (student) => {
    if (!student.attendanceRecord) return 0
    const total = student.attendanceRecord.length
    const present = student.attendanceRecord.filter(record => record.present).length
    return total > 0 ? Math.round((present / total) * 100) : 0
  }

  if (userRole === 'teacher') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mark Attendance</h3>
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
                  Present
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Overall %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {student.rollNumber || student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      checked={localAttendance[student.id] === true}
                      onChange={() => handleAttendanceToggle(student.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name={`attendance-${student.id}`}
                      checked={localAttendance[student.id] === false}
                      onChange={() => handleAttendanceToggle(student.id)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {calculateAttendancePercentage(student)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Student view - display attendance summary
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
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
            {students.map((course) => {
              const percentage = calculateAttendancePercentage(course)
              return (
                <tr key={course.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {course.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {course.attendanceRecord ? course.attendanceRecord.filter(r => r.present).length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {course.attendanceRecord ? course.attendanceRecord.length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      percentage >= 75 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : percentage >= 60
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {percentage >= 75 ? 'Good' : percentage >= 60 ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttendanceTable