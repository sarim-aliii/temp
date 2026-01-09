import { Request, Response } from 'express';
import Waitlist from '../models/Waitlist';
import { 
  sendEmail, 
  getWaitlistConfirmationEmail,
  getAccessGrantedEmail
} from '../utils/emailService';
import Logger from '../utils/logger';


// @desc    Register email for waitlist
// @route   POST /api/waitlist/register
// @access  Public
export const registerWaitlist = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    const existingEntry = await Waitlist.findOne({ email: normalizedEmail });
    if (existingEntry) {
      res.status(200).json({
        success: true,
        message: 'You are already on the waitlist!',
        position: existingEntry.position,
        alreadyRegistered: true,
      });
      return;
    }

    // Create new
    const totalCount = await Waitlist.countDocuments();
    const position = totalCount + 1;

    const newEntry = new Waitlist({
      email: normalizedEmail,
      position: position,
    });

    await newEntry.save();
    Logger.info(`New waitlist registration: ${normalizedEmail} (Position: ${position})`);

    // Send email (async)
    sendEmail(getWaitlistConfirmationEmail(normalizedEmail, position))
      .then((success) => {
        if (success) {
          newEntry.notified = true;
          newEntry.notifiedAt = new Date();
          newEntry.save().catch((err) => Logger.error('Failed to update notification status:', err));
        }
      })
      .catch((err) => Logger.error('Failed to send waitlist confirmation email:', err));

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position: position,
      alreadyRegistered: false,
    });

  } catch (error: any) {
    Logger.error('Waitlist registration error:', error);
    if (error.code === 11000) {
      const existingEntry = await Waitlist.findOne({ email: req.body.email?.toLowerCase().trim() });
      if (existingEntry) {
        res.status(200).json({
          success: true,
          message: 'You are already on the waitlist!',
          position: existingEntry.position,
          alreadyRegistered: true,
        });
        return;
      }
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Get waitlist position for an email
// @route   GET /api/waitlist/position/:email
// @access  Public
export const getWaitlistPosition = async (req: Request, res: Response) => {
  try {
    const email = req.params.email?.toLowerCase().trim();

    if (!email) {
      res.status(400).json({ success: false, message: 'Email parameter is required' });
      return;
    }

    const entry = await Waitlist.findOne({ email });
    
    if (!entry) {
      res.status(404).json({ success: false, message: 'Email not found on waitlist' });
      return;
    }

    res.status(200).json({
      success: true,
      position: entry.position,
      registeredAt: entry.createdAt,
    });

  } catch (error) {
    Logger.error('Error fetching waitlist position:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get waitlist statistics
// @route   GET /api/waitlist/stats
// @access  Public
export const getWaitlistStats = async (req: Request, res: Response) => {
  try {
    const totalCount = await Waitlist.countDocuments();
    res.status(200).json({ success: true, totalRegistrations: totalCount });
  } catch (error) {
    Logger.error('Error fetching waitlist stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset waitlist
// @route   DELETE /api/waitlist/reset
// @access  Private
export const resetWaitlist = async (req: Request, res: Response) => {
  try {
    const result = await Waitlist.deleteMany({});
    Logger.info(`Waitlist reset: Deleted ${result.deletedCount} entries`);
    
    res.status(200).json({
      success: true,
      message: `Waitlist reset successfully. Deleted ${result.deletedCount} entries.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    Logger.error('Error resetting waitlist:', error);
    res.status(500).json({ success: false, message: 'Server error during reset' });
  }
};


// @desc    Get all waitlist users
// @route   GET /api/waitlist/all
// @access  Private (Admin Only)
export const getWaitlistUsers = async (req: Request, res: Response) => {
  try {
    const users = await Waitlist.find({}).sort({ position: 1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    Logger.error('Error fetching waitlist users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// @desc    Approve a waitlist user
// @route   PUT /api/waitlist/approve/:id
// @access  Private (Admin Only)
export const approveWaitlistUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const entry = await Waitlist.findById(id);
    if (!entry) {
       res.status(404).json({ success: false, message: 'User not found' });
       return;
    }

    if (entry.approved) {
       res.status(400).json({ success: false, message: 'User already approved' });
       return;
    }

    // Update status
    entry.approved = true;
    await entry.save();

    Logger.info(`Waitlist user approved: ${entry.email}`);

    // Send "Access Granted" Email
    sendEmail(getAccessGrantedEmail(entry.email))
      .then(() => Logger.info(`Access email sent to ${entry.email}`))
      .catch(err => Logger.error(`Failed to send access email to ${entry.email}`, err));

    res.status(200).json({ success: true, message: 'User approved and notified', data: entry });

  } catch (error) {
    Logger.error('Error approving user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};