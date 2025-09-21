require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

const app = express();

// Perbaikan trust proxy untuk Render.com
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => {
    console.error('FATAL: Could not connect to MongoDB Atlas. Shutting down.', err);
    process.exit(1);
  });

// Schema definitions (Admin, CvData) - sama seperti sebelumnya

// Create first admin function - sama seperti sebelumnya

// Nodemailer transporter with improved config
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465', // true jika port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

// Rate limiters - sama seperti sebelumnya

// Escape HTML helper - sama seperti sebelumnya

// Routes - sama seperti sebelumnya

// Catch-all route - sama seperti sebelumnya

// Global error handler - sama seperti sebelumnya

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});