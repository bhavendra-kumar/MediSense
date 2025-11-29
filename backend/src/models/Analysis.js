const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testName: {
      type: String,
    },
    testValue: {
      type: String,
    },
    unit: {
      type: String,
    },
    normalRange: {
      min: Number,
      max: Number,
    },
    status: {
      type: String,
      enum: ['normal', 'abnormal', 'critical'],
    },
    interpretation: {
      type: String,
    },
    aiSummary: {
      type: String,
    },
    keyFindings: [
      {
        finding: String,
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
        },
      },
    ],
    recommendedTests: [
      {
        testName: String,
        reason: String,
        urgency: {
          type: String,
          enum: ['routine', 'soon', 'urgent'],
        },
      },
    ],
    doctorNotes: {
      type: String,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', AnalysisSchema);
