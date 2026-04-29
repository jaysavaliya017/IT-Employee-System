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
} from 'lucide-react';

const COMPANY_BRAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  PROATTEND: { bg: 'bg-primary-100', text: 'text-primary-700', ring: 'ring-primary-200' },
  CQTPL: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200' },
  NEXORA: { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200' },
  ASTERBYTE: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  INFINIX: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  VERTEXON: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  CLOUDBRIDGE: { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
  DEVSPHERE: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  PIXELROOT: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', ring: 'ring-fuchsia-200' },
  BLUEORBIT: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
};
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
  const rawCompanyCode = user?.company?.code || localStorage.getItem('companyCode') || 'PROATTEND';
  const companyCode = rawCompanyCode.trim().toUpperCase();
  const companyNameFromInput = localStorage.getItem('companyInput') || '';
  const fallbackCompanyNameFromCode = companyCode ? titleCase(companyCode.replace(/[_-]+/g, ' ')) : '';
  const companyName =
    user?.company?.name ||
    localStorage.getItem('companyName') ||
    companyNameFromInput ||
    fallbackCompanyNameFromCode ||
    'ProAttend Technologies';
  const companyStyle = COMPANY_BRAND_STYLES[companyCode] || COMPANY_BRAND_STYLES.PROATTEND;
  const companyInitials = companyCode.slice(0, 2).toUpperCase() || 'CO';


  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
            {!collapsed && (
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ring-1 ${companyStyle.bg} ${companyStyle.text} ${companyStyle.ring} shrink-0`}>
                  {companyInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{companyName}</p>
                  <p className="text-xs text-gray-500">{companyCode}</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ring-1 mx-auto ${companyStyle.bg} ${companyStyle.text} ${companyStyle.ring}`}>
                {companyInitials}
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  collapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{link.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
