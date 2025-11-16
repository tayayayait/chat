import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

const CodeBlock: React.FC<{ language?: string; children: React.ReactNode }> = ({
  language,
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => String(children).replace(/\n$/, ''), [children]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code', error);
    }
  };

  return (
    <div className="relative group bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 text-sm font-mono text-cyan-100 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between text-xs text-cyan-200/70 mb-2">
        <span className="uppercase tracking-wider">{language ?? 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
        <code>{text}</code>
      </pre>
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    className="prose prose-invert max-w-none"
    components={{
      p: ({ node, ...props }) => (
        <p {...props} className="mb-3 text-slate-100/90 leading-relaxed last:mb-0" />
      ),
      strong: ({ node, ...props }) => <strong {...props} className="text-white" />,
      em: ({ node, ...props }) => <em {...props} className="text-slate-100 italic" />,
      a: ({ node, ...props }) => (
        <a
          {...props}
          className="text-cyan-300 underline decoration-dotted hover:text-cyan-200"
          target="_blank"
          rel="noreferrer"
        />
      ),
      blockquote: ({ node, ...props }) => (
        <blockquote
          {...props}
          className="border-l-4 border-cyan-400/70 bg-white/5 rounded-r-2xl px-4 py-2 italic text-slate-100 shadow-inner"
        />
      ),
      ul: ({ node, ...props }) => (
        <ul {...props} className="list-disc list-inside space-y-1 text-slate-100/90 mb-3" />
      ),
      ol: ({ node, ...props }) => (
        <ol {...props} className="list-decimal list-inside space-y-1 text-slate-100/90 mb-3" />
      ),
      li: ({ node, ...props }) => <li {...props} className="pl-1" />,
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className ?? '');
        if (!inline) {
          return <CodeBlock language={match?.[1]}>{children}</CodeBlock>;
        }
        return (
          <code
            {...props}
            className="bg-slate-900/60 border border-slate-500/30 rounded-lg px-2 py-0.5 text-sm font-mono text-cyan-100"
          >
            {children}
          </code>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);

const Message: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';

  const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';
  const cardClasses = isUser
    ? 'from-purple-500/30 via-purple-600/20 to-indigo-900/50 border-purple-400/30'
    : 'from-slate-800/80 via-slate-900/70 to-black/60 border-slate-500/30';
  const Icon = isUser ? UserIcon : BotIcon;

  const timestampLabel = useMemo(() => {
    if (message.timestamp) {
      return new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'Just now';
  }, [message.timestamp]);

  const statusLabel = useMemo(() => {
    if (isStreaming && !isUser) {
      return 'Streaming';
    }
    const map: Record<NonNullable<MessageType['status']>, string> = {
      sending: 'Sending',
      delivered: 'Delivered',
      error: 'Needs Attention',
    };
    if (!message.status) {
      return 'Delivered';
    }
    return map[message.status] ?? 'Delivered';
  }, [isStreaming, isUser, message.status]);

  return (
    <div className={`flex items-start gap-4 ${containerClasses} animate-fade-in`}> 
      <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/30">
        <Icon />
      </div>
      <div className="flex-1 max-w-3xl">
        <div
          className={`relative px-5 py-4 rounded-3xl text-white whitespace-pre-wrap break-words backdrop-blur bg-gradient-to-br ${cardClasses} border shadow-2xl shadow-black/40`}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
              {isUser ? 'You' : 'Streamline AI'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/40 border border-white/10">
              {timestampLabel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-100">
              {statusLabel}
            </span>
          </div>
          <MarkdownRenderer content={message.content} />
          {isStreaming && message.content.length === 0 && '...'}
          {isStreaming && message.content.length > 0 && <BlinkingCursor />}
        </div>
      </div>
    </div>
  );
};

export default Message;
