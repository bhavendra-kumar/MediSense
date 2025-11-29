import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4" aria-hidden>
              <span className="text-5xl animate-bounce">🏥</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">MediSense AI</h1>
            <p className="text-blue-100 text-sm mt-1">{t('Create Your Account')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition text-sm"
                  aria-label="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition text-sm"
                  aria-label="Last Name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition text-sm"
                aria-label="Email address"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition text-sm"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white/80 px-2 py-1 rounded-md text-xs text-gray-700 shadow-sm"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition text-sm"
                  aria-label="Confirm Password"
                />
                
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label htmlFor="phone" className="block font-medium text-gray-700 flex items-center gap-2 mb-2">
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
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400 shadow-sm transition"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <span>⚕️</span>
                  <span>{t('auth.gender') || 'Gender (Optional)'}</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Language & Role */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label htmlFor="preferredLanguage" className="block font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <span>🌐</span>
                  <span>{t('Preferred Language')}</span>
                </label>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition bg-white"
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
                <label htmlFor="role" className="block font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <span>👨‍⚕️</span>
                  <span>{t('auth.role') || 'Account Type'}</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition bg-white"
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
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transform transition mt-6
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
                  {t('common.loading') || 'Creating Account...'}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-3">
                  <span>✨</span>
                  {t('auth.registerButton') || 'Create Account'}
                </span>
              )}
            </button>
          </form>

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
                onClick={() => alert('Google sign-in')}
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
        

          {/* Footer */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 text-center">
            <p className="text-gray-700 text-sm">
              {t('auth.haveAccount') || 'Already have an account?'}{' '}
              <Link to="/login" className="text-indigo-600 hover:underline font-semibold">
                {t('auth.login') || 'Sign In'} →
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-3">
              {t('auth.disclaimerShort') ||
                'Results are for informational purposes only — not a diagnosis. Always consult a licensed medical professional.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
