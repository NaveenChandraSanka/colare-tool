import { apiFetch } from './client';
import type { AuthSession } from '@/types';

export function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  return apiFetch<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    requireAuth: false,
  });
}
