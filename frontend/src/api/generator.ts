import { api } from './client';
import type { GenerationPayload } from '@/types';

export async function createDocuments(payload: GenerationPayload): Promise<Blob> {
  const r = await api.post<Blob>('/api/generator/create', payload, {
    responseType: 'blob',
  });
  return r.data;
}
