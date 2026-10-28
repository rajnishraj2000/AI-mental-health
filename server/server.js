require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Check MongoDB Connection Middleware for /api routes ──
const mongoose = require('mongoose');
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'MongoDB is not connected. Please set a valid MONGODB_URI in your .env file (e.g. from MongoDB Atlas) and restart.'
    });
  }
  next();
});

// ── API Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/assessment', require('./routes/assessment'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/journal', require('./routes/journal'));

// ── Serve React build in production ──
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('MindCare AI backend running. Build the React client with: cd client && npm run build');
  }
});

// ── Start server and connect to DB ──
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║  🧠  MindCare AI — Server running             ║
  ║     → Backend:  http://localhost:${PORT}          ║
  ║     → Frontend: http://localhost:5173         ║
  ╚═══════════════════════════════════════════════╝
  `);
  connectDB();
});
