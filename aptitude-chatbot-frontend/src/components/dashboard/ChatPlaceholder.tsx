'use client';

import { MessageCircle, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function ChatPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            AI 챗봇과 대화하기
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <CardDescription>
            적성검사 결과에 대해 AI와 대화하고 개인화된 조언을 받아보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>채팅 기능은 곧 구현될 예정입니다.</p>
          <p className="mt-2">
            AI가 여러분의 적성검사 결과를 분석하여 맞춤형 진로 상담을 제공할
            것입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
