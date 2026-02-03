import axios, { AxiosError } from 'axios';

/** Base URL del proxy Next.js que reenvía al backend con sesión (JWT) y secret. */
export const API_BASE = '/api/backend';
/** URL del backend (solo para uso server-side, p. ej. proxy). En el cliente usar API_BASE. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: true, // enviar cookies de sesión (necesario en prod para /api/backend)
});

export type ApiError = {
  message: string;
  status?: number;
  detail?: string;
};

export function getApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError;
    const data = e.response?.data as Record<string, unknown> | undefined;
    return {
      message: e.message || 'Error de conexión',
      status: e.response?.status,
      detail: (data?.detail ?? data?.message) as string | undefined,
    };
  }
  return {
    message: err instanceof Error ? err.message : 'Error desconocido',
  };
}
