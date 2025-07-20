const mongoose = require('mongoose');

const resumeAnalysisSchema = mongoose.Schema(
  {
    resume: { // Links to the Resume document that was analyzed
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Resume',
    },
    jobDescription: { // Links to the JobDescription it was analyzed against
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'JobDescription', // References the JobDescription model
    },
    // The user (employee or employer) who initiated or owns this specific analysis result
    // One of these fields should be set.
    employee: { // If an employee initiated the analysis for their resume
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeUser',
        required: function() { return !this.employer; } // Ensure one owner is present
    },
    employer: { // If an employer initiated the analysis (e.g., batch screening)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployerUser',
        required: function() { return !this.employee; } // Ensure one owner is present
    },
    relevanceScore: { // AI-generated score (e.g., 0-100 or 0-1)
      type: Number,
      required: true,
      min: 0,
      max: 100, // Assuming a percentage score
    },
    feedbackSummary: { // A general summary of the AI's feedback
      type: String,
      default: '',
      maxlength: 2000,
    },
    contentSuggestions: [ // Array of suggested additions/removals for the resume
      {
        type: String,
        trim: true,
      },
    ],
    keywordAnalysis: { // Object storing keywords found/missing
      missingKeywords: [{ type: String, trim: true }],
      foundKeywords: [{ type: String, trim: true }],
      // Can add more detailed keyword stats later
    },
    skillGapIdentification: [ // Skills from JD not in resume
      {
        type: String,
        trim: true,
      },
    ],
    granularFeedback: [ // More detailed feedback for specific sections
      {
        section: { type: String, trim: true }, // e.g., "Experience", "Skills", "Summary"
        feedback: { type: String, trim: true }, // Detailed text feedback
      },
    ],
    aiChatHistory: [ // Store the conversation for interactive chat window for this analysis
      {
        role: { type: String, enum: ['user', 'ai'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // For employer side: sophisticated matching criteria, weighted scoring results
    weightedScoreConfig: { // Configuration of weights used if employer customized them
      type: Object, // e.g., { experience: 1.5, skills: 2, education: 0.5 }
      default: null, // Null if no custom weights applied
    },
    extractedResumeSkills: [{ type: String, trim: true }],
    extractedJDSkills: [{ type: String, trim: true }],
    // Status of the analysis job (crucial for asynchronous processing)
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { // If status is 'failed', store the error message
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add an index for faster lookups between resume and JD, and by owner
resumeAnalysisSchema.index({ resume: 1, jobDescription: 1 });
resumeAnalysisSchema.index({ employee: 1 });
resumeAnalysisSchema.index({ employer: 1 });


module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);