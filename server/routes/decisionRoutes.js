const express = require('express');
const { createDecision, getDecisions, getDecisionById, deleteDecision } = require('../controllers/decisionController');
const { analyzeDecisionById } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createDecision);
router.get('/', getDecisions);
router.get('/:id', getDecisionById);
router.delete('/:id', deleteDecision);
router.post('/:id/analyze', analyzeDecisionById);

module.exports = router;
