// server/server.js (or index.js)
const express = require('express');
const dotenv = require('dotenv').config(); // Load environment variables
const connectDB = require('./config/db'); // Import DB connection
const cors = require('cors'); // Import cors
const aiRoutes = require('./routes/aiRoutes'); // Import new AI routes

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB (still needed for potential future data storage, but not for auth now)
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // To parse URL-encoded request bodies

// Mount AI routes
app.use('/api', aiRoutes); // All AI routes will be prefixed with /api

// --- Error Handling Middleware (optional but good practice) ---
// If you have a custom error handler, place it here.
// For example, if you have: const { errorHandler } = require('./middleware/errorMiddleware');
// app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});