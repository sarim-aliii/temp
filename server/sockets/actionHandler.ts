import { Server, Socket } from 'socket.io';
import { ClientAction, AuthenticatedSocket } from '../types';
import { roomState, getDefaultRoomState } from '../state/roomStore';
import JournalEntry from '../models/JournalEntry';
import User from '../models/User';
import Logger from '../utils/logger';

export const handleClientAction = async (
  io: Server,
  socket: Socket,
  user: any,
  action: ClientAction
) => {
  const authSocket = socket as unknown as AuthenticatedSocket;
  const rid = authSocket.roomId;
  
  if (!rid || !roomState[rid]) return;

  Logger.debug(`[Room: ${rid}] Action: ${action.type} from ${user.email}`);

  const currentState = roomState[rid];
  const serverTime = Date.now();

  // Handle buffering recovery
  if (authSocket.isBuffering) {
    if (['UPDATE_PLAYBACK_STATE', 'UPDATE_PLAYBACK_TIME'].includes(action.type)) {
      authSocket.isBuffering = false;
      socket.to(rid).emit('partnerBuffering', false);
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
        isPlaying: false,
        lastUpdateTimestamp: serverTime,
      };
      currentState.isScreenSharing = action.payload.type === 'screen';
      break;

    case 'SEND_MESSAGE':
      if (currentState.messages.length > 50) currentState.messages.shift();
      currentState.messages.push(action.payload);
      io.to(rid).emit('newChatMessage', action.payload);
      // We return here because we already emitted the specific event
      roomState[rid] = currentState;
      return;

    case 'SET_TYPING':
      currentState.typingUser = action.payload.isTyping ? user.email : null;
      socket.to(rid).emit('partnerTyping', currentState.typingUser);
      roomState[rid] = currentState;
      return;

    case 'UPDATE_PLAYBACK_TIME':
      currentState.playbackState.currentTime = action.payload.currentTime;
      currentState.playbackState.lastUpdateTimestamp = serverTime;
      break;

    case 'UPDATE_UI_STATE':
      currentState.uiState = { ...currentState.uiState, ...action.payload };
      break;

    case 'SET_AMBIENT_SOUND':
      currentState.ambientSound = { ...currentState.ambientSound, ...action.payload };
      break;

    case 'CREATE_JOURNAL_ENTRY':
      try {
        const newEntry = new JournalEntry({
          roomId: rid,
          authorId: user._id,
          content: action.payload.content,
        });
        const savedEntry = await newEntry.save();
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
      } catch (e) {
        Logger.error("Failed to save journal entry:", e);
        socket.emit('error', { message: 'Failed to save journal entry.' });
        return;
      }

    case 'CHECK_PREMIUM_STATUS':
      try {
        const freshUser = await User.findById(user._id);
        const partner = await User.findById(user.pairedWithUserId);
        const isRoomPremium = (freshUser?.isPremium) || (partner?.isPremium) || false;

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

  // Sync state after update
  roomState[rid] = currentState;
  io.to(rid).emit('serverUpdateState', currentState);
};