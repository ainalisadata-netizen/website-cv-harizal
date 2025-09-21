// server.js (Versi Login Email & Password dengan JWT)

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET; // Kunci rahasia untuk token, tambahkan ini di Render

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI KE DATABASE MONGODB ---
const mongoUri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// --- MODEL DATA UNTUK ADMIN (BARU) ---
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', AdminSchema);

// --- MODEL DATA UNTUK CV (TETAP SAMA) ---
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


// --- FUNGSI UNTUK MEMBUAT ADMIN PERTAMA KALI (JALANKAN SEKALI SAJA) ---
// Setelah dijalankan dan berhasil, Anda bisa memberi komentar pada baris pemanggilannya
async function createFirstAdmin() {
    try {
        const existingAdmin = await Admin.findOne({ email: 'harizalbanget@gmail.com' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('PasswordSuperAman123', 10); // Ganti dengan password kuat Anda
            const newAdmin = new Admin({
                email: 'harizalbanget@gmail.com', // Ganti dengan email admin Anda
                password: hashedPassword
            });
            await newAdmin.save();
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}
// Panggil fungsi ini saat server start untuk memastikan admin ada
createFirstAdmin();


// --- ENDPOINT LOGIN BARU ---
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Sanitasi input sederhana
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

        // Jika berhasil, buat token
        const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, message: 'Login successful', token: token });

    } catch (error) {
        console.error('Error in /login:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// --- MIDDLEWARE UNTUK VERIFIKASI TOKEN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};


// --- ENDPOINT DATA YANG SUDAH DIAMANKAN ---
app.get('/get-data', authenticateToken, async (req, res) => {
    // ... (Logika sama seperti sebelumnya, hanya ditambahkan 'authenticateToken')
    try {
        let data = await CvData.findOne({ uniqueId: "main_cv" });
        if (!data) {
            data = new CvData({
                uniqueId: "main_cv",
                personalInfo: {}, education: [], workExperience: [], certifications: [], trainings: [],
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

app.post('/update-data', authenticateToken, async (req, res) => {
    // ... (Logika sama seperti sebelumnya, hanya ditambahkan 'authenticateToken')
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
    const filePath = path.join(__dirname, 'public', req.path);
    // Cek jika file ada, jika tidak, fallback ke index.html
    if (require('fs').existsSync(filePath) && req.path !== '/') {
        res.sendFile(filePath);
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});