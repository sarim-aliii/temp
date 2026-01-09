import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedSocket } from '../types';
import User from '../models/User';
import JournalEntry from '../models/JournalEntry';
import Logger from '../utils/logger';
import { getRoomId } from '../utils/roomUtils';
import { roomState, roomTimers, getDefaultRoomState } from '../state/roomStore';
import { handleClientAction } from './actionHandler';


// --- Constants ---
const SYNC_INTERVAL = 1500;
const FREE_TRIAL_LIMIT = 24 * 60 * 60 * 1000;

export const initSocketServer = (io: Server) => {
  
  // 1. Master Clock / Sync Loop
  setInterval(() => {
    const now = Date.now();
    for (const roomId in roomState) {
      const state = roomState[roomId];
      const timeInRoom = now - state.createdAt;

      // Check Free Trial
      if (!state.isPremium && timeInRoom > FREE_TRIAL_LIMIT && state.videoSource.type !== null) {
        Logger.warn(`[Room: ${roomId}] Free trial expired.`);
        state.videoSource = { type: null, src: null };
        state.playbackState.isPlaying = false;
        io.to(roomId).emit('serverUpdateState', state);
        io.to(roomId).emit('serverNotification', { 
            type: 'error', 
            message: 'Free trial expired. Go premium to continue.' 
        });
        continue;
      }

      // Advance Clock
      if (state.playbackState.isPlaying) {
        const timeElapsed = now - state.playbackState.lastUpdateTimestamp;
        state.playbackState.currentTime += (timeElapsed / 1000) * state.playbackState.playbackRate;
        state.playbackState.lastUpdateTimestamp = now;
        io.to(roomId).emit('serverUpdateState', state);
      }
    }
  }, SYNC_INTERVAL);

  // 2. Authentication Middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token provided.'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found.'));
      (socket as unknown as AuthenticatedSocket).user = user;
      next();
    } catch (err) {
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
    socket.join(roomId);

    // Cancel deletion timer
    if (roomTimers[roomId]) {
      clearTimeout(roomTimers[roomId]);
      delete roomTimers[roomId];
    }

    // Initialize Room if needed
    if (!roomState[roomId]) {
      roomState[roomId] = getDefaultRoomState();
      try {
        const partner = await User.findById(user.pairedWithUserId);
        const isPremium = user.isPremium || partner?.isPremium || false;
        const entries = await JournalEntry.find({ roomId }).sort({ createdAt: 'asc' });
        
        roomState[roomId].journalEntries = entries.map(e => ({
          ...e.toObject(),
          _id: e._id.toString(),
          authorId: e.authorId.toString()
        })) as any;
        
        roomState[roomId].isPremium = isPremium;
        roomState[roomId].createdAt = Date.now();
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

    socket.emit('room-joined', {
      roomId,
      initialState: roomState[roomId],
      sessionId: socket.id,
      partnerSocketId,
    });
    socket.to(roomId).emit('partner-online', socket.id);

    // --- Events ---
    socket.on('clientAction', (action) => handleClientAction(io, socket, user, action));

    socket.on('reportBuffering', (isBuffering: boolean) => {
      authSocket.isBuffering = isBuffering;
      socket.to(roomId).emit('partnerBuffering', isBuffering);
      
      if (!isBuffering && !roomState[roomId].playbackState.isPlaying) {
         // Logic to resume if partner is also ready could go here
      }
    });

    socket.on('p2pSignal', (payload) => {
      io.to(payload.target).emit('p2pSignal', { sender: socket.id, data: payload.data });
    });

    socket.on('disconnect', () => {
      Logger.info(`User ${user.email} disconnected`);
      if (roomId && roomState[roomId]) {
        socket.to(roomId).emit('partner-offline', socket.id);
        
        // Grace Period / Room Deletion
        setTimeout(() => {
           const room = io.sockets.adapter.rooms.get(roomId);
           if (!room || room.size === 0) {
             roomTimers[roomId] = setTimeout(() => {
               const checkRoom = io.sockets.adapter.rooms.get(roomId);
               if (!checkRoom || checkRoom.size === 0) {
                 delete roomState[roomId];
                 delete roomTimers[roomId];
               }
             }, 60000);
           }
        }, 500);
      }
    });
  });
};