const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    detectedLanguage: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'pa', 'gu', 'mr', 'or'],
    },
    userLanguage: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'pa', 'gu', 'mr', 'or'],
      default: 'en',
    },
    reportDate: {
      type: Date,
    },
    hospital: {
      type: String,
    },
    doctor: {
      type: String,
    },
    notes: {
      type: String,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
    },
    rawOCRText: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
