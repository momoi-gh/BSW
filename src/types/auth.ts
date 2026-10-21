export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';
