import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  title?: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4 pl-10 lg:pl-0">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title || 'Dashboard'}</h2>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">

          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 w-44"
            />
          </div>

          <NotificationDropdown />

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {(user?.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.designation || user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1.5 z-20">
                  <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
                    <p className="text-xs text-slate-500">{user?.designation || user?.role}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>
                  <hr className="my-1.5 border-slate-100" />
                  <button
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

