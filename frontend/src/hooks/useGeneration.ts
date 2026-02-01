'use client';

import { useState, useCallback } from 'react';
import { getNextProposalNumber, createDocuments, getApiError } from '@/api';
import type { GenerationPayload } from '@/types';

export function useGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (payload: Omit<GenerationPayload, 'proposal_number'>) => {
      setError(null);
      setGenerating(true);
      try {
        const proposal_number = await getNextProposalNumber(payload.executive);
        const fullPayload: GenerationPayload = {
          ...payload,
          proposal_number,
        };
        const blob = await createDocuments(fullPayload);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cotizacion_${payload.company}_${proposal_number}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        const apiErr = getApiError(err);
        setError('No se pudo generar el documento. Intenta de nuevo.');
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  return { generate, generating, error, setError };
}
