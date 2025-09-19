const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fallback URLs for different environments
const FALLBACK_URLS = [
  'http://localhost:3001/api',
  'http://localhost:3002/api',
  'http://localhost:3003/api',
  'http://127.0.0.1:3001/api',
  'http://127.0.0.1:3002/api',
];

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.retryCount = 3;
    this.retryDelay = 1000;
    this.isConnected = false;
    this.lastWorkingURL = null;
  }

  // Test connection to a URL
  async testConnection(url) {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Find working API URL
  async findWorkingURL() {
    if (this.lastWorkingURL && await this.testConnection(this.lastWorkingURL)) {
      this.baseURL = this.lastWorkingURL;
      this.isConnected = true;
      return this.lastWorkingURL;
    }

    const urlsToTest = [this.baseURL, ...FALLBACK_URLS];
    
    for (const url of urlsToTest) {
      if (await this.testConnection(url)) {
        this.baseURL = url;
        this.lastWorkingURL = url;
        this.isConnected = true;
        console.log(`✅ Connected to API at: ${url}`);
        return url;
      }
    }
    
    this.isConnected = false;
    throw new Error('Unable to connect to any API server. Please ensure the backend is running.');
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('token');
  }

  // Retry logic for failed requests
  async retryRequest(endpoint, options, retries = this.retryCount) {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (retries > 0 && error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn(`Retrying request to ${endpoint}. Attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    // Ensure we have a working connection
    if (!this.isConnected) {
      await this.findWorkingURL();
    }

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      console.log('Making API request to:', url);
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          this.removeAuthToken();
          throw new Error('Session expired. Please log in again.');
        }
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // If connection failed, try to find a working URL
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.isConnected = false;
        try {
          await this.findWorkingURL();
          // Retry the request with the new URL
          return this.request(endpoint, options);
        } catch (connectionError) {
          throw new Error(`Unable to connect to server. Please check if the backend is running. Tried: ${FALLBACK_URLS.join(', ')}`);
        }
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.retryRequest(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.retryRequest(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.retryRequest(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.retryRequest(endpoint, { method: 'DELETE' });
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async register(email, password, role) {
    const response = await this.post('/auth/register', { email, password, role });
    if (response.token) {
      this.setAuthToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.removeAuthToken();
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  // User methods
  async getUserProfile() {
    return this.get('/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.put('/users/profile', { profile: profileData });
  }

  async getUsers(params = {}) {
    return this.get('/users', params);
  }

  async getUserById(userId) {
    return this.get(`/users/${userId}`);
  }

  async getUserCourses(userId) {
    return this.get(`/users/${userId}/courses`);
  }

  // Course methods
  async getCourses(params = {}) {
    return this.get('/courses', params);
  }

  async getCourseById(courseId) {
    return this.get(`/courses/${courseId}`);
  }

  async createCourse(courseData) {
    return this.post('/courses', courseData);
  }

  async updateCourse(courseId, courseData) {
    return this.put(`/courses/${courseId}`, courseData);
  }

  async deleteCourse(courseId) {
    return this.delete(`/courses/${courseId}`);
  }

  async enrollInCourse(courseId) {
    return this.post(`/courses/${courseId}/enroll`);
  }

  async dropFromCourse(courseId) {
    return this.delete(`/courses/${courseId}/enroll`);
  }

  async getCourseStudents(courseId) {
    return this.get(`/courses/${courseId}/students`);
  }

  async getCourseAssignments(courseId) {
    return this.get(`/courses/${courseId}/assignments`);
  }

  async getCourseAttendance(courseId, params = {}) {
    return this.get(`/courses/${courseId}/attendance`, params);
  }

  async getCourseAttendanceOverview(courseId, params = {}) {
    return this.get(`/attendance/course/${courseId}/overview`, params);
  }

  // Course module methods
  async getCourseModules(courseId) {
    return this.get(`/courses/${courseId}/modules`);
  }

  async createCourseModule(courseId, moduleData) {
    return this.post(`/courses/${courseId}/modules`, moduleData);
  }

  async updateCourseModule(courseId, moduleId, moduleData) {
    return this.put(`/courses/${courseId}/modules/${moduleId}`, moduleData);
  }

  async deleteCourseModule(courseId, moduleId) {
    return this.delete(`/courses/${courseId}/modules/${moduleId}`);
  }

  async markContentCompleted(courseId, moduleId, contentId, isCompleted = true) {
    return this.put(`/courses/${courseId}/modules/${moduleId}/content/${contentId}/complete`, { isCompleted });
  }

  async updateCourseStatus(courseId, status) {
    return this.put(`/courses/${courseId}/status`, { status });
  }

  async getCourseProgress(courseId) {
    return this.get(`/courses/${courseId}/progress`);
  }

  // Assignment methods
  async getAssignments(params = {}) {
    return this.get('/assignments', params);
  }

  async getAssignmentById(assignmentId) {
    return this.get(`/assignments/${assignmentId}`);
  }

  async createAssignment(assignmentData) {
    return this.post('/assignments', assignmentData);
  }

  async updateAssignment(assignmentId, assignmentData) {
    return this.put(`/assignments/${assignmentId}`, assignmentData);
  }

  async deleteAssignment(assignmentId) {
    return this.delete(`/assignments/${assignmentId}`);
  }

  async submitAssignment(assignmentId, submissionData) {
    return this.post(`/assignments/${assignmentId}/submit`, submissionData);
  }

  async gradeAssignment(assignmentId, studentId, gradeData) {
    return this.put(`/assignments/${assignmentId}/grade/${studentId}`, gradeData);
  }

  async getAssignmentSubmissions(assignmentId) {
    return this.get(`/assignments/${assignmentId}/submissions`);
  }

  async getStudentSubmission(assignmentId, studentId) {
    return this.get(`/assignments/${assignmentId}/submissions/${studentId}`);
  }

  // Attendance methods
  async getAttendance(params = {}) {
    return this.get('/attendance', params);
  }

  async getAttendanceById(attendanceId) {
    return this.get(`/attendance/${attendanceId}`);
  }

  async createAttendanceSession(attendanceData) {
    return this.post('/attendance', attendanceData);
  }

  async markStudentAttendance(attendanceId, studentId, status, notes = '') {
    return this.put(`/attendance/${attendanceId}/mark/${studentId}`, { status, notes });
  }

  async finalizeAttendance(attendanceId) {
    return this.put(`/attendance/${attendanceId}/finalize`);
  }

  async getStudentAttendanceSummary(studentId, courseId) {
    return this.get(`/attendance/student/${studentId}/summary`, { courseId });
  }

  async deleteAttendanceSession(attendanceId) {
    return this.delete(`/attendance/${attendanceId}`);
  }

  async markAttendance(courseId, studentId, status, notes = '') {
    return this.put(`/attendance/mark`, { courseId, studentId, status, notes });
  }

  // File upload methods
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.post('/upload/avatar', formData);
  }

  async uploadAssignmentFiles(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.post('/upload/assignment', formData);
  }

  async uploadResourceFiles(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.post('/upload/resource', formData);
  }

  async deleteFile(category, filename) {
    return this.delete(`/upload/${category}/${filename}`);
  }

  async getFileInfo(category, filename) {
    return this.get(`/upload/info/${category}/${filename}`);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }

  // Grade submission
  async gradeSubmission(submissionId, grade, feedback) {
    const response = await fetch(`${this.baseURL}/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ grade, feedback }),
    });
    return this.handleResponse(response);
  }

  // Remove student from course
  async removeStudentFromCourse(courseId, studentId) {
    const response = await fetch(`${this.baseURL}/courses/${courseId}/remove-student`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId }),
    });
    return this.handleResponse(response);
  }

  // Approve student for course
  async approveStudentForCourse(courseId, studentId) {
    const response = await fetch(`${this.baseURL}/courses/${courseId}/approve-student`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId }),
    });
    return this.handleResponse(response);
  }

  // Get attendance summary
  async getAttendanceSummary(courseId) {
    const response = await fetch(`${this.baseURL}/courses/${courseId}/attendance-summary`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Mark attendance
  async markAttendance(courseId, date, session, topic, attendanceData) {
    const response = await fetch(`${this.baseURL}/courses/${courseId}/attendance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ date, session, topic, attendanceData }),
    });
    return this.handleResponse(response);
  }

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId) {
    const response = await fetch(`${this.baseURL}/assignments/${assignmentId}/submissions`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;