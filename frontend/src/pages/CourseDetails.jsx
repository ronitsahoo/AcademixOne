
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ThemeToggle from '../components/ThemeToggle';
import AssignmentCard from '../components/AssignmentCard';

import ChatWindow from '../components/Chat/ChatWindow';
import StudentsTab from '../components/StudentsTab';
import AnnouncementsTab from '../components/AnnouncementsTab';
import AssignmentGrading from '../components/AssignmentGrading';
import AttendanceTab from '../components/AttendanceTab';
import logo from '../assets/logo.png';
import apiService from '../services/api';

function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [submissionModal, setSubmissionModal] = useState({ isOpen: false, assignment: null });
  const [submissionData, setSubmissionData] = useState({ content: '' });
  const [showChat, setShowChat] = useState(false);

  // Teacher management states
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      loadCourseData(userData);
    } else {
      navigate('/');
    }
  }, [courseId, navigate]);

  const loadCourseData = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Load course details
      const courseResponse = await apiService.getCourseById(courseId);
      const courseData = courseResponse.course;

      // Ensure enrollment status is properly set
      if (userData && userData.role === 'student') {
        // Double-check enrollment status by checking if user ID is in students array
        courseData.isEnrolled = courseData.students?.some(s =>
          (s.student?._id || s.student) === userData._id && s.status === 'enrolled'
        ) || false;
      }

      setCourse(courseData);

      // Load assignments
      const assignmentsResponse = await apiService.getCourseAssignments(courseId);
      setAssignments(assignmentsResponse.assignments || []);


    } catch (error) {
      console.error('Error loading course data:', error);
      setError(error.message || 'Failed to load course details');
      if (error.message?.includes('not found')) {
        setCourse(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    }
  };

  const handleEnrollCourse = async () => {
    try {
      setLoading(true);
      await apiService.enrollInCourse(courseId);
      alert('Successfully enrolled in course!');
      // Reload course data to update enrollment status
      await loadCourseData(user);
    } catch (error) {
      setError(error.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const handleDropCourse = async () => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      try {
        setLoading(true);
        await apiService.dropFromCourse(courseId);
        alert('Successfully dropped from course!');
        navigate('/student-dashboard');
      } catch (error) {
        setError(error.message || 'Failed to drop from course');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGradeAssignment = async (assignment) => {
    navigate(`/course/${courseId}/assignment/${assignment._id}/grade`);
  };

  // Teacher management functions
  const startEditing = (item, type) => {
    setEditingItem(item._id);
    setEditingType(type);
    setEditForm(item);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingType(null);
    setEditForm({});
    setShowAddForm(null);
  };

  const calculateProgress = (modules) => {
    if (!modules || modules.length === 0) return 0;
    const completedModules = modules.filter(m => (m.status || 'not_started') === 'completed').length;
    return Math.round((completedModules / modules.length) * 100);
  };

  const handleSaveEdit = async () => {
    try {
      if (editingType === 'course') {
        await apiService.updateCourse(courseId, editForm);
        setCourse({ ...course, ...editForm });
      } else if (editingType === 'module') {
        const response = await apiService.updateCourseModule(courseId, editingItem, editForm);
        
        // Use the updated modules from the backend response
        const updatedModules = response.modules || course.modules.map(m => m._id === editingItem ? { ...m, ...editForm } : m);
        const newProgress = calculateProgress(updatedModules);
        
        setCourse(prev => ({
          ...prev,
          modules: updatedModules,
          progress: newProgress,
          moduleProgress: response.moduleProgress || prev.moduleProgress
        }));
      } else if (editingType === 'resource') {
        // Update resource through course update
        const updatedResources = course.resources.map(r => 
          r._id === editingItem ? { ...r, ...editForm } : r
        );
        await apiService.updateCourse(courseId, { resources: updatedResources });
        setCourse(prev => ({
          ...prev,
          resources: updatedResources
        }));
      } else if (editingType === 'assignment') {
        // Ensure all required fields are present for assignment update
        const assignmentUpdateData = {
          title: editForm.title,
          description: editForm.description,
          instructions: editForm.instructions,
          dueDate: editForm.dueDate,
          maxScore: editForm.maxScore,
          submissionType: editForm.submissionType || 'both',
          allowLateSubmission: editForm.allowLateSubmission || false,
          lateSubmissionPenalty: editForm.lateSubmissionPenalty || 0
        };
        
        await apiService.updateAssignment(editingItem, assignmentUpdateData);
        setAssignments(prev => prev.map(a => a._id === editingItem ? { ...a, ...assignmentUpdateData } : a));
      }
      cancelEditing();
    } catch (error) {
      setError(error.message || 'Failed to save changes');
    }
  };

  const handleDelete = async (itemId, type) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'course') {
        await apiService.deleteCourse(courseId);
        navigate('/teacher-dashboard');
      } else if (type === 'module') {
        const response = await apiService.deleteCourseModule(courseId, itemId);
        
        // Use the updated modules from the backend response
        const updatedModules = response.modules || course.modules.filter(m => m._id !== itemId);
        const newProgress = calculateProgress(updatedModules);
        
        setCourse(prev => ({
          ...prev,
          modules: updatedModules,
          progress: newProgress,
          moduleProgress: response.moduleProgress || prev.moduleProgress
        }));
      } else if (type === 'resource') {
        // Delete resource through course update
        const updatedResources = course.resources.filter(r => r._id !== itemId);
        await apiService.updateCourse(courseId, { resources: updatedResources });
        setCourse(prev => ({
          ...prev,
          resources: updatedResources
        }));
      } else if (type === 'student') {
        await apiService.removeStudentFromCourse(courseId, itemId);
        setCourse(prev => ({
          ...prev,
          students: prev.students.filter(s => s.student._id !== itemId)
        }));
      } else if (type === 'assignment') {
        await apiService.deleteAssignment(itemId);
        setAssignments(prev => prev.filter(a => a._id !== itemId));
      }
    } catch (error) {
      setError(error.message || `Failed to delete ${type}`);
    }
  };

  const handleAdd = async (type) => {
    try {
      if (type === 'module') {
        // Ensure required fields and set defaults
        const moduleData = {
          title: editForm.title?.trim(),
          description: editForm.description?.trim() || '',
          status: 'not_started', // Set default status
          // Don't include order - backend will set it automatically
        };
        
        // Validate required fields
        if (!moduleData.title) {
          throw new Error('Module title is required');
        }
        
        const response = await apiService.addCourseModule(courseId, moduleData);
        
        // Backend returns the entire modules array after adding the new module
        const updatedModules = response.modules || [];
        const newProgress = calculateProgress(updatedModules);
        
        setCourse(prev => ({
          ...prev,
          modules: updatedModules,
          progress: newProgress,
          moduleProgress: response.moduleProgress || []
        }));
      } else if (type === 'resource') {
        // Add resource through course update
        const newResource = { 
          title: editForm.title,
          type: editForm.type || 'link',
          url: editForm.url,
          uploadedAt: new Date()
        };
        const updatedResources = [...(course.resources || []), newResource];
        await apiService.updateCourse(courseId, { resources: updatedResources });
        setCourse(prev => ({
          ...prev,
          resources: updatedResources
        }));
      } else if (type === 'assignment') {
        // Ensure all required fields are present and properly formatted
        const assignmentData = {
          title: editForm.title?.trim(),
          description: editForm.description?.trim(),
          instructions: editForm.instructions?.trim() || '',
          dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
          maxScore: parseInt(editForm.maxScore) || 0,
          submissionType: editForm.submissionType || 'both',
          allowLateSubmission: editForm.allowLateSubmission || false,
          lateSubmissionPenalty: parseInt(editForm.lateSubmissionPenalty) || 0,
          course: courseId
        };
        
        // Validate required fields
        if (!assignmentData.title || !assignmentData.description || !assignmentData.dueDate || !assignmentData.maxScore) {
          throw new Error('Please fill in all required fields');
        }
        
        console.log('Creating assignment with data:', assignmentData);
        
        const response = await apiService.createAssignment(assignmentData);
        console.log('Assignment creation response:', response);
        
        // Extract the assignment from the response object
        const newAssignment = response.assignment;
        
        if (newAssignment) {
          setAssignments(prev => [...prev, newAssignment]);
          console.log('Added new assignment to state:', newAssignment.title);
        } else {
          console.error('No assignment data in response:', response);
        }
      }
      cancelEditing();
    } catch (error) {
      setError(error.message || `Failed to add ${type}`);
    }
  };



  const handleSubmitAssignment = (assignment) => {
    setSubmissionModal({ isOpen: true, assignment });
    setSubmissionData({ content: '' });
  };

  const handleSubmissionSubmit = async () => {
    try {
      setLoading(true);

      // Validate submission data
      if (!submissionData.content.trim()) {
        throw new Error('Submission content is required');
      }

      console.log('Submitting assignment:', submissionModal.assignment._id, submissionData);

      const response = await apiService.submitAssignment(submissionModal.assignment._id, submissionData);
      console.log('Submission response:', response);

      alert('Assignment submitted successfully!');
      setSubmissionModal({ isOpen: false, assignment: null });
      // Refresh assignments data
      await loadCourseData(user);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionCancel = () => {
    setSubmissionModal({ isOpen: false, assignment: null });
    setSubmissionData({ content: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
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
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img src={logo} alt="AcademixOne" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Course Details</h1>
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
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {course.code && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                    {course.code}
                  </span>
                )}
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-sm">
                  {course.department}
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
                  {course.semester}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
              {course.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Instructor: {course.instructor?.profile?.firstName} {course.instructor?.profile?.lastName || course.instructor?.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{course.credits} Credits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{course.enrolledCount || 0} Students</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {user?.role === 'student' && (
              <div className="mt-4 md:mt-0 flex space-x-3">
                {course.isEnrolled ? (
                  <button
                    onClick={handleDropCourse}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Unenroll
                  </button>
                ) : (
                  <button
                    onClick={handleEnrollCourse}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Enroll in Course
                  </button>
                )}

              </div>
            )}
            {user?.role === 'teacher' && (
              <div className="mt-4 md:mt-0 flex space-x-4">
                {user?.role === 'teacher' && (
                  <>
                    <button
                      onClick={() => startEditing(course, 'course')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Edit Course
                    </button>
                    <button
                      onClick={() => handleDelete(courseId, 'course')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Delete Course
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate(`/teacher-dashboard`)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'modules', name: 'Modules', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                { id: 'assignments', name: 'Assignments', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                ...(user?.role === 'teacher' ? [{ id: 'grading', name: 'Grading', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }] : []),
                { id: 'resources', name: 'Resources', icon: 'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' },
                { id: 'students', name: 'Students', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'announcements', name: 'Announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
                { id: 'chat', name: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z' },
                { id: 'attendance', name: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Course Edit Modal */}
          {editingType === 'course' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Course</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Code</label>
                    <input
                      type="text"
                      value={editForm.code || ''}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                      <select
                        value={editForm.department || ''}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                      <select
                        value={editForm.semester || ''}
                        onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Semester</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editForm.credits || ''}
                        onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Credits"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Students</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={editForm.maxStudents || ''}
                        onChange={(e) => setEditForm({ ...editForm, maxStudents: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Max Students"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editForm.startDate ? editForm.startDate.split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                      <input
                        type="date"
                        value={editForm.endDate ? editForm.endDate.split('T')[0] : ''}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {course.description || 'No description available for this course.'}
                  </p>

                  {/* Course Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Course Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Instructor</p>
                      <p className="text-gray-900 dark:text-white">
                        {course.instructor?.profile?.firstName} {course.instructor?.profile?.lastName}
                        {course.instructor?.email && ` (${course.instructor.email})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Semester</p>
                      <p className="text-gray-900 dark:text-white">{course.semester || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credits</p>
                      <p className="text-gray-900 dark:text-white">{course.credits || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {course.schedule && course.schedule.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Schedule</h3>
                    <div className="space-y-3">
                      {course.schedule.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-900 dark:text-white">{schedule.day}</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {schedule.startTime} - {schedule.endTime}
                            {schedule.room && ` • ${schedule.room}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Assignments</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{assignments.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Enrolled Students</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.enrolledCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Course Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Modules</h2>
                {user?.role === 'teacher' && (
                  <button
                    onClick={() => setShowAddForm('module')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Add Module
                  </button>
                )}
              </div>

              {/* Course Progress Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Progress</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{course.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{course.modules?.length || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Modules</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {course.modules?.filter(m => m.status === 'completed')?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {course.modules?.filter(m => m.status === 'in_progress')?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  </div>
                </div>
              </div>

              {/* Modules List */}
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module._id || index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{module.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${(module.status || 'not_started') === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              (module.status || 'not_started') === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                            {(module.status || 'not_started') === 'completed' ? 'Completed' :
                              (module.status || 'not_started') === 'in_progress' ? 'In Progress' : 'Not Started'}
                          </span>
                          {user?.role === 'teacher' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditing(module, 'module')}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1"
                                title="Edit Module"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(module._id, 'module')}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1"
                                title="Delete Module"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {module.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>
                      )}
                      {module.content && module.content.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">Content:</h4>
                          <ul className="space-y-1">
                            {module.content.map((content, contentIndex) => (
                              <li key={content._id || contentIndex} className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${content.isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{content.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Modules Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Course modules will appear here when the instructor creates them.</p>
                </div>
              )}

              {/* Add Module Form */}
              {showAddForm === 'module' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Module</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Module Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter module title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="3"
                        placeholder="Enter module description (optional)"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAdd('module')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Add Module
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Module Form */}
              {editingType === 'module' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Module</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Module Title</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <select
                          value={editForm.status || ''}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Resources</h2>
                {user?.role === 'teacher' && (
                  <button
                    onClick={() => setShowAddForm('resource')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Add Resource
                  </button>
                )}
              </div>

              {course.resources && course.resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {course.resources.map((resource, index) => (
                    <div key={resource._id || index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
                            {user?.role === 'teacher' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => startEditing(resource, 'resource')}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1"
                                  title="Edit Resource"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(resource._id, 'resource')}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1"
                                  title="Delete Resource"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          {resource.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">{resource.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {resource.type === 'link' ? 'External Link' : 'File'}
                            </span>
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                              >
                                Open →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Resources Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Course resources will appear here when the instructor adds them.</p>
                </div>
              )}

              {/* Add Resource Form */}
              {showAddForm === 'resource' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Resource</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter resource title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="3"
                        placeholder="Enter resource description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                      <select
                        value={editForm.type || 'link'}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="link">External Link</option>
                        <option value="file">File</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                      <input
                        type="url"
                        value={editForm.url || ''}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter resource URL"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAdd('resource')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Add Resource
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Resource Form */}
              {editingType === 'resource' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Resource</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resource Title</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                        <input
                          type="url"
                          value={editForm.url || ''}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Assignments</h2>
                {user?.role === 'teacher' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddForm('assignment')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Add Assignment
                    </button>
                    <button
                      onClick={() => navigate(`/course/${courseId}/create-assignment`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Create Assignment (Advanced)
                    </button>
                  </div>
                )}
              </div>

              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment._id} className="relative">
                      <AssignmentCard
                        assignment={{
                          ...assignment,
                          course: course.name,
                          hasSubmitted: assignment.hasSubmitted || false,
                          isOverdue: new Date(assignment.dueDate) < new Date() && !assignment.hasSubmitted,
                          submission: {
                            status: assignment.hasSubmitted ? (assignment.submission?.status || 'submitted') : 'pending',
                            submittedAt: assignment.submission?.submittedAt,
                            grade: assignment.submission?.grade,
                          },
                          maxScore: assignment.maxScore,
                        }}
                        userRole={user?.role}
                        onSubmit={handleSubmitAssignment}
                        onGrade={user?.role === 'teacher' ? handleGradeAssignment : undefined}
                      />
                      {user?.role === 'teacher' && (
                        <div className="absolute top-4 right-4 flex space-x-1">
                          <button
                            onClick={() => startEditing(assignment, 'assignment')}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1 bg-white dark:bg-gray-800 rounded shadow"
                            title="Edit Assignment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id, 'assignment')}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-1 bg-white dark:bg-gray-800 rounded shadow"
                            title="Delete Assignment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Assignments Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Assignments will appear here when the instructor creates them.</p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}


          {/* Assignment Forms */}
          {showAddForm === 'assignment' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Assignment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignment Title *</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter assignment title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="4"
                    placeholder="Enter assignment description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</label>
                  <textarea
                    value={editForm.instructions || ''}
                    onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Enter detailed instructions for students"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                    <input
                      type="datetime-local"
                      value={editForm.dueDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Marks *</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editForm.maxScore || ''}
                      onChange={(e) => setEditForm({ ...editForm, maxScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission Type</label>
                    <select
                      value={editForm.submissionType || 'both'}
                      onChange={(e) => setEditForm({ ...editForm, submissionType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="file">File Upload</option>
                      <option value="text">Text Submission</option>
                      <option value="both">Both File and Text</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.allowLateSubmission || false}
                    onChange={(e) => setEditForm({ ...editForm, allowLateSubmission: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Allow late submissions
                  </label>
                </div>
                {editForm.allowLateSubmission && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Late Submission Penalty (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.lateSubmissionPenalty || 0}
                      onChange={(e) => setEditForm({ ...editForm, lateSubmissionPenalty: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAdd('assignment')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Assignment
                </button>
              </div>
            </div>
          )}

          {editingType === 'assignment' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Assignment</h3>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Basic Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignment Title *</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter assignment title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="4"
                        placeholder="Enter assignment description"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</label>
                      <textarea
                        value={editForm.instructions || ''}
                        onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows="3"
                        placeholder="Enter detailed instructions for students"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date *</label>
                        <input
                          type="datetime-local"
                          value={editForm.dueDate ? new Date(editForm.dueDate).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Marks *</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={editForm.maxScore || ''}
                          onChange={(e) => setEditForm({ ...editForm, maxScore: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission Type</label>
                      <select
                        value={editForm.submissionType || 'both'}
                        onChange={(e) => setEditForm({ ...editForm, submissionType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="file">File Upload</option>
                        <option value="text">Text Submission</option>
                        <option value="both">Both File and Text</option>
                      </select>
                    </div>
                  </div>

                  {/* Late Submission Settings */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Late Submission Settings</h4>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.allowLateSubmission || false}
                        onChange={(e) => setEditForm({ ...editForm, allowLateSubmission: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Allow late submissions
                      </label>
                    </div>
                    {editForm.allowLateSubmission && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Late Submission Penalty (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.lateSubmissionPenalty || 0}
                          onChange={(e) => setEditForm({ ...editForm, lateSubmissionPenalty: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <StudentsTab courseId={courseId} user={user} />
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementsTab courseId={courseId} user={user} />
          )}

          {/* Grading Tab (Teachers only) */}
          {activeTab === 'grading' && user?.role === 'teacher' && (
            <AssignmentGrading courseId={courseId} user={user} />
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <AttendanceTab courseId={courseId} user={user} />
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-[600px]">
              <ChatWindow
                courseId={courseId}
                courseName={course?.name}
                user={user}
              />
            </div>
          )}
        </div>
      </main>

      {/* Assignment Submission Modal */}
      {submissionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Submit Assignment: {submissionModal.assignment?.title}
                </h2>
                <button
                  onClick={handleSubmissionCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Assignment Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assignment Details</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{submissionModal.assignment?.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>📅 Due: {new Date(submissionModal.assignment?.dueDate).toLocaleDateString()}</span>
                    <span>📊 Max Score: {submissionModal.assignment?.maxScore}</span>
                  </div>
                </div>

                {/* Simplified Submission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Submission
                  </label>
                  <textarea
                    value={submissionData.content}
                    onChange={(e) => setSubmissionData({ ...submissionData, content: e.target.value })}
                    placeholder="Enter your assignment submission here. You can paste links to files (Google Drive, Dropbox, etc.) or write your answer directly."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="10"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    💡 Tip: If your assignment is a file, upload it to Google Drive, Dropbox, or any cloud service and paste the sharing link here.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleSubmissionCancel}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmissionSubmit}
                    disabled={loading || !submissionData.content.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                  >
                    {loading ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

CourseDetails.propTypes = {
  courseId: PropTypes.string,
  navigate: PropTypes.func,
};

export default CourseDetails;
