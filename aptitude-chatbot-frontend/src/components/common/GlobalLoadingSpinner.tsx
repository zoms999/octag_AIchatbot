'use client';

import React from 'react';
import { useLoadingStore } from '@/lib/stores/loading';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GlobalLoadingSpinnerProps {
  className?: string;
}

export function GlobalLoadingSpinner({ className }: GlobalLoadingSpinnerProps) {
  const { isGlobalLoading, globalLoadingMessage } = useLoadingStore();

  if (!isGlobalLoading) {
    return null;
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {globalLoadingMessage && (
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {globalLoadingMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// Loading overlay for specific components
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message,
  progress,
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md">
          <div className="flex flex-col items-center space-y-3 bg-card p-4 rounded-lg shadow-md border">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {message && (
              <p className="text-sm text-muted-foreground text-center">
                {message}
              </p>
            )}
            {typeof progress === 'number' && (
              <div className="w-32">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline loading spinner
interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function InlineLoading({ 
  size = 'md', 
  message, 
  className 
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}