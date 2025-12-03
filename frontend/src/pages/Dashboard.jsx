import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import reportService from '../services/reportService';
import dermService from '../services/dermService';
import aiService from '../services/aiService';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [dermReports, setDermReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthScoreLoading, setHealthScoreLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(null);
  const [healthProfile, setHealthProfile] = useState({
    age: user?.age || '',
    sex: user?.sex || 'not_specified',
    smoker: false,
    exerciseMinutesPerWeek: 150,
    sleepHours: 7,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.id) {
          const [reportRes, dermRes] = await Promise.all([
            reportService.getUserReports(user.id),
            dermService.getUserReports(user.id),
          ]);

          if (reportRes?.success) {
            setReports(reportRes.reports?.slice(0, 5) || []);
          }

          if (dermRes?.success) {
            setDermReports(dermRes.reports?.slice(0, 5) || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const fetchHealthScore = async () => {
    if (!user?.id) return;
    setHealthScoreLoading(true);
    try {
      const language = user?.preferredLanguage || 'en';
      const profile = {
        ...healthProfile,
        recentFindingsText: `Reports: ${reports.length}, Dermatology analyses: ${dermReports.length}`,
      };
      const response = await aiService.getHealthScore(profile, language);
      if (response?.success) {
        setHealthScore(response.data);
      }
    } catch (err) {
      console.error('Failed to get health score:', err);
    } finally {
      setHealthScoreLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero + Health score row */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 items-stretch">
          {/* Hero */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-[0_20px_80px_rgba(15,23,42,0.9)] relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 top-6 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-[11px] font-medium text-emerald-300 w-max">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI assisted · Multilingual
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-1">
                  Good {user?.firstName ? `to see you, ${user.firstName}` : 'to see you again'} 👋
                </h1>
                <p className="text-sm sm:text-base text-slate-400 max-w-xl">
                  This dashboard turns complex medical data into simple language. Upload reports, track your skin, and chat with an AI coach – always with a doctor-first mindset.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <Link
                  to="/reports"
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex flex-col justify-between hover:border-emerald-500/60 hover:bg-slate-900 transition"
                >
                  <span className="text-xs text-slate-400 mb-1">Reports</span>
                  <span className="text-lg font-semibold text-slate-50 flex items-center gap-1">
                    {reports.length}
                    <span className="text-xs font-normal text-slate-400">total</span>
                  </span>
                </Link>
                <Link
                  to="/dermatology"
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex flex-col justify-between hover:border-emerald-500/60 hover:bg-slate-900 transition"
                >
                  <span className="text-xs text-slate-400 mb-1">Skin analyses</span>
                  <span className="text-lg font-semibold text-slate-50 flex items-center gap-1">
                    {dermReports.length}
                    <span className="text-xs font-normal text-slate-400">total</span>
                  </span>
                </Link>
                <Link
                  to="/chat"
                  className="hidden sm:flex rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 flex-col justify-between hover:border-emerald-500/60 hover:bg-slate-900 transition"
                >
                  <span className="text-xs text-slate-400 mb-1">AI coach</span>
                  <span className="text-sm font-semibold text-slate-50 flex items-center gap-1">
                    Ask a health question →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Compact health score card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">AI health score (preview)</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-semibold text-emerald-400">
                    {healthScore ? healthScore.score : '--'}
                    <span className="text-base align-super text-emerald-300">/100</span>
                  </p>
                </div>
                {healthScore && (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                    {healthScore.category.replace('_', ' ')}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-2xl">
                🎯
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              This number is a light wellness estimate based on your profile. It is not a medical diagnosis.
            </p>

            <button
              type="button"
              onClick={fetchHealthScore}
              disabled={healthScoreLoading}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-semibold px-4 py-2 hover:bg-emerald-400 transition disabled:opacity-60"
            >
              {healthScoreLoading ? 'Calculating…' : 'Recalculate score'}
            </button>
          </div>
        </div>

        {/* AI Health Score Details */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="md:w-1/2">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-2 flex items-center gap-2">
                <span>🧠</span> Tune your health preview
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-4 max-w-xl">
                Share a few basics so the AI can give you a gentle, personalised wellness estimate. This never replaces your doctor.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    value={healthProfile.age}
                    onChange={(e) => setHealthProfile((p) => ({ ...p, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/80 rounded-xl text-sm text-slate-50 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                  <select
                    value={healthProfile.sex}
                    onChange={(e) => setHealthProfile((p) => ({ ...p, sex: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/80 rounded-xl text-sm text-slate-50"
                  >
                    <option value="not_specified">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Smoker</label>
                  <select
                    value={healthProfile.smoker ? 'yes' : 'no'}
                    onChange={(e) => setHealthProfile((p) => ({ ...p, smoker: e.target.value === 'yes' }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/80 rounded-xl text-sm text-slate-50"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exercise (min / week)</label>
                  <input
                    type="number"
                    min="0"
                    value={healthProfile.exerciseMinutesPerWeek}
                    onChange={(e) => setHealthProfile((p) => ({ ...p, exerciseMinutesPerWeek: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/80 rounded-xl text-sm text-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sleep (hours / night)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={healthProfile.sleepHours}
                    onChange={(e) => setHealthProfile((p) => ({ ...p, sleepHours: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-700 bg-slate-900/80 rounded-xl text-sm text-slate-50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={fetchHealthScore}
                disabled={healthScoreLoading}
                className="px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400 transition disabled:opacity-60"
              >
                {healthScoreLoading ? 'Calculating…' : 'Calculate Health Score'}
              </button>
            </div>

            <div className="md:w-1/2 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
              {healthScore ? (
                <div>
                  <p className="text-sm text-slate-200 mb-2 font-semibold">
                    Your current AI health score:
                  </p>
                  <p className="text-5xl font-extrabold text-emerald-400 mb-2">
                    {healthScore.score}%
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                    {healthScore.category.replace('_', ' ')}
                  </p>
                  {healthScore.shortSummary && (
                    <p className="text-sm text-slate-200 mb-4 whitespace-pre-line">
                      {healthScore.shortSummary}
                    </p>
                  )}

                  {healthScore.positiveFactors?.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-emerald-300 mb-1">What is helping your score</h3>
                      <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                        {healthScore.positiveFactors.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {healthScore.negativeFactors?.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold text-rose-300 mb-1">What may be hurting your score</h3>
                      <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                        {healthScore.negativeFactors.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {healthScore.recommendations?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-cyan-300 mb-1">Suggested next steps</h3>
                      <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                        {healthScore.recommendations.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No score yet. Fill in your details and tap "Calculate Health Score" to get a preview.
                </p>
              )}

              <p className="mt-4 text-[11px] text-slate-500 leading-snug">
                Disclaimer: This AI health score is only an educational estimate based on limited information.
                It is not a medical diagnosis and cannot replace consultation with a licensed healthcare professional.
              </p>
            </div>
          </div>
        </div>

        {/* Reports & Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Medical Reports */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 flex items-center gap-2">
                <span>📋</span> {t('dashboard.recentReports')}
              </h2>
              <Link to="/reports" className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs sm:text-sm hover:underline">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 border border-slate-800 rounded-2xl bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-900 transition"
                  >
                    <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1">
                      📄 {report.fileName}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      {new Date(report.uploadedAt || report.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      report.processingStatus === 'completed'
                        ? 'badge-success'
                        : report.processingStatus === 'failed'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}>
                      {report.processingStatus === 'completed' && '✓'}
                      {report.processingStatus === 'failed' && '✕'}
                      {report.processingStatus === 'processing' && '⟳'}
                      {report.processingStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">📭 {t('dashboard.noReports')}</p>
                <Link to="/reports" className="text-emerald-400 hover:underline text-xs mt-2 inline-block">
                  Start by uploading a report →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Skin Analysis */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 flex items-center gap-2">
                <span>🔬</span> Skin Analysis
              </h2>
              <Link to="/dermatology" className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs sm:text-sm hover:underline">
                View All →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
              </div>
            ) : dermReports.length > 0 ? (
              <div className="space-y-3">
                {dermReports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 border border-slate-800 rounded-2xl bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-900 transition"
                  >
                    <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1">
                      🔬 {report.diseaseDetected?.name || 'Skin Analysis'}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">
                      {new Date(report.uploadedAt || report.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        report.urgencyLevel === 'low'
                          ? 'badge-success'
                          : report.urgencyLevel === 'medium'
                          ? 'badge-warning'
                          : report.urgencyLevel === 'high' || report.urgencyLevel === 'critical'
                          ? 'badge-danger'
                          : 'badge-info'
                      }`}>
                        {report.urgencyLevel?.toUpperCase()}
                      </span>
                      {report.diseaseDetected?.confidence && (
                        <span className="text-xs text-gray-600 font-medium">
                          Confidence: {(report.diseaseDetected.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">📭 No analyses yet</p>
                <Link to="/dermatology" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Start a skin analysis →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
