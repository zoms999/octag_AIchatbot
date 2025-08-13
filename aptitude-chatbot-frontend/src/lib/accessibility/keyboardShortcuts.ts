/**
 * Keyboard shortcuts manager for accessibility
 */

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category?: string;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcutsManager {
  private static instance: KeyboardShortcutsManager;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;
  private helpModalOpen = false;

  static getInstance(): KeyboardShortcutsManager {
    if (!KeyboardShortcutsManager.instance) {
      KeyboardShortcutsManager.instance = new KeyboardShortcutsManager();
    }
    return KeyboardShortcutsManager.instance;
  }

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.setupEventListeners();
      this.registerDefaultShortcuts();
    }
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut) {
    const key = this.createShortcutKey(shortcut);
    this.shortcuts.set(key, { ...shortcut, enabled: shortcut.enabled ?? true });
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string) {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(
      shortcut => shortcut.category === category
    );
  }

  /**
   * Create shortcut key string
   */
  private createShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.metaKey) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Create shortcut key from keyboard event
   */
  private createEventKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    if (typeof document === 'undefined') {
      return;
    }
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeydown(event: KeyboardEvent) {
    if (!this.isEnabled) return;

    // Don't trigger shortcuts when typing in form elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow some shortcuts even in form elements
      if (!this.isGlobalShortcut(event)) {
        return;
      }
    }

    const eventKey = this.createEventKey(event);
    const shortcut = this.shortcuts.get(eventKey);

    if (shortcut && shortcut.enabled) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  /**
   * Check if shortcut should work globally (even in form elements)
   */
  private isGlobalShortcut(event: KeyboardEvent): boolean {
    const globalShortcuts = [
      'ctrl+/',  // Help
      'alt+h',   // Help
      'escape',  // Escape
      'f1',      // Help
    ];

    const eventKey = this.createEventKey(event);
    return globalShortcuts.includes(eventKey);
  }

  /**
   * Register default application shortcuts
   */
  private registerDefaultShortcuts() {
    // Navigation shortcuts
    this.register({
      id: 'navigate-chat',
      key: '1',
      altKey: true,
      description: '채팅 탭으로 이동',
      category: 'navigation',
      action: () => this.navigateToTab('chat')
    });

    this.register({
      id: 'navigate-tests',
      key: '2',
      altKey: true,
      description: '테스트 탭으로 이동',
      category: 'navigation',
      action: () => this.navigateToTab('tests')
    });

    // Chat shortcuts
    this.register({
      id: 'new-chat',
      key: 'n',
      ctrlKey: true,
      description: '새 채팅 시작',
      category: 'chat',
      action: () => this.triggerNewChat()
    });

    this.register({
      id: 'clear-chat',
      key: 'k',
      ctrlKey: true,
      description: '채팅 내역 지우기',
      category: 'chat',
      action: () => this.triggerClearChat()
    });

    // Accessibility shortcuts
    this.register({
      id: 'increase-font-size',
      key: '=',
      ctrlKey: true,
      description: '글자 크기 늘리기',
      category: 'accessibility',
      action: () => this.increaseFontSize()
    });

    this.register({
      id: 'decrease-font-size',
      key: '-',
      ctrlKey: true,
      description: '글자 크기 줄이기',
      category: 'accessibility',
      action: () => this.decreaseFontSize()
    });

    this.register({
      id: 'reset-font-size',
      key: '0',
      ctrlKey: true,
      description: '글자 크기 초기화',
      category: 'accessibility',
      action: () => this.resetFontSize()
    });

    this.register({
      id: 'toggle-high-contrast',
      key: 'h',
      ctrlKey: true,
      altKey: true,
      description: '고대비 모드 전환',
      category: 'accessibility',
      action: () => this.toggleHighContrast()
    });

    this.register({
      id: 'toggle-theme',
      key: 't',
      ctrlKey: true,
      description: '테마 전환 (다크/라이트)',
      category: 'accessibility',
      action: () => this.toggleTheme()
    });

    // Help shortcuts
    this.register({
      id: 'show-help',
      key: '/',
      ctrlKey: true,
      description: '키보드 단축키 도움말 표시',
      category: 'help',
      action: () => this.showHelp()
    });

    this.register({
      id: 'show-help-alt',
      key: 'h',
      altKey: true,
      description: '키보드 단축키 도움말 표시',
      category: 'help',
      action: () => this.showHelp()
    });

    this.register({
      id: 'show-help-f1',
      key: 'F1',
      description: '키보드 단축키 도움말 표시',
      category: 'help',
      action: () => this.showHelp()
    });

    // General shortcuts
    this.register({
      id: 'close-modal',
      key: 'Escape',
      description: '모달/다이얼로그 닫기',
      category: 'general',
      action: () => this.closeModal()
    });

    this.register({
      id: 'focus-search',
      key: 'f',
      ctrlKey: true,
      description: '검색 필드에 포커스',
      category: 'general',
      action: () => this.focusSearch()
    });
  }

  /**
   * Navigate to a specific tab
   */
  private navigateToTab(tab: string) {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('navigateToTab', { detail: { tab } });
    window.dispatchEvent(event);
  }

  /**
   * Trigger new chat
   */
  private triggerNewChat() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('newChat');
    window.dispatchEvent(event);
  }

  /**
   * Trigger clear chat
   */
  private triggerClearChat() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('clearChat');
    window.dispatchEvent(event);
  }

  /**
   * Increase font size
   */
  private increaseFontSize() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('increaseFontSize');
    window.dispatchEvent(event);
  }

  /**
   * Decrease font size
   */
  private decreaseFontSize() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('decreaseFontSize');
    window.dispatchEvent(event);
  }

  /**
   * Reset font size
   */
  private resetFontSize() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('resetFontSize');
    window.dispatchEvent(event);
  }

  /**
   * Toggle high contrast mode
   */
  private toggleHighContrast() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('toggleHighContrast');
    window.dispatchEvent(event);
  }

  /**
   * Toggle theme
   */
  private toggleTheme() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('toggleTheme');
    window.dispatchEvent(event);
  }

  /**
   * Show help modal
   */
  private showHelp() {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.helpModalOpen) return;
    
    this.helpModalOpen = true;
    const event = new CustomEvent('showKeyboardHelp');
    window.dispatchEvent(event);
  }

  /**
   * Close modal
   */
  private closeModal() {
    if (typeof window === 'undefined') {
      return;
    }
    const event = new CustomEvent('closeModal');
    window.dispatchEvent(event);
    this.helpModalOpen = false;
  }

  /**
   * Focus search field
   */
  private focusSearch() {
    if (typeof document === 'undefined') {
      return;
    }
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="검색"], input[placeholder*="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
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
  }
}

/**
 * Keyboard shortcuts utilities
 */
export const keyboardShortcutsUtils = {
  /**
   * Get manager instance
   */
  getManager(): KeyboardShortcutsManager {
    return KeyboardShortcutsManager.getInstance();
  },

  /**
   * Initialize keyboard shortcuts
   */
  initialize() {
    return KeyboardShortcutsManager.getInstance();
  },

  /**
   * Register a new shortcut
   */
  register(shortcut: KeyboardShortcut) {
    KeyboardShortcutsManager.getInstance().register(shortcut);
  },

  /**
   * Unregister a shortcut
   */
  unregister(id: string) {
    KeyboardShortcutsManager.getInstance().unregister(id);
  },

  /**
   * Get all shortcuts grouped by category
   */
  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const manager = KeyboardShortcutsManager.getInstance();
    const shortcuts = manager.getAllShortcuts();
    
    return shortcuts.reduce((acc, shortcut) => {
      const category = shortcut.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);
  }
};