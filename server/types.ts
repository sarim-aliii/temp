import { Socket } from 'socket.io';
import { IUser } from './models/User';

export interface AuthenticatedSocket extends Socket {
  user?: IUser;
  userId?: string;
  roomId?: string;
  isBuffering?: boolean;
}

export interface VideoSource {
  type: 'youtube' | 'url' | 'file' | 'screen' | null;
  src: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  lastUpdateTimestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;  
  senderAvatar?: string;
  content: string;
  audio?: string;
  image?: string;
  type?: 'text' | 'audio' | 'image' | 'system';
  timestamp: string | number;
}

export interface UIState {
  isSidebarVisible: boolean;
}

export interface AmbientSound {
  track: 'rain' | 'fireplace' | 'ocean' | 'forest' | 'breeze' | 'cafe' | null;
  isPlaying: boolean;
  volume: number;
}

export interface IJournalEntry {
  _id?: string;
  roomId: string;
  authorId: string;
  content: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface RoomState {
  roomId: string;
  videoSource: VideoSource;
  playbackState: PlaybackState;
  messages: ChatMessage[];
  uiState: UIState;
  isScreenSharing: boolean;
  typingUser: string | null; 
  ambientSound: AmbientSound;
  journalEntries: IJournalEntry[];
  isPremium: boolean;
  createdAt: number;
}

export type ClientAction =
  | { type: 'UPDATE_PLAYBACK_STATE'; payload: Partial<PlaybackState> }
  | { type: 'UPDATE_PLAYBACK_TIME'; payload: { currentTime: number } }
  | { type: 'UPDATE_VIDEO_SOURCE'; payload: VideoSource }
  | { type: 'SEND_MESSAGE'; payload: { content: string; type?: 'text' | 'audio' | 'image'; image?: string; } }
  | { type: 'SET_TYPING'; payload: { isTyping: boolean } }
  | { type: 'UPDATE_UI_STATE'; payload: Partial<UIState> }
  | { type: 'SET_AMBIENT_SOUND'; payload: Partial<AmbientSound> }
  | { type: 'CREATE_JOURNAL_ENTRY'; payload: { content: string } }
  | { type: 'CHECK_PREMIUM_STATUS' };