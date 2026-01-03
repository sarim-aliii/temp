import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { IUser } from '../models/User';
import JournalEntry from '../models/JournalEntry';
import Logger from '../utils/logger';
import { getRoomId } from '../utils/roomUtils';

const router = Router();

/**
 * @route   POST /api/journal
 * @desc    Save a new journal entry
 * @access  Private
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { content } = req.body;
  const user = req.user as IUser;

  if (!user.pairedWithUserId) {
    return res.status(400).json({ message: 'You must be paired to use the journal.' });
  }
  if (!content) {
    return res.status(400).json({ message: 'Content is required.' });
  }

  try {
    const roomId = getRoomId(user.id, user.pairedWithUserId);
    
    const newEntry = new JournalEntry({
      roomId,
      authorId: user.id,
      content,
    });
    
    await newEntry.save();
    
    res.status(201).json(newEntry);
  } catch (error) {
    Logger.error('Save Journal Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/journal
 * @desc    Load all journal entries for the user's room
 * @access  Private
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const user = req.user as IUser;

  if (!user.pairedWithUserId) {
    return res.status(400).json({ message: 'You must be paired to use the journal.' });
  }
  
  try {
    const roomId = getRoomId(user.id, user.pairedWithUserId);
    
    // Find all entries for this room and sort them by creation date
    const entries = await JournalEntry.find({ roomId })
      .sort({ createdAt: 'asc' })
      .populate('authorId', 'email id'); // Get author's email/id
      
    res.status(200).json(entries);
  } catch (error) {
    Logger.error('Load Journal Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;