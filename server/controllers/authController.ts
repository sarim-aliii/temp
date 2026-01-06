import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { firebaseAdmin } from '../config/firebaseAdmin';
import { sendEmail } from '../utils/emailService';

// Helper: Generate JWT
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError('An account with this email already exists.', 400);
  }

  // 1. Generate 6-digit OTP (Plain text for email)
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  
  // 2. Hash the token for database storage (Security)
  const verificationTokenHash = crypto.createHash('sha256').update(verificationCode).digest('hex');

  const user = await User.create({
    email,
    password, // Virtual field in User model will hash this to passHash
    name: name || email.split('@')[0],
    authMethod: 'email',
    verificationToken: verificationTokenHash,
    isVerified: false,
    avatar: 'https://picsum.photos/200'
  });

  if (user) {
    // Send Email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>Thanks for signing up for BlurChats!</p>
        <p>Please use the following OTP to verify your account:</p>
        
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>

        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'BlurChats - Verify Your Account',
        html: message,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for the verification code.',
        email: user.email
        // NOTE: We do NOT send the token here. User must verify first.
      });
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      throw new AppError('User registered, but failed to send verification email.', 500);
    }
  } else {
    throw new AppError('Invalid user data', 400);
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Select passHash because it is excluded by default
  const user = await User.findOne({ email }).select('+passHash');

  if (user && user.authMethod !== 'email') {
    throw new AppError(`This account exists but was created with ${user.authMethod}. Please use that sign-in method.`, 401);
  }

  if (user && (await user.matchPassword(password))) {
    // Check if verified
    if (!user.isVerified) {
      throw new AppError('Please verify your email address before logging in.', 403);
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
      isVerified: user.isVerified
    });
  } else {
    throw new AppError('Invalid email or password', 401);
  }
});

// @desc    Verify User Email
// @route   POST /api/auth/verify-email
// @access  Public (No Token Required)
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, token } = req.body; // User provides Email AND Code

  if (!email || !token) {
    throw new AppError('Please provide both email and verification code.', 400);
  }

  // Hash the incoming code to compare with DB
  const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by email AND matching hash
  const user = await User.findOne({
    email: email.toLowerCase(),
    verificationToken: verificationTokenHash
  });

  if (!user) {
    throw new AppError('Invalid verification code or email.', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined; // Clear the token
  await user.save();

  res.status(200).json({
    message: "Email verified successfully",
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user.id.toString()), // Log the user in immediately
  });
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).select('-password');
  if (user) {
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isPremium: user.isPremium,
      isVerified: user.isVerified,
      pairedWithUserId: user.pairedWithUserId,
    });
  } else {
    throw new AppError('User not found', 404);
  }
});

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("This account is already verified.", 400);
  }

  // Generate NEW Token
  const verificationToken = crypto.randomInt(100000, 999999).toString();
  const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  // Update User
  user.verificationToken = verificationTokenHash;
  await user.save();

  // Send Email
  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify Your Email</h2>
      <p>You requested a new verification code for BlurChats.</p>
      <p>Please use the following OTP to verify your account:</p>
      
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${verificationToken}</h1>
      </div>

      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'BlurChats - New Verification Code',
    html: message,
  });

  res.status(200).json({ message: "Verification code sent" });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.authMethod === 'google') {
    throw new AppError(`You registered with ${user.authMethod}. Please sign in with that.`, 400);
  }

  const resetOTP = crypto.randomInt(100000, 999999).toString();

  user.resetPasswordToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes
  await user.save();

  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Reset Your Password</h2>
      <p>Please use the following code to reset your password:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center;">
        <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${resetOTP}</h1>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'BlurChats - Password Reset Code',
      html: message,
    });
    res.status(200).json({ message: "OTP sent to email" });
  } catch (emailError) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    throw new AppError("Email could not be sent", 500);
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;

  const resetPasswordTokenHash = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    resetPasswordToken: resetPasswordTokenHash,
    resetPasswordExpire: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError("Invalid Code or Expired", 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    });
  } else {
    throw new AppError('User not found', 404);
  }
});

// Helper for Social Login (Firebase)
const socialLoginHandler = async (req: Request, res: Response, provider: 'google') => {
  const { idToken } = req.body;

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    let { email, uid, picture, name } = decodedToken;

    if (!email) {
      console.warn(`[${provider}] Email missing for UID: ${uid}. Using placeholder.`);
      email = `${uid}@${provider}.placeholder.com`;
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.authMethod !== provider && user.authMethod !== 'email' && !user.email.includes('.placeholder.com')) {
        throw new AppError(`This email is already associated with a ${user.authMethod} account.`, 400);
      }

      user.authMethod = provider;
      if (!user.isVerified) user.isVerified = true;
      await user.save();

    } else {
      user = await User.create({
        email,
        name: name || email?.split('@')[0] || 'User',
        avatar: picture || 'avatar-1',
        authMethod: provider,
        isVerified: true
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
    });

  } catch (error: any) {
    console.error(`${provider} Auth Error:`, error);
    // If it's already an AppError, rethrow it
    if (error instanceof AppError) throw error;
    throw new AppError(`${provider} Sign-In failed. Invalid token.`, 401);
  }
};

// @desc    Google Login (Firebase - kept if needed for Mobile/API)
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  await socialLoginHandler(req, res, 'google');
});