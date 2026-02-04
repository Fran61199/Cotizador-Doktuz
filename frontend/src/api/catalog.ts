import { api } from './client';
import type { Test } from '@/types';
import type { Location } from '@/types';

export type ClinicWithId = { id: number; name: string };

export async function getClinics(): Promise<string[]> {
  const r = await api.get<{ clinics: string[] }>('/api/catalog/clinics');
  return r.data?.clinics ?? [];
}

export async function getClinicsWithIds(): Promise<ClinicWithId[]> {
  const r = await api.get<{ clinics: ClinicWithId[] }>('/api/catalog/clinics', { params: { with_ids: true } });
  return r.data?.clinics ?? [];
}

export async function createClinic(name: string): Promise<{ name: string }> {
  const r = await api.post<{ name: string }>('/api/catalog/clinics', { name: name.trim() });
  return r.data ?? { name: name.trim() };
}

export async function getCatalog(params: {
  location: Location;
  clinic?: string;
  margin?: number;
}): Promise<Test[]> {
  const r = await api.get<{ catalog: Test[] }>('/api/catalog', { params });
  return r.data?.catalog ?? [];
}
