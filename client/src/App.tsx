import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CompanyAccess from './pages/CompanyAccess';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TeamLeaderDashboard from './pages/TeamLeaderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MonthlyAttendance from './pages/MonthlyAttendance';
import LeaveBalance from './pages/LeaveBalance';
import ApplyLeave from './pages/ApplyLeave';
import LeaveHistory from './pages/LeaveHistory';
import Holidays from './pages/Holidays';
import Profile from './pages/Profile';
import Employees from './pages/Employees';
import Companies from './pages/Companies';
import Teams from './pages/Teams';
import AttendanceManagement from './pages/AttendanceManagement';
import LeaveRequests from './pages/LeaveRequests';
import Shifts from './pages/Shifts';
import Reports from './pages/Reports';
import TeamAttendance from './pages/TeamAttendance';
import TeamLeaves from './pages/TeamLeaves';
import TeamMembers from './pages/TeamMembers';
import Settings from './pages/Settings';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ResourceRequests from './pages/ResourceRequests';
import ResourceRequestApprovals from './pages/ResourceRequestApprovals';
import Messages from './pages/Messages';
import SalaryDashboard from './pages/SalaryDashboard';
import SalarySlipList from './pages/SalarySlipList';
import SalaryGeneration from './pages/SalaryGeneration';
import SalaryGenerationNew from './pages/SalaryGenerationNew';
import EmployeeSalarySlips from './pages/EmployeeSalarySlips';
import GalleryPage from './pages/GalleryPage';
import AnnouncementList from './pages/AnnouncementList';
import NotificationPage from './pages/NotificationPage';
import DocumentCenter from './pages/DocumentCenter';
import PoliciesPage from './pages/PoliciesPage';

const App: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'HR':
        return '/admin';
      case 'MANAGER':
        return '/admin';
      case 'TEAM_LEADER':
        return '/team-leader';
      case 'EMPLOYEE':
      default:
        return '/dashboard';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/company" element={isAuthenticated ? <Navigate to={getDashboardRoute()} /> : <CompanyAccess />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDashboardRoute()} /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to={getDashboardRoute()} />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="team-leader" element={<TeamLeaderDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="attendance" element={<MonthlyAttendance />} />
        <Route path="leave-balance" element={<LeaveBalance />} />
        <Route path="apply-leave" element={<ApplyLeave />} />
        <Route path="leave-history" element={<LeaveHistory />} />
        <Route path="holidays" element={<Holidays />} />
        <Route path="profile" element={<Profile />} />
        <Route path="employees" element={<Employees />} />
        <Route path="companies" element={<Companies />} />
        <Route path="teams" element={<Teams />} />
        <Route path="attendance-management" element={<AttendanceManagement />} />
        <Route path="leave-requests" element={<LeaveRequests />} />
        <Route path="shifts" element={<Shifts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="team-attendance" element={<TeamAttendance />} />
        <Route path="team-leaves" element={<TeamLeaves />} />
        <Route path="team-members" element={<TeamMembers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="resource-requests" element={<ResourceRequests />} />
        <Route path="resource-request-approvals" element={<ResourceRequestApprovals />} />
        <Route path="messages" element={<Messages />} />
        <Route path="salary" element={<SalaryDashboard />} />
        <Route path="salary-records" element={<SalarySlipList />} />
        <Route path="salary-generation" element={<SalaryGeneration />} />
        <Route path="salary-generation-new" element={<SalaryGenerationNew />} />
        <Route path="my-salary-slips" element={<EmployeeSalarySlips />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="announcements" element={<AnnouncementList />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="documents" element={<DocumentCenter />} />
        <Route path="policies" element={<PoliciesPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/company'} />} />
    </Routes>
  );
};

export default App;
