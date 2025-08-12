'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipLinks({ links }: SkipLinksProps) {
  const defaultLinks = [
    { href: '#main-content', label: '메인 콘텐츠로 건너뛰기' },
    { href: '#navigation', label: '네비게이션으로 건너뛰기' },
    { href: '#footer', label: '푸터로 건너뛰기' }
  ];

  const skipLinks = links || defaultLinks;

  const handleSkipClick = (href: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    const target = document.querySelector(href);
    if (target) {
      // Make the target focusable if it's not already
      const htmlTarget = target as HTMLElement;
      const originalTabIndex = htmlTarget.tabIndex;
      
      if (originalTabIndex < 0) {
        htmlTarget.tabIndex = -1;
      }
      
      // Focus and scroll to the target
      htmlTarget.focus();
      htmlTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Restore original tabindex after a short delay
      if (originalTabIndex < 0) {
        setTimeout(() => {
          htmlTarget.removeAttribute('tabindex');
        }, 100);
      }
    }
  };

  return (
    <div className="skip-links">
      {skipLinks.map((link, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground"
          onClick={(e) => handleSkipClick(link.href, e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSkipClick(link.href, e as any);
            }
          }}
        >
          {link.label}
        </Button>
      ))}
    </div>
  );
}