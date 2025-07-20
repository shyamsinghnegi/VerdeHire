// server/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { processPdf } = require('../utils/pdfProcessor'); // Your existing PDF processing utility
const fs = require('fs').promises; // Using fs.promises for async file operations

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// For text-only input, use the gemini-pro model
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
        } else {
            throw new Error("Unsupported file type. Please upload a PDF or plain text file.");
        }
    } finally {
        // Clean up the uploaded file from the server's temp directory
        if (filePath) {
            await fs.unlink(filePath).catch(e => console.error("Error deleting temporary file:", e));
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
        res.status(200).json({ analysis, parsedResumeText: resumeContent }); // <--- ADDED parsedResumeText to response

    } catch (error) {
        console.error('Error in analyzeResume:', error);
        res.status(500).json({ message: 'Error processing resume analysis.', error: error.message });
    }
};


// NEW: chatWithAI function for conversational AI
const chatWithAI = async (req, res) => {
    try {
        // Receive the full context from the frontend
        const { resumeContent, jobDescription, conversationHistory } = req.body;

        if (!resumeContent || !jobDescription || !conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
            return res.status(400).json({ message: 'Complete conversation context (resume, JD, chat history) is required.' });
        }

        // Reconstruct the history for the Gemini API call
        // The Gemini API's `history` expects an array of { role: 'user' | 'model', parts: [{ text: '...' }] }
        const geminiHistory = [];

        // The first "turn" for Gemini should be the initial analysis request and its response.
        // We simulate the user providing the resume and JD as the first 'user' part,
        // and the initial AI analysis as the first 'model' part.
        // This ensures the AI remembers the core context.
        geminiHistory.push({
            role: 'user',
            parts: [{ text: `Original Resume for analysis:\n${resumeContent}\n\nOriginal Job Description:\n${jobDescription}` }]
        });
        // The first message in conversationHistory from the frontend is the initial AI analysis (role: 'model')
        if (conversationHistory.length > 0 && conversationHistory[0].role === 'model') {
            geminiHistory.push({
                role: 'model',
                parts: [{ text: conversationHistory[0].content }]
            });
        }

        // Add the rest of the conversation history (user questions and AI replies)
        // Start from the second message in conversationHistory as the first was the initial AI analysis
        for (let i = 1; i < conversationHistory.length; i++) {
            const msg = conversationHistory[i];
            geminiHistory.push({
                role: msg.role === 'user' ? 'user' : 'model', // Ensure correct role mapping
                parts: [{ text: msg.content }]
            });
        }

        // Get the latest user message from the conversation history
        const lastUserMessage = conversationHistory[conversationHistory.length - 1].content;

        // Start a new chat session with the reconstructed history
        const chat = model.startChat({
            history: geminiHistory,
            // You can add generationConfig here if you want specific parameters for chat responses
            generationConfig: {
                maxOutputTokens: 1000, // Limit response length for chat
            },
        });

        // Send the latest user message to the chat
        const result = await chat.sendMessage(lastUserMessage);
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
    chatWithAI, // Export the new chat function
};