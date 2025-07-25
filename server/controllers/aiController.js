// server/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { processPdf } = require('../utils/pdfProcessor'); // Your existing PDF processing utility
const fs = require('fs').promises; // Using fs.promises for async file operations
const mammoth = require('mammoth'); // Import mammoth for .docx processing

// Access your API key as an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('AI Controller: GEMINI_API_KEY loaded:', GEMINI_API_KEY ? 'Yes (starts with ' + GEMINI_API_KEY.substring(0, 5) + '...)' : 'No');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Use the variable

// For text-only input, use the gemini-pro model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Using gemini-2.0-flash as per your file

// Helper function to safely extract text from file and clean up
const extractTextFromFile = async (file) => {
    if (!file) {
        throw new Error("No file provided.");
    }
    const filePath = file.path;
    const fileType = file.mimetype;

    try {
        if (fileType === 'application/pdf') {
            return await processPdf(filePath); // Use your existing PDF parser
        } else if (fileType === 'text/plain') {
            const textContent = await fs.readFile(filePath, 'utf8');
            return textContent;
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle .docx files using mammoth
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value; // The raw text content
        }
        else {
            throw new Error("Unsupported file type. Please upload a PDF, plain text, or DOCX file.");
        }
    } finally {
        // Clean up the uploaded file from the server's temp directory
        if (filePath) {
            try {
                await fs.access(filePath); // Check if file is accessible (exists)
                await fs.unlink(filePath); // If it exists, then delete it
            } catch (e) {
                // If fs.access throws an error, it means the file doesn't exist
                // or there's a permission issue. Log only if it's not ENOENT.
                if (e.code !== 'ENOENT') {
                    console.error("Error deleting temporary file:", e);
                }
            }
        }
    }
};


// MODIFIED: analyzeResume function - now returns parsedResumeText
const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Resume file is required.' });
        }
        if (!req.body.jobDescription) {
            return res.status(400).json({ message: 'Job description is required.' });
        }

        const resumeContent = await extractTextFromFile(req.file); // Get the parsed text
        const jobDescription = req.body.jobDescription;

        // Construct the initial prompt for Gemini
        const prompt = `You are an AI career assistant. Analyze the provided resume against the given job description.
        Provide a detailed analysis including:
        1.  **Overall Match Percentage:** A numerical percentage indicating the match.
        2.  **Strengths:** Key areas where the resume aligns well with the job description.
        3.  **Areas for Improvement:** Specific skills or experiences from the job description that are missing or weakly represented in the resume.
        4.  **Keyword Gaps:** Important keywords from the job description not found in the resume.
        5.  **Tailoring Suggestions:** Actionable advice on how to tailor the resume to better fit this specific job description.

        ---
        Resume:
        ${resumeContent}

        ---
        Job Description:
        ${jobDescription}
        ---

        Please provide the analysis in a clear, well-formatted text, using bullet points for lists.`;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        // Return both the analysis AND the parsed resume content
        res.status(200).json({ analysis, parsedResumeText: resumeContent });

    } catch (error) {
        console.error('Error in analyzeResume:', error);
        res.status(500).json({ message: 'Error processing resume analysis.', error: error.message });
    }
};


// NEW: analyzeMultipleResumes function for Employer Tool
const analyzeMultipleResumes = async (req, res) => {
    try {
        const jobDescription = req.body.jobDescription;
        if (!jobDescription) {
            return res.status(400).json({ message: 'Job description is required.' });
        }

        const resumeFiles = req.files; // Multer will populate req.files for multiple files
        if (!resumeFiles || resumeFiles.length === 0) {
            return res.status(400).json({ message: 'At least one resume file is required.' });
        }

        const analysisResults = [];

        for (const file of resumeFiles) {
            let parsedResumeText = "";
            let currentAnalysis = "No analysis provided.";
            let currentScore = "N/A";
            let success = false;

            try {
                parsedResumeText = await extractTextFromFile(file);

                if (!parsedResumeText.trim()) {
                    currentAnalysis = "Could not extract text from resume or resume is empty.";
                } else {
                    // Prompt for each resume
                    const prompt = `You are an expert HR recruiter specializing in resume screening. Your task is to evaluate a candidate's resume against a given job description and provide a compatibility score and a brief justification.

                    Provide:
                    1.  **Compatibility Score (0-100):** A single numerical percentage score (e.g., 75) indicating how well this specific resume matches the job description.
                    2.  **Justification/Key Match Points:** A concise explanation (2-3 sentences) of why the resume received that score, highlighting the most relevant matches or significant gaps.

                    Format your response strictly as follows:
                    SCORE: [Numerical Score]%
                    ANALYSIS: [Justification/Key Match Points in Markdown]

                    ---
                    **Job Description:**
                    ${jobDescription}

                    ---
                    **Candidate Resume Text (File: ${file.originalname}):**
                    ${parsedResumeText}
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const aiRawResponse = response.text();

                    // Parse the AI response
                    const scoreLine = aiRawResponse.split('\n').find(line => line.startsWith('SCORE:'));
                    if (scoreLine) {
                        try {
                            currentScore = parseInt(scoreLine.split(':')[1].trim().replace('%', ''));
                            if (isNaN(currentScore)) currentScore = "N/A";
                        } catch (e) {
                            currentScore = "N/A";
                        }
                    }

                    const analysisStartIndex = aiRawResponse.indexOf('ANALYSIS:');
                    if (analysisStartIndex !== -1) {
                        currentAnalysis = aiRawResponse.substring(analysisStartIndex + 'ANALYSIS:'.length).trim();
                    }
                    success = true;
                }
            } catch (fileError) {
                console.error(`Error processing resume ${file.originalname}:`, fileError);
                currentAnalysis = `Failed to process resume: ${fileError.message}`;
                currentScore = "Error";
            } finally {
                // Ensure temporary file is deleted even if processing fails
                // This part is handled by extractTextFromFile's finally block,
                // so no need to duplicate here.
            }

            analysisResults.push({
                fileName: file.originalname,
                score: currentScore,
                analysis: currentAnalysis,
                success: success // Indicate if processing was successful for this resume
            });
        }

        if (analysisResults.length === 0) {
            return res.status(400).json({ message: "No valid resumes were processed." });
        }

        res.status(200).json({ results: analysisResults });

    } catch (error) {
        console.error('Error in analyzeMultipleResumes:', error);
        res.status(500).json({ message: 'Error processing multiple resumes.', error: error.message });
    }
};


// MODIFIED: chatWithAI function for conversational AI - now handles file uploads
const chatWithAI = async (req, res) => {
    try {
        // Receive the full context from the frontend
        const { resumeContent, jobDescription, conversationHistory } = req.body;
        const chatFile = req.file; // Multer makes the uploaded file available here

        // Validate essential context
        if (!jobDescription || !conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
            return res.status(400).json({ message: 'Complete conversation context (JD, chat history) is required.' });
        }

        let currentResumeContent = resumeContent; // Start with the original resume content
        let newResumeAnalysis = null; // To store analysis if a new file is uploaded

        // If a new file is uploaded in chat, process it and update the resume content for the AI
        if (chatFile) {
            try {
                const uploadedFileText = await extractTextFromFile(chatFile);
                currentResumeContent = uploadedFileText; // Use the new resume content for the current turn
                newResumeAnalysis = `New resume uploaded: ${chatFile.originalname}. Analyzing this new resume against the job description.`;
                console.log(newResumeAnalysis); // Log for debugging
            } catch (fileError) {
                console.error('Error processing uploaded chat file:', fileError);
                return res.status(400).json({ message: `Failed to process uploaded file: ${fileError.message}` });
            }
        }

        // Reconstruct the history for the Gemini API call
        const geminiHistory = [];

        // The first "turn" for Gemini should be the initial analysis request and its response.
        // We simulate the user providing the resume and JD as the first 'user' part,
        // and the initial AI analysis as the first 'model' part.
        // This ensures the AI remembers the core context.
        // If a new resume was uploaded, prepend its analysis to the history.
        if (newResumeAnalysis) {
            geminiHistory.push({
                role: 'user',
                parts: [{ text: `A new resume has been provided for analysis. Please consider this new resume for all subsequent analysis and responses. New Resume Content:\n${currentResumeContent}\n\nOriginal Job Description:\n${jobDescription}` }]
            });
            // If the user also sent a text message with the file, include it as the next user turn
            const lastUserMessage = conversationHistory[conversationHistory.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user' && lastUserMessage.content.trim() !== `(File attached: ${chatFile.originalname})`) {
                 geminiHistory.push({
                    role: 'user',
                    parts: [{ text: lastUserMessage.content }]
                });
            }
        } else {
            // If no new file, use the original resume content as the initial context
            if (resumeContent) { // Ensure original resume content is present
                geminiHistory.push({
                    role: 'user',
                    parts: [{ text: `Original Resume for analysis:\n${resumeContent}\n\nOriginal Job Description:\n${jobDescription}` }]
                });
            } else {
                // If no original resume content and no new file, this is an invalid state for chat
                return res.status(400).json({ message: 'No resume context available for chat.' });
            }
        }

        // Add the rest of the conversation history (user questions and AI replies)
        // Start from the beginning if a new file was uploaded and we reconstructed the initial prompt
        // Otherwise, start from the second message as the first was the initial AI analysis
        const startIndex = newResumeAnalysis ? 0 : 1;
        for (let i = startIndex; i < conversationHistory.length; i++) {
            const msg = conversationHistory[i];
            // Skip the simulated file attachment message if a file was actually uploaded
            if (chatFile && msg.content.includes(`(File attached: ${chatFile.originalname})`)) {
                continue;
            }
            geminiHistory.push({
                role: msg.role === 'user' ? 'user' : 'model', // Ensure correct role mapping
                parts: [{ text: msg.content }]
            });
        }

        // Get the latest user message from the conversation history (or the file message if only file was sent)
        let latestUserMessageContent = conversationHistory[conversationHistory.length - 1].content;
        if (chatFile && !latestUserMessageContent.trim()) {
            latestUserMessageContent = `Please analyze the recently uploaded resume (${chatFile.originalname}) against the job description.`;
        } else if (chatFile && latestUserMessageContent.includes(`(File attached: ${chatFile.originalname})`)) {
             // If user only sent the file, use a generic prompt for analysis
            latestUserMessageContent = `Please analyze the recently uploaded resume (${chatFile.originalname}) against the job description.`;
        }


        // Start a new chat session with the reconstructed history
        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 2000, // Increased limit for chat responses
            },
        });

        // Send the latest user message to the chat
        const result = await chat.sendMessage(latestUserMessageContent);
        const response = await result.response;
        const aiResponse = response.text();

        res.status(200).json({ aiResponse });

    } catch (error) {
        console.error('Error in chatWithAI:', error);
        res.status(500).json({ message: 'Error processing AI chat.', error: error.message });
    }
};


module.exports = {
    analyzeResume,
    chatWithAI,
    analyzeMultipleResumes,
};
