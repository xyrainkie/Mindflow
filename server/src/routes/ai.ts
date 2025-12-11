import { Router } from 'express';
import multer from 'multer';
import {
  processWithAI,
  processTextWithAI,
  chat
} from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiLimit } from '../middleware/rateLimit.js';

const router = Router();
const upload = multer();

router.use(authenticateToken);
router.use(aiLimit);

router.post('/process', upload.single('file'), processTextWithAI);
router.post('/process/:id', upload.single('file'), processWithAI);
router.post('/chat', chat);

export default router;
