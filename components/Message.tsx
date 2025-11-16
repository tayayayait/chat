
import React from 'react';
import type { Message as MessageType } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';

interface MessageProps {
  message: MessageType;
  isStreaming: boolean;
}

const BlinkingCursor: React.FC = () => (
    <span className="inline-block w-2 h-5 bg-cyan-400 animate-blink ml-1" />
);

const renderWithMarkdown = (text: string) => {
  // A very simple markdown-to-JSX converter.
  // It handles **bold**, *italic*, and `inline code`.
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="bg-gray-800 text-purple-400 font-mono px-1.5 py-0.5 rounded-md">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};


const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  
  const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';
  const bubbleClasses = isUser
    ? 'bg-purple-600 rounded-br-none'
    : 'bg-gray-700 rounded-bl-none';
  const Icon = isUser ? UserIcon : BotIcon;

  return (
    <div className={`flex items-start gap-3 ${containerClasses} animate-fade-in`}>
      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <Icon />
      </div>
      <div
        className={`px-4 py-3 rounded-xl max-w-lg md:max-w-2xl text-white whitespace-pre-wrap break-words shadow-md ${bubbleClasses}`}
      >
        {renderWithMarkdown(message.content)}
        {isStreaming && message.content.length === 0 && '...'}
        {isStreaming && message.content.length > 0 && <BlinkingCursor />}
      </div>
    </div>
  );
};

export default Message;
