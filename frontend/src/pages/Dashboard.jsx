import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import reportService from '../services/reportService';
import dermService from '../services/dermService';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [dermReports, setDermReports] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const quickActions = [
    { icon: '📋', title: 'Medical Reports', desc: 'Upload & analyze', to: '/reports', color: 'from-blue-500 to-cyan-500' },
    { icon: '🔬', title: 'Skin Analysis', desc: 'Check skin health', to: '/dermatology', color: 'from-purple-500 to-pink-500' },
    { icon: '💬', title: 'AI Chat', desc: 'Ask health questions', to: '/chat', color: 'from-green-500 to-teal-500' },
    { icon: '⚙️', title: 'Settings', desc: 'Manage profile', to: '/profile', color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="flex-1 gradient-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Hero Section */}
        <div className="mb-12 slide-up">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-2xl shadow-2xl p-8 sm:p-12 overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 text-8xl opacity-10">🏥</div>
            <div className="absolute bottom-0 left-0 text-6xl opacity-10">✨</div>

            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                Welcome, <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">{user?.firstName}! 👋</span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl">
                Your personalized health dashboard • Monitor your wellness journey with AI-powered insights
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group card overflow-hidden hover:-translate-y-2"
              >
                <div className={`bg-gradient-to-br ${action.color} p-6 text-white group-hover:shadow-lg transition`}>
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition">{action.icon}</div>
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.desc}</p>
                </div>
                <div className="p-4 bg-gray-50 group-hover:bg-gray-100 transition flex items-center justify-between">
                  <span className="text-gray-600 font-medium text-sm">Open</span>
                  <span className="text-lg group-hover:translate-x-1 transition">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-600 text-sm mb-2">Total Reports</p>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-3">🔬</div>
            <p className="text-gray-600 text-sm mb-2">Skin Analyses</p>
            <p className="text-3xl font-bold text-purple-600">{dermReports.length}</p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-600 text-sm mb-2">Health Score</p>
            <p className="text-3xl font-bold text-green-600">85%</p>
          </div>
        </div>

        {/* Reports & Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Medical Reports */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>📋</span> {t('dashboard.recentReports')}
              </h2>
              <Link to="/reports" className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline">
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
                    className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-semibold text-gray-800 mb-1">
                      📄 {report.fileName}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
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
                <p className="text-gray-600 text-lg">📭 {t('dashboard.noReports')}</p>
                <Link to="/reports" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Start by uploading a report →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Skin Analysis */}
          <div className="card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span>🔬</span> Skin Analysis
              </h2>
              <Link to="/dermatology" className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline">
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
                    className="p-4 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-semibold text-gray-800 mb-1">
                      🔬 {report.diseaseDetected?.name || 'Skin Analysis'}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
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
