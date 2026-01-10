import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from '../types';
import User from '../models/User';
import JournalEntry from '../models/JournalEntry';
import Message from '../models/Message';
import Logger from '../utils/logger';
import { getRoomId } from '../utils/roomUtils';
import { getRoomState, saveRoomState, getDefaultRoomState, roomTimers } from '../state/roomStore'; 
import { handleClientAction } from './actionHandler';


// --- Constants ---
const SYNC_INTERVAL = 1500;
const FREE_TRIAL_LIMIT = 24 * 60 * 60 * 1000; // 24 Hours

export const initSocketServer = (io: Server) => {
  
  setInterval(async () => {
    const now = Date.now();
    
    // Iterate only over rooms that have active connections on this server
    const activeRooms = io.sockets.adapter.rooms;

    for (const [roomId, sockets] of activeRooms) {
      // Filter out non-chat rooms (socket IDs are also rooms)
      if (sockets.size === 0 || roomId.length < 20) continue; 

      // Fetch state from Redis
      const state = await getRoomState(roomId);
      if (!state) continue;

      let hasChanges = false;

      // Check Free Trial
      if (!state.isPremium && (now - state.createdAt) > FREE_TRIAL_LIMIT && state.videoSource.type !== null) {
        state.videoSource = { type: null, src: null };
        state.playbackState.isPlaying = false;
        
        io.to(roomId).emit('serverNotification', { 
            type: 'error', 
            message: 'Free trial expired. Go premium to continue.' 
        });
        hasChanges = true;
      }

      // Advance Clock if Playing
      if (state.playbackState.isPlaying) {
        const timeElapsed = now - state.playbackState.lastUpdateTimestamp;
        state.playbackState.currentTime += (timeElapsed / 1000) * state.playbackState.playbackRate;
        state.playbackState.lastUpdateTimestamp = now;
        hasChanges = true;
      }

      // Save and Broadcast if changed
      if (hasChanges) {
        await saveRoomState(roomId, state);
        io.to(roomId).emit('serverUpdateState', state);
      }
    }
  }, SYNC_INTERVAL);

  // 2. Authentication Middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('No token provided.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) {
          return next(new Error('User not found.'));
      }
      (socket as unknown as AuthenticatedSocket).user = user;
      next();
    } catch (err: any) {
      next(new Error('Invalid token.'));
    }
  });

  // 3. Connection Handler
  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as unknown as AuthenticatedSocket;
    const user = authSocket.user!;
    authSocket.isBuffering = false;

    if (!user.pairedWithUserId) {
      socket.emit('error', { message: 'User is not paired.' });
      return;
    }

    const roomId = getRoomId(user._id.toString(), user.pairedWithUserId.toString());
    authSocket.roomId = roomId;
    authSocket.userId = user._id.toString();
    socket.join(roomId);

    // Cancel deletion timer if it exists (in-memory timer is fine for short disconnected grace periods)
    if (roomTimers[roomId]) {
      clearTimeout(roomTimers[roomId]);
      delete roomTimers[roomId];
    }

    // --- Initialize Room State from Redis ---
    let currentState = await getRoomState(roomId);

    if (!currentState) {
      Logger.info(`[Redis] Initializing new room: ${roomId}`);
      currentState = getDefaultRoomState(roomId);
      
      try {
        const partner = await User.findById(user.pairedWithUserId);
        const isPremium = user.isPremium || partner?.isPremium || false;
        
        // Load Data from DB
        const entries = await JournalEntry.find({ roomId }).sort({ createdAt: 'asc' });
        const messages = await Message.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50);
        
        const history = messages.reverse().map(msg => ({
          id: msg._id.toString(),
          senderId: msg.senderId.toString(),
          senderName: msg.senderName,
          senderAvatar: msg.senderAvatar,
          content: msg.content,
          image: msg.image, 
          type: msg.type,
          timestamp: msg.createdAt.toISOString()
        }));

        currentState.journalEntries = entries.map(e => ({
          ...e.toObject(),
          _id: e._id.toString(),
          authorId: e.authorId.toString()
        })) as any;

        currentState.messages = history as any;
        currentState.isPremium = isPremium;
        
        // Save initialized state to Redis
        await saveRoomState(roomId, currentState);

      } catch (e) {
        Logger.error("Error loading room data", e);
      }
    }

    // Identify Partner
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    let partnerSocketId: string | null = null;
    if (roomSockets) {
      for (const id of roomSockets) {
        if (id !== socket.id) {
          partnerSocketId = id;
          break;
        }
      }
    }

    // Emit Join Event
    socket.emit('room-joined', {
      roomId,
      initialState: currentState,
      sessionId: socket.id,
      partnerSocketId,
    });
    
    socket.to(roomId).emit('partner-online', socket.id);

    // --- Events ---
    socket.on('clientAction', (action) => handleClientAction(io, socket, user, action));

    socket.on('reportBuffering', (isBuffering: boolean) => {
      authSocket.isBuffering = isBuffering;
      socket.to(roomId).emit('partnerBuffering', isBuffering);
    });

    socket.on('p2pSignal', (payload) => {
      io.to(payload.target).emit('p2pSignal', { sender: socket.id, data: payload.data });
    });

    socket.on('disconnect', () => {
      // Logger.info(`User ${user.email} disconnected`);
      if (roomId) {
        socket.to(roomId).emit('partner-offline', socket.id);
        
        // Grace Period Logic
        setTimeout(() => {
           const room = io.sockets.adapter.rooms.get(roomId);
           if (!room || room.size === 0) {

           }
        }, 500);
      }
    });
  });
};