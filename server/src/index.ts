import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './config/database.js';

import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
import aiRoutes from './routes/ai.js';
import accountingRoutes from './routes/accounting.js';
import assetRoutes from './routes/assets.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').filter(Boolean);
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (!origin) return callback(null, true);
    if (origins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/assets', assetRoutes);

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error('服务器错误:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: '请求参数验证失败' });
    return;
  }

  if (err.code === 'P2002') {
    res.status(409).json({ error: '数据已存在' });
    return;
  }

  res.status(500).json({ error: '服务器内部错误' });
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}/api/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('🛑 正在关闭服务器...');
  await prisma.$disconnect();
  console.log('✅ 数据库连接已断开');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 正在关闭服务器...');
  await prisma.$disconnect();
  console.log('✅ 数据库连接已断开');
  process.exit(0);
});

startServer();
