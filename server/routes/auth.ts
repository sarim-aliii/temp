import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import { 
  registerUser, 
  loginUser, 
  verifyEmail, 
  getUserProfile, 
  resendVerificationEmail,
  forgotPassword,
  resetPassword 
} from '../controllers/authController';

const router = Router();



router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail); 
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authMiddleware, getUserProfile);
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/#/login?error=true` : 'http://localhost:3000/#/login?error=true',
    failureMessage: true,
    session: false,
  }),

  (req, res) => {
    // Generate token for the redirected user
    const user: any = req.user;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
        console.error('JWT_SECRET missing');
        return res.redirect('/#/login?error=server_config');
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: '30d', 
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/#/auth/callback?token=${token}`);
  }
);

export default router;