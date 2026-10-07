const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Option name is required'], trim: true },
    description: { type: String, trim: true, default: '' },
    price: { type: Number, default: null },
    pros: { type: [String], default: [] },
    cons: { type: [String], default: [] },
  },
  { _id: true }
);

const decisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 4,
        message: 'A decision must have between 2 and 4 options',
      },
    },
    priorities: { type: [String], default: [] },
    aiAnalysis: { type: String, default: null },
    recommendedOption: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Decision', decisionSchema);
