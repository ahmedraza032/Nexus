import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import meetingRoutes from './routes/meetingRoutes';
import connectionRoutes from './routes/connectionRoutes';
import { seedDemoUsers } from './scripts/seedDemoUsers';

dotenv.config();

// Connect to DB and seed demo users
connectDB().then(() => {
  seedDemoUsers();
});

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logger — shows every incoming request in the terminal
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/connections', connectionRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email configured: ${process.env.EMAIL_FROM ? '✅ ' + process.env.EMAIL_FROM : '❌ EMAIL_FROM not set'}`);
});
