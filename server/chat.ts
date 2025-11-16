import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, type Content } from '@google/genai';

export interface ChatRequestPayload {
  message?: unknown;
  history?: Array<{ role?: unknown; content?: unknown }>;
}

export interface ChatHandlerOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
}

export interface ChatResponder {
  (payload: ChatRequestPayload, res: ServerResponse): Promise<void>;
}

interface SsePayload {
  type: 'chunk' | 'complete' | 'error';
  text?: string;
  message?: string;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_SYSTEM_PROMPT =
  '당신은 친절하고 도움이 되는 어시스턴트입니다. 정보에 입각하여 간결하게 답변해주세요. 필요한 경우, 마크다운을 사용하여 텍스트 서식을 지정할 수 있습니다 (예: **굵게**, *기울임꼴*, `코드`).';

const readRequestBody = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};

const sendJsonError = (res: ServerResponse, statusCode: number, message: string) => {
  if (res.writableEnded) {
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: message }));
};

const writeSsePayload = (res: ServerResponse, payload: SsePayload) => {
  if (res.writableEnded) {
    return;
  }
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const normalizeHistory = (history: ChatRequestPayload['history']): Content[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  const normalized: Content[] = [];
  let conversationStarted = false;

  for (const entry of history) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const { role, content } = entry;
    if ((role !== 'user' && role !== 'model') || typeof content !== 'string') {
      continue;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      continue;
    }

    if (!conversationStarted) {
      if (role !== 'user') {
        continue;
      }
      conversationStarted = true;
    }

    normalized.push({
      role,
      parts: [{ text: trimmedContent }],
    });
  }

  return normalized;
};

const createChatResponder = ({ apiKey, model, systemInstruction }: ChatHandlerOptions): ChatResponder => {
  const client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  const resolvedModel = model?.trim() || DEFAULT_MODEL;
  const prompt = systemInstruction?.trim() || DEFAULT_SYSTEM_PROMPT;

  return async (payload: ChatRequestPayload, res: ServerResponse) => {
    if (!client) {
      sendJsonError(res, 500, 'Gemini API 키가 설정되지 않았습니다.');
      return;
    }

    const incomingMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!incomingMessage) {
      sendJsonError(res, 400, '전달된 메시지가 비어 있습니다.');
      return;
    }

    const history = normalizeHistory(payload.history);

    try {
      const chat = client.chats.create({
        model: resolvedModel,
        config: {
          systemInstruction: prompt,
        },
        history: history.length ? history : undefined,
      });

      const stream = await chat.sendMessageStream({ message: incomingMessage });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      res.flushHeaders?.();

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (!chunkText) {
          continue;
        }
        writeSsePayload(res, { type: 'chunk', text: chunkText });
      }

      writeSsePayload(res, { type: 'complete' });
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Gemini API call failed:', error);
      const message =
        error instanceof Error && error.message.includes('API key not valid')
          ? '잘못된 API 키입니다. 설정을 확인해주세요.'
          : '봇으로부터 응답을 받지 못했습니다. 다시 시도해주세요.';

      if (!res.headersSent) {
        sendJsonError(res, 500, message);
        return;
      }

      writeSsePayload(res, { type: 'error', message });
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };
};

export const createChatMiddleware = (options: ChatHandlerOptions) => {
  const responder = createChatResponder(options);

  return (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
    if (req.method !== 'POST') {
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      sendJsonError(res, 405, '허용되지 않은 메서드입니다. POST를 사용해주세요.');
      return;
    }

    void (async () => {
      let payload: ChatRequestPayload = {};
      try {
        const rawBody = await readRequestBody(req);
        payload = rawBody ? (JSON.parse(rawBody) as ChatRequestPayload) : {};
      } catch (error) {
        console.error('요청 본문 파싱 실패:', error);
        sendJsonError(res, 400, '요청 본문을 해석할 수 없습니다.');
        return;
      }

      await responder(payload, res);
    })().catch(error => {
      console.error('요청 처리 중 오류:', error);
      if (!res.headersSent) {
        sendJsonError(res, 500, '요청을 처리하는 중 오류가 발생했습니다.');
      } else if (!res.writableEnded) {
        writeSsePayload(res, { type: 'error', message: '요청을 처리하는 중 오류가 발생했습니다.' });
        res.write('data: [DONE]\n\n');
        res.end();
      }
      next(error);
    });
  };
};

export const createExpressChatHandler = (options: ChatHandlerOptions) => {
  const responder = createChatResponder(options);
  return async (req: IncomingMessage & { body?: ChatRequestPayload }, res: ServerResponse) => {
    const payload = req.body ?? {};
    await responder(payload, res);
  };
};

export const utils = {
  readRequestBody,
  normalizeHistory,
  sendJsonError,
  writeSsePayload,
};
