import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import reportService from '../services/reportService';
import Alert from '../components/Alert';
import LoadingOverlay from '../components/LoadingOverlay';
import { speakText, stopSpeaking } from '../utils/speech';

const POLL_INTERVAL_MS = 2000; // initial poll interval
const POLL_MAX_ATTEMPTS = 25; // 25 * 2s = ~50s maximum polling

const Reports = () => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedReport, setSelectedReport] = useState(null); // full report details for viewing
  const [analyzingId, setAnalyzingId] = useState(null); // id currently being analyzed
  const [errorMsg, setErrorMsg] = useState('');
  const [alertState, setAlertState] = useState({ show: false, type: 'info', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, reportId: null });

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
  };

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
      setErrorMsg(t('Failed to fetch reports'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (user?.id) fetchReports();
  }, [user?.id, fetchReports]);

  // Restore last viewed report from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('medisense:lastSelectedReport');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed._id) {
          setSelectedReport(parsed);
        }
      }
    } catch (e) {
      // ignore JSON / storage errors
      console.warn('Failed to restore last selected report from storage', e);
    }
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreviews((prev) => [
            ...prev,
            { id: `${file.name}-${file.lastModified}-${Math.random()}`, url: event.target.result, type: 'image', name: file.name },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews((prev) => [
          ...prev,
          { id: `${file.name}-${file.lastModified}-${Math.random()}`, url: '', type: 'file', name: file.name },
        ]);
      }
    });
  };

  const handleRemoveFile = (id) => {
    setFilePreviews((prev) => prev.filter((p) => p.id !== id));
    setSelectedFiles((prev) => {
      const remaining = [];
      let removed = false;
      for (let i = 0; i < prev.length; i += 1) {
        const p = filePreviews[i];
        if (!removed && p && p.id === id) {
          removed = true;
          // skip this file
        } else {
          remaining.push(prev[i]);
        }
      }
      return remaining;
    });
  };

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access denied or unavailable:', error);
      showAlert('error', t('Unable to access camera'));
    }
  };

  const handleCloseCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    setVideoStream(null);
    setShowCamera(false);
  };

  const handleCapturePhoto = () => {
    const video = document.getElementById('report-camera-video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `report-camera-${Date.now()}.png`, { type: 'image/png' });

      setSelectedFiles((prev) => [...prev, file]);
      const previewUrl = URL.createObjectURL(blob);
      setFilePreviews((prev) => [
        ...prev,
        { id: `camera-${Date.now()}-${Math.random()}`, url: previewUrl, type: 'image' },
      ]);

      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setShowCamera(false);
    }, 'image/png');
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      showAlert('warning', t('Please select at least one file'));
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setErrorMsg('');

    try {
      let index = 0;
      for (const file of selectedFiles) {
        // eslint-disable-next-line no-await-in-loop
        const response = await reportService.uploadReport(file, language, (percent) => {
          // approximate overall progress per file
          const base = (index / selectedFiles.length) * 100;
          const perFile = percent / selectedFiles.length;
          setUploadProgress(Math.min(100, Math.round(base + perFile)));
        });

        if (!response?.success) {
          console.error('Upload failed server response', response);
          setErrorMsg(response?.message || t('Upload failed. Try again.'));
        }

        index += 1;
      }

      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadProgress(0);
      await fetchReports();
      showAlert('success', t('Report uploaded!'));
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMsg(t('Upload failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

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
      // 1) Ensure OCR is done first
      const ocr = await reportService.performOCR(reportId);
      if (!ocr?.success) {
        setErrorMsg(ocr?.message || t('Failed to process report with OCR'));
        showAlert('error', ocr?.message || t('Failed to process report with OCR'));
        setAnalyzingId(null);
        setLoading(false);
        return;
      }

      // 2) Start analysis now that OCR text exists
      const start = await reportService.analyzeReport(reportId);
      if (!start?.success) {
        setErrorMsg(start?.message || t('Failed to start analysis'));
        setAnalyzingId(null);
        setLoading(false);
        return;
      }

      // 3) Poll status until completed or failed
      const final = await pollAnalysisStatus(reportId);

      // Refresh report list and UI
      await fetchReports();

      if ((final?.processingStatus || final?.status) === 'completed') {
        showAlert('success', t('Analysis completed!'));
      } else {
        showAlert('error', t(('Analysis completed with failure.')));
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || t('Analysis failed. Please try again.'));
      showAlert('error', t('Analysis failed. Please try again.'));
    } finally {
      setAnalyzingId(null);
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!reportId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await reportService.deleteReport(reportId);
      if (response?.success) {
        await fetchReports();
        showAlert('success', t('Report deleted'));
      } else {
        setErrorMsg(response?.message || t('Delete failed. Please try again.'));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMsg(t('Delete failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report) => {
    setErrorMsg('');
    setLoading(true);

    try {
      // If report not yet processed, run OCR first
      const status = report.processingStatus || report.status || 'pending';

      if (status !== 'completed') {
        const ocr = await reportService.performOCR(report._id);
        if (!ocr?.success) {
          setErrorMsg(ocr?.message || t('Failed to process report with OCR'));
          showAlert('error', ocr?.message || t('Failed to process report with OCR'));
          return;
        }
      }

      // Always (re)run analysis to get fresh AI insights
      const analysis = await reportService.analyzeReport(report._id);
      if (!analysis?.success || !analysis.data) {
        setErrorMsg(analysis?.message || t('Failed to analyze report'));
        showAlert('error', analysis?.message || t('Failed to analyze report'));
        return;
      }

      const { summary, keyFindings, abnormalValues, recommendedTests, healthSuggestions, analyses } = analysis.data;

      // Build a view model combining basic report info with AI insights
      const fullReport = {
        ...report,
        summary,
        keyFindings,
        abnormalValues,
        recommendedTests,
        healthSuggestions,
        analyses,
      };

      setSelectedReport(fullReport);

      try {
        localStorage.setItem('medisense:lastSelectedReport', JSON.stringify(fullReport));
      } catch (e) {
        console.warn('Failed to persist last selected report', e);
      }
    } catch (err) {
      console.error('View report failed:', err);
      setErrorMsg(err.message || t('Failed to load report details'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReportDetails = () => {
    if (!selectedReport) return;

    const lines = [];

    lines.push(selectedReport.fileName || t('Report Details'));
    lines.push(new Date(selectedReport.uploadedAt || selectedReport.createdAt).toLocaleString());
    lines.push('');

    if (selectedReport.summary) {
      lines.push(t('AI Medical Summary'));
      lines.push(selectedReport.summary);
      lines.push('');
    }

    if (selectedReport.keyFindings?.length) {
      lines.push(t('Key Findings'));
      selectedReport.keyFindings.forEach((kf) => {
        const text = kf?.finding || kf?.text || '';
        const sev = kf?.severity ? ` (${kf.severity})` : '';
        if (text) lines.push(`• ${text}${sev}`);
      });
      lines.push('');
    }

    if (selectedReport.abnormalValues?.length) {
      lines.push(t('Abnormal Test Values'));
      selectedReport.abnormalValues.forEach((av) => {
        const name = av?.testName || av?.name || t('Test');
        const val = av?.value || '';
        const interp = av?.interpretation ? ` - ${av.interpretation}` : '';
        lines.push(`• ${name}: ${val}${interp}`);
      });
      lines.push('');
    }

    if (selectedReport.recommendedTests?.length) {
      lines.push(t('Recommended Further Tests'));
      selectedReport.recommendedTests.forEach((rt) => {
        const name = rt?.testName || rt?.name || '';
        const reason = rt?.reason ? ` – ${rt.reason}` : '';
        const urg = rt?.urgency ? ` [${rt.urgency}]` : '';
        if (name) lines.push(`• ${name}${reason}${urg}`);
      });
      lines.push('');
    }

    if (selectedReport.healthSuggestions) {
      lines.push(t('Health Suggestions'));
      if (Array.isArray(selectedReport.healthSuggestions)) {
        selectedReport.healthSuggestions.forEach((s) => lines.push(`• ${s}`));
      } else {
        lines.push(String(selectedReport.healthSuggestions));
      }
      lines.push('');
    }

    const textToCopy = lines.join('\n').trim();
    if (!textToCopy) return;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => showAlert('success', t('copied')))
      .catch(() => showAlert('error', t('Failed to copy report details')));
  };

  const handleListenReportDetails = () => {
    if (!selectedReport) return;

    const parts = [];

    if (selectedReport.summary) {
      parts.push(t('AI Medical Summary'));
      parts.push(selectedReport.summary);
    }

    if (selectedReport.keyFindings?.length) {
      parts.push(t('Key Findings'));
      selectedReport.keyFindings.forEach((kf) => {
        const text = kf?.finding || kf?.text || '';
        const sev = kf?.severity ? ` (${kf.severity})` : '';
        if (text) parts.push(`${text}${sev}`);
      });
    }

    if (selectedReport.abnormalValues?.length) {
      parts.push(t('Abnormal Test Values'));
      selectedReport.abnormalValues.forEach((av) => {
        const name = av?.testName || av?.name || t('Test');
        const val = av?.value || '';
        const interp = av?.interpretation ? ` - ${av.interpretation}` : '';
        parts.push(`${name}: ${val}${interp}`);
      });
    }

    if (selectedReport.recommendedTests?.length) {
      parts.push(t('Recommended Further Tests'));
      selectedReport.recommendedTests.forEach((rt) => {
        const name = rt?.testName || rt?.name || '';
        const reason = rt?.reason ? ` – ${rt.reason}` : '';
        const urg = rt?.urgency ? ` [${rt.urgency}]` : '';
        if (name) parts.push(`${name}${reason}${urg}`);
      });
    }

    if (selectedReport.healthSuggestions) {
      parts.push(t('Health Suggestions'));
      if (Array.isArray(selectedReport.healthSuggestions)) {
        selectedReport.healthSuggestions.forEach((s) => parts.push(s));
      } else {
        parts.push(String(selectedReport.healthSuggestions));
      }
    }

    const text = parts.join('\n').trim();
    if (!text) return;

    speakText(text, language);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <LoadingOverlay show={loading} label={t('Please wait...')} />
      <Alert
        type={alertState.type}
        message={alertState.message}
        show={alertState.show}
        autoCloseMs={3200}
        onClose={() => setAlertState((prev) => ({ ...prev, show: false }))}
      />
      {/* Delete confirmation modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 animate-[fadeIn_0.2s_ease-out]">
            <h2 className="text-lg font-semibold text-slate-50 mb-2">
              {t('Confirm Deletion')}
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              {t('Are you sure you want to delete this report?')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, reportId: null })}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deleteConfirm.reportId;
                  setDeleteConfirm({ open: false, reportId: null });
                  handleDelete(id);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/40 transition"
              >
                {t('Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 drop-shadow-[0_0_18px_rgba(34,197,94,0.45)]">
          {t('reports.title') || 'My Reports'}
        </h1>

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-700/70 rounded-xl shadow-lg shadow-red-900/40">
            <p className="text-sm font-medium text-red-100">{errorMsg}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.9)] p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-slate-100">
            {t('Upload Report')}
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            {t('Upload your lab reports or prescriptions and let MediSense AI extract key medical insights for you.')}
          </p>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                {t('Preferred language')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60"
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

            {/* Previews for selected image files */}
            {filePreviews.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mb-2">
                {filePreviews.map((p) => (
                  <div key={p.id} className="relative flex flex-col items-center text-[11px] text-slate-300">
                    {p.type === 'image' ? (
                      <img
                        src={p.url}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-xl shadow-lg shadow-slate-900/70 border border-slate-700/80"
                      />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-inner">
                        📄
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(p.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 text-white text-xs shadow-lg shadow-red-900/60 hover:bg-red-700"
                    >
                      x
                    </button>
                    <span className="mt-1 max-w-[6rem] truncate">
                      {p.name || t('File')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* File Upload */}
            <div className="border border-dashed border-slate-700/80 rounded-3xl p-8 text-center bg-slate-900/60">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-slate-100 font-semibold mb-1">
                  {selectedFiles.length
                    ? `${selectedFiles.length} file(s) selected`
                    : t('Click to select a file')}
                </p>
                <p className="text-slate-400 text-xs">{t('reports.supportedFormats') || 'PDF, JPG, PNG'}</p>
                <p className="text-slate-500 text-xs">{t('reports.maxSize') || 'Max 10 MB'}</p>
              </label>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={showCamera ? handleCloseCamera : handleOpenCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-900/50 hover:from-sky-400 hover:to-indigo-400 transition"
                >
                  {showCamera ? t('Close') : t('Take Photo')}
                </button>
              </div>

              {showCamera && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <video
                    id="report-camera-video"
                    autoPlay
                    playsInline
                    className="w-full max-w-xs rounded-2xl shadow-lg shadow-slate-900/80 border border-slate-700/80"
                    ref={(node) => {
                      if (node && videoStream) {
                        node.srcObject = videoStream;
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition"
                  >
                    {t('Capture Photo')}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFiles.length || loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 shadow-[0_18px_40px_rgba(8,47,73,0.85)] hover:from-emerald-400 hover:via-cyan-400 hover:to-sky-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (t('Analyzing...')) : (t('Upload'))}
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && reports.length === 0 ? (
            <p className="col-span-full text-center text-slate-400 text-sm">{t('Loading...')}</p>
          ) : reports.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 text-sm">
              {t('No reports found')}
            </p>
          ) : (
            reports.map((report) => {
              const status = report.processingStatus || report.status || (report.result && report.result.status) || 'pending';
              const isAnalyzing = analyzingId === report._id;

              return (
                <div
                  key={report._id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-[0_14px_40px_rgba(15,23,42,0.9)] hover:border-emerald-500/60 hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">
                        {report.fileType === 'pdf' ? '📋' : '🖼️'}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                          status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/60'
                            : status === 'processing' || status === 'pending'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-400/60'
                            : status === 'failed'
                            ? 'bg-red-500/10 text-red-300 border-red-400/60'
                            : 'bg-slate-800 text-slate-300 border-slate-600/70'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-100 mb-2 line-clamp-2">
                      {report.fileName || report.fileNameOriginal || report.name}
                    </h3>

                    <p className="text-xs text-slate-400 mb-4">
                      {new Date(report.uploadedAt || report.createdAt).toLocaleString()}
                    </p>

                    <div className="space-y-2">
                      {(status === 'pending' || status === 'processing') && (
                        <button
                          onClick={() => handleAnalyze(report._id)}
                          disabled={isAnalyzing}
                          className="w-full bg-amber-500 text-slate-900 px-4 py-2 rounded-2xl hover:bg-amber-400 transition text-xs font-semibold shadow shadow-amber-900/40"
                        >
                          {isAnalyzing ? (t('Analyzing...')) : (t('Analyze'))}
                        </button>
                      )}

                      {status === 'completed' && (
                        <button
                          onClick={() => handleViewReport(report)}
                          className="w-full bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-500 transition text-xs font-semibold shadow shadow-emerald-900/40"
                        >
                          {t('View Report')}
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirm({ open: true, reportId: report._id })}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-2xl hover:bg-red-500 transition text-xs font-semibold shadow shadow-red-900/50"
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Report Details */}
        {selectedReport && (
          <div className="mt-10 bg-slate-900/80 border border-slate-800/80 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.95)] p-8">
            <div className="flex items-start justify-between mb-4 gap-3">
              <h2 className="text-2xl font-semibold text-slate-100">
                {selectedReport.fileName || t('Report Details')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleListenReportDetails}
                  className="text-xs sm:text-sm px-2 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition flex items-center gap-1"
                >
                  <span role="img" aria-label="listen">
                    🔊
                  </span>
                  {t('Listen')}
                </button>
                <button
                  type="button"
                  onClick={handleCopyReportDetails}
                  className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                >
                  {t('Copy')}
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-xs sm:text-sm px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition flex items-center gap-1"
                >
                  🔇 {t('Stop')}
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    try {
                      localStorage.removeItem('medisense:lastSelectedReport');
                    } catch (e) {
                      // ignore
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  {t('Close')}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              {new Date(selectedReport.uploadedAt || selectedReport.createdAt).toLocaleString()}
            </p>

            {/* Summary */}
            {selectedReport.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {t('AI Medical Summary')}
                </h3>
                <p className="text-sm text-slate-200 whitespace-pre-line">
                  {selectedReport.summary}
                </p>
              </div>
            )}

            {/* Key Findings */}
            {selectedReport.keyFindings && selectedReport.keyFindings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {t('Key Findings')}
                </h3>
                <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                  {selectedReport.keyFindings.map((kf, idx) => (
                    <li key={idx}>
                      {kf?.finding || kf?.text || ''}
                      {kf?.severity ? ` (${kf.severity})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Abnormal Values */}
            {selectedReport.abnormalValues && selectedReport.abnormalValues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {t('Abnormal Test Values')}
                </h3>
                <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                  {selectedReport.abnormalValues.map((av, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">{av?.testName || av?.name || 'Test'}:</span> {av?.value}
                      {av?.interpretation ? ` - ${av.interpretation}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Tests */}
            {selectedReport.recommendedTests && selectedReport.recommendedTests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {t('Recommended Further Tests')}
                </h3>
                <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                  {selectedReport.recommendedTests.map((rt, idx) => (
                    <li key={idx}>
                      {rt?.testName || rt?.name || ''}
                      {rt?.reason ? ` – ${rt.reason}` : ''}
                      {rt?.urgency ? ` [${rt.urgency}]` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyses / Suggestions placeholder */}
            {selectedReport.analyses && selectedReport.analyses.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 text-slate-100">
                  {t('Test Analyses')}
                </h3>
                <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                  {selectedReport.analyses.map((a) => (
                    <li key={a._id || a.id}>
                      <span className="font-semibold">{a.testName}:</span> {a.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-[11px] text-slate-500">
              {t(
                'Disclaimer: These insights are AI-generated and for informational purposes only. Always consult a qualified healthcare professional for diagnosis and treatment.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
