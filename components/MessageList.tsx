
import React, { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types';
import Message from './Message';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          isStreaming={isLoading && index === messages.length - 1}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
