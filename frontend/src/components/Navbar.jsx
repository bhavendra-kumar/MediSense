import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setLangDropdownOpen(false)
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡିଆ', flag: '🇮🇳' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl border-b border-blue-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold hover:opacity-90 transition transform hover:scale-105"
          >
            <span className="text-3xl animate-bounce">🏥</span>
            <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
              MediSense AI
            </span>
          </Link>

          {/* Center Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition duration-200 flex items-center gap-1 hover:shadow-lg"
              >
                <span>📊</span> Dashboard
              </Link>
              <Link
                to="/reports"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition duration-200 flex items-center gap-1 hover:shadow-lg"
              >
                <span>📄</span> Reports
              </Link>
              <Link
                to="/dermatology"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition duration-200 flex items-center gap-1 hover:shadow-lg"
              >
                <span>🔬</span> Dermatology
              </Link>
              <Link
                to="/chat"
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition duration-200 flex items-center gap-1 hover:shadow-lg"
              >
                <span>💬</span> AI Chat
              </Link>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 px-3 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md"
              >
                <span>{currentLang?.flag}</span>
                <span>{currentLang?.code.toUpperCase()}</span>
                <span className="text-xs">▼</span>
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 border border-gray-200">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                      {i18n.language === lang.code && (
                        <span className="ml-auto text-blue-600 font-bold text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg transition duration-200 font-medium shadow-md"
                >
                  <span className="text-lg">👤</span>
                  <span className="hidden sm:inline text-sm">{user?.firstName}</span>
                  <span className="text-xs">▼</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-2xl overflow-hidden z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="font-semibold text-sm">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-3 hover:bg-blue-50 transition text-sm font-medium border-b border-gray-100"
                    >
                      ⚙️ Profile Settings
                    </Link>
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
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-blue-900 text-sm font-bold hover:bg-cyan-300 transition duration-200 shadow-md"
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
