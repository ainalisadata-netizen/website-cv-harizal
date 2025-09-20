// server.js (Versi Final dengan Debugging Detail)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// --- STRUKTUR DATA (SCHEMA) UNTUK CV DI DATABASE ---
const cvSchema = new mongoose.Schema({
  uniqueId: { type: String, default: "main_cv", unique: true },
  personalInfo: Object,
  education: Array,
  workExperience: Array,
  certifications: Array,
  trainings: Array,
  projects: Object,
});

const CvData = mongoose.model('CvData', cvSchema);

// --- LOGIKA LOGIN ---
let currentOTP = null;
let otpTimestamp = null;
const OTP_VALIDITY_MS = 5 * 60 * 1000;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (username.toLowerCase() !== 'harizal') {
      return res.status(401).json({ success: false, message: 'Unauthorized username' });
    }
    currentOTP = generateOTP();
    otpTimestamp = Date.now();
    const mailOptions = {
      from: `"Harizal CV Admin" <ainalisadata@gmail.com>`, // Menggunakan email terverifikasi
      to: 'harizalbanget@gmail.com',
      subject: 'Your OTP for Harizal CV Admin Panel',
      text: `Your one-time password (OTP) is: ${currentOTP}\n\nThis OTP is valid for 5 minutes.`,
    };
    console.log("Mencoba mengirim email..."); // Log tambahan
    await transporter.sendMail(mailOptions);
    console.log("Perintah kirim email berhasil dijalankan."); // Log tambahan
    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    // *** BAGIAN INI DIUBAH UNTUK MENAMPILKAN DETAIL ERROR ***
    console.error('!!! TERJADI ERROR SAAT LOGIN !!!');
    console.error(error); // Cetak seluruh objek error
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/verify', (req, res) => {
    try {
        const { otp } = req.body;
        if (!currentOTP || (Date.now() - otpTimestamp > OTP_VALIDITY_MS)) {
            currentOTP = null;
            return res.status(400).json({ success: false, message: 'OTP expired or invalid. Please login again.' });
        }
        if (otp === currentOTP) {
            currentOTP = null;
            return res.json({ success: true, message: 'OTP verified' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error in /verify:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- ENDPOINT DATA ---
app.get('/get-data', async (req, res) => {
  try {
    let data = await CvData.findOne({ uniqueId: "main_cv" });
    if (!data) {
        console.log("Database is empty. Creating a new empty document.");
        data = new CvData({
            uniqueId: "main_cv",
            personalInfo: { name: "Harizal", title: "IT Consultant", address: "", email: "" },
            education: [], workExperience: [], certifications: [], trainings: [],
            projects: { it: [], network_infrastructure: [], security: [] }
        });
        await data.save();
    }
    return res.json(data);
  } catch (error) {
    console.error('Error in /get-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/update-data', async (req, res) => {
  try {
    const newData = req.body;
    await CvData.findOneAndUpdate({ uniqueId: "main_cv" }, newData, { upsert: true, new: true });
    return res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error in /update-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- SERVE FRONTEND ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});