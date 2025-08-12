import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageFeedback } from '../MessageFeedback';
import { useChatStore } from '../../../lib/stores';
import { Message } from '../../../types';

// Mock the chat store
jest.mock('../../../lib/stores', () => ({
  useChatStore: jest.fn(),
}));

const mockUseChatStore = useChatStore as jest.MockedFunction<
  typeof useChatStore
>;

describe('MessageFeedback', () => {
  const mockSubmitFeedback = jest.fn();

  const mockAssistantMessage: Message = {
    id: 'test-message',
    content: 'This is an AI response',
    role: 'assistant',
    timestamp: new Date().toISOString(),
  };

  const mockUserMessage: Message = {
    id: 'user-message',
    content: 'This is a user message',
    role: 'user',
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockReturnValue({
      submitMessageFeedback: mockSubmitFeedback,
    } as any);
  });

  it('should render feedback buttons for assistant messages', () => {
    render(<MessageFeedback message={mockAssistantMessage} />);

    expect(
      screen.getByRole('button', { name: /thumbs up/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /thumbs down/i })
    ).toBeInTheDocument();
  });

  it('should not render for user messages', () => {
    const { container } = render(<MessageFeedback message={mockUserMessage} />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render for streaming messages', () => {
    const streamingMessage = { ...mockAssistantMessage, isStreaming: true };
    const { container } = render(
      <MessageFeedback message={streamingMessage} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle positive feedback', async () => {
    render(<MessageFeedback message={mockAssistantMessage} />);

    const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
    fireEvent.click(thumbsUpButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        'test-message',
        'positive'
      );
    });
  });

  it('should handle negative feedback', async () => {
    render(<MessageFeedback message={mockAssistantMessage} />);

    const thumbsDownButton = screen.getByRole('button', {
      name: /thumbs down/i,
    });
    fireEvent.click(thumbsDownButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        'test-message',
        'negative'
      );
    });
  });

  it('should show feedback status when feedback exists', () => {
    const messageWithFeedback = {
      ...mockAssistantMessage,
      feedback: {
        rating: 'positive' as const,
        timestamp: new Date().toISOString(),
      },
    };

    render(<MessageFeedback message={messageWithFeedback} />);

    expect(screen.getByText('도움이 되었습니다')).toBeInTheDocument();
  });

  it('should disable buttons when feedback already exists', () => {
    const messageWithFeedback = {
      ...mockAssistantMessage,
      feedback: {
        rating: 'positive' as const,
        timestamp: new Date().toISOString(),
      },
    };

    render(<MessageFeedback message={messageWithFeedback} />);

    const thumbsUpButton = screen.getByRole('button', { name: /thumbs up/i });
    const thumbsDownButton = screen.getByRole('button', {
      name: /thumbs down/i,
    });

    expect(thumbsUpButton).toBeDisabled();
    expect(thumbsDownButton).toBeDisabled();
  });
});
