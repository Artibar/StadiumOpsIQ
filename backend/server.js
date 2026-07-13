import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { incidentsRouter, statsRouter } from './routes/incidents.js';
import errorHandler from './middleware/errorHandler.js';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://stadiumopsiq-1.onrender.com',
    'https://stadiumopsiq.onrender.com'
  ],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());
app.use(express.json());

app.use('/api/incidents', incidentsRouter);
app.get('/api/stadiums', async (req, res) => {
  try {
    const response = await fetch('https://worldcup26.ir/get/stadiums')
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('[STADIUMS] proxy failed:', error.message)
    res.status(500).json({ 
      error: 'Failed to fetch stadiums',
      message: error.message
    })
  }
})
app.use('/api/stats', statsRouter);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date() 
  });
});

app.use(errorHandler);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI is not defined.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`StadiumOps IQ backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
