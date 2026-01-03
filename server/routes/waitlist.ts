import express, { Request, Response, Router } from 'express';
import Waitlist, { IWaitlist } from '../models/Waitlist';
import { sendEmail, getWaitlistConfirmationEmail } from '../utils/emailService';
import Logger from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/waitlist/register
 * @desc    Register email for waitlist
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already registered
    const existingEntry = await Waitlist.findOne({ email: normalizedEmail });
    if (existingEntry) {
      return res.status(200).json({
        success: true,
        message: 'You are already on the waitlist!',
        position: existingEntry.position,
        alreadyRegistered: true,
      });
    }

    // Get total count to determine position
    const totalCount = await Waitlist.countDocuments();
    const position = totalCount + 1;

    // Create new waitlist entry
    const newEntry = new Waitlist({
      email: normalizedEmail,
      position: position,
    });

    await newEntry.save();
    Logger.info(`New waitlist registration: ${normalizedEmail} (Position: ${position})`);

    // Send confirmation email (don't block response if email fails)
    sendEmail(getWaitlistConfirmationEmail(normalizedEmail, position))
      .then((success) => {
        if (success) {
          newEntry.notified = true;
          newEntry.notifiedAt = new Date();
          newEntry.save().catch((err) => {
            Logger.error('Failed to update notification status:', err);
          });
        }
      })
      .catch((err) => {
        Logger.error('Failed to send waitlist confirmation email:', err);
      });

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position: position,
      alreadyRegistered: false,
    });

  } catch (error: any) {
    Logger.error('Waitlist registration error:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      const existingEntry = await Waitlist.findOne({ email: req.body.email?.toLowerCase().trim() });
      if (existingEntry) {
        return res.status(200).json({
          success: true,
          message: 'You are already on the waitlist!',
          position: existingEntry.position,
          alreadyRegistered: true,
        });
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration. Please try again.' 
    });
  }
});

/**
 * @route   GET /api/waitlist/position/:email
 * @desc    Get waitlist position for an email
 * @access  Public
 */
router.get('/position/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email?.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email parameter is required' 
      });
    }

    const entry = await Waitlist.findOne({ email });
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found on waitlist' 
      });
    }

    res.status(200).json({
      success: true,
      position: entry.position,
      registeredAt: entry.registeredAt,
    });

  } catch (error) {
    Logger.error('Error fetching waitlist position:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   GET /api/waitlist/stats
 * @desc    Get waitlist statistics (total count)
 * @access  Public
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalCount = await Waitlist.countDocuments();
    
    res.status(200).json({
      success: true,
      totalRegistrations: totalCount,
    });

  } catch (error) {
    Logger.error('Error fetching waitlist stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   DELETE /api/waitlist/reset
 * @desc    Delete all waitlist entries (reset waitlist)
 * @access  Public
 */
router.delete('/reset', async (req: Request, res: Response) => {
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
    res.status(500).json({ 
      success: false, 
      message: 'Server error during reset' 
    });
  }
});

export default router;

