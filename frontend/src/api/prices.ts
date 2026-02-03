import { API_BASE } from './client';

export type ImportPricesResult = {
  imported: number;
  errors: string[];
};

export type ImportPreviewRow = {
  prueba: string;
  categoria: string;
  clinica: string;
  ingreso: number;
  periodico: number;
  retiro: number;
  valid: boolean;
  error?: string | null;
};

export type ImportPreviewResult = {
  rows: ImportPreviewRow[];
  validCount: number;
  invalidCount: number;
};

export type PriceRow = {
  test_id: number;
  test_name: string;
  category: string;
  price_id: number | null;
  ingreso: number;
  periodico: number;
  retiro: number;
};

export type PricesListResult = {
  clinic: string;
  clinic_id: number | null;
  tests: PriceRow[];
};

export type SearchTestClinicPrice = {
  clinic_name: string;
  clinic_id: number | null;
  ingreso: number;
  periodico: number;
  retiro: number;
};

export type SearchTestResult = {
  test_id: number;
  test_name: string;
  category: string;
  clinics_with_price: SearchTestClinicPrice[];
  clinics_without_price: string[];
};

/** Busca pruebas por nombre. Devuelve clínicas con y sin precios. */
export async function searchTests(q: string): Promise<{ tests: SearchTestResult[] }> {
  const res = await fetch(`${API_BASE}/api/prices/search?q=${encodeURIComponent(q)}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'No se pudo buscar.');
  return data as { tests: SearchTestResult[] };
}

export type PriceUpdatePayload = {
  test_id: number;
  clinic_id: number | null;
  ingreso: number;
  periodico: number;
  retiro: number;
};

/** Lista exámenes y precios para una sede (Lima o nombre de clínica). */
export async function getPricesList(clinic: string): Promise<PricesListResult> {
  const res = await fetch(`${API_BASE}/api/prices/list?clinic=${encodeURIComponent(clinic)}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'No se pudo cargar la lista.');
  return data as PricesListResult;
}

/** Actualiza o crea un precio (1x1). clinic_id null = Lima. */
export async function updatePrice(payload: PriceUpdatePayload): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/api/prices`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'No se pudo guardar.');
  return data;
}

export type AddPricePayload = {
  test_name: string;
  category: string;
  clinic_id: number | null;
  ingreso: number;
  periodico: number;
  retiro: number;
};

export type DeletePricePayload = {
  test_id: number;
  scope: 'clinic' | 'lima' | 'all_provincia' | 'all';
  clinic_id?: number | null;
};

/** Añade una prueba (crea si no existe) y su precio para la sede. clinic_id null = Lima. */
export async function addPrice(payload: AddPricePayload): Promise<{ id: number; test_id: number }> {
  const res = await fetch(`${API_BASE}/api/prices/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'No se pudo añadir.');
  return data;
}

/** Elimina precio(s) de una prueba según el alcance. */
export async function deletePrice(payload: DeletePricePayload): Promise<{ deleted: number; test_name: string }> {
  const res = await fetch(`${API_BASE}/api/prices`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'No se pudo eliminar.');
  return data;
}

/** Descarga la plantilla XLSX de precios. */
export async function downloadPricesTemplate(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/prices/template`, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error('No se pudo descargar la plantilla.');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_precios.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

/** Envía el archivo XLSX y obtiene previsualización (filas válidas/inválidas) sin importar. */
export async function getImportPreview(file: File): Promise<ImportPreviewResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/prices/preview`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'No se pudo leer el archivo.';
    throw new Error(detail);
  }
  return {
    rows: data.rows ?? [],
    validCount: data.validCount ?? 0,
    invalidCount: data.invalidCount ?? 0,
  };
}

/** Sube un archivo XLSX e importa precios. */
export async function importPricesFile(file: File): Promise<ImportPricesResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/prices/import`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'No se pudo importar el archivo. Verifica el formato e intenta de nuevo.';
    throw new Error(detail);
  }
  return { imported: data.imported ?? 0, errors: data.errors ?? [] };
}
