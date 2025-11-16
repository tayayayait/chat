import express from 'express';
import dotenv from 'dotenv';
import { createExpressChatHandler } from './chat';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.SERVER_PORT) || 8788;

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post(
  '/api/chat',
  createExpressChatHandler({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    systemInstruction: process.env.GEMINI_SYSTEM_PROMPT,
  }),
);

app.get('/healthz', (_, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Gemini chat server listening on http://localhost:${PORT}`);
});
