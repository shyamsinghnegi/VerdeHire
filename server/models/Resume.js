const mongoose = require('mongoose');

const resumeSchema = mongoose.Schema(
  {
    user: { // Links to the EmployeeUser who owns this resume
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'EmployeeUser',
    },
    title: { // A user-friendly name for this resume version (e.g., "Software Engineer Resume v1")
      type: String,
      required: [true, 'Please add a title for this resume version'],
      trim: true,
      maxlength: 100,
    },
    fileName: { // Original file name
      type: String,
      required: true,
    },
    filePath: { // Path/URL where the file is stored (e.g., S3 URL or local path)
      type: String,
      required: true,
    },
    fileMimeType: { // e.g., "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      type: String,
      required: true,
    },
    fileSize: { // Size in bytes
      type: Number,
      required: true,
    },
    parsedContent: { // Store the extracted text content of the resume
      type: String,
      default: '',
    },
    parsedData: { // Store structured extracted data (skills, experience, education, etc.)
      type: Object,
      default: {},
    },
    isCurrent: { // Flag if this is the user's currently active resume
      type: Boolean,
      default: false,
    },
    // References to analysis results performed on this resume
    analysisResults: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResumeAnalysis', // References the ResumeAnalysis model
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);