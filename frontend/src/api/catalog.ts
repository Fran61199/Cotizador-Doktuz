import { api } from './client';
import type { Test } from '@/types';
import type { Location } from '@/types';

export async function getClinics(): Promise<string[]> {
  const r = await api.get<{ clinics: string[] }>('/api/catalog/clinics');
  return r.data?.clinics ?? [];
}

export async function getCatalog(params: {
  location: Location;
  clinic?: string;
  margin?: number;
}): Promise<Test[]> {
  const r = await api.get<{ catalog: Test[] }>('/api/catalog', { params });
  return r.data?.catalog ?? [];
}
