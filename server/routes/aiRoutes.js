// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs for fs.existsSync and fs.mkdirSync

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the 'uploads' directory exists
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Route for single resume analysis (Employee Tool)
router.post('/analyze-resume', upload.single('resume'), aiController.analyzeResume);

// NEW: Route for conversational AI chat - now accepts a single file upload
router.post('/chat-ai', upload.single('chatFile'), aiController.chatWithAI); // 'chatFile' must match frontend FormData field name

// Route for Employer Tool (multiple resume analysis)
router.post('/employer/analyze-resumes', upload.array('resumes'), aiController.analyzeMultipleResumes);

module.exports = router;
