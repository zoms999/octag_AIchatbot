'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '../../lib/stores';
import { Conversation } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  MessageSquare,
  Trash2,
  Share2,
  Download,
  MoreVertical,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConversationHistoryProps {
  className?: string;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  className,
}) => {
  const {
    conversations,
    currentConversationId,
    isLoading,
    loadConversations,
    setCurrentConversation,
    deleteConversation,
    shareConversation,
    exportConversation,
  } = useChatStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadConversations().catch(console.error);
  }, [loadConversations]);

  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversation(conversationId);
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (confirm('이 대화를 삭제하시겠습니까?')) {
      try {
        await deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  const handleShareConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const url = await shareConversation(conversationId);
      setShareUrl(url);
      setSelectedConversation(conversationId);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Failed to share conversation:', error);
    }
  };

  const handleExportConversation = (
    conversationId: string,
    format: 'json' | 'txt',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      exportConversation(conversationId, format);
    } catch (error) {
      console.error('Failed to export conversation:', error);
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Could add a toast notification here
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const formatConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return '새 대화';

    const preview = lastMessage.content.slice(0, 50);
    return preview.length < lastMessage.content.length
      ? `${preview}...`
      : preview;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInDays === 1) {
      return '어제';
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {conversations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">아직 대화가 없습니다</p>
        </div>
      ) : (
        conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={cn(
              'p-3 cursor-pointer transition-colors hover:bg-muted/50',
              currentConversationId === conversation.id &&
                'bg-muted border-primary'
            )}
            onClick={() => handleConversationSelect(conversation.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {conversation.messages.length}개 메시지
                  </span>
                </div>
                <p className="text-sm font-medium truncate mb-1">
                  {formatConversationPreview(conversation)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(conversation.updatedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleShareConversation(conversation.id, e)}
                >
                  <Share2 className="h-3 w-3" />
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>대화 내보내기</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        대화를 파일로 저장하시겠습니까?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={(e) =>
                            handleExportConversation(conversation.id, 'txt', e)
                          }
                          className="flex-1"
                        >
                          텍스트 파일
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) =>
                            handleExportConversation(conversation.id, 'json', e)
                          }
                          className="flex-1"
                        >
                          JSON 파일
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>대화 공유</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              이 링크를 통해 대화를 공유할 수 있습니다:
            </p>
            {shareUrl && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button size="sm" onClick={copyShareUrl}>
                  복사
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
