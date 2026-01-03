import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User, { IUser } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import Logger from '../utils/logger';

const router = Router();


// Helper function to generate a JWT token
const generateToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    Logger.error('JWT_SECRET is not defined. Server cannot sign tokens.');
    throw new Error('Server configuration error');
  }
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user data from token
 * @access  Private
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      isPremium: user.isPremium,
      pairedWithUserId: user.pairedWithUserId,
    });
  } catch (error) {
    Logger.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email: email.toLowerCase(),
      passHash,
    });

    const savedUser = await newUser.save();

    // Send back a token
    const token = generateToken(savedUser.id);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        isPremium: savedUser.isPremium,
        pairedWithUserId: savedUser.pairedWithUserId, // Added this
      },
    });

  } catch (error) {
    Logger.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

/**
 * @route   POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passHash');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.passHash && user.googleId) {
      return res.status(400).json({
        message: 'This account was created with Google. Please log in using Google.',
        code: 'GOOGLE_ACCOUNT'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Send back a token
    const token = generateToken(user.id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        pairedWithUserId: user.pairedWithUserId,
      },
    });

  } catch (error) {
    Logger.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});


/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));


/**
 * @route   GET /api/auth/google/callback
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000/#/login?error=true',
    failureMessage: true,
    session: false,
  }),

  (req: Request, res: Response) => {
    const user: any = req.user;
    const token = generateToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.redirect(`${frontendUrl}/#/auth/callback?token=${token}`);
  });

export default router;