'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard, X } from 'lucide-react';
import { keyboardShortcutsUtils, KeyboardShortcut } from '@/lib/accessibility';

interface KeyboardShortcutsHelpProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open: controlledOpen, onOpenChange }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, KeyboardShortcut[]>>({});

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;

  useEffect(() => {
    // Load shortcuts
    setShortcuts(keyboardShortcutsUtils.getShortcutsByCategory());

    // Listen for help shortcut
    const handleShowHelp = () => {
      if (controlledOpen === undefined) {
        setIsOpen(true);
      }
    };

    const handleCloseModal = () => {
      if (controlledOpen === undefined) {
        setIsOpen(false);
      }
    };

    window.addEventListener('showKeyboardHelp', handleShowHelp);
    window.addEventListener('closeModal', handleCloseModal);

    return () => {
      window.removeEventListener('showKeyboardHelp', handleShowHelp);
      window.removeEventListener('closeModal', handleCloseModal);
    };
  }, [controlledOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Cmd');
    
    // Format key name
    let keyName = shortcut.key;
    if (keyName === ' ') keyName = 'Space';
    else if (keyName.length === 1) keyName = keyName.toUpperCase();
    
    parts.push(keyName);
    
    return parts.join(' + ');
  };

  const categoryLabels: Record<string, string> = {
    navigation: '네비게이션',
    chat: '채팅',
    accessibility: '접근성',
    help: '도움말',
    general: '일반'
  };

  const categoryOrder = ['navigation', 'chat', 'accessibility', 'general', 'help'];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            키보드 단축키
          </DialogTitle>
          <DialogDescription>
            다음 키보드 단축키를 사용하여 더 빠르게 애플리케이션을 사용할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categoryOrder.map(category => {
            const categoryShortcuts = shortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {categoryLabels[category] || category}
                  <Badge variant="secondary" className="text-xs">
                    {categoryShortcuts.length}개
                  </Badge>
                </h3>
                
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {shortcut.description}
                        </div>
                        {shortcut.enabled === false && (
                          <div className="text-xs text-muted-foreground mt-1">
                            현재 비활성화됨
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).split(' + ').map((key, index, array) => (
                          <React.Fragment key={index}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                              {key}
                            </kbd>
                            {index < array.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            총 {Object.values(shortcuts).flat().length}개의 단축키
          </div>
          
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            닫기
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-sm mb-2">접근성 팁</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tab 키로 요소 간 이동할 수 있습니다</li>
            <li>• Enter 또는 Space 키로 버튼을 활성화할 수 있습니다</li>
            <li>• Escape 키로 모달이나 메뉴를 닫을 수 있습니다</li>
            <li>• 화살표 키로 목록이나 메뉴를 탐색할 수 있습니다</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}