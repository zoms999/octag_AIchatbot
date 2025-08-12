'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className,
}) => {
  return (
    <div className={cn('flex gap-3 max-w-4xl mr-auto', className)}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>

      {/* Typing Bubble */}
      <Card className="p-3 bg-muted mr-8">
        <div className="flex items-center gap-2">
          {/* Typing Animation */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-muted-foreground">
            AI가 응답하고 있습니다...
          </span>
        </div>
      </Card>
    </div>
  );
};
