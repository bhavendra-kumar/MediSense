const DermReport = require('../models/DermReport');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeImage, getCareSuggestions, determineUrgency, getSpecialistRecommendation } = require('../services/dermService');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Upload skin image
 */
exports.uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    const { bodyPart = '', userDescription = '', userLanguage = 'en' } = req.body;

    // Create dermatology report entry
    const dermReport = await DermReport.create({
      userId: req.user.id,
      imageUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      bodyPart,
      userDescription,
      userLanguage,
      processingStatus: 'pending',
    });

    logger.info(`Skin image uploaded: ${dermReport._id}`);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      report: {
        id: dermReport._id,
        fileName: dermReport.fileName,
        uploadedAt: dermReport.uploadedAt,
      },
    });
  } catch (error) {
    logger.error(`Image upload error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

/**
 * Analyze skin image
 */
exports.analyzeImage = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const dermReport = await DermReport.findOne({
      _id: reportId,
      userId: req.user.id,
    });

    if (!dermReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Update status
    dermReport.processingStatus = 'processing';
    await dermReport.save();

    try {
      const imagePath = path.join(process.cwd(), dermReport.imageUrl);

      // Call dermatology analysis service
      const analysisResult = await analyzeImage(imagePath);

      // Get care suggestions for detected condition
      const conditionName = analysisResult.diseaseDetected?.name || 'Unknown';
      const careSuggestions = await getCareSuggestions(conditionName, dermReport.userLanguage);

      // Update report with analysis results
      dermReport.diseaseDetected = analysisResult.diseaseDetected;
      dermReport.conditions = analysisResult.conditions;
      dermReport.careSuggestions = Object.entries(careSuggestions).flatMap(([category, suggestions]) =>
        suggestions.map((s) => ({
          suggestion: s,
          category,
        }))
      );
      dermReport.urgencyLevel = determineUrgency(analysisResult.diseaseDetected.severity);
      dermReport.recommendedSpecialist = getSpecialistRecommendation(conditionName);
      dermReport.isProcessed = true;
      dermReport.processingStatus = 'completed';

      await dermReport.save();

      logger.info(`Skin image analysis completed: ${reportId}`);

      return res.status(200).json({
        success: true,
        message: 'Analysis completed successfully',
        data: {
          reportId: dermReport._id,
          diseaseDetected: dermReport.diseaseDetected,
          conditions: dermReport.conditions,
          careSuggestions: dermReport.careSuggestions,
          urgencyLevel: dermReport.urgencyLevel,
          recommendedSpecialist: dermReport.recommendedSpecialist,
        },
      });
    } catch (analysisError) {
      dermReport.processingStatus = 'failed';
      dermReport.processingError = analysisError.message;
      await dermReport.save();

      throw analysisError;
    }
  } catch (error) {
    logger.error(`Image analysis error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze image',
      error: error.message,
    });
  }
});

/**
 * Get user's dermatology reports
 */
exports.getUserReports = asyncHandler(async (req, res) => {
  try {
    const reports = await DermReport.find({ userId: req.user.id }).sort({ createdAt: -1 }).populate('userId', 'firstName lastName email');

    logger.info(`Retrieved ${reports.length} derm reports for user: ${req.user.id}`);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    logger.error(`Get derm reports error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: error.message,
    });
  }
});

/**
 * Get specific dermatology report
 */
exports.getReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await DermReport.findOne({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    logger.info(`Retrieved derm report: ${reportId}`);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error(`Get derm report error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report',
      error: error.message,
    });
  }
});

/**
 * Update dermatology report (doctor notes, verification)
 */
exports.updateReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;
    const { doctorNotes, verification } = req.body;

    // Only doctors can update reports
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update reports',
      });
    }

    const report = await DermReport.findByIdAndUpdate(
      reportId,
      {
        doctorId: req.user.id,
        doctorNotes,
        doctorVerification: verification,
        verifiedAt: verification ? new Date() : null,
      },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    logger.info(`Derm report updated by doctor: ${reportId}`);

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      report,
    });
  } catch (error) {
    logger.error(`Update derm report error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: error.message,
    });
  }
});

/**
 * Delete dermatology report
 */
exports.deleteReport = asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await DermReport.findOneAndDelete({
      _id: reportId,
      userId: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    logger.info(`Derm report deleted: ${reportId}`);

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete derm report error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: error.message,
    });
  }
});
