const { GoogleGenerativeAI } = require('@google/generative-ai');

const buildPrompt = (decision) => {
  const optionLines = decision.options
    .map((opt, i) => {
      const price = opt.price != null ? `$${opt.price}` : 'not specified';
      const pros = opt.pros?.length ? opt.pros.join(', ') : 'none listed';
      const cons = opt.cons?.length ? opt.cons.join(', ') : 'none listed';
      return (
        `Option ${i + 1}: ${opt.name}\n` +
        `  Description: ${opt.description || 'not provided'}\n` +
        `  Price: ${price}\n` +
        `  Pros: ${pros}\n` +
        `  Cons: ${cons}`
      );
    })
    .join('\n\n');

  const priorities =
    decision.priorities?.length ? decision.priorities.join(', ') : 'not specified';

  return `You are a decision-support assistant. Your role is to help users compare options and make informed decisions.

Decision title: ${decision.title}
Decision question: ${decision.question}
User priorities: ${priorities}

Options to compare:
${optionLines}

Instructions:
- Base your analysis ONLY on the information provided above.
- Do not invent facts, prices, or specifications not listed.
- If important information is missing, mention that limitation clearly.
- This is decision support, not professional advice — say so in your summary.
- Be concise and practical.

Respond with ONLY a valid JSON object in exactly this structure (no markdown, no code fences, no extra text):
{
  "recommendation": "name of the single best option based on the user priorities",
  "summary": "2-3 sentence explanation of the recommendation and any key limitations",
  "comparison": [
    {
      "option": "option name",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "priorityAlignment": "one sentence on how well this option matches the user priorities"
    }
  ],
  "reasoning": ["key reason 1", "key reason 2", "key reason 3"],
  "scores": [
    {
      "option": "exact option name matching the option names above",
      "score": 0,
      "priorityScores": [
        {
          "priority": "exact priority name from the user priorities list",
          "score": 0
        }
      ]
    }
  ]
}

Scoring rules:
- Provide one entry in "scores" for EVERY option listed above — no exceptions.
- "score" is an overall 0–100 integer reflecting how well the option satisfies the user's priorities based ONLY on the information provided.
- "priorityScores" contains one entry per user priority, each scored 0–100.
- If a priority cannot be assessed from the provided information, score it 50 and note the limitation in summary.
- Do not invent facts. Base scores solely on the provided pros, cons, description, and price.
- Higher score = better fit for that priority.`;
};

const analyzeDecision = async (decision) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

  const prompt = buildPrompt(decision);

  let rawText;
  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text();
  } catch (err) {
    // Log the real error server-side for debugging; never expose to frontend
    console.error('[aiService] Gemini API error:', err.message);
    throw new Error('Gemini API request failed');
  }

  // Strip markdown code fences if Gemini wraps the JSON anyway
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned an invalid response format');
  }

  // Validate required top-level fields
  if (
    typeof parsed.recommendation !== 'string' ||
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.comparison) ||
    !Array.isArray(parsed.reasoning) ||
    !Array.isArray(parsed.scores)
  ) {
    throw new Error('AI response is missing required fields');
  }

  // Validate and clamp each score to 0–100
  parsed.scores = parsed.scores.map((entry) => ({
    option: String(entry.option || ''),
    score: Math.min(100, Math.max(0, Math.round(Number(entry.score) || 0))),
    priorityScores: Array.isArray(entry.priorityScores)
      ? entry.priorityScores.map((ps) => ({
          priority: String(ps.priority || ''),
          score: Math.min(100, Math.max(0, Math.round(Number(ps.score) || 0))),
        }))
      : [],
  }));

  return parsed;
};

module.exports = { analyzeDecision };
