import { Router } from 'express';
import { 
  registerWaitlist, 
  getWaitlistPosition, 
  getWaitlistStats, 
  getWaitlistUsers,
  approveWaitlistUser,
  resetWaitlist,
} from '../controllers/waitlistController';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

router.post('/register', registerWaitlist);
router.get('/position/:email', getWaitlistPosition);
router.get('/stats', getWaitlistStats);
router.delete('/reset', requireAdmin, resetWaitlist);
router.get('/all', requireAdmin, getWaitlistUsers);
router.put('/approve/:id', requireAdmin, approveWaitlistUser);

export default router;