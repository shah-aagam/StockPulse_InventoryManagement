import 'dotenv/config';

const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockpulse',
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  llmProvider: (process.env.LLM_PROVIDER || 'groq').toLowerCase(),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqBaseUrl: (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai').replace(/\/$/, ''),
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiBaseUrl: (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, ''),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
};

export default config;
