// server.js (Versi Final dengan Perbaikan Data & Animasi)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Ditambahkan kembali untuk form kontak

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// --- MODEL DATA (Schema) ---
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', AdminSchema);

const cvSchema = new mongoose.Schema({
  uniqueId: { type: String, default: "main_cv", unique: true },
  personalInfo: Object, education: Array, workExperience: Array,
  certifications: Array, trainings: Array, projects: Object,
});
const CvData = mongoose.model('CvData', cvSchema);


// --- FUNGSI MEMBUAT ADMIN PERTAMA KALI ---
async function createFirstAdmin() {
    try {
        const existingAdmin = await Admin.findOne({ email: 'harizalbanget@gmail.com' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('PasswordSuperAman123', 10);
            const newAdmin = new Admin({ email: 'harizalbanget@gmail.com', password: hashedPassword });
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

// --- TRANSPORTER EMAIL (UNTUK FORM KONTAK) ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
});


// === ENDPOINT PUBLIK (TIDAK PERLU LOGIN) ===

// Endpoint untuk mengambil data CV, bisa diakses oleh siapa saja
app.get('/get-data', async (req, res) => {
    try {
        let data = await CvData.findOne({ uniqueId: "main_cv" });
        if (!data) {
            data = new CvData({
                uniqueId: "main_cv",
                personalInfo: { name: "Harizal", title: "IT Consultant" },
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

// Endpoint untuk form kontak
app.post('/contact-request', async (req, res) => {
    try {
        const { name, email, company, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Nama, email, dan pesan wajib diisi.' });
        }
        const mailOptions = {
            from: `"Notifikasi Website CV" <${process.env.EMAIL_USER}>`,
            to: 'harizalbanget@gmail.com',
            subject: `Permintaan CV dari ${name}`,
            replyTo: email, // Memudahkan membalas email
            html: `<h3>Permintaan CV Baru</h3><p><strong>Nama:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Perusahaan:</strong> ${company}</p><hr><p><strong>Pesan:</strong></p><p>${message}</p>`
        };
        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: 'Permintaan berhasil dikirim.' });
    } catch (error) {
        console.error('Error in /contact-request:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


// === ENDPOINT ADMIN (PERLU LOGIN & TOKEN) ===

// Endpoint login admin
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== 'string' || !password) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, message: 'Login successful', token: token });
    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Middleware untuk verifikasi token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Endpoint untuk menyimpan data (diamankan)
app.post('/update-data', authenticateToken, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});