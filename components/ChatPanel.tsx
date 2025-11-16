
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../types';
import { streamChat } from '../services/geminiService';
import { loadConversations, saveConversations } from '../services/conversationStorage';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ConversationCard from './ConversationCard';

const INITIAL_ASSISTANT_MESSAGE: Message = {
  id: 'init-message',
  role: 'model',
  content: '안녕하세요! 무엇을 도와드릴까요?',
};

const createInitialMessages = (): Message[] => [{ ...INITIAL_ASSISTANT_MESSAGE }];

const createConversation = (): Conversation => ({
  id: `conv-${Date.now()}`,
  title: '새 대화',
  messages: createInitialMessages(),
  updatedAt: Date.now(),
});

const cloneMessages = (msgs: Message[]): Message[] => msgs.map(msg => ({ ...msg }));

const deriveConversationTitle = (msgs: Message[]): string => {
  const firstUserMessage = msgs.find(msg => msg.role === 'user' && msg.content.trim());
  if (firstUserMessage) {
    const normalized = firstUserMessage.content.trim();
    return normalized.length > 30 ? `${normalized.slice(0, 30)}...` : normalized;
  }
  return '새 대화';
};

const sortByUpdatedAt = (conversations: Conversation[]): Conversation[] =>
  [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(createInitialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const storedConversations = sortByUpdatedAt(loadConversations());
    if (storedConversations.length > 0) {
      const latest = storedConversations[0];
      setConversations(storedConversations);
      setCurrentConversationId(latest.id);
      setMessages(cloneMessages(latest.messages.length ? latest.messages : createInitialMessages()));
      return;
    }

    const initialConversation = createConversation();
    setConversations([initialConversation]);
    setCurrentConversationId(initialConversation.id);
    saveConversations([initialConversation]);
  }, []);

  const applyConversationsUpdate = useCallback(
    (
      updater: (prev: Conversation[]) => Conversation[],
      afterUpdate?: (updated: Conversation[]) => void,
    ) => {
      setConversations(prev => {
        const updated = sortByUpdatedAt(updater(prev));
        saveConversations(updated);
        afterUpdate?.(updated);
        return updated;
      });
    },
    [],
  );

  const persistConversationState = useCallback((updatedMessages: Message[]) => {
    if (!currentConversationId) {
      return;
    }
    const preparedMessages = cloneMessages(updatedMessages);
    const title = deriveConversationTitle(preparedMessages);
    applyConversationsUpdate(prev => {
      const remaining = prev.filter(conv => conv.id !== currentConversationId);
      const updatedConversation: Conversation = {
        id: currentConversationId,
        title,
        messages: preparedMessages,
        updatedAt: Date.now(),
      };
      return [...remaining, updatedConversation];
    });
  }, [applyConversationsUpdate, currentConversationId]);

  const ensureConversationId = useCallback(() => {
    if (currentConversationId) {
      return currentConversationId;
    }
    const newConversation = createConversation();
    setCurrentConversationId(newConversation.id);
    setMessages(cloneMessages(newConversation.messages));
    applyConversationsUpdate(prev => [newConversation, ...prev]);
    return newConversation.id;
  }, [applyConversationsUpdate, currentConversationId]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    setMessages(cloneMessages(conversation.messages.length ? conversation.messages : createInitialMessages()));
    setIsHistoryOpen(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    const newConversation = createConversation();
    setCurrentConversationId(newConversation.id);
    setMessages(cloneMessages(newConversation.messages));
    applyConversationsUpdate(prev => [newConversation, ...prev.filter(conv => conv.id !== newConversation.id)]);
    setIsHistoryOpen(false);
  }, [applyConversationsUpdate]);

  const handleRenameConversation = useCallback((conversation: Conversation) => {
    const newTitle = window.prompt('새로운 대화명을 입력하세요.', conversation.title)?.trim();
    if (!newTitle) {
      return;
    }
    applyConversationsUpdate(prev =>
      prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, title: newTitle, updatedAt: Date.now() }
          : conv,
      ),
    );
  }, [applyConversationsUpdate]);

  const handleDeleteConversation = useCallback((conversation: Conversation) => {
    const confirmed = window.confirm('이 대화를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }
    applyConversationsUpdate(prev => prev.filter(conv => conv.id !== conversation.id), updated => {
      if (currentConversationId === conversation.id) {
        if (updated.length > 0) {
          const fallback = updated[0];
          setCurrentConversationId(fallback.id);
          setMessages(cloneMessages(fallback.messages));
        } else {
          const freshConversation = createConversation();
          setCurrentConversationId(freshConversation.id);
          setMessages(cloneMessages(freshConversation.messages));
          setConversations([freshConversation]);
          saveConversations([freshConversation]);
        }
      }
    });
  }, [applyConversationsUpdate, currentConversationId]);

  const formatConversationDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = useCallback(async (inputText: string) => {
    const trimmedMessage = inputText.trim();
    if (!trimmedMessage || isLoading) return;

    setError(null);
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    const activeConversationId = ensureConversationId();

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
      if (fullText) {
        persistConversationState(messagesRef.current);
      } else {
        // Even if the assistant response failed, make sure we store the latest user turn.
        if (messagesRef.current.some(msg => msg.role === 'user')) {
          persistConversationState(messagesRef.current);
        }
      }
    }
  }, [ensureConversationId, isLoading, messages, persistConversationState]);

  const handleStopResponse = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return (
    <div className="relative flex h-full">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-80 border-r border-white/5 bg-gradient-to-b from-gray-950/95 via-gray-900/90 to-gray-950/95 p-5 backdrop-blur-2xl shadow-2xl transition-transform duration-300 md:relative md:z-auto md:translate-x-0 md:shadow-none ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        aria-label="대화 기록"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">대화 기록</h2>
          <button
            type="button"
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsHistoryOpen(false)}
            aria-label="대화 기록 닫기"
          >
            닫기
          </button>
        </div>
        <button
          type="button"
          onClick={handleNewConversation}
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:brightness-110"
        >
          새 대화
        </button>
        <div className="flex-1 space-y-3 overflow-y-auto pt-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-400">대화 기록이 없습니다.</p>
          ) : (
            conversations.map(conversation => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentConversationId}
                onSelect={handleSelectConversation}
                onRename={handleRenameConversation}
                onDelete={handleDeleteConversation}
                formatConversationDate={formatConversationDate}
              />
            ))
          )}
        </div>
      </aside>
      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsHistoryOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="flex h-full flex-1 flex-col bg-gray-950/30">
        <div className="flex items-center gap-3 border-b border-gray-800 p-4 md:hidden">
          <button
            type="button"
            className="rounded-xl bg-gray-800/70 px-3 py-2 text-sm text-gray-100 shadow-inner"
            onClick={() => setIsHistoryOpen(true)}
          >
            대화 기록 보기
          </button>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-purple-500 to-sky-500 px-3 py-2 text-sm font-semibold text-white"
            onClick={handleNewConversation}
          >
            새 대화
          </button>
        </div>
        {error && (
          <div className="p-3 bg-red-500/80 text-white text-center rounded-md m-4 border border-red-700 shadow-lg">
            <p><strong>오류:</strong> {error}</p>
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} onStop={handleStopResponse} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPanel;
