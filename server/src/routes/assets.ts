import { Router } from 'express';
import { buildAlarmWav } from '../utils/alarmWav.js';

const router = Router();

router.get('/alarm', async (req, res) => {
  try {
    const wav = buildAlarmWav();
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(wav);
  } catch {
    res.status(500).json({ error: '音频生成失败' });
  }
});

export default router;
