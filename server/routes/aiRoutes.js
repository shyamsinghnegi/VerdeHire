// server/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { analyzeResume, chatWithAI } = require('../controllers/aiController'); // Make sure to import chatWithAI
const upload = require('../middleware/uploadMiddleware'); // Your multer middleware for file uploads

router.post('/analyze-resume', upload.single('resume'), analyzeResume);
router.post('/chat-ai', chatWithAI); // NEW ROUTE FOR CHAT

module.exports = router;