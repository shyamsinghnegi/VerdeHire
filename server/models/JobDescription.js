const mongoose = require('mongoose');

const jobDescriptionSchema = mongoose.Schema(
  {
    // The user who provided this job description. One of these should be set.
    employeeUser: { // If an employee provided it for personal optimization
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeUser',
      // required: function() { return !this.employerUser; } // uncomment for strict validation
    },
    employerUser: { // If an employer provided it for screening multiple resumes
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployerUser',
      // required: function() { return !this.employeeUser; } // uncomment for strict validation
    },
    title: { // A user-friendly name for the JD (e.g., "Senior Software Engineer JD", "My saved JD for Google")
      type: String,
      required: [true, 'Please add a title for this Job Description'],
      trim: true,
      maxlength: 200,
    },
    originalContent: { // The full text content of the job description as provided by the user
      type: String,
      required: [true, 'Please provide the job description content'],
      minlength: 50,
    },
    // Optional: Fields that could be extracted or manually added for metadata
    companyName: { // Contextual company name if the user provides it (not necessarily linked to an employer user)
        type: String,
        trim: true,
        maxlength: 150,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    extractedSkills: [{ // Skills extracted by NLP from the originalContent
      type: String,
      trim: true,
    }],
    parsedData: { // More comprehensive structured data extracted from the JD by NLP
      type: Object,
      default: {},
    },

    // References to analysis results where this JD was used
    resumeAnalyses: [
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

// Add indexes for faster lookups based on associated user
jobDescriptionSchema.index({ employeeUser: 1 });
jobDescriptionSchema.index({ employerUser: 1 });


module.exports = mongoose.model('JobDescription', jobDescriptionSchema);