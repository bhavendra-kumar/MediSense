import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const validateEmail = (email) => {
    // simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(formData.email)) {
      setError(t('auth.invalidEmail') || 'Please enter a valid email address.');
      return;
    }
    if (!formData.password) {
      setError(t('auth.enterPassword') || 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password, formData.remember);
      // Expecting login to return an object like { success: true, user, token } or similar.
      if (response?.success || response?.token) {
        navigate('/dashboard');
      } else {
        setError(response?.message || t('auth.loginFailed') || 'Login failed. Check credentials.');
      }
    } catch (err) {
      console.error(err);
      setError(t('auth.loginError') || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4" aria-hidden>
              <span className="text-5xl animate-bounce">🏥</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">MediSense AI</h1>
            <p className="text-blue-100 mt-1">{t('Your AI Health Companion')}</p>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Error */}
            {error && (
              <div
                role="alert"
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in"
                aria-live="assertive"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <p className="text-red-800 font-semibold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>📧</span>
                <span>{t('auth.email') || 'Email address'}</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder=""
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition"
                aria-label="Email address"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>🔐</span>
                <span>{t('auth.password') || 'Password'}</span>
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white/80 px-3 py-1 rounded-md text-sm text-gray-700 shadow-sm"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Row: Remember + Forgot */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>{t('Remember Password') || 'Remember me'}</span>
              </label>

              <Link to="/forgot-password" className="text-indigo-600 hover:underline font-medium">
                {t('Forgot Password?') || 'Forgot password?'}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transform transition
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02]'}`}
              aria-disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-3">
                  <svg
                    className="w-5 h-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  {t('common.loading') || 'Logging in...'}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-3">
                  <span>🚀</span>
                  {t('auth.login') || 'Sign In'}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <div className="text-xs text-gray-400">or</div>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social / Alternative sign-in (placeholders) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-3 py-2 rounded-xl border border-gray-200 hover:shadow-sm transition bg-white"
                onClick={() => alert('Google sign-in placeholder')}
              >
                <img src="/assets/Google_Logo.png" alt="" className="w-5 h-5" />
                <span className="text-sm">Continue with Google</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-3 py-2 rounded-xl border border-gray-200 hover:shadow-sm transition bg-white"
                onClick={() => alert('Apple sign-in placeholder')}
              >
                <img src="/icons/apple.svg" alt="" className="w-5 h-5" />
                <span className="text-sm">Continue with Apple</span>
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 text-center">
            <p className="text-gray-700 text-sm">
              {t('auth.noAccount') || "Don't have an account?"}{' '}
              <Link to="/register" className="text-indigo-600 hover:underline font-semibold">
                {t('auth.register') || 'Sign Up'} →
              </Link>
            </p>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
