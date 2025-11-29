// src/services/reportService.js
import api from './api';

const normalize = (res) => {
  // If backend already returns success boolean, preserve it.
  if (!res) return { success: false, message: 'No response' };
  if (typeof res.success !== 'undefined') return res;
  // Otherwise assume OK
  return { success: true, ...res };
};

const reportService = {
  uploadReport: async (file, userLanguage, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userLanguage', userLanguage);

      const response = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (typeof onProgress === 'function') {
            const percent = ev.total ? Math.round((ev.loaded * 100) / ev.total) : 0;
            onProgress(percent);
          }
        },
      });

      return normalize(response.data);
    } catch (err) {
      console.error('uploadReport error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'Upload error' };
    }
  },

  performOCR: async (reportId) => {
    try {
      const response = await api.post(`/reports/${reportId}/ocr`);
      return normalize(response.data);
    } catch (err) {
      console.error('performOCR error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'OCR error' };
    }
  },

  analyzeReport: async (reportId) => {
    try {
      const response = await api.post(`/reports/${reportId}/analyze`);
      return normalize(response.data);
    } catch (err) {
      console.error('analyzeReport error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'Analyze error' };
    }
  },

  getUserReports: async (userId) => {
    try {
      const response = await api.get(`/reports/user/${userId}`);
      return normalize(response.data);
    } catch (err) {
      console.error('getUserReports error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'Fetch reports error' };
    }
  },

  getReport: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return normalize(response.data);
    } catch (err) {
      console.error('getReport error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'Get report error' };
    }
  },

  deleteReport: async (reportId) => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return normalize(response.data);
    } catch (err) {
      console.error('deleteReport error', err?.response?.data || err.message);
      return { success: false, message: err?.response?.data?.message || err.message || 'Delete error' };
    }
  },
};

export default reportService;
