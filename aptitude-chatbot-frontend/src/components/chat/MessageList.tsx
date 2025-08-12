'use client';

import React from 'react';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming = false,
  className,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && message.isStreaming}
          showTimestamp={
            index === 0 ||
            index === messages.length - 1 ||
            messages[index - 1]?.role !== message.role
          }
        />
      ))}
    </div>
  );
};
