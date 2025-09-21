// server.js (Final Version with Brevo Fix and Improvements)

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
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => {
    console.error('FATAL: Could not connect to MongoDB Atlas. Shutting down.', err);
    process.exit(1);
  });

// --- SCHEMA & MODEL ---
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', AdminSchema);

const cvSchema = new mongoose.Schema({
  uniqueId: { type: String, default: "main_cv", unique: true },
  personalInfo: {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  education: [{ degree: String, institution: String, status: String }],
  workExperience: [{ period: String, company: String, position: String }],
  certifications: [String],
  trainings: [String],
  projects: { it: [String], network_infrastructure: [String], security: [String] }
});
const CvData = mongoose.model('CvData', cvSchema);

// --- FUNGSI MEMBUAT ADMIN PERTAMA KALI ---
async function createFirstAdmin() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'harizalbanget@gmail.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('WARNING: DEFAULT_ADMIN_PASSWORD is not set. Admin user cannot be created.');
    return;
  }
  try {
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const newAdmin = new Admin({ email: adminEmail, password: hashedPassword });
      await newAdmin.save();
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}
createFirstAdmin();

// --- TRANSPORTER EMAIL (Konfigurasi Khusus Brevo) ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- RATE LIMITER ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});

// Helper untuk sanitasi HTML
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
};

// =======================================================
// === RUTE API ===
// =======================================================

// ENDPOINT PUBLIK
app.get('/get-data', apiLimiter, async (req, res, next) => {
  try {
    let data = await CvData.findOne({ uniqueId: "main_cv" }).lean();
    if (!data) {
      const initialData = require('./data.json');
      data = new CvData({ ...initialData, uniqueId: "main_cv" });
      await data.save();
      data = data.toObject();
    }
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

app.post('/contact-request', apiLimiter, async (req, res, next) => {
  try {
    const { name, email, company, message } = req.body;
    if (!name || !email || !message || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid input provided.' });
    }
    const mailOptions = {
      from: `"Notifikasi Website CV" <${process.env.EMAIL_USER}>`,
      to: 'harizalbanget@gmail.com',
      subject: `Permintaan CV dari ${escapeHtml(name)}`,
      replyTo: email,
      html: `<h3>Permintaan CV Baru</h3>
             <p><strong>Nama:</strong> ${escapeHtml(name)}</p>
             <p><strong>Email:</strong> ${escapeHtml(email)}</p>
             <p><strong>Perusahaan:</strong> ${escapeHtml(company)}</p>
             <hr>
             <p><strong>Pesan:</strong></p>
             <p>${escapeHtml(message)}</p>`
    };
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Permintaan berhasil dikirim.' });
  } catch (error) {
    next(error);
  }
});

// ENDPOINT ADMIN
app.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ adminId: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: 'Login successful', token });
  } catch (error) {
    next(error);
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token is missing or invalid' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(403).json({ success: false, message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

app.post('/update-data', authenticateToken, async (req, res, next) => {
  try {
    const newData = req.body;
    if (typeof newData.personalInfo !== 'object' || !Array.isArray(newData.workExperience)) {
      return res.status(400).json({ success: false, message: 'Invalid CV data structure' });
    }
    await CvData.findOneAndUpdate(
      { uniqueId: "main_cv" }, newData,
      { upsert: true, new: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    next(error);
  }
});

// --- RUTE CATCH-ALL (HARUS PALING BAWAH) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});