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
 model: "gemini-2.0-flash"
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
  "keyFindings": string[],
  "abnormalValues": string[],
  "recommendedTests": string[],
  "healthAdvice": string
}

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
// 4️⃣ SKIN ANALYSIS
// ===================================================================
const analyzeSkinCondition = async (description, language = "en") => {
  try {
    logger.info("Skin analysis via Gemini");

    const prompt = `
User reports a skin issue: "${description}"

Return ONLY JSON:
{
  "conditions": string[],
  "severity": "mild" | "moderate" | "severe",
  "careRecommendations": string[],
  "urgentCareNeeded": boolean
}

Respond in: ${language}
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
  analyzeSkinCondition,
};
