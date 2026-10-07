const Decision = require('../models/Decision');

// POST /api/decisions
const createDecision = async (req, res) => {
  const { title, question, options, priorities } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!question || !question.trim()) {
    return res.status(400).json({ message: 'Question is required' });
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
    return res.status(400).json({ message: 'Provide between 2 and 4 options' });
  }
  for (const opt of options) {
    if (!opt.name || !opt.name.trim()) {
      return res.status(400).json({ message: 'Each option must have a name' });
    }
  }

  try {
    const decision = await Decision.create({
      userId: req.userId,
      title: title.trim(),
      question: question.trim(),
      options,
      priorities: priorities || [],
    });

    res.status(201).json(decision);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create decision' });
  }
};

// GET /api/decisions
const getDecisions = async (req, res) => {
  try {
    const decisions = await Decision.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('title question options priorities createdAt updatedAt');

    res.status(200).json(decisions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch decisions' });
  }
};

// GET /api/decisions/:id
const getDecisionById = async (req, res) => {
  try {
    const decision = await Decision.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    res.status(200).json(decision);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch decision' });
  }
};

// DELETE /api/decisions/:id
const deleteDecision = async (req, res) => {
  try {
    const decision = await Decision.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!decision) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    res.status(200).json({ message: 'Decision deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete decision' });
  }
};

module.exports = { createDecision, getDecisions, getDecisionById, deleteDecision };
