const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const PDFDocument = require('pdfjs-dist');
const franc = require('franc');
const logger = require('../utils/logger');

// Supported Indian languages
const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn', 'kn', 'ml', 'pa', 'gu', 'mr', 'or'];

/**
 * Detect language from text
 */
const detectLanguage = (text) => {
  try {
    const detected = franc(text);
    // franc returns ISO 639-3 codes, map to our format
    const langMap = {
      eng: 'en',
      hin: 'hi',
      tam: 'ta',
      tel: 'te',
      ben: 'bn',
      kan: 'kn',
      mal: 'ml',
      pan: 'pa',
      guj: 'gu',
      mar: 'mr',
      ory: 'or',
    };

    const mappedLang = langMap[detected] || 'en';
    return SUPPORTED_LANGUAGES.includes(mappedLang) ? mappedLang : 'en';
  } catch (error) {
    logger.error('Language detection error:', error);
    return 'en';
  }
};

/**
 * Extract text from image using OCR
 */
const extractTextFromImage = async (imagePath) => {
  try {
    logger.info(`Starting OCR for image: ${imagePath}`);

    const result = await Tesseract.recognize(imagePath, ['eng', 'hin', 'tam', 'tel', 'ben', 'kan', 'mal', 'pan', 'guj', 'mar', 'ory']);

    const text = result.data.text;
    const confidence = result.data.confidence;

    logger.info(`OCR completed with confidence: ${confidence}`);

    return {
      text,
      confidence,
      language: detectLanguage(text),
    };
  } catch (error) {
    logger.error(`OCR extraction error: ${error.message}`);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Extract text from PDF
 */
const extractTextFromPDF = async (pdfPath) => {
  try {
    logger.info(`Starting PDF text extraction: ${pdfPath}`);

    const pdf = await PDFDocument.getDocument(pdfPath).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    logger.info('PDF text extraction completed');

    return {
      text: fullText,
      pageCount: pdf.numPages,
      language: detectLanguage(fullText),
    };
  } catch (error) {
    logger.error(`PDF extraction error: ${error.message}`);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Preprocess image before OCR for better accuracy
 */
const preprocessImage = async (imagePath, outputPath) => {
  try {
    await sharp(imagePath)
      .grayscale() // Convert to grayscale
      .normalize() // Normalize the image
      .toFile(outputPath);

    logger.info('Image preprocessing completed');
    return outputPath;
  } catch (error) {
    logger.error(`Image preprocessing error: ${error.message}`);
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
};

/**
 * Extract medical report data from OCR text
 */
const extractReportData = (text) => {
  try {
    const reportData = {
      testResults: [],
      anomalies: [],
      observations: [],
    };

    // Simple regex patterns for common test names and values
    const testPatterns = [
      /(?:hemoglobin|hb|hgb)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:blood\s*sugar|glucose|blood\s*glucose)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:rbc|red\s*blood\s*cell)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:wbc|white\s*blood\s*cell)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:platelet)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:cholesterol)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:creatinine)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:sodium|na)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
      /(?:potassium|k)[:\s]*([0-9.]+)\s*([a-z/]+)?/gi,
    ];

    testPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        reportData.testResults.push({
          name: match[0].split(':')[0].trim(),
          value: match[1],
          unit: match[2] || 'unit unknown',
        });
      }
    });

    return reportData;
  } catch (error) {
    logger.error(`Report data extraction error: ${error.message}`);
    return {
      testResults: [],
      anomalies: [],
      observations: [],
    };
  }
};

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  preprocessImage,
  extractReportData,
  detectLanguage,
};
