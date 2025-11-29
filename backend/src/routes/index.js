const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const reportRoutes = require('./reportRoutes');
const dermRoutes = require('./dermRoutes');
const aiRoutes = require('./aiRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/derm', dermRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

module.exports = router;
