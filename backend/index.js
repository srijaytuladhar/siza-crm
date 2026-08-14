require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const errorHandler = require('./backend/middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Connect to MongoDB (fallback) - will be replaced with PostgreSQL connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'CRM API is running' });
});

// API routes will be added here

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});