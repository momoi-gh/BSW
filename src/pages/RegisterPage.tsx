import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { AuthError } from '@/components/auth/AuthError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type RegisterFormValues, registerSchema } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';

export function RegisterPage() {
  const registerUser = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const errorCode = useAuthStore((state) => state.errorCode);
  const status = useAuthStore((state) => state.status);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', username: '', displayName: '', password: '' },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (errorCode === 'USER_EXISTS') {
      const message = '邮箱或用户名已被注册';
      setError('email', { type: 'server', message });
      setError('username', { type: 'server', message });
    }
  }, [errorCode, setError]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const ok = await registerUser({
      email: values.email,
      username: values.username,
      password: values.password,
      displayName: values.displayName?.trim() || undefined,
    });
    setSubmitting(false);
    if (ok) {
      navigate('/chat', { replace: true });
    }
  });

  const busy = submitting || status === 'loading';

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">注册</h2>
        <p className="text-sm text-slate-500">创建账号后会自动登录。</p>
      </div>

      <AuthError />

      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="3–32 位字母/数字/_"
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
            {errors.username ? (
              <p className="text-xs text-red-600">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">昵称（可选）</Label>
            <Input
              id="displayName"
              autoComplete="nickname"
              placeholder="显示名称"
              aria-invalid={Boolean(errors.displayName)}
              {...register('displayName')}
            />
            {errors.displayName ? (
              <p className="text-xs text-red-600">{errors.displayName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="8–128 位"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="h-10 w-full" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              注册中…
            </>
          ) : (
            '注册并登录'
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link to="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline">
          已有账号，去登录
        </Link>
        <Link to="/chat" className="text-slate-500 hover:text-slate-900">
          先看界面
        </Link>
      </div>
    </div>
  );
}
