// server.js
/**
 * Backend server for Harizal CV Admin Panel
 * 
 * Setup environment variables in a `.env` file at the project root:
 * 
 * EMAIL_HOST=smtp.example.com
 * EMAIL_PORT=587
 * EMAIL_SECURE=false
 * EMAIL_USER=your_email@example.com
 * EMAIL_PASS=your_email_password
 * 
 * Replace the above with your SMTP provider credentials.
 * 
 * This server listens on port 3000.
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Store OTP and timestamp in memory (simple approach)
let currentOTP = null;
let otpTimestamp = null;
const OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

// Nodemailer transporter setup using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility: generate 6-digit OTP as string
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid username' });
    }
    if (username.toLowerCase() !== 'harizal') {
      return res.status(401).json({ success: false, message: 'Unauthorized username' });
    }

    currentOTP = generateOTP();
    otpTimestamp = Date.now();

    // Send OTP email
    const mailOptions = {
      from: `"Harizal CV Admin" <${process.env.EMAIL_USER}>`,
      to: 'harizalbanget@gmail.com',
      subject: 'Your OTP for Harizal CV Admin Panel',
      text: `Your one-time password (OTP) is: ${currentOTP}\n\nThis OTP is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error in /login:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /verify
app.post('/verify', (req, res) => {
  try {
    const { otp } = req.body;
    if (typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid OTP format' });
    }
    if (!currentOTP) {
      return res.status(400).json({ success: false, message: 'No OTP generated. Please login first.' });
    }
    const now = Date.now();
    if (now - otpTimestamp > OTP_VALIDITY_MS) {
      currentOTP = null;
      otpTimestamp = null;
      return res.status(400).json({ success: false, message: 'OTP expired. Please login again.' });
    }
    if (otp === currentOTP) {
      // OTP matched, clear OTP to prevent reuse
      currentOTP = null;
      otpTimestamp = null;
      return res.json({ success: true, message: 'OTP verified' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error in /verify:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /get-data
app.get('/get-data', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ success: false, message: 'Data file not found' });
    }
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    return res.json(jsonData);
  } catch (error) {
    console.error('Error in /get-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /update-data
app.post('/update-data', (req, res) => {
  try {
    const newData = req.body;
    if (typeof newData !== 'object' || newData === null) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    // Basic validation: check required top-level keys exist
    const requiredKeys = ['personalInfo', 'education', 'workExperience', 'certifications', 'trainings', 'projects'];
    for (const key of requiredKeys) {
      if (!(key in newData)) {
        return res.status(400).json({ success: false, message: `Missing required key: ${key}` });
      }
    }

    // Sanitize input: simple example, ensure personalInfo has name and email strings
    if (typeof newData.personalInfo.name !== 'string' || typeof newData.personalInfo.email !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid personalInfo data' });
    }

    // Write to data.json atomically
    const dataPath = path.join(__dirname, 'data.json');
    const tempPath = dataPath + '.tmp';

    fs.writeFileSync(tempPath, JSON.stringify(newData, null, 2), { encoding: 'utf-8' });
    fs.renameSync(tempPath, dataPath);

    return res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error in /update-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});