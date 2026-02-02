import { api, getApiError } from './client';

export type UserItem = {
  id: number;
  email: string;
  name: string | null;
};

export async function getUsers(): Promise<UserItem[]> {
  const { data } = await api.get<UserItem[]>('/api/auth/users');
  return data ?? [];
}

export async function addUser(email: string, name?: string): Promise<UserItem> {
  const { data } = await api.post<UserItem>('/api/auth/users', { email: email.trim(), name: name?.trim() || null });
  return data!;
}

/** Crea usuario con contraseña aleatoria y la envía por email. La BD guarda solo el hash. */
export async function inviteUser(email: string, name?: string): Promise<UserItem> {
  const { data } = await api.post<UserItem>('/api/auth/users/invite', {
    email: email.trim(),
    name: name?.trim() || null,
  });
  return data!;
}

export { getApiError };
