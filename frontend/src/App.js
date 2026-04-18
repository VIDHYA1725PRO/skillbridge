import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layout
import DashboardLayout from './components/common/DashboardLayout';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AllCourses from './pages/student/AllCourses';
import MyCourses from './pages/student/MyCourses';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentProgress from './pages/student/StudentProgress';
import StudentQuizzes from './pages/student/StudentQuizzes';
import StudentMessages from './pages/student/StudentMessages';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';
import StudentCertificates from './pages/student/StudentCertificates';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherMessages from './pages/teacher/TeacherMessages';
import TeacherNotifications from './pages/teacher/TeacherNotifications';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherCertificates from './pages/teacher/TeacherCertificates';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminProfile from './pages/admin/AdminProfile';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<AllCourses />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="quizzes" element={<TeacherQuizzes />} />
        <Route path="certificates" element={<TeacherCertificates />} />
        <Route path="messages" element={<TeacherMessages />} />
        <Route path="notifications" element={<TeacherNotifications />} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px', borderRadius: '12px' },
            success: { style: { background: '#C6F6D5', color: '#276749' } },
            error: { style: { background: '#FED7D7', color: '#C53030' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
