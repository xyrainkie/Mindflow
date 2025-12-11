const envSchema = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CUSTOM_AI_BASE_URL: process.env.CUSTOM_AI_BASE_URL || '',
  CUSTOM_AI_TOKEN: process.env.CUSTOM_AI_TOKEN || '',
  CUSTOM_AI_MODELS: (process.env.CUSTOM_AI_MODELS || '').split(',').map(m => m.trim()).filter(Boolean),
};

export const env = envSchema;