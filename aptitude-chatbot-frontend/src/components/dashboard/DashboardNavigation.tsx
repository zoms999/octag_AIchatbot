'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';

interface NavigationTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navigationTabs: NavigationTab[] = [
  {
    id: 'chat',
    label: '채팅',
    icon: MessageCircle,
    path: '/dashboard/chat',
  },
  {
    id: 'tests',
    label: '테스트 결과',
    icon: FileText,
    path: '/dashboard/tests',
  },
];

export function DashboardNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const navigationRef = useRef<HTMLDivElement>(null);

  // Enable keyboard navigation
  useKeyboardNavigation(navigationRef, {
    orientation: 'horizontal',
    circular: true
  });

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  const isActiveTab = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleKeyDown = (event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(path);
    }
  };

  // Listen for navigation shortcuts
  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const { tab } = event.detail;
      const targetTab = navigationTabs.find(t => t.id === tab);
      if (targetTab) {
        handleTabClick(targetTab.path);
      }
    };

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);

    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
    };
  }, []);

  return (
    <div className="border-b bg-background">
      <div className="flex h-12 items-center px-4 md:px-6">
        <div 
          ref={navigationRef}
          className="flex space-x-1" 
          role="tablist" 
          aria-label="메인 네비게이션 탭"
        >
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isActiveTab(tab.path);

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTabClick(tab.path)}
                onKeyDown={(e) => handleKeyDown(e, tab.path)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                aria-label={`${tab.label} 탭${isActive ? ' (현재 선택됨)' : ''}`}
                tabIndex={isActive ? 0 : -1}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
