import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'mr', label: 'मराठी' },
  { code: 'or', label: 'ଓଡିଆ' },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    sex: 'not_specified',
    preferredLanguage: 'en',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        age: user.age || '',
        sex: user.sex || 'not_specified',
        preferredLanguage: user.preferredLanguage || i18n.language || 'en',
      }));
    }
  }, [user, i18n.language]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        age: formData.age,
        sex: formData.sex,
        preferredLanguage: formData.preferredLanguage,
      };

      const res = await updateProfile(payload);
      if (res?.success) {
        // change app language immediately
        i18n.changeLanguage(formData.preferredLanguage || 'en');
        setSuccessMessage(t('Profile updated successfully') || 'Profile updated successfully.');
      } else {
        setErrorMessage(res?.message || t('Failed to update profile') || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage(t('Failed to update profile') || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage(t('Passwords do not match') || 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      // changePassword is exposed via authService; we can hit it through updateProfile
      // or you can wire a dedicated service. For now call window.fetch via backend route.
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(t('Password updated successfully') || 'Password updated successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setErrorMessage(data.message || t('Failed to update password') || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMessage(t('Failed to update password') || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-emerald-300 mb-1 uppercase tracking-wide">
              Profile & Preferences
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-50 tracking-tight">
              {user?.firstName ? `${user.firstName}'s profile` : 'Your profile'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Manage your account details, security and how MediSense AI speaks to you.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Signed in as</span>
            <span className="font-semibold text-emerald-100 truncate max-w-[160px]">
              {user?.email}
            </span>
          </div>
        </header>

        {(successMessage || errorMessage) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              successMessage
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                : 'border-rose-500/60 bg-rose-500/10 text-rose-100'
            }`}
          >
            {successMessage || errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          {/* Profile details */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                  <span>👤</span> Basic information
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Keep your name, age and contact details up to date.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    min="0"
                    value={formData.age}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  >
                    <option value="not_specified">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default language</label>
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleProfileChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    The whole app will use this language when you sign in.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 text-sm font-semibold px-5 py-2.5 hover:bg-emerald-400 transition disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Security & extras */}
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
              <h2 className="text-sm font-semibold text-slate-50 mb-3 flex items-center gap-2">
                <span>🔒</span> Password & security
              </h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Current password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-100/10 text-slate-50 text-xs font-semibold px-4 py-2.5 hover:bg-slate-100/20 border border-slate-600/60 transition disabled:opacity-60"
                >
                  Update password
                </button>
                <p className="text-[11px] text-slate-500 mt-1">
                  We never store your plain password. Make sure it&apos;s unique and hard to guess.
                </p>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100">Session overview</p>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/40">
                  Beta
                </span>
              </div>
              <p>
                We&apos;ll gradually add more controls here – like recent devices, login history and data export options – so you stay in control of your health data.
              </p>
              <p className="text-[11px] text-slate-500">
                For now, if you lose access to your account or spot any suspicious activity, contact support using the email in the footer.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
