require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb'); 
const { spawn } = require('child_process');

const app = express();
const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'SmartDineDB'; 
const jwtSecret = 'YOUR_SECRET_KEY'; 

async function connectDb() {
    try { await client.connect(); console.log("✅ Auth DB Connected!"); } 
    catch (e) { console.error("❌ DB Error:", e); }
}
connectDb();

app.use(cors());
app.use(express.json());

// AUTH ROUTES
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const users = client.db(dbName).collection('users');
    if (await users.findOne({ username })) return res.status(400).json({ message: 'User exists.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({ username, password: hashedPassword });
    res.status(201).json({ message: 'Success!' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = client.db(dbName).collection('users');
    const user = await users.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, message: 'Login successful!' });
});

// RECOMMENDATION ROUTE
app.post('/api/recommend', (req, res) => {
    const { query, city, count = 3, page = 1 } = req.body;
    const pythonProcess = spawn('python', ['smartdine.py', query || "", city || "", count, page]);
    
    let result = '';
    pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
    pythonProcess.on('close', (code) => {
        if (code === 0) res.json({ answer: result });
        else res.json({ answer: JSON.stringify([{ "error": "Server Error. Check logs." }]) });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Gateway running on ${PORT}`));