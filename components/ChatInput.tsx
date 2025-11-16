
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="px-4 py-3 bg-gray-900/50 border-t border-gray-700/50 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="flex-1 bg-gray-700 text-white rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition max-h-48 disabled:opacity-70"
          disabled={isLoading}
          aria-label="채팅 메시지 입력"
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="w-12 h-12 flex items-center justify-center bg-purple-600 text-white rounded-full transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          aria-label="메시지 보내기"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
