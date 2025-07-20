const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios'); // Import axios for making requests to Python service
require('dotenv').config({ path: './.env' }); // Ensure .env is loaded here too

const app = express();
const authRoutes = require('./routes/authRoutes');
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 1. Node.js Backend Health Check (for frontend)
app.get('/api/health', (req, res) => {
  res.json({ message: 'Node.js Backend is operational!' });
});

// 2. Endpoint to check Python service health (proxied from Node.js)
app.get('/api/python/health', async (req, res) => {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL; // Get URL from .env
    if (!pythonServiceUrl) {
      return res.status(500).json({ message: 'Python service URL not configured in .env' });
    }
    const response = await axios.get(`${pythonServiceUrl}/health`);
    res.json({ message: `Python AI Service: ${response.data.message}` });
  } catch (error) {
    console.error('Error connecting to Python service:', error.message);
    res.status(500).json({ message: `Failed to connect to Python AI Service. Error: ${error.message}` });
  }
});
app.use('/api/auth', authRoutes);

// Production build static files (will be used later)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

module.exports = app;