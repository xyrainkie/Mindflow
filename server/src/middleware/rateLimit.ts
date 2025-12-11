import rateLimit from 'express-rate-limit';

export const bodyLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 限制每个IP 1分钟内最多10个AI请求
  message: {
    error: 'AI请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default bodyLimit;