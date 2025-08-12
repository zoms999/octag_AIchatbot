import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';
import { useChatStore } from '../../../lib/stores';

// Mock the chat store
jest.mock('../../../lib/stores', () => ({
  useChatStore: jest.fn(),
}));

const mockUseChatStore = useChatStore as jest.MockedFunction<
  typeof useChatStore
>;

describe('ChatInterface', () => {
  const mockStore = {
    currentConversation: null,
    isStreaming: false,
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected' as const,
    sendMessage: jest.fn(),
    createNewConversation: jest.fn(),
    retryLastMessage: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockReturnValue(mockStore);
  });

  it('should render chat interface', () => {
    render(<ChatInterface />);

    expect(screen.getByText('AI 채팅')).toBeInTheDocument();
    expect(screen.getByText('새 대화')).toBeInTheDocument();
  });

  it('should create new conversation on mount if none exists', () => {
    render(<ChatInterface />);

    expect(mockStore.createNewConversation).toHaveBeenCalled();
  });

  it('should show empty state when no messages', () => {
    mockUseChatStore.mockReturnValue({
      ...mockStore,
      currentConversation: {
        id: 'test-conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<ChatInterface />);

    expect(screen.getByText('새로운 대화를 시작하세요')).toBeInTheDocument();
    expect(screen.getByText('적성검사 결과 요약')).toBeInTheDocument();
  });

  it('should handle new chat button click', () => {
    render(<ChatInterface />);

    const newChatButton = screen.getByText('새 대화');
    fireEvent.click(newChatButton);

    expect(mockStore.createNewConversation).toHaveBeenCalled();
  });

  it('should show error message and retry button when error exists', () => {
    mockUseChatStore.mockReturnValue({
      ...mockStore,
      error: 'Test error message',
      currentConversation: {
        id: 'test-conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<ChatInterface />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('재시도')).toBeInTheDocument();
  });

  it('should handle retry button click', () => {
    mockUseChatStore.mockReturnValue({
      ...mockStore,
      error: 'Test error message',
      currentConversation: {
        id: 'test-conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<ChatInterface />);

    const retryButton = screen.getByText('재시도');
    fireEvent.click(retryButton);

    expect(mockStore.clearError).toHaveBeenCalled();
    expect(mockStore.retryLastMessage).toHaveBeenCalled();
  });

  it('should disable buttons when streaming', () => {
    mockUseChatStore.mockReturnValue({
      ...mockStore,
      isStreaming: true,
      currentConversation: {
        id: 'test-conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<ChatInterface />);

    const newChatButton = screen.getByText('새 대화');
    const suggestionButtons = screen
      .getAllByRole('button')
      .filter(
        (button) =>
          button.textContent?.includes('적성검사') ||
          button.textContent?.includes('추천') ||
          button.textContent?.includes('강점')
      );

    expect(newChatButton).toBeDisabled();
    suggestionButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
