const mongoose = require("mongoose");

const studentInformationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
  },
  marks: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const StudentInformation = mongoose.model("StudentInformation", studentInformationSchema);

module.exports = StudentInformation;
