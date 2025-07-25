// client/src/pages/EmployerToolPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked'; // For rendering markdown in results
import '../styles/EmployerToolPage.css'; // New CSS file for this page

const EmployerToolPage = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFiles, setResumeFiles] = useState([]); // Array to hold multiple resume files
  const [analysisResults, setAnalysisResults] = useState([]); // Array to hold analysis for each resume
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const resultsRef = useRef(null); // Ref for auto-scrolling to results

  // Effect to scroll to the analysis results whenever they update
  useEffect(() => {
    if (analysisResults.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [analysisResults]);

  const handleJDChange = (e) => {
    setJobDescription(e.target.value);
    setAnalysisResults([]); // Clear previous results when JD changes
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => 
      file.type === 'application/pdf' || file.type === 'text/plain'
    );

    if (validFiles.length > 0) {
      setResumeFiles(validFiles);
      setError('');
      setAnalysisResults([]); // Clear previous results when files change
    } else {
      setResumeFiles([]);
      setError('Please upload only PDF or plain text files for resumes.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysisResults([]);

    if (!jobDescription.trim()) {
      setError('Please enter the job description.');
      setLoading(false);
      return;
    }
    if (resumeFiles.length === 0) {
      setError('Please upload at least one resume file.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    // CRITICAL FIX: Append all files under the same field name 'resumes'
    resumeFiles.forEach((file) => {
      formData.append('resumes', file); 
    });

    try {
      const response = await axios.post('http://localhost:5000/api/employer/analyze-resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResults(response.data.results); 

    } catch (err) {
      console.error('Error during multi-resume analysis:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to get AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employer-tool-page-container">
      <div className="employer-tool-card">
        <h1 className="employer-tool-title">Employer Resume Matcher</h1>
        <p className="employer-tool-description">
          Upload a job description and multiple resumes to get AI-powered compatibility scores and insights.
        </p>

        <form onSubmit={handleSubmit} className="employer-tool-form">
          {/* Job Description Textarea */}
          <div className="form-group">
            <label htmlFor="jobDescription" className="form-label">
              Paste Job Description Here
            </label>
            <textarea
              id="jobDescription"
              rows="10"
              value={jobDescription}
              onChange={handleJDChange}
              placeholder="Paste the full job description here..."
              className="form-textarea"
              required
            ></textarea>
          </div>

          {/* Multiple Resume Upload */}
          <div className="form-group">
            <label htmlFor="resumes" className="form-label">
              Upload Resumes (PDF or TXT, Multiple Files)
            </label>
            <input
              type="file"
              id="resumes"
              accept=".pdf,.txt"
              multiple // Allows multiple file selection
              onChange={handleFileChange}
              className="form-input"
            />
            {resumeFiles.length > 0 && (
              <p className="file-name-display">
                Selected files: {resumeFiles.map(file => file.name).join(', ')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${loading ? 'loading-button' : ''} blue-button`}
            disabled={loading}
          >
            {loading ? 'Analyzing Resumes...' : 'Get Resume Scores'}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p className="error-title">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Analysis Results Output */}
        {analysisResults.length > 0 && (
          <div className="analysis-results-container" ref={resultsRef}>
            <h2 className="results-overall-title">Analysis Results:</h2>
            {analysisResults.map((result, index) => (
              <div key={index} className="resume-result-card">
                <h3 className="resume-result-title">Resume: {result.fileName || `Resume ${index + 1}`}</h3>
                <p className="resume-score">Compatibility Score: <span className="score-value">{result.score || 'N/A'}%</span></p>
                <div className="resume-analysis-content" dangerouslySetInnerHTML={{ __html: marked.parse(result.analysis || 'No analysis provided.') }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
};

export default EmployerToolPage;
