import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './db';
import Logger from './utils/logger';
import { initSocketServer } from './sockets';


// Routes
import authRoutes from './routes/auth';
import pairingRoutes from './routes/pairing';
import journalRoutes from './routes/journal';
import paymentRoutes from './routes/payment';
import videoRoutes from './routes/video';
import waitlistRoutes from './routes/waitlist';
import postRoutes from './routes/posts';

// --- Connect to Database ---
connectDB();

const app = express();

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
configurePassport(passport);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('❌ Malformed JSON received:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload received' });
  }
  next();
});

// --- HTTP Server & Socket.IO Setup ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 8080;

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/posts', postRoutes);

// --- Initialize Sockets ---
initSocketServer(io);

httpServer.listen(PORT, () => {
  Logger.info(`BlurChat server listening on port ${PORT}`);
});