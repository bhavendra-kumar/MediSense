import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import Alert from '../components/Alert';
import Google from '../assets/Google_Logo.png';

const Login = () => {
  const { t } = useTranslation();
  const { login, loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertState, setAlertState] = useState({ show: false, type: 'info', message: '' });

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const validateEmail = (email) => {
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
      setError(t('Please enter your password.'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password, formData.remember);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromGoogle = params.get('token');
    const errorFromGoogle = params.get('error');

    console.log('Google token from URL:', tokenFromGoogle, 'error:', errorFromGoogle);

    if (errorFromGoogle) {
      setError('Google sign-in failed. Please try again.');
    }

    if (tokenFromGoogle) {
      loginWithToken(tokenFromGoogle);
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <Alert
        type={alertState.type}
        message={alertState.message}
        show={alertState.show}
        autoCloseMs={2800}
        onClose={() => setAlertState((prev) => ({ ...prev, show: false }))}
      />
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left brand panel */}
        <div className="hidden lg:flex flex-col gap-6 text-slate-100">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live preview · Not a medical diagnosis
            </p>
            <h1 className="text-4xl font-semibold tracking-tight mb-3">
              Your health, translated
              <span className="block text-slate-300 text-lg font-normal mt-2">
                Clear reports. Gentle explanations. Real language.
              </span>
            </h1>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-300">Today&apos;s AI health glance</p>
                <p className="text-3xl font-semibold text-emerald-400 mt-1">
                  82
                  <span className="text-base align-super text-emerald-300">/100</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                🩺
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Based on your latest reports, sleep and activity.
              Use MediSense AI as a coach – not as your doctor.
            </p>
            <div className="flex gap-2 text-[11px] text-slate-200 flex-wrap">
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Multilingual explanations
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Dermatology insights
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Report summaries
              </span>
            </div>
          </div>
        </div>

        {/* Right auth card */}
        <div className="w-full max-w-md mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-[0_22px_60px_rgba(15,23,42,0.9)] p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Secure login
              </div>
              <h2 className="text-2xl font-semibold text-slate-50 tracking-tight mb-1">
                Welcome back to MediSense
              </h2>
              <p className="text-sm text-slate-400">
                Sign in to see your AI health insights and reports.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.email') || 'Email address'}
                </label>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-sm">
                    📧
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="mt-0 w-full rounded-2xl border border-slate-700 bg-slate-900/70 pl-10 pr-3 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400 shadow-sm transition"
                    aria-label="Email address"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.password') || 'Password'}
                </label>
                <div className="mt-1 relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-sm">
                    🔐
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 pl-10 pr-12 py-2.5 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400 shadow-sm transition"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 px-3 py-1 rounded-full text-[11px] text-slate-200 border border-slate-600"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Row: Remember + Forgot */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="inline-flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/60"
                  />
                  <span>{t('Remember Password') || 'Remember me'}</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium">
                  {t('Forgot Password?') || 'Forgot password?'}
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-2xl font-semibold text-sm text-slate-950 shadow-lg shadow-emerald-500/20 transform transition
                  ${loading ? 'bg-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-400 to-cyan-300 hover:scale-[1.01]'}`}
                aria-disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-3">
                    <svg
                      className="w-5 h-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden>
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
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-800" />
                <div className="text-[11px] text-slate-500">or</div>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Social sign-in */}
              <div className="mt-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 transition text-xs text-slate-200"
                  onClick={() => {
                    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                    window.location.href = `${apiBase}/api/auth/google`;
                  }}
                >
                  <img
                    src={Google}
                    alt="Google"
                    className="h-4 w-4"
                  />
                  <span>Continue with Google</span>
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 border-t border-slate-800 pt-4 text-center">
              <p className="text-xs text-slate-400">
                {t('auth.noAccount') || "Don't have an account?"}{' '}
                <Link
                  to="/register"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium">
                  {t('auth.register') || 'Sign Up'} →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ); };

export default Login;