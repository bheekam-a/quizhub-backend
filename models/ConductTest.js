const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: {
      validator: (arr) => arr.length === 4,
      message: "Each question must have exactly 4 options",
    },
  },
  correctOptions: {
    type: [String],
    required: true, // e.g. [0,2]
  },
  type: { type: String, enum: ["single", "multiple"], default: "single" },
});

const testSchema = new mongoose.Schema(
  {
    testName: { type: String, required: true },
    conductedBy: { type: String, required: true },
    testDuration: { type: Number, required: true }, // in minutes
    Date: { type: String, required: true }, // "2025-10-08"
    Time: { type: String, required: true }, // "17:00"
    testQuestions: [questionSchema],
    marksPerQuestion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
