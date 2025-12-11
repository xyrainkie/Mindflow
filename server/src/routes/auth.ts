import { Router } from 'express';
import { register, login, getProfile, guestLogin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.get('/profile', authenticateToken, getProfile);

export default router;