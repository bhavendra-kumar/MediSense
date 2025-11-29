import api from "./api";

const aiService = {
  // ---- AI Chat ----
  sendMessage: async (message, language) => {
    try {
      const response = await api.post("/ai/chat", { message, language });
      return response.data;
    } catch (err) {
      return { success: false, error: "Failed to send message" };
    }
  },

  getChatHistory: async () => {
    try {
      const response = await api.get("/ai/chat/history");
      return response.data;
    } catch (err) {
      return { success: false, error: "Failed to load chat history" };
    }
  },

  clearChatHistory: async () => {
    try {
      const response = await api.delete("/ai/chat/history");
      return response.data;
    } catch (err) {
      return { success: false, error: "Failed to clear chat history" };
    }
  },

  // ---- Health Report Generation ----
  generateHealthReport: async (analysisData, language) => {
    try {
      const response = await api.post("/ai/health-report", {
        analysisData,
        language,
      });
      return response.data;
    } catch (err) {
      return { success: false, error: "Health report generation failed" };
    }
  },

  summarizeHealthData: async (healthData, language) => {
    try {
      const response = await api.post("/ai/summarize", {
        healthData,
        language,
      });
      return response.data;
    } catch (err) {
      return { success: false, error: "Summary failed" };
    }
  },

  // ---- Health Tips Section ----
  getHealthTips: async (topic, language) => {
    try {
      const response = await api.get("/ai/health-tips", {
        params: { topic, language },
      });
      return response.data;
    } catch (err) {
      return { success: false, error: "Failed to load health tips" };
    }
  },

  // ---- Speech to Text ----
  speechToText: async (audioFile) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await api.post("/ai/stt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (err) {
      return { success: false, error: "Speech-to-text failed" };
    }
  },

  // ---- Text to Speech ----
  textToSpeech: async (text, language) => {
    try {
      const response = await api.post("/ai/tts", {
        text,
        language,
      });
      return response.data;
    } catch (err) {
      return { success: false, error: "Text-to-speech failed" };
    }
  },
};

export default aiService;
