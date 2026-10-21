import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/auth';

import { apiRequest, refreshSession } from './client';

export const authApi = {
  login(input: LoginInput): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      skipAuth: true,
      skipRefresh: true,
    });
  },

  register(input: RegisterInput): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      skipAuth: true,
      skipRefresh: true,
    });
  },

  async me(): Promise<User> {
    // 实测：GET /users/me 返回 { user }，不是裸 User
    const data = await apiRequest<{ user: User }>('/users/me');
    return data.user;
  },

  logout(refreshToken: string): Promise<void> {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
      skipRefresh: true,
    });
  },

  refresh: refreshSession,
};
