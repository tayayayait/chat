import type { Message } from '../types';

interface StreamChatParams {
  message: string;
  history: Message[];
  signal?: AbortSignal;
}

interface SsePayload {
  type: 'chunk' | 'complete' | 'error';
  text?: string;
  message?: string;
}

const parseSseStream = async function* (response: Response): AsyncGenerator<string> {
  if (!response.body) {
    throw new Error('응답 본문이 비어 있습니다. 잠시 후 다시 시도해주세요.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');

        const dataLines = rawEvent
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.replace(/^data:\s*/, ''));

        if (!dataLines.length) {
          continue;
        }

        const dataString = dataLines.join('\n').trim();
        if (!dataString) {
          continue;
        }

        if (dataString === '[DONE]') {
          return;
        }

        let payload: SsePayload | undefined;
        try {
          payload = JSON.parse(dataString) as SsePayload;
        } catch {
          continue;
        }

        if (payload.type === 'error') {
          throw new Error(payload.message ?? '서버에서 오류가 발생했습니다.');
        }

        if (payload.type === 'chunk' && typeof payload.text === 'string') {
          yield payload.text;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const streamChat = async ({ message, history, signal }: StreamChatParams) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok) {
    let errorMessage = '봇으로부터 응답을 받지 못했습니다. 다시 시도해주세요.';
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.error === 'string') {
        errorMessage = errorBody.error;
      }
    } catch {
      // ignore body parse errors
    }
    throw new Error(errorMessage);
  }

  return parseSseStream(response);
};
