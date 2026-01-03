import mongoose from 'mongoose';

/**
 * Generate a room ID from two user IDs
 * The IDs are sorted to ensure consistent room IDs regardless of order
 */
export const getRoomId = (
  userId1: string | mongoose.Schema.Types.ObjectId,
  userId2: string | mongoose.Schema.Types.ObjectId
): string => {
  return [userId1.toString(), userId2.toString()].sort().join('_');
};

