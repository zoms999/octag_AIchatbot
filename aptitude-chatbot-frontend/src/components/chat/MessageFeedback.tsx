'use client';

import React, { useState } from 'react';
import { Message, MessageFeedback as MessageFeedbackType } from '../../types';
import { useChatStore } from '../../lib/stores';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageFeedbackProps {
  message: Message;
  className?: string;
}

export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  message,
  className,
}) => {
  const { submitMessageFeedback } = useChatStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingRating, setPendingRating] = useState<
    'positive' | 'negative' | null
  >(null);

  // Only show feedback for assistant messages
  if (message.role !== 'assistant' || message.isStreaming) {
    return null;
  }

  const currentFeedback = message.feedback;

  const handleFeedback = async (
    rating: 'positive' | 'negative',
    withComment = false
  ) => {
    if (isSubmitting) return;

    if (withComment) {
      setPendingRating(rating);
      setShowCommentDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMessageFeedback(message.id, rating);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!pendingRating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitMessageFeedback(
        message.id,
        pendingRating,
        comment.trim() || undefined
      );
      setShowCommentDialog(false);
      setComment('');
      setPendingRating(null);
    } catch (error) {
      console.error('Failed to submit feedback with comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentCancel = () => {
    setShowCommentDialog(false);
    setComment('');
    setPendingRating(null);
  };

  return (
    <div className={cn('flex items-center gap-1 mt-2', className)}>
      {/* Feedback Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 opacity-60 hover:opacity-100',
            currentFeedback?.rating === 'positive' &&
              'text-green-600 opacity-100'
          )}
          onClick={() => handleFeedback('positive')}
          disabled={isSubmitting || !!currentFeedback}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 opacity-60 hover:opacity-100',
            currentFeedback?.rating === 'negative' && 'text-red-600 opacity-100'
          )}
          onClick={() => handleFeedback('negative')}
          disabled={isSubmitting || !!currentFeedback}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>

        {/* Comment Button */}
        {!currentFeedback && (
          <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                disabled={isSubmitting}
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>피드백 남기기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">평가</label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        pendingRating === 'positive' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setPendingRating('positive')}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      좋아요
                    </Button>
                    <Button
                      variant={
                        pendingRating === 'negative' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setPendingRating('negative')}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      싫어요
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">의견 (선택사항)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="이 응답에 대한 의견을 남겨주세요..."
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {comment.length}/500
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCommentCancel}
                    disabled={isSubmitting}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCommentSubmit}
                    disabled={!pendingRating || isSubmitting}
                  >
                    {isSubmitting ? '제출 중...' : '제출'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Feedback Status */}
      {currentFeedback && (
        <div className="text-xs text-muted-foreground ml-2">
          {currentFeedback.rating === 'positive'
            ? '도움이 되었습니다'
            : '개선이 필요합니다'}
          {currentFeedback.comment && ' • 의견 제출됨'}
        </div>
      )}
    </div>
  );
};
