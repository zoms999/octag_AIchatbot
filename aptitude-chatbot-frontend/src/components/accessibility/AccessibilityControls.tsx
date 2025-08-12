'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Type, 
  Contrast, 
  Keyboard,
  Plus,
  Minus,
  RotateCcw,
  Eye,
  Volume2
} from 'lucide-react';
import { useAccessibilityContext } from './AccessibilityProvider';
import { FontSizeLevel } from '@/lib/accessibility';

interface AccessibilityControlsProps {
  className?: string;
}

export function AccessibilityControls({ className }: AccessibilityControlsProps) {
  const {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    isHighContrast,
    toggleHighContrast,
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled
  } = useAccessibilityContext();

  const [isOpen, setIsOpen] = useState(false);

  const fontSizeLabels: Record<FontSizeLevel, string> = {
    small: '작게',
    normal: '보통',
    large: '크게',
    'extra-large': '매우 크게'
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 p-0 ${className}`}
          aria-label="접근성 설정"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">접근성 설정 열기</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          접근성 설정
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Font Size Controls */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              글자 크기
            </span>
            <Badge variant="secondary" className="text-xs">
              {fontSizeLabels[fontSize]}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={decreaseFontSize}
              disabled={fontSize === 'small'}
              aria-label="글자 크기 줄이기"
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetFontSize}
              aria-label="글자 크기 초기화"
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              초기화
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={increaseFontSize}
              disabled={fontSize === 'extra-large'}
              aria-label="글자 크기 늘리기"
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Font Size Presets */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {Object.entries(fontSizeLabels).map(([level, label]) => (
              <Button
                key={level}
                variant={fontSize === level ? "default" : "outline"}
                size="sm"
                onClick={() => setFontSize(level as FontSizeLevel)}
                className="h-7 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* High Contrast Toggle */}
        <DropdownMenuItem
          onClick={toggleHighContrast}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            고대비 모드
          </span>
          <Badge variant={isHighContrast ? "default" : "secondary"} className="text-xs">
            {isHighContrast ? '켜짐' : '꺼짐'}
          </Badge>
        </DropdownMenuItem>
        
        {/* Keyboard Shortcuts Toggle */}
        <DropdownMenuItem
          onClick={() => setKeyboardShortcutsEnabled(!keyboardShortcutsEnabled)}
          className="flex items-center justify-between cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            키보드 단축키
          </span>
          <Badge variant={keyboardShortcutsEnabled ? "default" : "secondary"} className="text-xs">
            {keyboardShortcutsEnabled ? '켜짐' : '꺼짐'}
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Screen Reader Info */}
        <div className="p-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Volume2 className="h-3 w-3" />
            스크린 리더 지원됨
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            키보드 탐색 가능
          </div>
        </div>
        
        {/* Keyboard Shortcuts Hint */}
        <div className="p-2 bg-muted/50 rounded-md mx-2 mb-2">
          <div className="text-xs text-muted-foreground">
            <strong>단축키:</strong>
          </div>
          <div className="text-xs text-muted-foreground">
            Ctrl + / : 도움말
          </div>
          <div className="text-xs text-muted-foreground">
            Ctrl + + : 글자 크기 늘리기
          </div>
          <div className="text-xs text-muted-foreground">
            Ctrl + - : 글자 크기 줄이기
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}