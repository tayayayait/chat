
import React, { useState, useCallback } from 'react';
import type { Message } from '../types';
import { streamChat } from '../services/geminiService';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-message',
      role: 'model',
      content: '안녕하세요! 무엇을 도와드릴까요?',
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = useCallback(async (inputText: string) => {
    const trimmedMessage = inputText.trim();
    if (!trimmedMessage || isLoading) return;

    setError(null);
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
    };

    const assistantMessageId = `model-${Date.now()}`;
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      role: 'model',
      content: '',
    };

    const historyForRequest = messages.filter(msg => msg.id !== 'init-message');

    setMessages(prev => [...prev, userMessage, assistantMessagePlaceholder]);

    let fullText = '';

    try {
      const stream = await streamChat({
        message: trimmedMessage,
        history: historyForRequest,
        signal: controller.signal,
      });
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
          )
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (!fullText) {
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [isLoading, messages]);

  const handleStopResponse = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="p-3 bg-red-500/80 text-white text-center rounded-md m-4 border border-red-700 shadow-lg">
          <p><strong>오류:</strong> {error}</p>
        </div>
      )}
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSendMessage={handleSendMessage} onStop={handleStopResponse} isLoading={isLoading} />
    </div>
  );
};

export default ChatPanel;
