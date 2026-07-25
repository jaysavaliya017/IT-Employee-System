import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Gift,
  User,
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Clock,
  BarChart3,
  Package,
  MessageSquare,
  DollarSign,
  Image,
  Bell,
  FileCheck,
  BookOpen,
  Fingerprint,
} from 'lucide-react';

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'My Attendance', icon: CalendarCheck },
    { path: '/apply-leave', label: 'Apply Leave', icon: FileText },
    { path: '/leave-history', label: 'Leave History', icon: Clock },
    { path: '/holidays', label: 'Holidays', icon: Gift },
    { path: '/resource-requests', label: 'Resource Requests', icon: Package },
    { path: '/salary', label: 'My Salary', icon: DollarSign },
    { path: '/my-salary-slips', label: 'My Salary Slips', icon: FileText },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/documents', label: 'Documents', icon: FileCheck },
    { path: '/policies', label: 'Policies', icon: BookOpen },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const teamLeaderLinks = [
    { path: '/team-leader', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/team-attendance', label: 'Team Attendance', icon: CalendarCheck },
    { path: '/team-leaves', label: 'Team Leaves', icon: FileText },
    { path: '/team-members', label: 'Team Members', icon: Users },
    { path: '/resource-request-approvals', label: 'Resource Approvals', icon: Package },
    { path: '/salary', label: 'My Salary', icon: DollarSign },
    { path: '/my-salary-slips', label: 'My Salary Slips', icon: FileText },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/documents', label: 'Documents', icon: FileCheck },
    { path: '/policies', label: 'Policies', icon: BookOpen },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/attendance', label: 'My Attendance', icon: CalendarCheck },
    { path: '/apply-leave', label: 'Apply Leave', icon: FileText },
    { path: '/leave-history', label: 'Leave History', icon: Clock },
    { path: '/holidays', label: 'Holidays', icon: Gift },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/teams', label: 'Teams', icon: Building2 },
    { path: '/attendance-management', label: 'Attendance', icon: CalendarCheck },
    { path: '/leave-requests', label: 'Leave Requests', icon: ClipboardList },
    { path: '/salary-generation-new', label: 'Salary Generation', icon: DollarSign },
    { path: '/salary-records', label: 'Salary Records', icon: DollarSign },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/documents', label: 'Documents', icon: FileCheck },
    { path: '/policies', label: 'Policies', icon: BookOpen },
    { path: '/resource-request-approvals', label: 'Resource Approvals', icon: Package },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/holidays', label: 'Holidays', icon: CalendarDays },
    { path: '/shifts', label: 'Shifts', icon: Clock },
    { path: '/biometric-devices', label: 'Fingerprint Devices', icon: Fingerprint },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const getLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'HR':
      case 'MANAGER':
        return adminLinks;
      case 'TEAM_LEADER':
        return teamLeaderLinks;
      case 'EMPLOYEE':
      default:
        return employeeLinks;
    }
  };

  const links = getLinks();
  const rawCompanyCode = user?.company?.code || localStorage.getItem('companyCode') || 'STAFFSYNC';
  const companyCode = rawCompanyCode.trim().toUpperCase();
  const companyNameFromInput = localStorage.getItem('companyInput') || '';
  const fallbackCompanyNameFromCode = companyCode ? titleCase(companyCode.replace(/[_-]+/g, ' ')) : '';
  const companyName =
    user?.company?.name ||
    localStorage.getItem('companyName') ||
    companyNameFromInput ||
    fallbackCompanyNameFromCode ||
    'StaffSync Technologies';
  const companyInitials = companyCode.slice(0, 2).toUpperCase() || 'CO';

  return (
    <>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-2 bg-white rounded-lg shadow-card border border-slate-200"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-navy-900 z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">

          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
            {!collapsed ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm bg-gradient-to-br from-primary-500 to-primary-700 text-white shrink-0 shadow-sm">
                  {companyInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">{companyName}</p>
                  <p className="text-[11px] text-navy-300 tracking-wide">{companyCode}</p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs bg-gradient-to-br from-primary-500 to-primary-700 text-white mx-auto shadow-sm">
                {companyInitials}
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft
                className={`w-4 h-4 text-navy-300 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? link.label : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-navy-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary-400" />
                  )}
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                  {!collapsed && <span className="text-sm truncate">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              title={collapsed ? 'Logout' : undefined}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-navy-300 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
