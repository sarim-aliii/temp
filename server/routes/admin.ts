import { Router } from 'express';
import User from '../models/User';

const router = Router();

// Simple Middleware to check Admin Key
const verifyAdmin = (req: any, res: any, next: any) => {
  const key = req.headers['x-admin-key'];
  // Ensure you add ADMIN_KEY=some_secret_password to your .env file
  if (!key || key !== process.env.ADMIN_KEY) { 
    return res.status(403).json({ message: 'Access Denied' });
  }
  next();
};

// GET /api/admin/users - Fetch all registered users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -googleId') // Exclude sensitive info
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/stats - Quick stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    // Assuming $4.99 per premium user
    const revenue = premiumUsers * 4.99; 

    res.json({ totalUsers, premiumUsers, revenue });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;