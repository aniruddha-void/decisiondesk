const Decision = require('../models/Decision');
const { analyzeDecision } = require('../services/aiService');

// POST /api/decisions/:id/analyze
const analyzeDecisionById = async (req, res) => {
  try {
    const decision = await Decision.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    const analysis = await analyzeDecision(decision);

    // Persist the result into the Decision document
    decision.aiAnalysis = JSON.stringify(analysis);
    decision.recommendedOption = analysis.recommendation;
    await decision.save();

    res.status(200).json({
      aiAnalysis: analysis,
      recommendedOption: analysis.recommendation,
    });
  } catch (err) {
    // Never expose Gemini key or internal details
    const safeMessages = {
      'GEMINI_API_KEY is not configured': 'AI analysis is not configured on this server.',
      'Gemini API request failed': 'The AI service is unavailable. Please try again later.',
      'AI returned an invalid response format': 'The AI returned an unexpected response. Please try again.',
      'AI response is missing required fields': 'The AI returned an incomplete response. Please try again.',
    };

    const message = safeMessages[err.message] || 'AI analysis failed. Please try again.';
    res.status(500).json({ message });
  }
};

module.exports = { analyzeDecisionById };
