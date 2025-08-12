import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Message,
  Conversation,
  ChatRequest,
  ChatResponse,
  StreamingChatResponse,
  DocumentReference,
} from '../../types';
import { apiClient } from '../api/client';
import { SSEClient } from '../streaming/sseClient';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  streamingMessage: Message | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  sseClient: SSEClient | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => void;
  setCurrentConversation: (conversationId: string | null) => void;
  clearCurrentConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
  stopStreaming: () => void;

  // Feedback actions
  submitMessageFeedback: (
    messageId: string,
    rating: 'positive' | 'negative',
    comment?: string
  ) => Promise<void>;
  shareConversation: (conversationId: string) => Promise<string>;
  exportConversation: (conversationId: string, format: 'json' | 'txt') => void;

  // Internal helpers
  streamChatResponse: (chatRequest: ChatRequest) => Promise<void>;
  addMessageToConversation: (conversationId: string, message: Message) => void;
  updateStreamingMessage: (content: string) => void;
  completeStreamingMessage: (finalContent: string, metadata?: any) => void;
  setConnectionStatus: (
    status: 'connected' | 'disconnected' | 'connecting' | 'error'
  ) => void;
}

// Helper function to create a new message
const createMessage = (
  content: string,
  role: 'user' | 'assistant',
  isStreaming = false
): Message => ({
  id: uuidv4(),
  content,
  role,
  timestamp: new Date().toISOString(),
  isStreaming,
});

// Helper function to create a new conversation
const createConversation = (initialMessage?: Message): Conversation => ({
  id: uuidv4(),
  messages: initialMessage ? [initialMessage] : [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      currentConversationId: null,
      currentConversation: null,
      isStreaming: false,
      isLoading: false,
      error: null,
      streamingMessage: null,
      connectionStatus: 'disconnected',
      sseClient: null,

      // Send message action
      sendMessage: async (messageContent: string) => {
        const state = get();

        if (state.isStreaming) {
          throw new Error('Cannot send message while streaming');
        }

        if (!messageContent.trim()) {
          throw new Error('Message cannot be empty');
        }

        set({ isLoading: true, error: null });

        try {
          // Create user message
          const userMessage = createMessage(messageContent, 'user');

          // Get or create conversation
          let conversation = state.currentConversation;
          let conversationId = state.currentConversationId;

          if (!conversation) {
            conversation = createConversation(userMessage);
            conversationId = conversation.id;

            set((state) => ({
              conversations: [...state.conversations, conversation!],
              currentConversation: conversation!,
              currentConversationId: conversationId,
            }));
          } else {
            // Add user message to existing conversation
            get().addMessageToConversation(conversationId!, userMessage);
          }

          set({
            isLoading: false,
            isStreaming: true,
            connectionStatus: 'connecting',
          });

          // Prepare chat request
          const chatRequest: ChatRequest = {
            message: messageContent,
            conversation_id: conversationId || undefined,
          };

          // Start streaming response
          await get().streamChatResponse(chatRequest);
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to send message';

          set({
            isLoading: false,
            isStreaming: false,
            error: errorMessage,
            connectionStatus: 'error',
          });

          throw error;
        }
      },

      // Stream chat response (internal method)
      streamChatResponse: async (chatRequest: ChatRequest) => {
        const state = get();

        // Clean up any existing SSE client
        if (state.sseClient) {
          state.sseClient.disconnect();
        }

        // Create initial streaming message
        const streamingMessage = createMessage('', 'assistant', true);
        const conversationId =
          chatRequest.conversation_id || state.currentConversationId;

        if (conversationId) {
          get().addMessageToConversation(conversationId, streamingMessage);
          set({ streamingMessage });
        }

        let accumulatedContent = '';
        let finalMetadata: any = null;

        // Get auth token for headers
        const token =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('access_token') ||
              localStorage.getItem('access_token')
            : null;

        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Create SSE client
        const sseClient = new SSEClient({
          url: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/chat/stream`,
          data: chatRequest,
          headers,
          retryAttempts: 3,
          retryDelay: 1000,

          onConnectionChange: (status) => {
            set({ connectionStatus: status });
          },

          onMessage: (data: StreamingChatResponse) => {
            if (data.type === 'chunk') {
              accumulatedContent += data.content;
              get().updateStreamingMessage(accumulatedContent);
            } else if (data.type === 'complete') {
              finalMetadata = data.metadata;
              if (data.content) {
                accumulatedContent = data.content;
              }
            } else if (data.type === 'error') {
              throw new Error(data.content);
            }
          },

          onComplete: () => {
            get().completeStreamingMessage(accumulatedContent, finalMetadata);
            set({
              isStreaming: false,
              streamingMessage: null,
              sseClient: null,
            });
          },

          onError: (error: Error) => {
            console.error('SSE streaming error:', error);

            const errorMessage = error.message || 'Streaming failed';

            set({
              isStreaming: false,
              streamingMessage: null,
              error: errorMessage,
              connectionStatus: 'error',
              sseClient: null,
            });

            // Remove the failed streaming message
            const state = get();
            if (state.streamingMessage && state.currentConversationId) {
              const conversation = state.conversations.find(
                (c) => c.id === state.currentConversationId
              );
              if (conversation) {
                const updatedMessages = conversation.messages.filter(
                  (m) => m.id !== state.streamingMessage!.id
                );

                set((state) => ({
                  conversations: state.conversations.map((c) =>
                    c.id === state.currentConversationId
                      ? {
                          ...c,
                          messages: updatedMessages,
                          updatedAt: new Date().toISOString(),
                        }
                      : c
                  ),
                  currentConversation:
                    state.currentConversationId === conversation.id
                      ? { ...conversation, messages: updatedMessages }
                      : state.currentConversation,
                }));
              }
            }
          },
        });

        set({ sseClient });

        try {
          await sseClient.connect();
        } catch (error) {
          // Error handling is done in the onError callback
          throw error;
        }
      },

      // Load conversations from server
      loadConversations: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get<Conversation[]>(
            '/chat/conversations'
          );

          set({
            conversations: response.data || [],
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to load conversations';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      // Load specific conversation
      loadConversation: async (conversationId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get<Conversation>(
            `/chat/conversations/${conversationId}`
          );
          const conversation = response.data;

          if (conversation) {
            // Update conversations list
            set((state) => ({
              conversations: state.conversations.map((c) =>
                c.id === conversationId ? conversation : c
              ),
              currentConversation: conversation,
              currentConversationId: conversationId,
              isLoading: false,
            }));
          }
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to load conversation';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      // Create new conversation
      createNewConversation: () => {
        const newConversation = createConversation();

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversation: newConversation,
          currentConversationId: newConversation.id,
          error: null,
        }));
      },

      // Set current conversation
      setCurrentConversation: (conversationId: string | null) => {
        if (!conversationId) {
          set({
            currentConversation: null,
            currentConversationId: null,
          });
          return;
        }

        const state = get();
        const conversation = state.conversations.find(
          (c) => c.id === conversationId
        );

        if (conversation) {
          set({
            currentConversation: conversation,
            currentConversationId: conversationId,
          });
        }
      },

      // Clear current conversation
      clearCurrentConversation: () => {
        set({
          currentConversation: null,
          currentConversationId: null,
          error: null,
        });
      },

      // Delete conversation
      deleteConversation: async (conversationId: string) => {
        try {
          await apiClient.delete(`/chat/conversations/${conversationId}`);

          set((state) => {
            const updatedConversations = state.conversations.filter(
              (c) => c.id !== conversationId
            );
            const isCurrentConversation =
              state.currentConversationId === conversationId;

            return {
              conversations: updatedConversations,
              currentConversation: isCurrentConversation
                ? null
                : state.currentConversation,
              currentConversationId: isCurrentConversation
                ? null
                : state.currentConversationId,
            };
          });
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to delete conversation';

          set({ error: errorMessage });
          throw error;
        }
      },

      // Clear all conversations
      clearAllConversations: async () => {
        try {
          await apiClient.delete('/chat/conversations');

          set({
            conversations: [],
            currentConversation: null,
            currentConversationId: null,
            error: null,
          });
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to clear conversations';

          set({ error: errorMessage });
          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Retry last message
      retryLastMessage: async () => {
        const state = get();

        if (
          !state.currentConversation ||
          state.currentConversation.messages.length === 0
        ) {
          throw new Error('No message to retry');
        }

        const messages = state.currentConversation.messages;
        const lastUserMessage = [...messages]
          .reverse()
          .find((m) => m.role === 'user');

        if (!lastUserMessage) {
          throw new Error('No user message to retry');
        }

        // Remove any assistant messages after the last user message
        const lastUserMessageIndex = messages.findIndex(
          (m) => m.id === lastUserMessage.id
        );
        const filteredMessages = messages.slice(0, lastUserMessageIndex + 1);

        // Update conversation with filtered messages
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === state.currentConversationId
              ? {
                  ...c,
                  messages: filteredMessages,
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          currentConversation: state.currentConversation
            ? { ...state.currentConversation, messages: filteredMessages }
            : null,
        }));

        // Retry sending the message
        await get().sendMessage(lastUserMessage.content);
      },

      // Stop streaming
      stopStreaming: () => {
        const state = get();

        // Disconnect SSE client if active
        if (state.sseClient) {
          state.sseClient.disconnect();
        }

        set({
          isStreaming: false,
          streamingMessage: null,
          connectionStatus: 'disconnected',
          sseClient: null,
        });
      },

      // Helper: Add message to conversation
      addMessageToConversation: (conversationId: string, message: Message) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          currentConversation:
            state.currentConversationId === conversationId
              ? {
                  ...state.currentConversation!,
                  messages: [...state.currentConversation!.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : state.currentConversation,
        }));
      },

      // Helper: Update streaming message content
      updateStreamingMessage: (content: string) => {
        const state = get();

        if (!state.streamingMessage || !state.currentConversationId) return;

        const updatedMessage = { ...state.streamingMessage, content };

        set((state) => ({
          streamingMessage: updatedMessage,
          conversations: state.conversations.map((c) =>
            c.id === state.currentConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === state.streamingMessage!.id ? updatedMessage : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          currentConversation: state.currentConversation
            ? {
                ...state.currentConversation,
                messages: state.currentConversation.messages.map((m) =>
                  m.id === state.streamingMessage!.id ? updatedMessage : m
                ),
                updatedAt: new Date().toISOString(),
              }
            : null,
        }));
      },

      // Helper: Complete streaming message
      completeStreamingMessage: (finalContent: string, metadata?: any) => {
        const state = get();

        if (!state.streamingMessage || !state.currentConversationId) return;

        const completedMessage = {
          ...state.streamingMessage,
          content: finalContent,
          isStreaming: false,
          metadata,
        };

        set((state) => ({
          streamingMessage: null,
          conversations: state.conversations.map((c) =>
            c.id === state.currentConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === state.streamingMessage!.id ? completedMessage : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          currentConversation: state.currentConversation
            ? {
                ...state.currentConversation,
                messages: state.currentConversation.messages.map((m) =>
                  m.id === state.streamingMessage!.id ? completedMessage : m
                ),
                updatedAt: new Date().toISOString(),
              }
            : null,
        }));
      },

      // Helper: Set connection status
      setConnectionStatus: (
        status: 'connected' | 'disconnected' | 'connecting' | 'error'
      ) => {
        set({ connectionStatus: status });
      },

      // Submit message feedback
      submitMessageFeedback: async (
        messageId: string,
        rating: 'positive' | 'negative',
        comment?: string
      ) => {
        try {
          const feedback = {
            rating,
            comment,
            timestamp: new Date().toISOString(),
          };

          // Submit to server
          await apiClient.post('/chat/feedback', {
            message_id: messageId,
            rating,
            comment,
          });

          // Update local state
          set((state) => ({
            conversations: state.conversations.map((conversation) => ({
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId ? { ...message, feedback } : message
              ),
              updatedAt: new Date().toISOString(),
            })),
            currentConversation: state.currentConversation
              ? {
                  ...state.currentConversation,
                  messages: state.currentConversation.messages.map((message) =>
                    message.id === messageId
                      ? { ...message, feedback }
                      : message
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : null,
          }));
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to submit feedback';

          set({ error: errorMessage });
          throw error;
        }
      },

      // Share conversation
      shareConversation: async (conversationId: string) => {
        try {
          const response = await apiClient.post<{ share_url: string }>(
            '/chat/share',
            {
              conversation_id: conversationId,
            }
          );

          return response.data.share_url;
        } catch (error: unknown) {
          const errorMessage =
            (error as any).response?.data?.message ||
            (error as any).message ||
            'Failed to share conversation';

          set({ error: errorMessage });
          throw error;
        }
      },

      // Export conversation
      exportConversation: (conversationId: string, format: 'json' | 'txt') => {
        const state = get();
        const conversation = state.conversations.find(
          (c) => c.id === conversationId
        );

        if (!conversation) {
          throw new Error('Conversation not found');
        }

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'json') {
          content = JSON.stringify(conversation, null, 2);
          filename = `conversation-${conversationId}.json`;
          mimeType = 'application/json';
        } else {
          // Text format
          const header = `대화 내용\n생성일: ${new Date(conversation.createdAt).toLocaleString('ko-KR')}\n수정일: ${new Date(conversation.updatedAt).toLocaleString('ko-KR')}\n\n`;

          const messages = conversation.messages
            .map((message) => {
              const timestamp = new Date(message.timestamp).toLocaleString(
                'ko-KR'
              );
              const role = message.role === 'user' ? '사용자' : 'AI';
              return `[${timestamp}] ${role}: ${message.content}`;
            })
            .join('\n\n');

          content = header + messages;
          filename = `conversation-${conversationId}.txt`;
          mimeType = 'text/plain';
        }

        // Create and download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist conversations and current conversation ID
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
