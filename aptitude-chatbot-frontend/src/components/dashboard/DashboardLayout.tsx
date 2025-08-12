'use client';

import { ReactNode } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardNavigation } from './DashboardNavigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content Area */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Navigation Tabs */}
        <nav role="navigation" aria-label="메인 네비게이션" id="navigation">
          <DashboardNavigation />
        </nav>

        {/* Page Content */}
        <main 
          className="flex-1 overflow-hidden" 
          id="main-content"
          role="main"
          aria-label="메인 콘텐츠"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
