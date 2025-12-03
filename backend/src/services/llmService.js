// src/services/llmService.js
const logger = require("../utils/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ---- Load GEMINI API key ----
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.0-pro"
});

// ---- Helper: Generate text safely ----
async function generateTextFromGemini(prompt) {
  try {
    const result = await chatModel.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error("Gemini API Error: " + err.message);
    throw err;
  }
}

// ===================================================================
// 1️⃣ MEDICAL SUMMARY
// ===================================================================
const generateMedicalSummary = async (reportText, language = "en") => {
  try {
    logger.info("Generating medical summary via Gemini");

    const prompt = `
You are a medical AI assistant.
Analyze the following report and return ONLY valid JSON:
{
  "summary": string (in ${language}),
  "keyFindings": Array<{ "finding": string, "severity": "low" | "medium" | "high" }>,
  "abnormalValues": Array<{ "testName": string, "value": string, "interpretation": string }>,
  "recommendedTests": Array<{ "testName": string, "reason": string, "urgency": "routine" | "soon" | "urgent" }>,
  "healthAdvice": string (in ${language})
}

Use language: ${language} for all text fields.

Report:
${reportText}
`;

    const raw = await generateTextFromGemini(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();

    return JSON.parse(clean);
  } catch (err) {
    logger.error("Medical summary error (Gemini): " + err.message);

    return {
      summary: "AI service unavailable. Please try again later.",
      keyFindings: [],
      abnormalValues: [],
      recommendedTests: [],
      healthAdvice: "Consult a doctor for accurate medical guidance.",
    };
  }
};

// ===================================================================
// 2️⃣ CHAT RESPONSE
// ===================================================================
const generateChatResponse = async (
  message,
  conversationHistory = [],
  language = "en"
) => {
  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const historyText = conversationHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const prompt = `
You are Medisense AI — a safe, simple medical assistant.
Respond ONLY in language: ${language}.
Never give a final diagnosis.
Always recommend visiting a doctor if symptoms are serious.

Conversation:
${historyText}

User:
${message}
`;

    const reply = await generateTextFromGemini(prompt);

    return {
      message: reply,
      timestamp: new Date(),
    };
  } catch (err) {
    logger.error("Chat error (Gemini): " + err.message);

    return {
      message:
        "I am having trouble connecting to the medical assistant. Try again later.",
      timestamp: new Date(),
    };
  }
};

// ===================================================================
// 3️⃣ HEALTH SUGGESTIONS
// ===================================================================
const generateHealthSuggestions = async (analysisData, language = "en") => {
  try {
    logger.info("Generating health suggestions via Gemini");

    const prompt = `
You are a health expert.
Return ONLY valid JSON:
{
  "lifestyle": string[],
  "diet": string[],
  "exercise": string[],
  "preventiveMeasures": string[]
}

Respond in: ${language}

Analysis:
${JSON.stringify(analysisData, null, 2)}
`;

    const raw = await generateTextFromGemini(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();

    return JSON.parse(clean);
  } catch (err) {
    logger.error("Health suggestion error: " + err.message);

    return {
      lifestyle: [],
      diet: [],
      exercise: [],
      preventiveMeasures: [],
    };
  }
};

// ===================================================================
// 4️⃣ AI HEALTH SCORE
// ===================================================================
// input: {
//   age?: number,
//   sex?: string,
//   vitals?: {...},
//   labs?: {...},
//   lifestyle?: {...},
//   conditions?: string[],
//   recentFindingsText?: string
// }
const generateHealthScore = async (profile, language = "en") => {
  try {
    logger.info("Generating AI health score via Gemini");

    const prompt = `You are a cautious preventive-medicine assistant.
You are NOT a doctor and must NOT give a final diagnosis.

The user profile is below as JSON:
${JSON.stringify(profile, null, 2)}

Using this information only, estimate an overall wellness score between 0 and 100, where:
- 90-100 = excellent,
- 75-89 = good,
- 60-74 = needs attention,
- 0-59 = high risk / needs medical review.

Return ONLY valid JSON in this exact structure:
{
  "score": number, // 0-100
  "category": "excellent" | "good" | "needs_attention" | "high_risk",
  "shortSummary": string, // 1-2 line explanation in ${language}
  "positiveFactors": string[], // what is helping the score
  "negativeFactors": string[], // what is hurting the score
  "recommendations": string[] // 3-7 simple, actionable, preventive suggestions in ${language}
}

Be realistic but reassuring. Always remind that this is not a medical diagnosis.
Use language: ${language} for all strings.`;

    const raw = await generateTextFromGemini(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // basic sanitization
    const score = Number.isFinite(parsed.score) ? Math.max(0, Math.min(100, parsed.score)) : 60;

    return {
      score,
      category: parsed.category || (score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "needs_attention" : "high_risk"),
      shortSummary: parsed.shortSummary || "AI health score preview. Please consult a doctor for detailed evaluation.",
      positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : [],
      negativeFactors: Array.isArray(parsed.negativeFactors) ? parsed.negativeFactors : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch (err) {
    logger.error("Health score error: " + err.message);
    return {
      score: 60,
      category: "needs_attention",
      shortSummary: "AI health score is unavailable right now. Use this app only for guidance and consult a doctor for real assessment.",
      positiveFactors: [],
      negativeFactors: [],
      recommendations: [],
    };
  }
};

// ===================================================================
// 4️⃣ SKIN ANALYSIS
// ===================================================================
// context: {
//   description: string,
//   bodyPart?: string,
//   imageFinding?: {
//     diseaseDetected?: {...},
//     conditions?: [...]
//   }
// }
const analyzeSkinCondition = async (context, language = "en") => {
  try {
    logger.info("Skin analysis via Gemini");

    const prompt = `
You are a cautious dermatology assistant.
You are NOT a doctor and must NOT give a final diagnosis.
You only provide possible explanations and general advice.

Patient case (JSON):
${JSON.stringify(context, null, 2)}

Based ONLY on this information, return ONLY valid JSON:
{
  "conditions": string[],           // possible skin conditions (short names)
  "severity": "mild" | "moderate" | "severe",
  "careRecommendations": string[],  // plain-language advice, home care, OTC-style options to DISCUSS with a doctor
  "urgentCareNeeded": boolean       // true if they should see a doctor very soon
}

Use language: ${language} for all text.
Always assume this is NOT a confirmed diagnosis.
`;

    const raw = await generateTextFromGemini(prompt);
    const clean = raw.replace(/```json|```/g, "").trim();

    return JSON.parse(clean);
  } catch (err) {
    logger.error("Skin analysis error: " + err.message);

    return {
      conditions: [],
      severity: "unknown",
      careRecommendations: [],
      urgentCareNeeded: false,
    };
  }
};

module.exports = {
  generateMedicalSummary,
  generateChatResponse,
  generateHealthSuggestions,
  generateHealthScore,
  analyzeSkinCondition,
};
