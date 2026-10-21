import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('请输入正确的邮箱地址'),
  password: z.string().min(8, '密码至少 8 位').max(128, '密码最多 128 位'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  username: z.string().regex(/^[A-Za-z0-9_]{3,32}$/, '用户名需为 3–32 位字母、数字或下划线'),
  displayName: z.string().trim().max(100, '昵称最多 100 个字符').optional(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
