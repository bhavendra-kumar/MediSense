const axios = require('axios');
const logger = require('../utils/logger');

const MOCK_ML_URL = process.env.MOCK_ML_URL || 'http://localhost:6000';

/**
 * Send image to dermatology AI model
 * In production, this would call the actual ML model API
 */
const analyzeImage = async (imagePath) => {
  try {
    logger.info(`Sending image to dermatology model: ${imagePath}`);

    // For now, return mock response (replace with actual API call)
    // In production, this would send the image to HuggingFace/Roboflow API

    const mockResponse = {
      diseaseDetected: {
        name: 'Sample Condition',
        confidence: 0.85,
        severity: 'moderate',
      },
      conditions: [
        {
          name: 'Condition 1',
          probability: 0.85,
          description: 'Description of condition 1',
        },
        {
          name: 'Condition 2',
          probability: 0.1,
          description: 'Description of condition 2',
        },
      ],
      careSuggestions: [
        {
          suggestion: 'Keep the area clean and dry',
          category: 'home-care',
        },
        {
          suggestion: 'Apply prescribed topical cream twice daily',
          category: 'medication',
        },
        {
          suggestion: 'Avoid scratching or picking',
          category: 'lifestyle',
        },
      ],
      urgencyLevel: 'medium',
      recommendedSpecialist: 'Dermatologist',
    };

    logger.info('Dermatology analysis completed');
    return mockResponse;

    // Production code example (uncomment when API available):
    /*
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${MOCK_ML_URL}/analyze/dermatology`, formData, {
      headers: formData.getHeaders(),
    });

    logger.info('Dermatology API response received');
    return response.data;
    */
  } catch (error) {
    logger.error(`Dermatology analysis error: ${error.message}`);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
};

/**
 * Get care recommendations for a condition
 */
const getCareSuggestions = async (conditionName, language = 'en') => {
  try {
    logger.info(`Getting care suggestions for: ${conditionName}`);

    // Mock care suggestions based on condition
    const careSuggestions = {
      'Acne': {
        'home-care': ['Wash face twice daily with gentle cleanser', 'Use non-comedogenic moisturizer', 'Avoid touching face'],
        'medication': ['Use benzoyl peroxide 2.5%', 'Apply salicylic acid serum', 'Consider oral antibiotics if severe'],
        'lifestyle': ['Avoid greasy foods', 'Manage stress', 'Keep pillowcase clean'],
        'when-to-see-doctor': ['Acne is severe or widespread', 'Home treatments not working after 8 weeks', 'Acne is causing scarring'],
      },
      'Eczema': {
        'home-care': ['Moisturize within 3 minutes of bathing', 'Use fragrance-free products', 'Keep skin hydrated'],
        'medication': ['Use topical corticosteroids', 'Apply calcineurin inhibitors', 'Consider antihistamines for itching'],
        'lifestyle': ['Avoid harsh soaps', 'Use lukewarm water for bathing', 'Manage stress and sleep'],
        'when-to-see-doctor': ['Eczema gets worse or doesn\'t improve', 'Signs of infection', 'Persistent itching affecting sleep'],
      },
      'Psoriasis': {
        'home-care': ['Keep skin moisturized', 'Avoid triggers', 'Get regular sunlight exposure'],
        'medication': ['Use topical corticosteroids', 'Apply vitamin D analogues', 'Consider phototherapy'],
        'lifestyle': ['Manage stress', 'Maintain healthy weight', 'Avoid alcohol and smoking'],
        'when-to-see-doctor': ['Psoriasis worsens', 'New symptoms develop', 'Treatment not effective after 4 weeks'],
      },
    };

    const suggestions = careSuggestions[conditionName] || {
      'home-care': ['Keep the affected area clean and dry', 'Apply prescribed treatments as directed'],
      'medication': ['Follow doctor\'s medication recommendations'],
      'lifestyle': ['Avoid triggers if possible'],
      'when-to-see-doctor': ['If symptoms persist or worsen', 'If new symptoms develop'],
    };

    return suggestions;
  } catch (error) {
    logger.error(`Care suggestions error: ${error.message}`);
    return {
      'home-care': [],
      'medication': [],
      'lifestyle': [],
      'when-to-see-doctor': [],
    };
  }
};

/**
 * Determine urgency level based on condition severity
 */
const determineUrgency = (severity) => {
  const urgencyMap = {
    mild: 'low',
    moderate: 'medium',
    severe: 'high',
    critical: 'critical',
  };

  return urgencyMap[severity] || 'medium';
};

/**
 * Get specialist recommendation
 */
const getSpecialistRecommendation = (conditionName) => {
  try {
    // Map conditions to specialists
    const specialistMap = {
      'Acne': 'Dermatologist',
      'Eczema': 'Dermatologist',
      'Psoriasis': 'Dermatologist',
      'Fungal Infection': 'Dermatologist',
      'Bacterial Infection': 'Dermatologist or Infectious Disease Specialist',
      'Viral Infection': 'Dermatologist or Infectious Disease Specialist',
      'Allergy Related': 'Dermatologist or Allergist',
    };

    return specialistMap[conditionName] || 'General Practitioner';
  } catch (error) {
    logger.error(`Specialist recommendation error: ${error.message}`);
    return 'General Practitioner';
  }
};

module.exports = {
  analyzeImage,
  getCareSuggestions,
  determineUrgency,
  getSpecialistRecommendation,
};
