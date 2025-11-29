import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import dermService from '../services/dermService';

const Dermatology = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bodyPart, setBodyPart] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedReport, setSelectedReport] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    try {
      const response = await dermService.uploadImage(
        selectedImage,
        bodyPart,
        description,
        language
      );
      if (response.success) {
        alert('Image uploaded successfully!');
        resetForm();
        fetchReports();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (reportId) => {
    try {
      const response = await dermService.analyzeImage(reportId);
      if (response.success) {
        alert('Analysis completed!');
        fetchReports();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        const response = await dermService.deleteReport(reportId);
        if (response.success) {
          alert('Analysis deleted successfully!');
          fetchReports();
        }
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          {t('dermatology.title')}
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {t('dermatology.uploadSkinImage')}
          </h2>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('auth.preferredLanguage')}
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

            {/* Image Preview */}
            {imagePreview && (
              <div className="flex justify-center mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-64 rounded-lg shadow"
                />
              </div>
            )}

            {/* Image Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleImageSelect}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer block">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-gray-700 font-semibold mb-2">
                  {selectedImage ? selectedImage.name : t('dermatology.uploadSkinImage')}
                </p>
                <p className="text-gray-600 text-sm">JPG or PNG (max 5MB)</p>
              </label>
            </div>

            {/* Body Part Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('dermatology.bodyPart')}
              </label>
              <select
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
              <label className="block text-gray-700 font-semibold mb-2">
                {t('dermatology.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your symptoms..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedImage || loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? t('common.loading') : 'Upload & Analyze'}
            </button>
          </div>
        </div>

        {/* Analysis History */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Analysis History</h2>

          {loading && reports.length === 0 ? (
            <p className="text-center text-gray-600">{t('common.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-600">No analyses yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  {/* Image Preview */}
                  <img
                    src={report.imageUrl}
                    alt="Skin analysis"
                    className="w-full h-48 object-cover"
                  />

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-gray-800">
                        {report.diseaseDetected?.name || 'Pending Analysis'}
                      </h3>
                      {report.diseaseDetected && (
                        <p className="text-sm text-gray-600">
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

                    <p className="text-xs text-gray-600 mb-4">
                      {new Date(report.uploadedAt).toLocaleDateString()}
                    </p>

                    <div className="space-y-2">
                      {report.processingStatus === 'pending' && (
                        <button
                          onClick={() => handleAnalyze(report._id)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                        >
                          {t('dermatology.analyze')}
                        </button>
                      )}

                      {report.processingStatus === 'completed' && (
                        <button
                          onClick={() => setSelectedReport(report._id)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                        >
                          View Details
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(report._id)}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
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
      </div>
    </div>
  );
};

export default Dermatology;
