'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Chat message skeleton
export function ChatMessageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-3 p-4", className)}>
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Chat interface skeleton
export function ChatInterfaceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b p-4">
        <Skeleton className="h-6 w-48" />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

// Test result card skeleton
export function TestResultCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Test results list skeleton
export function TestResultsListSkeleton({ 
  count = 3, 
  className 
}: { 
  count?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <TestResultCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Dashboard header skeleton
export function DashboardHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

// Navigation tabs skeleton
export function NavigationTabsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1 border-b", className)}>
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

// Form skeleton
export function FormSkeleton({ 
  fields = 3, 
  className 
}: { 
  fields?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Page skeleton (full page loading)
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen", className)}>
      <DashboardHeaderSkeleton />
      <NavigationTabsSkeleton className="px-4" />
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <TestResultsListSkeleton />
      </div>
    </div>
  );
}