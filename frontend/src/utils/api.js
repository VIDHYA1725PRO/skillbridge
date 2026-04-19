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
export const getCourse = (id) => API.get(`/courses?id=${id}`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (id, data) => API.put(`/courses?id=${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses?id=${id}`);
export const enrollCourse = (id) => API.post(`/courses?id=${id}&action=enroll`);
export const unenrollCourse = (id) => API.post(`/courses?id=${id}&action=unenroll`);
export const getTeacherCourses = () => API.get('/courses?teacher=true');

// Assignments
export const getStudentAssignments = () => API.get('/assignments');
export const getTeacherAssignments = () => API.get('/assignments');
export const createAssignment = (data) => API.post('/assignments', data);
export const submitAssignment = (id, formData) => {
  formData.append('assignmentId', id);
  return API.post('/assignments/submit', formData);
};
export const gradeAssignment = (id, studentId, data) => API.put(`/assignments/${id}/grade/${studentId}`, data);
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);

// Quizzes
export const getStudentQuizzes = () => API.get('/quizzes?role=student');
export const getTeacherQuizzes = () => API.get('/quizzes?role=teacher');
export const getQuizForAttempt = (id) => API.get(`/quizzes?attempt=${id}`);
export const submitQuiz = (id, data) => API.post(`/quizzes?submit=${id}`, data);
export const createQuiz = (data) => API.post('/quizzes', data);
export const toggleQuiz = (id) => API.put(`/quizzes?toggle=${id}`);
export const deleteQuiz = (id) => API.delete(`/quizzes?delete=${id}`);

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
export const getAdminUsers = (params) => API.get('/admin/stats?action=users', { params });
export const addAdminUser = (data) => API.post('/admin/users', data);
export const updateAdminUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminCourses = () => API.get('/admin/stats?action=courses');
export const sendAnnouncement = (data) => API.post('/admin/announce', data);
