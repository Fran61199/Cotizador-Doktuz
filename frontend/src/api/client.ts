import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

export type ApiError = {
  message: string;
  status?: number;
  detail?: string;
};

export function getApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ detail?: string }>;
    return {
      message: e.message || 'Error de conexión',
      status: e.response?.status,
      detail: e.response?.data?.detail ?? e.response?.data?.message,
    };
  }
  return {
    message: err instanceof Error ? err.message : 'Error desconocido',
  };
}
