const Report = require('../models/Report');
const Analysis = require('../models/Analysis');
const { asyncHandler } = require('../middleware/errorHandler');
const { extractTextFromImage, extractTextFromPDF, extractReportData, detectLanguage } = require('../services/ocrService');
const { generateMedicalSummary, generateHealthSuggestions } = require('../services/llmService');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Upload a medical report (PDF or Image)
 */
exports.uploadReport = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { userLanguage = 'en' } = req.body;

    // Create report entry
    const report = await Report.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      userLanguage,
      processingStatus: 'pending',
    });

    logger.info(`Report uploaded: ${report._id}`);

    return res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      report: {
        id: report._id,
        fileName: report.fileName,
        fileType: report.fileType,
        uploadedAt: report.uploadedAt,
      },
    });
  } catch (error) {
    logger.error(`Report upload error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload report',
      error: error.message,
    });
  }
});

/**
 * Perform OCR on uploaded report
 */
exports.performOCR = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Update status
    report.processingStatus = 'processing';
    await report.save();

    try {
      let ocrResult;
      const filePath = path.join(process.cwd(), report.fileUrl);

      if (report.fileType === 'pdf') {
        ocrResult = await extractTextFromPDF(filePath);
      } else {
        ocrResult = await extractTextFromImage(filePath);
      }

      // Store OCR text
      report.rawOCRText = ocrResult.text;
      report.detectedLanguage = ocrResult.language;
      report.processingStatus = 'completed';
      await report.save();

      // Extract structured report data
      const reportData = extractReportData(ocrResult.text);

      logger.info(`OCR completed for report: ${reportId}`);

      return res.status(200).json({
        success: true,
        message: 'OCR completed successfully',
        data: {
          reportId: report._id,
          text: ocrResult.text.substring(0, 500) + '...', // Return preview
          detectedLanguage: ocrResult.language,
          confidence: ocrResult.confidence || 'N/A',
          extractedData: reportData,
        },
      });
    } catch (ocrError) {
      report.processingStatus = 'failed';
      report.processingError = ocrError.message;
      await report.save();

      throw ocrError;
    }
  } catch (error) {
    logger.error(`OCR error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform OCR',
      error: error.message,
    });
  }
});

/**
 * Analyze report and generate AI insights
 */
exports.analyzeReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    if (!report.rawOCRText) {
      return res.status(400).json({
        success: false,
        message: 'Report must be processed with OCR first',
      });
    }

    try {
      // Generate medical summary
      const summary = await generateMedicalSummary(report.rawOCRText, report.userLanguage);

      // Generate health suggestions
      const suggestions = await generateHealthSuggestions(summary, report.userLanguage);

      // Create analysis records for each test result
      const analyses = [];
      if (summary.abnormalValues && Array.isArray(summary.abnormalValues)) {
        for (const abnormalValue of summary.abnormalValues) {
          const analysis = await Analysis.create({
            reportId: report._id,
            userId: req.user.id,
            testName: abnormalValue.testName || 'Unknown Test',
            testValue: abnormalValue.value,
            status: 'abnormal',
            interpretation: abnormalValue.interpretation || 'Requires review',
            aiSummary: summary.summary,
            keyFindings: summary.keyFindings || [],
            recommendedTests: summary.recommendedTests || [],
          });
          analyses.push(analysis);
        }
      }

      report.isProcessed = true;
      await report.save();

      logger.info(`Report analysis completed: ${reportId}`);

      return res.status(200).json({
        success: true,
        message: 'Report analyzed successfully',
        data: {
          reportId: report._id,
          summary: summary.summary,
          keyFindings: summary.keyFindings || [],
          abnormalValues: summary.abnormalValues || [],
          recommendedTests: summary.recommendedTests || [],
          healthSuggestions: suggestions,
          analyses: analyses.map((a) => ({
            id: a._id,
            testName: a.testName,
            status: a.status,
          })),
        },
      });
    } catch (analysisError) {
      logger.error(`Analysis error: ${analysisError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze report',
        error: analysisError.message,
      });
    }
  } catch (error) {
    logger.error(`Report analysis error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze report',
      error: error.message,
    });
  }
});

/**
 * Get user's reports
 */
exports.getUserReports = asyncHandler(async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate('userId', 'firstName lastName email');

    logger.info(`Retrieved ${reports.length} reports for user: ${req.user.id}`);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    logger.error(`Get reports error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: error.message,
    });
  }
});

/**
 * Get specific report
 */
exports.getReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOne({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Get related analyses
    const analyses = await Analysis.find({ reportId: report._id });

    logger.info(`Retrieved report: ${reportId}`);

    return res.status(200).json({
      success: true,
      report: {
        ...report.toObject(),
        analyses,
      },
    });
  } catch (error) {
    logger.error(`Get report error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report',
      error: error.message,
    });
  }
});

/**
 * Delete report
 */
exports.deleteReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findOneAndDelete({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Delete related analyses
    await Analysis.deleteMany({ reportId: report._id });

    logger.info(`Report deleted: ${reportId}`);

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete report error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message,
    });
  }
});
