// server.js (Final Version with Correct Route Order)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => {
    console.error('FATAL: Could not connect to MongoDB Atlas. Shutting down.', err);
    process.exit(1);
  });

// --- SCHEMA & MODEL ---
const AdminSchema = new mongoose.Schema({ /* ... (tidak ada perubahan) ... */ });
const Admin = mongoose.model('Admin', AdminSchema);

const cvSchema = new mongoose.Schema({ /* ... (tidak ada perubahan) ... */ });
const CvData = mongoose.model('CvData', cvSchema);

const CvRequestSchema = new mongoose.Schema({ /* ... (tidak ada perubahan) ... */ });
const CvRequest = mongoose.model('CvRequest', CvRequestSchema);

// --- FUNGSI MEMBUAT ADMIN PERTAMA KALI ---
async function createFirstAdmin() { /* ... (tidak ada perubahan) ... */ }
createFirstAdmin();

// --- RATE LIMITER ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts." });

// =======================================================
// === RUTE API (HARUS DIDEFINISIKAN SEBELUM STATIC FILES) ===
// =======================================================

// === ENDPOINT PUBLIK ===
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
    } catch (error) { next(error); }
});

app.post('/contact-request', apiLimiter, async (req, res, next) => {
    // ... (Logika endpoint ini tidak berubah)
});


// === ENDPOINT ADMIN ===
app.post('/login', loginLimiter, async (req, res, next) => {
    // ... (Logika endpoint ini tidak berubah)
});

const authenticateToken = (req, res, next) => {
    // ... (Logika middleware ini tidak berubah)
};

app.post('/update-data', authenticateToken, async (req, res, next) => {
    // ... (Logika endpoint ini tidak berubah)
});

app.get('/get-requests', authenticateToken, async (req, res, next) => {
    // ... (Logika endpoint ini tidak berubah)
});

app.delete('/delete-request/:id', authenticateToken, async (req, res, next) => {
    // ... (Logika endpoint ini tidak berubah)
});


// --- MENYAJIKAN FILE STATIS (SETELAH API) ---
app.use(express.static(path.join(__dirname, 'public')));

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