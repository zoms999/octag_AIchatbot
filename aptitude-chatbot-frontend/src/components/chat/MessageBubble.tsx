'use client';

import React, { useState } from 'react';
import { Message } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Copy, Check, User, Bot } from 'lucide-react';
import { MessageFeedback } from './MessageFeedback';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  showTimestamp = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 max-w-4xl',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}
      >
        {/* Message Bubble */}
        <Card
          className={cn(
            'p-3 relative group',
            isUser
              ? 'bg-primary text-primary-foreground ml-8'
              : 'bg-muted mr-8',
            isStreaming && 'animate-pulse'
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              {/* Message Content */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content ? (
                  <MessageContent content={message.content} />
                ) : (
                  <span className="text-muted-foreground italic">
                    {isStreaming ? '입력 중...' : '메시지가 비어있습니다'}
                  </span>
                )}
              </div>

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs opacity-70 ml-2">
                    AI가 응답하고 있습니다...
                  </span>
                </div>
              )}
            </div>

            {/* Copy Button */}
            {message.content && !isStreaming && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0',
                  isUser
                    ? 'text-primary-foreground/70 hover:text-primary-foreground'
                    : ''
                )}
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Feedback (for assistant messages) */}
        {!isUser && !isStreaming && <MessageFeedback message={message} />}

        {/* Timestamp */}
        {showTimestamp && (
          <div
            className={cn(
              'text-xs text-muted-foreground mt-1 px-1',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

// Component to render message content with basic markdown support
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert `code` to <code>
    text = text.replace(
      /`(.*?)`/g,
      '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
    );

    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
  };

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: formatContent(content),
      }}
    />
  );
};
