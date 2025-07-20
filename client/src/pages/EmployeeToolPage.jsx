// client/src/pages/EmployeeToolPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Keep useNavigate import
import { marked } from 'marked'; // Import the marked library
import '../styles/EmployeeToolPage.css'; // Corrected CSS import path

const EmployeeToolPage = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(''); // Stores the initial analysis text for display
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- New state for chat functionality ---
  const [chatMessages, setChatMessages] = useState([]); // Array of { role: 'user' | 'model', content: string }
  const [currentChatMessage, setCurrentChatMessage] = useState(''); // Text in the chat input box
  const [chatLoading, setLoadingChat] = useState(false); // Loading state for chat messages
  const [rawResumeContent, setRawResumeContent] = useState(''); // Store the parsed resume text for chat context
  // --- End new chat state ---

  const navigate = useNavigate(); // navigate is now explicitly used
  const chatMessagesEndRef = useRef(null); // Ref for auto-scrolling chat history

  // Effect to scroll to the bottom of chat messages whenever they update
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      setResumeFile(file);
      setError(''); // Clear previous errors
      // Clear previous analysis/chat when a new resume is selected
      setAiAnalysis('');
      setChatMessages([]);
      setRawResumeContent(''); // Clear raw content too
    } else {
      setResumeFile(null);
      setError('Please upload a PDF or plain text file for your resume.');
    }
  };

  const handleJDChange = (e) => {
    setJobDescription(e.target.value);
    // Clear previous analysis/chat when JD changes
    setAiAnalysis('');
    setChatMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAiAnalysis('');
    setChatMessages([]); // Clear chat history for a new analysis
    setRawResumeContent(''); // Clear raw content for a new analysis

    if (!resumeFile) {
      setError('Please upload your resume file.');
      setLoading(false);
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please enter the job description.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await axios.post('/api/analyze-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const initialAnalysis = response.data.analysis;
      const parsedResumeText = response.data.parsedResumeText; // This will be sent from backend now

      setAiAnalysis(initialAnalysis);
      setRawResumeContent(parsedResumeText); // Store the parsed resume content for chat context
      // Add initial AI analysis as the first message in chat history
      setChatMessages([{ role: 'model', content: initialAnalysis }]);

    } catch (err) {
      console.error('Error during AI analysis:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to get AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- New Chat Functionality ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentChatMessage.trim()) return; // Don't send empty messages

    // Ensure initial analysis was performed and context is available
    if (!aiAnalysis || !rawResumeContent || !jobDescription) {
        setError('Please perform an initial analysis before starting a chat to provide context.');
        return;
    }

    setLoadingChat(true); // Set chat loading true
    setError(''); // Clear any previous errors

    const newUserMessage = { role: 'user', content: currentChatMessage };
    // Optimistically update chat messages with the user's new message
    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setCurrentChatMessage(''); // Clear the input box immediately

    try {
      // Send the entire conversation history, including initial context, to the backend
      const response = await axios.post('/api/chat-ai', {
        resumeContent: rawResumeContent, // Send the actual raw resume text
        jobDescription: jobDescription,
        conversationHistory: [...chatMessages, newUserMessage] // Send the full history including the new user message
      });

      const aiResponse = response.data.aiResponse;
      // Add the AI's response to the chat history
      setChatMessages((prevMessages) => [...prevMessages, { role: 'model', content: aiResponse }]);

    } catch (err) {
      console.error('Error during AI chat:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Failed to get AI response. Please try again.');
      // If chat fails, you might want to remove the last user message or add a system error message
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { role: 'model', content: 'Sorry, I am unable to respond at the moment. Please try again.' }
      ]);
    } finally {
      setLoadingChat(false); // Set chat loading false
    }
  };
  // --- End New Chat Functionality ---


  return (
    <div className="employee-tool-page-container">
      <div className="employee-tool-card">
        <h1 className="employee-tool-title">Employee AI Tool</h1>
        <p className="employee-tool-description">
          Upload your resume and paste the job description to get AI-powered insights and suggestions.
        </p>

        <form onSubmit={handleSubmit} className="employee-tool-form">
          {/* Resume Upload */}
          <div className="form-group">
            <label htmlFor="resume" className="form-label">
              Upload Your Resume (PDF or TXT)
            </label>
            <input
              type="file"
              id="resume"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="form-input"
            />
            {resumeFile && (
              <p className="file-name-display">Selected file: {resumeFile.name}</p>
            )}
          </div>

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

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${loading ? 'loading-button' : ''} blue-button`}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Get AI Analysis'}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p className="error-title">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* AI Analysis Output & Chat Section */}
        {aiAnalysis && ( // Only show this section if initial analysis exists
          <div className="analysis-output-container"> {/* Wrapper for output & chat */}
            {/* Initial AI Analysis Output */}
            <div className="analysis-output">
              <h2 className="analysis-title">AI Analysis & Suggestions:</h2>
              {/* Render Markdown content */}
              <div className="analysis-content-markdown" dangerouslySetInnerHTML={{ __html: marked.parse(aiAnalysis) }} />
            </div>

            {/* Chat Section */}
            <div className="chat-section">
              <h3 className="chat-title">Chat with AI:</h3>
              <div className="chat-messages-display">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}-message`}>
                    <span className="message-role">{msg.role === 'user' ? 'You:' : 'AI:'}</span>
                    {/* Render Markdown content for chat messages */}
                    <div className="message-content-markdown" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                  </div>
                ))}
                <div ref={chatMessagesEndRef} /> {/* Element for auto-scrolling */}
              </div>

              <form onSubmit={handleChatSubmit} className="chat-input-form">
                <textarea
                  value={currentChatMessage}
                  onChange={(e) => setCurrentChatMessage(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  rows="3" // Adjust rows as needed for default height
                  className="chat-textarea"
                  disabled={chatLoading} // Disable input while AI is thinking
                ></textarea>
                <button
                  type="submit"
                  className={`chat-send-button blue-button ${chatLoading ? 'loading-button' : ''}`}
                  disabled={chatLoading}
                >
                  {chatLoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Changed Link to a button using navigate() to resolve ESLint warning */}
      <button onClick={() => navigate('/')} className="back-button">
        Back to Home
      </button>
    </div>
  );
};

export default EmployeeToolPage;
