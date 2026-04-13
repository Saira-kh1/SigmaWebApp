// server.js (ESM)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import ChatRoutes from './routes/chat.js';
import AuthRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT ?? 8080;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ----- Middleware -----
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  })
);
app.use(helmet());
if (NODE_ENV !== 'production') app.use(morgan('dev'));

// ----- Routes -----

// Auth routes (includes /auth/guest for guest token generation)
app.use('/auth', AuthRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, env: NODE_ENV, time: new Date().toISOString() });
});

// Chat routes (includes both /api/chat and /api/chat/guest)
app.use('/api', ChatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Error handler
// (Make sure this stays after all routes)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ----- DB + Server bootstrap -----
async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      // Add options if needed (keep defaults for modern Mongoose)
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📍 API endpoints:`);
    console.log(`   - POST /auth/register - Register new user`);
    console.log(`   - POST /auth/login - Login existing user`);
    console.log(`   - POST /auth/guest - Get guest token (NEW)`);
    console.log(`   - POST /api/chat - Chat (registered users, saves to DB)`);
    console.log(`   - POST /api/chat/guest - Chat (guest users, no DB save)`);
    console.log(`   - GET  /api/thread - List threads (registered only)`);
    console.log(`   - GET  /api/thread/:id - Get thread (registered only)`);
    console.log(`   - DELETE /api/thread/:id - Delete thread (registered only)`);
  });
}

start();