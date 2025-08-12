'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AccessibilityControls } from '@/components/accessibility';

export function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getUserDisplayName = () => {
    if (!user) return 'Unknown User';
    return user.name || 'User';
  };

  const getUserTypeLabel = () => {
    if (!user) return '';

    switch (user.type) {
      case 'personal':
        return '개인 사용자';
      case 'organization_admin':
        return '기관 관리자';
      case 'organization_member':
        return '기관 구성원';
      default:
        return '';
    }
  };

  return (
    <>
      <header 
        className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="메인 헤더"
      >
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* Logo/Title */}
          <div className="flex items-center space-x-2" role="img" aria-label="적성검사 챗봇 로고">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold" aria-hidden="true">AC</span>
            </div>
            <h1 className="text-lg font-semibold">적성검사 챗봇</h1>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-2">
            {/* Accessibility Controls */}
            <AccessibilityControls />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
              aria-label="테마 전환"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">테마 전환</span>
            </Button>

            {/* User Info */}
            <div 
              className="flex items-center space-x-2 rounded-lg bg-muted/50 px-3 py-2"
              role="region"
              aria-label="사용자 정보"
            >
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-sm font-medium" aria-label={`사용자 이름: ${getUserDisplayName()}`}>
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-muted-foreground" aria-label={`사용자 유형: ${getUserTypeLabel()}`}>
                  {getUserTypeLabel()}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutDialog(true)}
              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
              aria-label="로그아웃"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>로그아웃 확인</DialogTitle>
            <DialogDescription>
              정말로 로그아웃하시겠습니까? 현재 세션이 종료되고 로그인 페이지로
              이동합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleLogout}>로그아웃</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
