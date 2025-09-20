// server.js (Versi MongoDB)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose'); // <-- Menggunakan Mongoose untuk database
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Render akan menggunakan port-nya sendiri

app.use(bodyParser.json());

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// --- STRUKTUR DATA (SCHEMA) UNTUK CV DI DATABASE ---
const cvSchema = new mongoose.Schema({
  // Kita buat satu dokumen saja untuk menyimpan semua data CV
  uniqueId: { type: String, default: "main_cv", unique: true },
  personalInfo: Object,
  education: Array,
  workExperience: Array,
  certifications: Array,
  trainings: Array,
  projects: Object,
});

// Membuat "Model" yang akan digunakan untuk berinteraksi dengan database
const CvData = mongoose.model('CvData', cvSchema);


// --- LOGIKA LOGIN (SAMA SEPERTI SEBELUMNYA) ---
let currentOTP = null;
let otpTimestamp = null;
const OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 menit

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
  // ... (Logika login tidak berubah, biarkan sama)
  try {
    const { username } = req.body;
    if (username.toLowerCase() !== 'harizal') {
      return res.status(401).json({ success: false, message: 'Unauthorized username' });
    }
    currentOTP = generateOTP();
    otpTimestamp = Date.now();
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

app.post('/verify', (req, res) => {
    // ... (Logika verifikasi tidak berubah, biarkan sama)
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


// --- ENDPOINT DATA (SEKARANG MENGGUNAKAN DATABASE) ---

// GET /get-data (Mengambil data dari MongoDB)
app.get('/get-data', async (req, res) => {
  try {
    // Cari satu dokumen CV di database
    let data = await CvData.findOne({ uniqueId: "main_cv" });
    if (!data) {
        // Jika database kosong, kita buat data awal dari file data.json
        console.log("Database is empty. Initializing with data.json...");
        const initialData = require('./data.json'); // Membaca file lokal sekali saja
        data = new CvData({ ...initialData, uniqueId: "main_cv" });
        await data.save();
    }
    return res.json(data);
  } catch (error) {
    console.error('Error in /get-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /update-data (Menyimpan data ke MongoDB)
app.post('/update-data', async (req, res) => {
  try {
    const newData = req.body;
    // 'upsert: true' artinya: jika data sudah ada, update. Jika belum ada, buat baru.
    await CvData.findOneAndUpdate({ uniqueId: "main_cv" }, newData, { upsert: true, new: true });
    return res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error in /update-data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- MELAYANI FILE FRONTEND ---
// Tambahkan ini untuk melayani file dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Menangani semua rute lain agar mengarah ke index.html (untuk single page app)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});