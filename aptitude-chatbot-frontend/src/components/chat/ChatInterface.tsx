'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../lib/stores';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { useScreenReader, useAriaAttributes } from '@/hooks/useAccessibility';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const {
    currentConversation,
    isStreaming,
    isLoading,
    error,
    connectionStatus,
    sendMessage,
    createNewConversation,
    retryLastMessage,
    clearError,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { announce, announceStatus, announceError } = useScreenReader();
  const ariaAttributes = useAriaAttributes(chatContainerRef);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, isStreaming]);

  // Create initial conversation if none exists
  useEffect(() => {
    if (!currentConversation) {
      createNewConversation();
    }
  }, [currentConversation, createNewConversation]);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRetry = async () => {
    try {
      clearError();
      await retryLastMessage();
    } catch (error) {
      console.error('Failed to retry message:', error);
    }
  };

  const handleNewChat = () => {
    createNewConversation();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">AI 채팅</h2>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus status={connectionStatus} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            disabled={isStreaming}
          >
            새 대화
          </Button>
        </div>
      </div>

      {/* Network Status */}
      <NetworkStatusIndicator className="mx-4 mt-2" />

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentConversation ? (
          <>
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4">
              {currentConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    새로운 대화를 시작하세요
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    적성검사 결과에 대해 궁금한 것을 물어보세요.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSendMessage('내 적성검사 결과를 요약해주세요')
                      }
                      disabled={isStreaming || isLoading}
                    >
                      적성검사 결과 요약
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSendMessage('추천 직업군을 알려주세요')
                      }
                      disabled={isStreaming || isLoading}
                    >
                      추천 직업군
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSendMessage('내 강점과 약점은 무엇인가요?')
                      }
                      disabled={isStreaming || isLoading}
                    >
                      강점과 약점
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <MessageList
                    messages={currentConversation.messages}
                    isStreaming={isStreaming}
                  />
                  {isStreaming && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="px-4 pb-2">
                <Card className="p-3 bg-destructive/10 border-destructive/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      disabled={isStreaming || isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      재시도
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Message Input */}
            <div className="border-t p-4">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming || isLoading}
                placeholder="메시지를 입력하세요..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">대화를 불러오는 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
