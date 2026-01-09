import { RoomState } from '../types';

// The single source of truth for room data
export const roomState: Record<string, RoomState> = {};
export const roomTimers: Record<string, NodeJS.Timeout> = {};

export const getDefaultRoomState = (): RoomState => ({
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