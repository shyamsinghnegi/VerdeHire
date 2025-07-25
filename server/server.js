// server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv'); // Ensure dotenv is imported

dotenv.config(); // <--- THIS MUST BE CALLED EARLY TO LOAD .env variables

const aiRoutes = require('./routes/aiRoutes'); // Import your AI routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Routes
app.use('/api', aiRoutes); // Use your AI routes under /api prefix

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('VerdeHire Backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
