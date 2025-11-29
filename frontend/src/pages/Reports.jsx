import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import reportService from '../services/reportService';

const POLL_INTERVAL_MS = 2000; // initial poll interval
const POLL_MAX_ATTEMPTS = 25; // 25 * 2s = ~50s maximum polling

const Reports = () => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedReport, setSelectedReport] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null); // id currently being analyzed
  const [errorMsg, setErrorMsg] = useState('');

  // fetch reports (memoized)
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // reportService.getUserReports should return { success, reports }
      const response = await reportService.getUserReports(user?.id);
      if (response?.success) {
        setReports(response.reports || []);
      } else {
        console.warn('getUserReports returned unsuccessful response', response);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setErrorMsg(t('reports.fetchFailed') || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (user?.id) fetchReports();
  }, [user?.id, fetchReports]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert(t('reports.selectFile') || 'Please select a file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      const response = await reportService.uploadReport(selectedFile, language, (percent) => {
        // progress callback (0-100)
        setUploadProgress(percent);
      });

      if (response?.success) {
        setSelectedFile(null);
        setUploadProgress(0);
        await fetchReports();
        alert(t('reports.uploadSuccess') || 'Report uploaded successfully!');
      } else {
        console.error('Upload failed server response', response);
        setErrorMsg(response?.message || t('reports.uploadFailed') || 'Upload failed. Try again.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMsg(t('reports.uploadFailed') || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Polling helper: repeatedly GET /api/analysis/:id until status changes
  async function pollAnalysisStatus(reportId) {
    let attempts = 0;
    let interval = POLL_INTERVAL_MS;

    while (attempts < POLL_MAX_ATTEMPTS) {
      attempts += 1;
      try {
        const res = await reportService.getReport(reportId);
        if (!res) throw new Error('No response from status endpoint');

        const r = res.report || res.analysis || res.data;
        // update reports list locally with fresh status if available
        if (r) {
          setReports((prev) => prev.map((p) => (p._id === r._id ? r : p)));
        }

        const status = r?.processingStatus || r?.status || r?.result?.status;
        if (status === 'completed' || status === 'failed') {
          return r;
        }
      } catch (err) {
        console.warn('poll error', err);
        // ignore transient errors and continue
      }

      // sleep
      await new Promise((res) => setTimeout(res, interval));
      // optional small backoff (cap at 8s)
      interval = Math.min(8000, interval + 500);
    }

    throw new Error('Timeout while waiting for analysis to complete');
  }

  const handleAnalyze = async (reportId) => {
    setErrorMsg('');
    setAnalyzingId(reportId);
    setLoading(true);

    try {
      // 1) Tell backend to start analysis for this report
      const start = await reportService.analyzeReport(reportId);
      if (!start?.success) {
        // backend did not accept job
        setErrorMsg(start?.message || t('reports.analyzeFailed') || 'Failed to start analysis');
        setAnalyzingId(null);
        return;
      }

      // 2) Poll status until completed or failed
      const final = await pollAnalysisStatus(reportId);

      // Refresh report list and UI
      await fetchReports();

      if ((final?.processingStatus || final?.status) === 'completed') {
        alert(t('reports.analysisComplete') || 'Analysis completed!');
      } else {
        alert(t('reports.analysisFailed') || 'Analysis completed with failure.');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || t('reports.analysisFailed') || 'Analysis failed. Please try again.');
      alert(t('reports.analysisFailed') || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzingId(null);
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm(t('reports.confirmDelete') || 'Are you sure you want to delete this report?')) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await reportService.deleteReport(reportId);
      if (response?.success) {
        await fetchReports();
        alert(t('reports.deleteSuccess') || 'Report deleted successfully!');
      } else {
        setErrorMsg(response?.message || t('reports.deleteFailed') || 'Delete failed. Please try again.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMsg(t('reports.deleteFailed') || 'Delete failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          {t('reports.title') || 'My Reports'}
        </h1>

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('reports.upload') || 'Upload Report'}</h2>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('auth.preferredLanguage') || 'Preferred language'}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-700 font-semibold mb-2">
                  {selectedFile ? selectedFile.name : t('reports.dropFile') || 'Click to select a file'}
                </p>
                <p className="text-gray-600 text-sm">{t('reports.supportedFormats') || 'PDF, JPG, PNG'}</p>
                <p className="text-gray-600 text-sm">{t('reports.maxSize') || 'Max 10 MB'}</p>
              </label>
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (t('common.loading') || 'Uploading...') : (t('reports.upload') || 'Upload')}
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && reports.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">{t('common.loading') || 'Loading...'}</p>
          ) : reports.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">{t('dashboard.noReports') || 'No reports found'}</p>
          ) : (
            reports.map((report) => {
              const status = report.processingStatus || report.status || (report.result && report.result.status) || 'pending';
              const isAnalyzing = analyzingId === report._id;

              return (
                <div key={report._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">
                        {report.fileType === 'pdf' ? '📋' : '🖼️'}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : status === 'processing' || status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">
                      {report.fileName || report.fileNameOriginal || report.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                      {new Date(report.uploadedAt || report.createdAt).toLocaleString()}
                    </p>

                    <div className="space-y-2">
                      {(status === 'pending' || status === 'processing') && (
                        <button
                          onClick={() => handleAnalyze(report._id)}
                          disabled={isAnalyzing}
                          className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition text-sm"
                        >
                          {isAnalyzing ? (t('reports.analyzing') || 'Analyzing...') : (t('reports.analyze') || 'Analyze')}
                        </button>
                      )}

                      {status === 'completed' && (
                        <button
                          onClick={() => setSelectedReport(report._id)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                        >
                          {t('reports.viewReport') || 'View Report'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(report._id)}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                      >
                        {t('reports.deleteReport') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
