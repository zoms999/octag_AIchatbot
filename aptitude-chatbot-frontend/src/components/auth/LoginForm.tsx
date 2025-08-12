'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common';
import { useAuthStore } from '@/lib/stores/auth';
import { LoginCredentials, LoginFormData } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  className?: string;
}

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    loginType: 'personal',
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      errors.username = '사용자명을 입력해주세요.';
    }

    if (!formData.password.trim()) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 4) {
      errors.password = '비밀번호는 최소 4자 이상이어야 합니다.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (
    field: keyof LoginFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear global error when user makes changes
    if (error) {
      clearError();
    }
  };

  // Handle login type selection
  const handleLoginTypeChange = (type: 'personal' | 'organization') => {
    setFormData((prev) => ({ ...prev, loginType: type }));
    clearError();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const credentials: LoginCredentials = {
        username: formData.username.trim(),
        password: formData.password,
        loginType: formData.loginType,
      };

      await login(credentials);

      toast.success('로그인 성공!', {
        description: '메인 페이지로 이동합니다.',
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login failed:', err);

      // Show user-friendly error message
      let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';

      if (err && typeof err === 'object') {
        const error = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        errorMessage =
          error.response?.data?.message || error.message || errorMessage;
      }

      toast.error('로그인 실패', {
        description: errorMessage,
      });
    }
  };

  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Login Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          로그인 유형
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={formData.loginType === 'personal' ? 'default' : 'outline'}
            onClick={() => handleLoginTypeChange('personal')}
            className="w-full"
            disabled={isLoading}
          >
            개인
          </Button>
          <Button
            type="button"
            variant={
              formData.loginType === 'organization' ? 'default' : 'outline'
            }
            onClick={() => handleLoginTypeChange('organization')}
            className="w-full"
            disabled={isLoading}
          >
            기관
          </Button>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Field */}
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-sm font-medium text-foreground"
          >
            {formData.loginType === 'personal' ? '사용자명' : '기관 코드'}
          </Label>
          <Input
            id="username"
            type="text"
            placeholder={
              formData.loginType === 'personal'
                ? '사용자명을 입력하세요'
                : '기관 코드를 입력하세요'
            }
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            disabled={isLoading}
            aria-invalid={!!formErrors.username}
            aria-describedby={
              formErrors.username ? 'username-error' : undefined
            }
            className={cn(
              formErrors.username &&
                'border-destructive focus-visible:ring-destructive/20'
            )}
          />
          {formErrors.username && (
            <p id="username-error" className="text-sm text-destructive">
              {formErrors.username}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            비밀번호
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              aria-invalid={!!formErrors.password}
              aria-describedby={
                formErrors.password ? 'password-error' : undefined
              }
              className={cn(
                'pr-10',
                formErrors.password &&
                  'border-destructive focus-visible:ring-destructive/20'
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </Button>
          </div>
          {formErrors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {formErrors.password}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={formData.rememberMe}
            onCheckedChange={(checked) =>
              handleInputChange('rememberMe', checked === true)
            }
            disabled={isLoading}
          />
          <Label htmlFor="rememberMe" className="text-sm text-foreground">
            로그인 상태 유지
          </Label>
        </div>

        {/* Global Error Message */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </Button>
      </form>

      {/* Additional Links */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => {
              toast.info('회원가입 기능은 준비 중입니다.');
            }}
          >
            회원가입
          </Button>
        </p>
        <p className="text-sm text-muted-foreground">
          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => {
              toast.info('비밀번호 찾기 기능은 준비 중입니다.');
            }}
          >
            비밀번호를 잊으셨나요?
          </Button>
        </p>
      </div>
    </div>
  );
}
