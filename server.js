// server.js (Final Version with CV Request Database)

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
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoUri)
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
  personalInfo: { name: String, title: String, address: String, email: String },
  education: [{ degree: String, institution: String, status: String }],
  workExperience: [{ period: String, company: String, position: String }],
  certifications: [String], trainings: [String],
  projects: { it: [String], network_infrastructure: [String], security: [String] }
});
const CvData = mongoose.model('CvData', cvSchema);

// SKEMA BARU UNTUK PERMINTAAN CV
const CvRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const CvRequest = mongoose.model('CvRequest', CvRequestSchema);

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
    } catch (error) { console.error('Error creating admin user:', error); }
}
createFirstAdmin();

// --- RATE LIMITER ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts." });


// =======================================================
// === RUTE API ===
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

// ENDPOINT KONTAK BARU: MENYIMPAN KE DATABASE
app.post('/contact-request', apiLimiter, async (req, res, next) => {
    try {
        const { name, email, company, message } = req.body;
        if (!name || !email || !message || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid input provided.' });
        }
        const newRequest = new CvRequest({ name, email, company, message });
        await newRequest.save();
        return res.json({ success: true, message: 'Permintaan berhasil disimpan.' });
    } catch (error) { next(error); }
});


// === ENDPOINT ADMIN ===
app.post('/login', loginLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, message: 'Login successful', token: token });
    } catch (error) { next(error); }
});

// MIDDLEWARE AUTENTIKASI
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token is not valid' });
        req.user = user;
        next();
    });
};

// ENDPOINT AMAN: MEMPERBARUI DATA CV
app.post('/update-data', authenticateToken, async (req, res, next) => {
    try {
        const newData = req.body;
        await CvData.findOneAndUpdate({ uniqueId: "main_cv" }, newData, { upsert: true, new: true, runValidators: true });
        return res.json({ success: true, message: 'Data updated successfully' });
    } catch (error) { next(error); }
});

// ENDPOINT AMAN BARU: MENGAMBIL SEMUA PERMINTAAN CV
app.get('/get-requests', authenticateToken, async (req, res, next) => {
    try {
        const requests = await CvRequest.find().sort({ createdAt: -1 }); // Diurutkan dari yang terbaru
        res.json(requests);
    } catch (error) { next(error); }
});

// ENDPOINT AMAN BARU: MENGHAPUS PERMINTAAN CV
app.delete('/delete-request/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
        const result = await CvRequest.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        res.json({ success: true, message: 'Request deleted successfully' });
    } catch (error) { next(error); }
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