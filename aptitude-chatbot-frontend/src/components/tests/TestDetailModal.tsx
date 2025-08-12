'use client';

import React from 'react';
import { TestResult, TestDocument } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  FileText,
  Calendar,
  User,
  Hash,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Copy,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '../ui/use-toast';

interface TestDetailModalProps {
  test: TestResult | null;
  isOpen: boolean;
  onClose: () => void;
  onReprocess?: (test: TestResult) => void;
}

export function TestDetailModal({
  test,
  isOpen,
  onClose,
  onReprocess,
}: TestDetailModalProps) {
  const { toast } = useToast();

  if (!test) return null;

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      completed: 'default' as const,
      processing: 'secondary' as const,
      failed: 'destructive' as const,
    };

    const labels = {
      completed: '완료',
      processing: '처리중',
      failed: '실패',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getDocumentTypeLabel = (type: TestDocument['type']) => {
    const labels = {
      aptitude_summary: '적성 요약',
      career_recommendation: '진로 추천',
      personality_analysis: '성격 분석',
      skill_assessment: '기술 평가',
      learning_path: '학습 경로',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', {
        locale: ko,
      });
    } catch {
      return dateString;
    }
  };

  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyTestId = async () => {
    try {
      await navigator.clipboard.writeText(test.id);
      toast({
        title: '복사 완료',
        description: '테스트 ID가 클립보드에 복사되었습니다.',
      });
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleReprocess = () => {
    onReprocess?.(test);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(test.status)}
            적성검사 결과 상세 정보
          </DialogTitle>
          <DialogDescription>
            테스트 #{test.anpSeq}의 상세 정보와 생성된 문서들을 확인할 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  기본 정보
                  {getStatusBadge(test.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">테스트 번호:</span>
                    <span className="text-sm">{test.anpSeq}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">사용자 ID:</span>
                    <span className="text-sm font-mono">{test.userId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">완료일:</span>
                    <span className="text-sm">
                      {formatDate(test.completedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">경과 시간:</span>
                    <span className="text-sm">
                      {formatRelativeDate(test.completedAt)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">테스트 ID:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {test.id}
                  </code>
                  <Button variant="ghost" size="sm" onClick={handleCopyTestId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 생성된 문서들 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    생성된 문서
                  </div>
                  <Badge variant="outline">{test.documents.length}개</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {test.documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>생성된 문서가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {test.documents.map((document) => (
                      <Card
                        key={document.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {getDocumentTypeLabel(document.type)}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {document.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                              {document.summary}
                            </p>

                            {document.contentPreview &&
                              Object.keys(document.contentPreview).length >
                                0 && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                                    내용 미리보기:
                                  </h4>
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                    {JSON.stringify(
                                      document.contentPreview,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                생성일: {formatDate(document.createdAt)}
                              </span>
                              <Button variant="ghost" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                다운로드
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* 액션 버튼들 */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {test.status !== 'processing' && (
              <Button
                variant="outline"
                onClick={handleReprocess}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                재처리
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
