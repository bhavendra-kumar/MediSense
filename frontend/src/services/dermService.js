import api from './api';

export const dermService = {
  uploadImage: async (image, bodyPart, userDescription, userLanguage) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('bodyPart', bodyPart);
    formData.append('userDescription', userDescription);
    formData.append('userLanguage', userLanguage);

    const response = await api.post('/derm/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  analyzeImage: async (reportId) => {
    const response = await api.post(`/derm/${reportId}/analyze`);
    return response.data;
  },

  getUserReports: async (userId) => {
    const response = await api.get(`/derm/user/${userId}`);
    return response.data;
  },

  getReport: async (reportId) => {
    const response = await api.get(`/derm/${reportId}`);
    return response.data;
  },

  updateReport: async (reportId, updateData) => {
    const response = await api.put(`/derm/${reportId}`, updateData);
    return response.data;
  },

  deleteReport: async (reportId) => {
    const response = await api.delete(`/derm/${reportId}`);
    return response.data;
  },
};

export default dermService;
