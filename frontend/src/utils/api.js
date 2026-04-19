import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sb_token');
      localStorage.removeItem('sb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);

// Courses
export const getCourses = () => API.get('/courses');
export const getCourse = (id) => API.get(`/courses/${id}`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);
export const enrollCourse = (id) => API.post(`/courses/${id}/enroll`);
export const unenrollCourse = (id) => API.post(`/courses/${id}/unenroll`);
export const getTeacherCourses = () => API.get('/courses/teacher/my-courses');

// Assignments
export const getStudentAssignments = () => API.get('/assignments/student');
export const getTeacherAssignments = () => API.get('/assignments/teacher');
export const createAssignment = (data) => API.post('/assignments', data);
export const submitAssignment = (id, formData) => {
  formData.append('assignmentId', id);
  return API.post(`/assignments/${id}/submit`, formData);
};
export const gradeAssignment = (id, studentId, data) => API.put(`/assignments/${id}/grade/${studentId}`, data);
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);
export const downloadSubmission = (assignmentId, studentId) => 
  API.get(`/assignments/${assignmentId}/submission/${studentId}/download`, { responseType: 'blob' });
export const downloadAssignmentAttachment = (assignmentId) =>
  API.get(`/assignments/${assignmentId}/attachment/download`, { responseType: 'blob' });

// Quizzes
export const getStudentQuizzes = () => API.get('/quizzes/student');
export const getTeacherQuizzes = () => API.get('/quizzes/teacher');
export const getQuizForAttempt = (id) => API.get(`/quizzes/${id}/attempt`);
export const submitQuiz = (id, data) => API.post(`/quizzes/${id}/submit`, data);
export const createQuiz = (data) => API.post('/quizzes', data);
export const toggleQuiz = (id) => API.put(`/quizzes/${id}/toggle`);
export const deleteQuiz = (id) => API.delete(`/quizzes/${id}`);

// Messages
export const getConversations = () => API.get('/messages/conversations');
export const getMessages = (userId) => API.get(`/messages/${userId}`);
export const sendMessage = (data) => API.post('/messages', data);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markAllRead = () => API.put('/notifications/read-all');
export const markRead = (id) => API.put(`/notifications/${id}/read`);
export const broadcastNotification = (data) => API.post('/notifications/broadcast', data);

// Certificates
export const getMyCertificates = () => API.get('/certificates/my');
export const uploadCertificate = (formData) => API.post('/certificates/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getStudentCertificates = () => API.get('/certificates/students');
export const verifyCertificate = (id) => API.put(`/certificates/${id}/verify`);

// Progress
export const logProgress = (data) => API.post('/progress/log', data);
export const getHeatmap = () => API.get('/progress/heatmap');
export const getTodos = () => API.get('/progress/todos');
export const createTodo = (data) => API.post('/progress/todos', data);
export const updateTodo = (id, data) => API.put(`/progress/todos/${id}`, data);
export const deleteTodo = (id) => API.delete(`/progress/todos/${id}`);

// Users
export const getTeachers = () => API.get('/users/teachers');
export const getUser = (id) => API.get(`/users/${id}`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const addAdminUser = (data) => API.post('/admin/users', data);
export const updateAdminUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminCourses = () => API.get('/admin/courses');
export const sendAnnouncement = (data) => API.post('/admin/announce', data);
