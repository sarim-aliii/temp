import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import User, { IUser } from '../models/User';
import { nanoid } from 'nanoid';
import Logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/pairing/generate-code
 */
router.post('/generate-code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user) return res.status(401).json({ message: 'Not authorized' });

    // Check if user is already paired
    if (user.pairedWithUserId) {
      return res.status(400).json({ message: 'User is already paired' });
    }

    // Generate a 6-char, uppercase, alphanumeric code
    const newCode = nanoid(6).toUpperCase();

    // Save the code to the user's document
    user.inviteCode = newCode;
    await user.save();

    res.status(200).json({ inviteCode: newCode });
  } catch (error) {
    Logger.error('Generate Code Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/pairing/link-partner
 */
router.post('/link-partner', authMiddleware, async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  const user = req.user as IUser;
  
  if (!user) return res.status(401).json({ message: 'Not authorized' });

  if (!inviteCode) {
    return res.status(400).json({ message: 'Invite code is required' });
  }

  try {
    // 1. Check if the current user is already paired
    if (user.pairedWithUserId) {
      return res.status(400).json({ message: 'You are already paired' });
    }

    // 2. Find the partner with that code
    const partner = await User.findOne({ inviteCode: inviteCode });

    if (!partner) {
      return res.status(404).json({ message: 'Invalid or expired invite code' });
    }

    // 3. Check if the partner is already paired
    if (partner.pairedWithUserId) {
      return res.status(400).json({ message: 'This code has already been used' });
    }

    // 4. Don't let users pair with themselves
    if (partner.id === user.id) {
      return res.status(400).json({ message: 'You cannot pair with yourself' });
    }

    // 5. Link the accounts!
    user.pairedWithUserId = partner.id;
    user.inviteCode = undefined;      
    
    partner.pairedWithUserId = user.id;
    partner.inviteCode = undefined;
    
    await user.save();
    await partner.save();

    res.status(200).json({ 
      message: 'Pairing successful!',
      user: user,
    });

  } catch (error) {
    Logger.error('Link Partner Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;