import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiService from '../services/api';

function AttendanceTab({ courseId, user }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentSummary, setStudentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    session: '',
    topic: '',
    duration: 60
  });
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    loadAttendanceData();
    if (user?.role === 'teacher') {
      loadStudents();
    }
  }, [courseId, user]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'teacher') {
        // Load all attendance records for the course
        const response = await apiService.getCourseAttendance(courseId);
        setAttendanceRecords(response.attendance?.records || []);
      } else if (user?.role === 'student') {
        // Load student's attendance summary
        const response = await apiService.getStudentAttendanceSummary(user._id, courseId);
        setStudentSummary(response.summary);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await apiService.getCourseStudents(courseId);
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleCreateAttendance = async (e) => {
    e.preventDefault();
    
    if (!formData.session.trim()) {
      setError('Session name is required');
      return;
    }

    // Check if any attendance has been marked
    const hasAttendanceData = Object.keys(attendanceData).length > 0;
    if (!hasAttendanceData) {
      setError('Please mark attendance for at least one student');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create attendance session
      const sessionData = {
        course: courseId,
        date: formData.date,
        session: formData.session,
        topic: formData.topic,
        duration: parseInt(formData.duration)
      };

      const sessionResponse = await apiService.createAttendanceSession(sessionData);
      const attendanceId = sessionResponse.attendance._id;

      // Bulk mark attendance
      const attendanceArray = Object.entries(attendanceData).map(([studentId, status]) => ({
        studentId,
        status,
        notes: ''
      }));

      await apiService.post(`/attendance/${attendanceId}/bulk-mark`, { attendanceData: attendanceArray });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        session: '',
        topic: '',
        duration: 60
      });
      setAttendanceData({});
      setShowCreateForm(false);

      // Reload data
      await loadAttendanceData();
    } catch (error) {
      console.error('Error creating attendance:', error);
      setError(error.message || 'Failed to create attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'late':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'excused':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading attendance...</span>
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

      {/* Teacher View */}
      {user?.role === 'teacher' && (
        <>
          {/* Create Attendance Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mark Attendance
              </h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                {showCreateForm ? 'Cancel' : 'New Session'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateAttendance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session
                    </label>
                    <input
                      type="text"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Lecture 1, Lab Session"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topic (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Class topic or description"
                  />
                </div>

                {/* Student Attendance Marking */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Mark Student Attendance
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {student.profile?.firstName} {student.profile?.lastName || student.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {student.email}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {['present', 'absent', 'late', 'excused'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleAttendanceChange(student._id, status)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                                attendanceData[student._id] === status
                                  ? getStatusColor(status)
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
                  >
                    {loading ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Attendance Records */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Attendance Records
            </h3>

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No attendance records</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create your first attendance session to start tracking student attendance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record) => (
                  <div key={record._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {record.session}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()} • {record.duration} minutes
                        </p>
                        {record.topic && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Topic: {record.topic}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {record.attendancePercentage}%
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {record.presentCount + record.lateCount}/{record.totalStudents} present
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Present: {record.presentCount}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        Absent: {record.absentCount}
                      </span>
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Late: {record.lateCount}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400">
                        Excused: {record.excusedCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Student View */}
      {user?.role === 'student' && studentSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            My Attendance Summary
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {studentSummary.attendancePercentage}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Overall</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {studentSummary.totalClasses}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {studentSummary.presentCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {studentSummary.absentCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {studentSummary.lateCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Late</div>
            </div>
          </div>

          {studentSummary.records && studentSummary.records.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Attendance History</h4>
              <div className="space-y-2">
                {studentSummary.records.map((record) => {
                  const studentRecord = record.records.find(r => r.student.toString() === user._id);
                  return (
                    <div key={record._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {record.session}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      {studentRecord && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(studentRecord.status)}`}>
                          {studentRecord.status.charAt(0).toUpperCase() + studentRecord.status.slice(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

AttendanceTab.propTypes = {
  courseId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired
};

export default AttendanceTab;