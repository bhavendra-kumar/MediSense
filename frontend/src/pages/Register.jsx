import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import Alert from '../components/Alert';
import Google from '../assets/Google_Logo.png';

const Register = () => {
  const { t } = useTranslation();
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    preferredLanguage: 'en',
    role: 'patient',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertState, setAlertState] = useState({ show: false, type: 'info', message: '' });

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBase}/api/auth/google`;
  };

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...data } = formData;
      const response = await register(data);

      if (response?.success) {
        navigate('/dashboard');
      } else {
        setError(response?.message || t('auth.registrationFailed') || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('auth.registrationError') || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Left brand panel (mirrors login vibe) */}
        <div className="hidden lg:flex flex-col gap-6 text-slate-100">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Create account · Multilingual explanations
            </p>
            <h1 className="text-4xl font-semibold tracking-tight mb-3">
              Join MediSense AI
              <span className="block text-slate-300 text-lg font-normal mt-2">
                One place for reports, skin checks and AI health coaching.
              </span>
            </h1>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-300">Designed for patients and doctors</p>
                <p className="text-3xl font-semibold text-emerald-400 mt-1">
                  24/7
                  <span className="text-base align-super text-emerald-300"> assist</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                🏥
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              We translate medical language into simple words in your language. You&apos;re always in control of what you share.
            </p>
            <div className="flex gap-2 text-[11px] text-slate-200 flex-wrap">
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Privacy-first by design
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Doctor-friendly summaries
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-900/50 border border-slate-700/70">
                Works across languages
              </span>
            </div>
          </div>
        </div>

        {/* Right register card */}
        <div className="w-full max-w-xl mx-auto">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-[0_22px_60px_rgba(15,23,42,0.9)] overflow-hidden">
            <div className="px-8 pt-8 pb-4 border-b border-slate-800">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Create your secure account
              </div>
              <h2 className="text-2xl font-semibold text-slate-50 tracking-tight mb-1">
                {t('Create Your Account') || 'Create your account'}
              </h2>
              <p className="text-sm text-slate-400">
                A few details to personalise your experience. You can change them later.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <p className="text-red-800 font-semibold text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>👤</span>
                    <span>{t('auth.firstName') || 'First Name'}</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-sm text-slate-50"
                    aria-label="First Name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>👤</span>
                    <span>{t('auth.lastName') || 'Last Name'}</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-sm text-slate-50"
                    aria-label="Last Name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                  <span>📧</span>
                  <span>{t('auth.email') || 'Email Address'}</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-sm text-slate-50"
                  aria-label="Email address"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>🔐</span>
                    <span>{t('auth.password') || 'Password'}</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder=""
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-sm text-slate-50"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded-full text-[11px] text-slate-200 border border-slate-600"
                      aria-pressed={showPassword}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>✓</span>
                    <span>{t('auth.confirmPassword') || 'Confirm Password'}</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-sm text-slate-50"
                    aria-label="Confirm Password"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>☎️</span>
                    <span>{t('auth.phone') || 'Phone (Optional)'}</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-slate-500 shadow-sm transition text-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>⚕️</span>
                    <span>{t('auth.gender') || 'Gender (Optional)'}</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 shadow-sm transition text-slate-50"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Language & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label htmlFor="preferredLanguage" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>🌐</span>
                    <span>{t('Preferred Language')}</span>
                  </label>
                  <select
                    id="preferredLanguage"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 shadow-sm transition text-slate-50"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="ta">தமிழ்</option>
                    <option value="te">తెలుగు</option>
                    <option value="bn">বাংলা</option>
                    <option value="kn">ಕನ್ನಡ</option>
                    <option value="ml">മലയാളം</option>
                    <option value="pa">ਪੰਜਾਬੀ</option>
                    <option value="gu">ગુજરાતી</option>
                    <option value="mr">मराठी</option>
                    <option value="or">ଓଡିଆ</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="role" className="block text-xs font-medium text-slate-300 flex items-center gap-2 mb-1">
                    <span>👨‍⚕️</span>
                    <span>{t('auth.role') || 'Account Type'}</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 shadow-sm transition text-slate-50"
                  >
                    <option value="patient">{t('auth.patient') || 'Patient'}</option>
                    <option value="doctor">{t('auth.doctor') || 'Doctor'}</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-2xl font-semibold text-sm text-slate-950 shadow-lg shadow-emerald-500/20 transform transition mt-4
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
                      aria-hidden
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    {t('common.loading') || 'Creating account...'}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-3">
                    <span>✨</span>
                    {t('auth.registerButton') || 'Create Account'}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-3">
                <div className="flex-1 h-px bg-slate-800" />
                <div className="text-[11px] text-slate-500">or</div>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Social sign-in */}
              <div className="mt-1">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 transition text-xs text-slate-200"
                  onClick={handleGoogleSignIn}
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
            <div className="px-8 py-5 border-t border-slate-800 bg-slate-950/60 text-center">
              <p className="text-xs text-slate-400">
                {t('auth.haveAccount') || 'Already have an account?'}{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium">
                  {t('auth.login') || 'Sign In'} →
                </Link>
              </p>
              <p className="text-[11px] text-slate-500 mt-3 max-w-md mx-auto">
                {t('auth.disclaimerShort') ||
                  'Results are for informational purposes only — not a diagnosis. Always consult a licensed medical professional.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;



