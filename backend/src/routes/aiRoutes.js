const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiCtrl = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');

// Multer setup for speech-to-text audio
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only audio files allowed.'));
    }
    cb(null, true);
  },
});

// ----------- CHAT ----------
router.post('/chat', authMiddleware, aiCtrl.sendMessage);
router.get('/chat/history', authMiddleware, aiCtrl.getHistory);
router.delete('/chat/history', authMiddleware, aiCtrl.clearHistory);

// ----------- HEALTH FEATURES ----------
router.post('/health-report', authMiddleware, aiCtrl.generateHealthReport);
router.post('/summarize', authMiddleware, aiCtrl.summarizeHealthData);
router.get('/health-tips', authMiddleware, aiCtrl.getHealthTips);
router.post('/health-score', authMiddleware, aiCtrl.getHealthScore);

// ----------- VOICE FEATURES ----------
router.post('/stt', authMiddleware, upload.single('audio'), aiCtrl.speechToText);
router.post('/tts', authMiddleware, aiCtrl.textToSpeech);

module.exports = router;
