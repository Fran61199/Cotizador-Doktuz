import { api } from './client';

export async function getNextProposalNumber(executive: string): Promise<string> {
  const r = await api.get<{ proposal_number?: string }>('/api/proposal/next', {
    params: { executive },
  });
  return r.data?.proposal_number ?? '0001';
}
