import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../chat';

// Mock API client
jest.mock('../../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    streamRequest: jest.fn(),
  },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('useChatStore', () => {
  beforeEach(() => {
    // Clear store state before each test
    useChatStore.getState().clearAllConversations();
    useChatStore.getState().clearCurrentConversation();
    useChatStore.getState().clearError();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChatStore());

    expect(result.current.conversations).toEqual([]);
    expect(result.current.currentConversationId).toBeNull();
    expect(result.current.currentConversation).toBeNull();
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('should create new conversation', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.createNewConversation();
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.currentConversation).toBeTruthy();
    expect(result.current.currentConversationId).toBe('mock-uuid');
    expect(result.current.currentConversation?.messages).toEqual([]);
  });

  it('should set current conversation', () => {
    const { result } = renderHook(() => useChatStore());

    // Create a conversation first
    act(() => {
      result.current.createNewConversation();
    });

    const conversationId = result.current.currentConversationId!;

    // Clear current conversation
    act(() => {
      result.current.clearCurrentConversation();
    });

    expect(result.current.currentConversation).toBeNull();

    // Set it back
    act(() => {
      result.current.setCurrentConversation(conversationId);
    });

    expect(result.current.currentConversation).toBeTruthy();
    expect(result.current.currentConversationId).toBe(conversationId);
  });

  it('should add message to conversation', () => {
    const { result } = renderHook(() => useChatStore());

    // Create a conversation
    act(() => {
      result.current.createNewConversation();
    });

    const conversationId = result.current.currentConversationId!;
    const message = {
      id: 'test-message',
      content: 'Hello',
      role: 'user' as const,
      timestamp: new Date().toISOString(),
    };

    act(() => {
      result.current.addMessageToConversation(conversationId, message);
    });

    expect(result.current.currentConversation?.messages).toHaveLength(1);
    expect(result.current.currentConversation?.messages[0]).toEqual(message);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useChatStore());

    // Set an error manually
    act(() => {
      useChatStore.setState({ error: 'Test error' });
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should stop streaming', () => {
    const { result } = renderHook(() => useChatStore());

    // Set streaming state manually
    act(() => {
      useChatStore.setState({
        isStreaming: true,
        connectionStatus: 'connected',
        streamingMessage: {
          id: 'streaming-msg',
          content: 'Partial content',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        },
      });
    });

    expect(result.current.isStreaming).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');

    act(() => {
      result.current.stopStreaming();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingMessage).toBeNull();
    expect(result.current.connectionStatus).toBe('disconnected');
  });
});
