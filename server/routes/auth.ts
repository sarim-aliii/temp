import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import User, { IUser } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import Logger from '../utils/logger';
import { sendEmail } from '../utils/emailService'; 

const router = Router();

// --- Helper: Generate JWT Token ---
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

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
      name: user.name,
      avatar: user.avatar,
      isPremium: user.isPremium,
      isVerified: user.isVerified, // Critical for frontend routing
      pairedWithUserId: user.pairedWithUserId,
    });
  } catch (error) {
    Logger.error('Get Me Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/signup
 * @desc    Register user, generate OTP, send email
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

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

    // --- Generate OTP ---
    const verificationCode = generateOTP();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    const newUser = new User({
      email: email.toLowerCase(),
      passHash,
      name: name || email.split('@')[0],
      verificationCode, 
      verificationCodeExpires,
      isVerified: false
    });

    const savedUser = await newUser.save();

    // --- Send Verification Email ---
    await sendEmail({
      to: savedUser.email,
      subject: 'Verify your BlurChat Identity',
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 20px;">
          <h2>IDENTITY VERIFICATION</h2>
          <p>Use the following code to complete your secure login:</p>
          <h1 style="color: #ef4444; letter-spacing: 5px;">${verificationCode}</h1>
          <p style="opacity: 0.7;">This code expires in 1 hour.</p>
        </div>
      `
    });

    // Send back a token
    const token = generateToken(savedUser.id);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        isPremium: savedUser.isPremium,
        isVerified: false,
        pairedWithUserId: savedUser.pairedWithUserId,
      },
    });

  } catch (error) {
    Logger.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify the OTP code
 */
router.post('/verify-email', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { token } = req.body; // Frontend sends code as "token"
    const userId = (req.user as IUser).id;

    const user = await User.findById(userId).select('+verificationCode +verificationCodeExpires');

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) {
      return res.status(200).json({ message: 'User already verified', user });
    }

    // Check Code
    if (user.verificationCode !== token) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check Expiry
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    // Mark Verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verified successfully',
      token: generateToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        isVerified: true
      }
    });

  } catch (error) {
    Logger.error('Verification Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    // Generate new OTP
    const verificationCode = generateOTP();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send Email
    await sendEmail({
      to: user.email,
      subject: 'New Verification Code',
      html: `
        <div style="font-family: monospace; background: #000; color: #fff; padding: 20px;">
          <h2>NEW SIGNAL RECEIVED</h2>
          <p>Your new verification code is:</p>
          <h1 style="color: #ef4444; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
      `
    });

    res.status(200).json({ message: 'Verification code resent' });

  } catch (error) {
    Logger.error('Resend Error:', error);
    res.status(500).json({ message: 'Server error' });
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
        isVerified: user.isVerified,
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
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/#/login?error=true` : 'http://localhost:3000/#/login?error=true',
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