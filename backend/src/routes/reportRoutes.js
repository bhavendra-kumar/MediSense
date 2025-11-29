const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reportCtrl = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Routes
router.post('/upload', authMiddleware, upload.single('file'), reportCtrl.uploadReport);
router.post('/:reportId/ocr', authMiddleware, reportCtrl.performOCR);
router.post('/:reportId/analyze', authMiddleware, reportCtrl.analyzeReport);
router.get('/user/:userId', authMiddleware, reportCtrl.getUserReports);
router.get('/:reportId', authMiddleware, reportCtrl.getReport);
router.delete('/:reportId', authMiddleware, reportCtrl.deleteReport);

module.exports = router;
