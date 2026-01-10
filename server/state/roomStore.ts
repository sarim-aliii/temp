import { RoomState } from '../types';
import redisClient from '../services/redis'; 
import Logger from '../utils/logger';


export const roomTimers: Record<string, NodeJS.Timeout> = {};

const ROOM_TTL = 24 * 60 * 60; // Room state expires after 24 hours of inactivity

export const getDefaultRoomState = (roomId: string): RoomState => ({
  roomId,
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

// --- Redis Helpers ---

/**
 * Fetches the room state from Redis.
 * Returns null if not found or if Redis is down.
 */
export const getRoomState = async (roomId: string): Promise<RoomState | null> => {
  try {
    if (!redisClient.isOpen) return null;
    
    const data = await redisClient.get(`room:${roomId}`);
    if (data) {
      return JSON.parse(typeof data === 'string' ? data : data.toString()) as RoomState;
    }
    return null;
  } catch (error) {
    Logger.error(`Redis Get Error [${roomId}]:`, error);
    return null;
  }
};

/**
 * Saves the room state to Redis with an expiration time (TTL).
 */
export const saveRoomState = async (roomId: string, state: RoomState) => {
  try {
    if (!redisClient.isOpen) return;
    
    // Convert object to string and save with Expiration (EX)
    await redisClient.set(`room:${roomId}`, JSON.stringify(state), {
      EX: ROOM_TTL 
    });
  } catch (error) {
    Logger.error(`Redis Save Error [${roomId}]:`, error);
  }
};