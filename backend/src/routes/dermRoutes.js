const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const dermCtrl = require('../controllers/dermController');
const { authMiddleware, doctorOnly } = require('../middleware/auth');

// Configure multer for image uploads
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
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.post('/upload', authMiddleware, upload.single('image'), dermCtrl.uploadImage);
router.post('/:reportId/analyze', authMiddleware, dermCtrl.analyzeImage);
router.get('/user/:userId', authMiddleware, dermCtrl.getUserReports);
router.get('/:reportId', authMiddleware, dermCtrl.getReport);
router.put('/:reportId', authMiddleware, doctorOnly, dermCtrl.updateReport);
router.delete('/:reportId', authMiddleware, dermCtrl.deleteReport);

module.exports = router;
