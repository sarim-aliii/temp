import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './config/passport';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import connectDB from './db';
import authRoutes from './routes/auth';
import pairingRoutes from './routes/pairing';
import journalRoutes from './routes/journal';
import paymentRoutes from './routes/payment';
import videoRoutes from './routes/video';
import waitlistRoutes from './routes/waitlist';
import {
  RoomState,
  ClientAction,
  AuthenticatedSocket,
} from './types';
import jwt from 'jsonwebtoken';
import User from './models/User';
import JournalEntry from './models/JournalEntry';
import Logger from './utils/logger';
import { getRoomId } from './utils/roomUtils';


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


// --- Socket.IO and Room State Logic ---
const roomState: Record<string, RoomState> = {};
const roomTimers: Record<string, NodeJS.Timeout> = {}; // Grace period timers

const getDefaultRoomState = (): RoomState => ({
  videoSource: { type: 'youtube', src: 'dQw4w9WgXcQ' },
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    lastUpdateTimestamp: Date.now(),
  },
  messages: [],
  uiState: { isSidebarVisible: true },
  isScreenSharing: false,
  typingUser: null,
  ambientSound: { track: null, isPlaying: false, volume: 0.5 },
  journalEntries: [],
  isPremium: false,
  createdAt: Date.now()
});

// --- Global State Broadcaster (Master Clock Sync) ---
const SYNC_INTERVAL = 1500;
const FREE_TRIAL_LIMIT = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const roomId in roomState) {
    const state = roomState[roomId];

    const timeInRoom = now - state.createdAt;
    if (
      !state.isPremium &&                     // If room is not premium
      timeInRoom > FREE_TRIAL_LIMIT &&        // And time is over 10 mins
      state.videoSource.type !== null         // And a video is loaded
    ) {
      Logger.warn(`[Room: ${roomId}] Free trial expired. Kicking video.`);
      state.videoSource = { type: null, src: null };
      state.playbackState.isPlaying = false;
      
      // Notify clients of the kick
      io.to(roomId).emit('serverUpdateState', state);
      io.to(roomId).emit('serverNotification', { 
          type: 'error', 
          message: 'Free 10-minute trial expired. Go premium to continue watching.' 
      });
      continue;
    }

    // Weakest Link Rule (Pause)
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    let isAnyoneBuffering = false;
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        const sock = io.sockets.sockets.get(socketId) as unknown as AuthenticatedSocket;
        if (sock && sock.isBuffering) {
          isAnyoneBuffering = true;
          break;
        }
      }
    }

    if (isAnyoneBuffering && state.playbackState.isPlaying) {
      Logger.warn(`[Room: ${roomId}] Pausing playback because a user is buffering.`);
      state.playbackState.isPlaying = false;
      state.playbackState.lastUpdateTimestamp = Date.now();
      io.to(roomId).emit('serverUpdateState', state);
      continue; 
    }

    // Advance clock if playing and no one is buffering
    if (state.playbackState.isPlaying) {
      const currentTime = Date.now();
      const timeElapsedMs = currentTime - state.playbackState.lastUpdateTimestamp;
      const newTime = state.playbackState.currentTime + (timeElapsedMs / 1000) * state.playbackState.playbackRate;

      state.playbackState.currentTime = newTime;
      state.playbackState.lastUpdateTimestamp = currentTime;

      io.to(roomId).emit('serverUpdateState', state);
    }
  }
}, SYNC_INTERVAL);

// --- Socket.IO Authentication Middleware ---
io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      Logger.error('JWT_SECRET is not defined in server .env');
      return next(new Error('Authentication error: Server configuration error.'));
    }
    const decoded = jwt.verify(token, jwtSecret) as { id: string }; 
    const user = await User.findById(decoded.id); 
    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }
    (socket as unknown as AuthenticatedSocket).user = user;
    next();
  }
  catch (err) {
    Logger.error('Authentication error: Invalid token.', err);
    return next(new Error('Authentication error: Invalid token.'));
  }
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket: Socket) => {
  const authSocket = socket as unknown as AuthenticatedSocket;
  const user = authSocket.user!;
  authSocket.isBuffering = false;

  if (!user.pairedWithUserId) {
    Logger.warn(`User ${user.email} (${socket.id}) connected but is not paired.`);
    socket.emit('error', { message: 'User is not paired.' });
    return;
  }

  const roomId = getRoomId(user._id.toString(), user.pairedWithUserId.toString());
  authSocket.roomId = roomId;
  socket.join(roomId);

  // Cancel deletion timer if it exists
  if (roomTimers[roomId]) {
    Logger.info(`[Room: ${roomId}] User reconnected. Cancelling deletion timer.`);
    clearTimeout(roomTimers[roomId]);
    delete roomTimers[roomId];
  }

  Logger.info(`User ${user.email} (${socket.id}) connected and joined room ${roomId}`);

  if (!roomState[roomId]) {
    roomState[roomId] = getDefaultRoomState();
    
    // Capture pairedWithUserId since we know it's defined at this point
    const partnerUserId = user.pairedWithUserId!;
    
    (async () => {
      try {
        // Check premium status when room is created
        const partner = await User.findById(partnerUserId);
        const isRoomPremium = user.isPremium || (partner && partner.isPremium) || false;
        
        const entries = await JournalEntry.find({ roomId }).sort({ createdAt: 'asc' });
        
          if (roomState[roomId]) { 
          // Convert server IJournalEntry[] to client IJournalEntry[] format
          roomState[roomId].journalEntries = entries.map(entry => ({
            _id: entry._id.toString(),
            roomId: entry.roomId,
            authorId: entry.authorId.toString(),
            content: entry.content,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          })) as any;
          roomState[roomId].isPremium = isRoomPremium; // Set premium status
          roomState[roomId].createdAt = Date.now();   // Set creation time
          
          if (isRoomPremium) {
            Logger.info(`[Room: ${roomId}] Premium room created.`);
          }
          
          socket.emit('serverUpdateState', roomState[roomId]);
        }
      } catch (e) {
        Logger.error("Failed to load journal/premium status for room:", e, { roomId });
      }
    })();
  }

  // --- NEW LOGIC: Find Partner Socket ID ---
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  let partnerSocketId: string | null = null;
  if (roomSockets) {
    for (const id of roomSockets) {
      if (id !== socket.id) {
        partnerSocketId = id;
        break; // Assuming only 2 users per room
      }
    }
  }

  socket.emit('room-joined', {
    roomId,
    initialState: roomState[roomId],
    sessionId: socket.id,
    partnerSocketId, // <--- Sent to client
  });

  socket.to(roomId).emit('partner-online', socket.id);

  // --- Core Event Listeners ---
  socket.on('clientAction', async (action: ClientAction) => {
    const rid = authSocket.roomId;
    if (!rid || !roomState[rid]) return;

    Logger.debug(`[Room: ${rid}] Received action: ${action.type} from user: ${user.email}`);

    const currentState = roomState[rid];
    const serverTime = Date.now();

    if (authSocket.isBuffering) {
      switch (action.type) {
        case 'UPDATE_PLAYBACK_STATE':
        case 'UPDATE_PLAYBACK_TIME':
          authSocket.isBuffering = false;
          socket.to(rid).emit('partnerBuffering', false);
          break;
      }
    }

    switch (action.type) {
      case 'UPDATE_PLAYBACK_STATE':
        currentState.playbackState = {
          ...currentState.playbackState,
          ...action.payload,
          lastUpdateTimestamp: serverTime,
        };
        break;

      case 'UPDATE_VIDEO_SOURCE':
        currentState.videoSource = action.payload;
        currentState.playbackState = {
          ...getDefaultRoomState().playbackState,
          lastUpdateTimestamp: serverTime,
        };
        currentState.isScreenSharing = action.payload.type === 'screen';
        break;

      case 'SEND_MESSAGE':
        if (currentState.messages.length > 50) {
          currentState.messages.shift();
        }
        currentState.messages.push(action.payload);

        io.to(rid).emit('newChatMessage', action.payload);
        roomState[rid] = currentState;
        return;

      case 'SET_TYPING':
        currentState.typingUser = action.payload.isTyping ? user.email : null;
        // Optimization: Broadcast only typing status to partner
        socket.to(rid).emit('partnerTyping', currentState.typingUser);
        roomState[rid] = currentState;
        return; // Return early

      case 'UPDATE_PLAYBACK_TIME':
        currentState.playbackState.currentTime = action.payload.currentTime;
        currentState.playbackState.lastUpdateTimestamp = serverTime;
        break;

      case 'UPDATE_UI_STATE':
        currentState.uiState = {
          ...currentState.uiState,
          ...action.payload,
        };
        break;

      case 'SET_AMBIENT_SOUND':
        currentState.ambientSound = {
          ...currentState.ambientSound,
          ...action.payload,
        };
        break;
      
      case 'CREATE_JOURNAL_ENTRY':
        try {
          const newEntry = new JournalEntry({
            roomId: rid,
            authorId: user._id,
            content: action.payload.content,
          });
          const savedEntry = await newEntry.save();

          // Convert server IJournalEntry to client IJournalEntry format
          const clientEntry = {
            _id: savedEntry._id.toString(),
            roomId: savedEntry.roomId,
            authorId: savedEntry.authorId.toString(),
            content: savedEntry.content,
            createdAt: savedEntry.createdAt,
            updatedAt: savedEntry.updatedAt,
          };
          currentState.journalEntries.push(clientEntry as any);
          io.to(rid).emit('newJournalEntry', clientEntry);

          roomState[rid] = currentState;
          return;
        } 
        catch (e) {
          Logger.error("Failed to save journal entry:", e);
          socket.emit('error', { message: 'Failed to save journal entry.' });
          return;
        }

      case 'CHECK_PREMIUM_STATUS':
        try {
          const freshUser = await User.findById(user._id);
          const partner = await User.findById(user.pairedWithUserId);
          const isRoomPremium = (freshUser && freshUser.isPremium) || (partner && partner.isPremium) || false;

          if (isRoomPremium && !currentState.isPremium) {
            Logger.info(`[Room: ${rid}] Room upgraded to Premium.`);
            currentState.isPremium = true;
          }
        } catch (e) {
          Logger.error('Failed to check premium status:', e);
        }
        break;

      default:
        Logger.warn(`Unknown clientAction type: ${(action as any).type}`);
        return;
    }

    roomState[rid] = currentState;
    io.to(rid).emit('serverUpdateState', currentState);
  });

  socket.on('reportBuffering', (isBuffering: boolean) => {
    authSocket.isBuffering = isBuffering;
    const rid = authSocket.roomId;
    if (rid && roomState[rid]) { 
      socket.to(rid).emit('partnerBuffering', isBuffering);

      // Weakest Link Resume logic
      if (!isBuffering) {
        const socketsInRoom = io.sockets.adapter.rooms.get(rid);
        let isAnyoneElseBuffering = false;
        if (socketsInRoom) {
          for (const socketId of socketsInRoom) {
            if (socketId === socket.id) continue;
            const sock = io.sockets.sockets.get(socketId) as unknown as AuthenticatedSocket;
            if (sock && sock.isBuffering) {
              isAnyoneElseBuffering = true;
              break;
            }
          }
        }

        if (!isAnyoneElseBuffering && !roomState[rid].playbackState.isPlaying) {
          Logger.info(`[Room: ${rid}] All users ready. Resuming playback.`);
          roomState[rid].playbackState.isPlaying = true;
          roomState[rid].playbackState.lastUpdateTimestamp = Date.now();
          io.to(rid).emit('serverUpdateState', roomState[rid]);
        }
      }
    }
    if (rid) {
      Logger.debug(`[Room: ${rid}] User ${user.email} buffering: ${isBuffering}`);
    }
  });


  // WebRTC signaling
  socket.on('p2pSignal', (payload: { target: string; data: any }) => {
    io.to(payload.target).emit('p2pSignal', {
      sender: socket.id,
      data: payload.data,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    Logger.info(`User ${user.email} (${socket.id}) disconnected`);
    const rid = authSocket.roomId;

    if (rid && roomState[rid]) {
      socket.to(rid).emit('partner-offline', socket.id);
      socket.to(rid).emit('partnerBuffering', false);

      // Grace Period Logic
      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(rid);
        if (!room || room.size === 0) {
          Logger.info(`[Room: ${rid}] Room is empty. Starting 60s deletion timer.`);
          roomTimers[rid] = setTimeout(() => {
            const roomAfterDelay = io.sockets.adapter.rooms.get(rid);
            if (!roomAfterDelay || roomAfterDelay.size === 0) {
              Logger.info(`[Room: ${rid}] Deleting room state after 60s.`);
              delete roomState[rid];
              delete roomTimers[rid]; 
            }
          }, 60000); 
        }
      }, 500); 
    }
  });
});

httpServer.listen(PORT, () => {
  Logger.info(`BlurChat server listening on port ${PORT}`);
});