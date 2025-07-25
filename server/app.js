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


app.use('/api/auth', authRoutes);

// Production build static files (will be used later)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

module.exports = app;