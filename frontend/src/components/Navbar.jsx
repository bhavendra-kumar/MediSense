import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl border-b border-blue-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-semibold tracking-tight hover:opacity-95 transition"
          >
            <span className="text-3xl">🔎</span>
            <span className="bg-gradient-to-r from-cyan-200 via-sky-200 to-white bg-clip-text text-transparent drop-shadow-sm">
              MediSense AI
            </span>
          </Link>

          {/* Center Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink
                to="/dashboard"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-blue-900/40'
                      : 'text-blue-100 hover:bg-blue-500/40 hover:text-white'
                  }`
                }
              >
                <span>📊</span>
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
              <NavLink
                to="/reports"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-blue-900/40'
                      : 'text-blue-100 hover:bg-blue-500/40 hover:text-white'
                  }`
                }
              >
                <span>📄</span>
                <span className="hidden sm:inline">Reports</span>
              </NavLink>
              <NavLink
                to="/dermatology"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-blue-900/40'
                      : 'text-blue-100 hover:bg-blue-500/40 hover:text-white'
                  }`
                }
              >
                <span>🔬</span>
                <span className="hidden sm:inline">Dermatology</span>
              </NavLink>
              <NavLink
                to="/chat"
                onClick={() => setDropdownOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-blue-900/40'
                      : 'text-blue-100 hover:bg-blue-500/40 hover:text-white'
                  }`
                }
              >
                <span>💬</span>
                <span className="hidden sm:inline">AI Chat</span>
              </NavLink>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-full transition duration-150 font-semibold shadow-md border border-indigo-400/60"
                >
                  <span className="text-lg">👤</span>
                  <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                    {user?.firstName || 'Profile'}
                  </span>
                  <span className="text-[10px]">▾</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="font-semibold text-sm">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-3 text-sm font-semibold border-b border-gray-100 flex items-center gap-2 transition ${
                          isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                        }`
                      }
                    >
                      <span>⚙️</span>
                      <span>Profile settings</span>
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition text-sm font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-blue-300/70 text-blue-50 hover:bg-blue-500/40 transition duration-150"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-cyan-400 text-blue-900 text-xs font-semibold hover:bg-cyan-300 transition duration-150 shadow-md shadow-cyan-500/40"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
