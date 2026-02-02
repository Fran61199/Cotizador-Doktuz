import { api, getApiError } from './client';

export type RegisterPayload = { email: string; password: string; name?: string };
export type UserAuthResponse = { id: number; email: string; name: string | null };
export type RegisterResponse = UserAuthResponse & { email_sent: boolean };

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/api/auth/register', payload);
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/api/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return data;
}

export { getApiError };
