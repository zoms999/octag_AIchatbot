'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Square } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  maxLength = 2000,
  className,
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (but not Shift+Enter or during IME composition)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const canSend = message.trim().length > 0 && !disabled;
  const isOverLimit = message.length > maxLength;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'min-h-[44px] max-h-[120px] resize-none pr-12',
            isOverLimit && 'border-destructive focus-visible:ring-destructive'
          )}
          rows={1}
        />

        {/* Send Button */}
        <Button
          type="submit"
          size="sm"
          disabled={!canSend || isOverLimit}
          className="absolute right-2 bottom-2 h-8 w-8 p-0"
        >
          {disabled ? (
            <Square className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character Count and Help Text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1',
            isOverLimit && 'text-destructive'
          )}
        >
          <span>{message.length}</span>
          <span>/</span>
          <span>{maxLength}</span>
        </div>
      </div>
    </form>
  );
};
