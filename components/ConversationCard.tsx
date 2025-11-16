import React from 'react';
import type { Conversation } from '../types';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  onRename: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
  formatConversationDate: (timestamp: number) => string;
}

const truncate = (text: string, limit = 70) => {
  if (!text) {
    return '';
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
  formatConversationDate,
}) => {
  const lastMeaningfulMessage = [...conversation.messages]
    .reverse()
    .find(msg => msg.content.trim());
  const previewText = truncate(
    lastMeaningfulMessage?.content || '아직 메시지가 없습니다. 새 대화를 시작해보세요!',
  );
  const timestampLabel = formatConversationDate(conversation.updatedAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 backdrop-blur-xl shadow-lg ${
        isActive
          ? 'border-purple-400/60 bg-gradient-to-br from-purple-600/40 via-indigo-600/30 to-slate-900/60'
          : 'border-white/5 bg-white/5 hover:border-purple-300/40 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-purple-200 shadow-inner shadow-purple-500/20">
            <ChatBubbleIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white line-clamp-1">
              {conversation.title || '새 대화'}
            </span>
            <span className="text-[11px] text-purple-100/70">
              {timestampLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="대화 이름 변경"
            className="rounded-full p-2 text-purple-100/80 transition hover:bg-white/10 hover:text-white active:scale-95"
            onClick={event => {
              event.stopPropagation();
              onRename(conversation);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="대화 삭제"
            className="rounded-full p-2 text-rose-200/90 transition hover:bg-white/10 hover:text-rose-100 active:scale-95"
            onClick={event => {
              event.stopPropagation();
              onDelete(conversation);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-200/90 line-clamp-2">
        {previewText}
      </p>
    </button>
  );
};

export default ConversationCard;
