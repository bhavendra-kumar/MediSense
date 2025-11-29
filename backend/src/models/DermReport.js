const mongoose = require('mongoose');

const DermReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    bodyPart: {
      type: String,
    },
    userDescription: {
      type: String,
    },
    userLanguage: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'pa', 'gu', 'mr', 'or'],
      default: 'en',
    },
    // AI Analysis Results
    diseaseDetected: {
      name: String,
      confidence: Number, // 0-100
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
      },
    },
    conditions: [
      {
        name: String,
        probability: Number,
        description: String,
      },
    ],
    aiExplanation: {
      type: String,
    },
    careSuggestions: [
      {
        suggestion: String,
        category: {
          type: String,
          enum: ['home-care', 'medication', 'lifestyle', 'when-to-see-doctor'],
        },
      },
    ],
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    recommendedSpecialist: {
      type: String,
    },
    // Doctor Review
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctorNotes: {
      type: String,
    },
    doctorVerification: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('DermReport', DermReportSchema);
