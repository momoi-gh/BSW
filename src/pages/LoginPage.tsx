import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthError } from '@/components/auth/AuthError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { safeRedirect } from '@/lib/redirect';
import { type LoginFormValues, loginSchema } from '@/lib/validation';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const status = useAuthStore((state) => state.status);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const ok = await login(values);
    setSubmitting(false);
    if (ok) {
      navigate(safeRedirect(searchParams.get('redirect')), { replace: true });
    }
  });

  const busy = submitting || status === 'loading';

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">登录</h2>
        <p className="text-sm text-slate-500">使用邮箱和密码继续。</p>
      </div>

      <AuthError />

      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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
            autoComplete="current-password"
            placeholder="至少 8 位"
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
              登录中…
            </>
          ) : (
            '登录'
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          to="/register"
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          注册新账号
        </Link>
        <Link to="/chat" className="text-slate-500 hover:text-slate-900">
          先看界面
        </Link>
      </div>

      {import.meta.env.DEV ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          <p className="font-medium text-slate-600">开发联调账号（3100）</p>
          <p>alice@example.com / bob@example.com / carol@example.com</p>
          <p>密码：password123</p>
        </div>
      ) : null}
    </div>
  );
}
