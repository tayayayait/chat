import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createChatMiddleware, type ChatHandlerOptions } from './server/chat';

const registerGeminiRoute = (middlewares: any, options: ChatHandlerOptions) => {
  middlewares.use('/api/chat', createChatMiddleware(options));
};

const geminiProxyPlugin = (options: ChatHandlerOptions) => ({
  name: 'gemini-chat-proxy',
  configureServer(server: any) {
    registerGeminiRoute(server.middlewares, options);
  },
  configurePreviewServer(server: any) {
    registerGeminiRoute(server.middlewares, options);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const options: ChatHandlerOptions = {
    apiKey: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
    systemInstruction: env.GEMINI_SYSTEM_PROMPT || process.env.GEMINI_SYSTEM_PROMPT,
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), geminiProxyPlugin(options)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
