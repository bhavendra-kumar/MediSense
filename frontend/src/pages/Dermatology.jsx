import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import dermService from '../services/dermService';
import Alert from '../components/Alert';
import LoadingOverlay from '../components/LoadingOverlay';
import { speakText, stopSpeaking } from '../utils/speech';

const Dermatology = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [bodyPart, setBodyPart] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedReport, setSelectedReport] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [alertState, setAlertState] = useState({ show: false, type: 'info', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, reportId: null });

  const showAlert = (type, message) => {
    setAlertState({ show: true, type, message });
  };

  useEffect(() => {
    fetchReports();
  }, [user?.id]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await dermService.getUserReports(user.id);
      if (response.success) {
        setReports(response.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSelectedImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [
          ...prev,
          { id: `${file.name}-${file.lastModified}-${Math.random()}`, url: event.target.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id) => {
    setImagePreviews((prev) => prev.filter((p) => p.id !== id));
    setSelectedImages((prev) => prev.filter((_, index) => imagePreviews[index]?.id !== id));
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
    const video = document.getElementById('derm-camera-video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-shot-${Date.now()}.png`, { type: 'image/png' });

      setSelectedImages((prev) => [...prev, file]);
      const previewUrl = URL.createObjectURL(blob);
      setImagePreviews((prev) => [...prev, { id: `camera-${Date.now()}-${Math.random()}`, url: previewUrl }]);

      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setShowCamera(false);
    }, 'image/png');
  };

  const handleUpload = async () => {
    if (!selectedImages.length) {
      showAlert('warning', 'Please select at least one image');
      return;
    }

    setLoading(true);
    try {
      for (const img of selectedImages) {
        // eslint-disable-next-line no-await-in-loop
        const response = await dermService.uploadImage(
          img,
          bodyPart,
          description,
          language
        );
        if (!response.success) {
          showAlert('error', 'One of the images failed to upload.');
        }
      }
      showAlert('success', 'Images uploaded successfully!');
      resetForm();
      fetchReports();
    } catch (error) {
      console.error('Upload failed:', error);
      showAlert('error', 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (reportId) => {
    try {
      const response = await dermService.analyzeImage(reportId);
      if (response.success) {
        showAlert('success', 'Analysis completed!');
        fetchReports();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      showAlert('error', 'Analysis failed. Please try again.');
    }
  };

  const handleViewDetails = async (reportId) => {
    try {
      setLoading(true);
      const response = await dermService.getReport(reportId);
      if (response.success && response.report) {
        setSelectedReport(response.report);
      } else {
        showAlert('error', 'Failed to load report details.');
      }
    } catch (error) {
      console.error('Failed to load report details:', error);
      showAlert('error', 'Failed to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!reportId) return;
    setLoading(true);
    try {
      const response = await dermService.deleteReport(reportId);
      if (response.success) {
        showAlert('success', 'Analysis deleted successfully!');
        fetchReports();
      } else {
        showAlert('error', 'Delete failed. Please try again.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showAlert('error', 'Delete failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setBodyPart('');
    setDescription('');
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyAdvice = async () => {
    if (!selectedReport) return;

    try {
      const lines = [];

      if (selectedReport.diseaseDetected?.name) {
        lines.push(`Main finding: ${selectedReport.diseaseDetected.name}`);
      }

      if (selectedReport.skinAI) {
        if (selectedReport.skinAI.conditions && selectedReport.skinAI.conditions.length > 0) {
          lines.push(`Possible issues: ${selectedReport.skinAI.conditions.join(', ')}`);
        }
        if (selectedReport.skinAI.severity) {
          lines.push(`Severity: ${selectedReport.skinAI.severity}`);
        }
        if (selectedReport.skinAI.careRecommendations && selectedReport.skinAI.careRecommendations.length > 0) {
          lines.push('Advice / what you can do:');
          selectedReport.skinAI.careRecommendations.forEach((item, idx) => {
            lines.push(`- ${item}`);
          });
        }
        if (selectedReport.skinAI.urgentCareNeeded) {
          lines.push('IMPORTANT: This may need urgent medical attention. Please consult a doctor as soon as possible.');
        }
      }

      if (selectedReport.careSuggestions && selectedReport.careSuggestions.length > 0) {
        const byCategory = {
          'home-care': 'Home care',
          medication: 'Medicines / treatment',
          lifestyle: 'Lifestyle and habits',
          'when-to-see-doctor': 'When to see a doctor',
        };

        Object.keys(byCategory).forEach((catKey) => {
          const items = selectedReport.careSuggestions.filter((c) => c.category === catKey);
          if (!items.length) return;
          lines.push(`${byCategory[catKey]}:`);
          items.forEach((item) => {
            lines.push(`- ${item.suggestion}`);
          });
        });
      }

      if (selectedReport.urgencyLevel) {
        lines.push(`Urgency: ${selectedReport.urgencyLevel}`);
      }
      if (selectedReport.recommendedSpecialist) {
        lines.push(`Recommended specialist: ${selectedReport.recommendedSpecialist}`);
      }

      if (!lines.length) {
        showAlert('warning', 'No advice available to copy yet.');
        return;
      }

      const text = lines.join('\n');
      await navigator.clipboard.writeText(text);
      showAlert('success', 'Advice copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy advice:', error);
      showAlert('error', 'Failed to copy advice.');
    }
  };

  const handleListenAdvice = () => {
    if (!selectedReport) return;

    const parts = [];

    if (selectedReport.diseaseDetected?.name) {
      parts.push(`Main finding: ${selectedReport.diseaseDetected.name}`);
    }

    if (selectedReport.skinAI) {
      if (selectedReport.skinAI.conditions && selectedReport.skinAI.conditions.length > 0) {
        parts.push(`Possible issues: ${selectedReport.skinAI.conditions.join(', ')}`);
      }
      if (selectedReport.skinAI.severity) {
        parts.push(`Severity: ${selectedReport.skinAI.severity}`);
      }
      if (selectedReport.skinAI.careRecommendations && selectedReport.skinAI.careRecommendations.length > 0) {
        parts.push('Why it may have occurred / what you can do:');
        selectedReport.skinAI.careRecommendations.forEach((item) => {
          parts.push(item);
        });
      }
      if (selectedReport.skinAI.urgentCareNeeded) {
        parts.push('This condition may need urgent medical attention. Please consult a doctor as soon as possible.');
      }
    }

    if (selectedReport.careSuggestions && selectedReport.careSuggestions.length > 0) {
      const byCategory = {
        'home-care': 'Home care',
        medication: 'Medicines or treatment',
        lifestyle: 'Lifestyle and habits',
        'when-to-see-doctor': 'When to see a doctor',
      };

      Object.keys(byCategory).forEach((catKey) => {
        const items = selectedReport.careSuggestions.filter((c) => c.category === catKey);
        if (!items.length) return;
        parts.push(byCategory[catKey]);
        items.forEach((item) => {
          parts.push(item.suggestion);
        });
      });
    }

    const text = parts.join('\n').trim();
    if (!text) return;

    speakText(text, language);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <LoadingOverlay show={loading} label={t('Please wait, processing your skin analysis...')} />
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
              {t('Are you sure you want to delete this analysis?')}
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
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 drop-shadow-[0_0_18px_rgba(34,197,94,0.45)]">
          {t('dermatology.title')}
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-2xl">
          {t('Upload clear skin photos and let MediSense AI suggest possible conditions and care steps. This does not replace a real dermatologist.')}
        </p>

        {/* Upload Section */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.9)] p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-slate-100">
            {t('dermatology.uploadSkinImage')}
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            {t('Take a close, well-lit photo of the affected area to get the best AI guidance.')}
          </p>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                {t('auth.preferredLanguage')}
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

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mb-4">
                {imagePreviews.map((p) => (
                  <div key={p.id} className="relative">
                    <img
                      src={p.url}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl shadow-lg shadow-slate-900/80 border border-slate-700/80"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(p.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 text-white text-xs shadow-lg shadow-red-900/60 hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Image Upload */}
            <div className="border border-dashed border-slate-700/80 rounded-3xl p-8 text-center bg-slate-900/60">
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer block">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-slate-100 font-semibold mb-1">
                  {selectedImages.length
                    ? `${selectedImages.length} image(s) selected`
                    : t('dermatology.uploadSkinImage')}
                </p>
                <p className="text-slate-400 text-xs">JPG or PNG (max 5MB)</p>
              </label>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={showCamera ? handleCloseCamera : handleOpenCamera}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-900/50 hover:from-sky-400 hover:to-indigo-400 transition"
                >
                  {showCamera ? t('Close Camera') : t('Take Photo with Camera')}
                </button>
              </div>

              {showCamera && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <video
                    id="derm-camera-video"
                    autoPlay
                    playsInline
                    className="w-full max-w-xs rounded-2xl shadow-lg shadow-slate-900/80 border border-slate-700/80"
                    ref={(node) => {
                      if (node && videoStream) {
                        // eslint-disable-next-line no-param-reassign
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

            {/* Body Part Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                {t('dermatology.bodyPart')}
              </label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60">
                <option value="">Select body part...</option>
                <option value="face">Face</option>
                <option value="arm">Arm</option>
                <option value="leg">Leg</option>
                <option value="back">Back</option>
                <option value="chest">Chest</option>
                <option value="hand">Hand</option>
                <option value="foot">Foot</option>
                <option value="neck">Neck</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 tracking-wide">
                {t('dermatology.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your symptoms..."
                rows="4"
                className="w-full px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm shadow-inner placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedImages.length || loading}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 shadow-[0_18px_40px_rgba(8,47,73,0.85)] hover:from-emerald-400 hover:via-cyan-400 hover:to-sky-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : 'Upload & Analyze'}
            </button>
          </div>
        </div>

        {/* Analysis History */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-slate-100">Analysis History</h2>

          {loading && reports.length === 0 ? (
            <p className="text-center text-slate-400 text-sm">{t('common.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-slate-500 text-sm">No analyses yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-3xl shadow-[0_14px_40px_rgba(15,23,42,0.9)] hover:border-emerald-500/60 hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition overflow-hidden">

                  {/* Image Preview */}
                  <img
                    src={report.imageUrl}
                    alt="Skin analysis"
                    className="w-full h-48 object-cover"/>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg text-slate-100">
                        {report.diseaseDetected?.name || 'Pending Analysis'}
                      </h3>
                      {report.diseaseDetected && (
                        <p className="text-sm text-slate-300">
                          Confidence:{' '}
                          <span className="font-semibold">
                            {Math.round(report.diseaseDetected.confidence * 100)}%
                          </span>
                        </p>
                      )}
                    </div>

                    {report.diseaseDetected && (
                      <div className="mb-4 space-y-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(
                            report.urgencyLevel
                          )}`}
                        >
                          {report.urgencyLevel}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mb-4">
                      {new Date(report.uploadedAt).toLocaleDateString()}
                    </p>

                    <div className="space-y-2">
                      {report.processingStatus === 'pending' && (
                        <button
                          onClick={() => handleAnalyze(report._id)}
                          className="w-full bg-sky-500 text-slate-900 px-4 py-2 rounded-2xl hover:bg-sky-400 transition text-xs font-semibold shadow shadow-sky-900/40">
                          {t('dermatology.analyze')}
                        </button>
                      )}

                      {report.processingStatus === 'completed' && (
                        <button
                          onClick={() => handleViewDetails(report._id)}
                          className="w-full bg-emerald-600 text-white px-4 py-2 rounded-2xl hover:bg-emerald-500 transition text-xs font-semibold shadow shadow-emerald-900/40"
                        >
                          View Details
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirm({ open: true, reportId: report._id })}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-2xl hover:bg-red-500 transition text-xs font-semibold shadow shadow-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedReport && (
          <div className="mt-10 bg-slate-900/80 border border-slate-800/80 rounded-3xl shadow-[0_18px_60px_rgba(15,23,42,0.95)] p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100">Skin Analysis Details</h2>
                <p className="text-xs text-slate-400 mt-1">You can copy this advice and share it with your doctor.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleListenAdvice}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 border border-emerald-400/60 transition flex items-center gap-1"
                >
                  <span role="img" aria-label="listen">
                    🔊
                  </span>
                  Listen
                </button>
                <button
                  type="button"
                  onClick={handleCopyAdvice}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-900 text-xs font-semibold hover:bg-sky-400 transition shadow shadow-sky-900/40"
                >
                  Copy Advice
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 border border-slate-600 transition flex items-center gap-1"
                >
                  🔇 Stop
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="text-sm text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Main condition and severity */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-100">
                {selectedReport.diseaseDetected?.name || 'Analysis Result'}
              </h3>
              {selectedReport.diseaseDetected && (
                <p className="text-sm text-slate-300 mt-1">
                  Confidence:{' '}
                  <span className="font-semibold">
                    {Math.round((selectedReport.diseaseDetected.confidence || 0) * 100)}%
                  </span>
                  {selectedReport.diseaseDetected.severity && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 text-xs font-medium border border-orange-400/70">
                      {selectedReport.diseaseDetected.severity}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Possible conditions */}
            {selectedReport.conditions && selectedReport.conditions.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-slate-100 mb-2">Possible conditions</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                  {selectedReport.conditions.map((c, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{c.name}</span>
                      {typeof c.probability === 'number' && (
                        <span className="ml-1 text-gray-500">
                          ({Math.round(c.probability * 100)}%)
                        </span>
                      )}
                      {c.description && (
                        <span className="ml-1 text-gray-600">- {c.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LLM skin analysis */}
            {selectedReport.skinAI && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-slate-100 mb-2">Explanation</h4>
                {selectedReport.skinAI.conditions && selectedReport.skinAI.conditions.length > 0 && (
                  <p className="text-sm text-slate-200 mb-2">
                    Possible issues:{' '}
                    <span className="font-medium">
                      {selectedReport.skinAI.conditions.join(', ')}
                    </span>
                  </p>
                )}
                {selectedReport.skinAI.severity && (
                  <p className="text-sm text-slate-200 mb-2">
                    Severity level: <span className="font-medium">{selectedReport.skinAI.severity}</span>
                  </p>
                )}
                {selectedReport.skinAI.careRecommendations &&
                  selectedReport.skinAI.careRecommendations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-slate-100 mb-1">
                        Why it may have occurred / what you can do:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                        {selectedReport.skinAI.careRecommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {selectedReport.skinAI.urgentCareNeeded && (
                  <p className="mt-3 text-sm text-red-300 font-semibold">
                    This condition may need urgent medical attention. Please consult a doctor as soon as possible.
                  </p>
                )}
              </div>
            )}

            {/* Care suggestions by category */}
            {selectedReport.careSuggestions && selectedReport.careSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {['home-care', 'medication', 'lifestyle', 'when-to-see-doctor'].map((categoryKey) => {
                  const items = selectedReport.careSuggestions.filter(
                    (c) => c.category === categoryKey
                  );
                  if (!items.length) return null;

                  const titleMap = {
                    'home-care': 'Home care',
                    medication: 'Medicines / treatment',
                    lifestyle: 'Lifestyle and habits',
                    'when-to-see-doctor': 'When to see a doctor',
                  };

                  return (
                    <div key={categoryKey} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/80">
                      <h4 className="text-sm font-semibold text-slate-100 mb-2">
                        {titleMap[categoryKey]}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-200">
                        {items.map((item, idx) => (
                          <li key={idx}>{item.suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Urgency and specialist */}
            <div className="flex flex-wrap gap-3 items-center mt-2">
              {selectedReport.urgencyLevel && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(selectedReport.urgencyLevel)}`}>
                  Urgency: {selectedReport.urgencyLevel}
                </span>
              )}

            </div>

            {/* Safety disclaimer */}
            <p className="mt-4 text-[11px] text-slate-500 leading-snug">
              Disclaimer: This analysis is generated by an AI system and may be inaccurate or incomplete.
              Do not use it as a final diagnosis or as a substitute for professional medical advice.
              Always consult a qualified doctor before starting, changing, or stopping any treatment or medicine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dermatology;
