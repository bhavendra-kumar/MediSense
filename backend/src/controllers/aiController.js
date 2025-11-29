const { asyncHandler } = require('../middleware/errorHandler');
const {
  generateChatResponse,
  generateHealthSuggestions,
  generateMedicalSummary,
} = require('../services/llmService');
const logger = require('../utils/logger');

// In-memory conversation log (use DB in production)
const conversations = new Map();

/* ---------------------------------------------
   SEND MESSAGE (CHAT)
--------------------------------------------- */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { message, language = 'en' } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be empty',
    });
  }

  const userId = req.user.id;

  // Initialize if not present
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }

  const history = conversations.get(userId);

  // Get AI response
  const aiResponse = await generateChatResponse(message, history, language);

  // Append user + AI messages to history
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: aiResponse.message });

  // Limit history to 20 messages
  if (history.length > 20) {
    conversations.set(userId, history.slice(-20));
  }

  logger.info(`AI chat processed for user: ${userId}`);

  return res.status(200).json({
    success: true,
    data: {
      userMessage: message,
      aiResponse: aiResponse.message,
      timestamp: new Date(),
    },
  });
});

/* ---------------------------------------------
   GET CHAT HISTORY
--------------------------------------------- */
exports.getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const history = conversations.get(userId) || [];

  logger.info(`Chat history retrieved for user: ${userId}`);

  return res.status(200).json({
    success: true,
    count: history.length,
    history,
  });
});

/* ---------------------------------------------
   CLEAR CHAT HISTORY
--------------------------------------------- */
exports.clearHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  conversations.delete(userId);

  logger.info(`Chat history cleared for user: ${userId}`);

  return res.status(200).json({
    success: true,
    message: 'Conversation history cleared',
  });
});

/* ---------------------------------------------
   GENERATE HEALTH REPORT
--------------------------------------------- */
exports.generateHealthReport = asyncHandler(async (req, res) => {
  const { analysisData, language = 'en' } = req.body;

  if (!analysisData) {
    return res.status(400).json({
      success: false,
      message: 'Analysis data is required',
    });
  }

  const suggestions = await generateHealthSuggestions(analysisData, language);

  logger.info(`Health report generated for user: ${req.user.id}`);

  return res.status(200).json({
    success: true,
    data: suggestions,
  });
});

/* ---------------------------------------------
   SUMMARIZE HEALTH DATA
--------------------------------------------- */
exports.summarizeHealthData = asyncHandler(async (req, res) => {
  const { healthData, language = 'en' } = req.body;

  if (!healthData) {
    return res.status(400).json({
      success: false,
      message: 'Health data is required',
    });
  }

  const summary = await generateMedicalSummary(
    JSON.stringify(healthData),
    language
  );

  logger.info(`Health data summarized for user: ${req.user.id}`);

  return res.status(200).json({
    success: true,
    data: summary,
  });
});

/* ---------------------------------------------
   HEALTH TIPS (STATIC)
--------------------------------------------- */
exports.getHealthTips = asyncHandler(async (req, res) => {
  const { topic = 'general' } = req.query;

  const healthTips = {
    general: [
      'Drink at least 8 glasses of water',
      'Sleep 7–9 hours daily',
      'Walk 30 minutes a day',
      'Eat fruits & vegetables',
      'Manage stress through meditation',
    ],
    diabetes: [
      'Monitor sugar regularly',
      'Reduce high-carb foods',
      'Walk after meals',
      'Take prescribed medications',
      'Schedule regular checkups',
    ],
    hypertension: [
      'Reduce salt intake',
      'Avoid oily foods',
      'Exercise daily',
      'Limit alcohol',
      'Check BP regularly',
    ],
    heart_health: [
      'Avoid fried food',
      'Increase fiber-rich food',
      'Walk daily',
      'Reduce stress',
      'Monitor cholesterol',
    ],
  };

  const tips = healthTips[topic] || healthTips.general;

  return res.status(200).json({
    success: true,
    topic,
    tips,
  });
});

/* ---------------------------------------------
   SPEECH TO TEXT (MOCK)
--------------------------------------------- */
exports.speechToText = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No audio file provided',
    });
  }

  // TODO: Replace with Whisper API
  return res.status(200).json({
    success: true,
    data: {
      text: 'Mock transcription of your voice message.',
      confidence: 0.95,
      language: 'en',
    },
  });
});

/* ---------------------------------------------
   TEXT TO SPEECH (MOCK)
--------------------------------------------- */
exports.textToSpeech = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      audioUrl: 'https://example.com/mock-audio.mp3',
      duration: 4.5,
      language: 'en',
    },
  });
});
