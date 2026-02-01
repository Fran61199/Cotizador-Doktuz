/**
 * Mapeo ejecutivo → puesto para el shape del PPT.
 * Define el puesto según el ejecutivo seleccionado.
 */
const EXECUTIVE_TITLE_MAP: Record<string, string> = {
  'Kery Blanco': 'Director Médico Comercial',
  'Maria Alejandra Coria': 'Asistente Comercial',
  'Stephanie Calambrogio': 'Asistente Comercial',
  'Ana Príncipe': 'Asistente Comercial',
  'Franco Salgado': 'Customer Success',
  'Patricia Cánepa': 'Ejecutivo VIP',
};

/** Emails de login → nombre de ejecutivo en el PPT */
const EMAIL_TO_EXECUTIVE: Record<string, string> = {
  'franco.salgado@doktuz.com': 'Franco Salgado',
  'ana.principe@doktuz.com': 'Ana Príncipe',
  'asistente.comercial@doktuz.com': 'Maria Alejandra Coria', // cuenta genérica → primer asistente por defecto
  'maria.coria@doktuz.com': 'Maria Alejandra Coria',
  'maria.alejandra.coria@doktuz.com': 'Maria Alejandra Coria',
  'stephanie.calambrogio@doktuz.com': 'Stephanie Calambrogio',
  'kery.blanco@doktuz.com': 'Kery Blanco',
  'patricia.canepa@doktuz.com': 'Patricia Cánepa',
  'patricia.cánepa@doktuz.com': 'Patricia Cánepa',
  'admin@doktuz.com': 'Franco Salgado', // admin por defecto
};

export const EXECUTIVE_NAMES = Object.keys(EXECUTIVE_TITLE_MAP);

const DEFAULT_TITLE = 'Asistente Comercial';

export function getExecutiveTitle(executive: string): string {
  const normalized = executive.trim();
  return EXECUTIVE_TITLE_MAP[normalized] ?? DEFAULT_TITLE;
}

/**
 * Obtiene el nombre del ejecutivo según el usuario logueado (email o nombre).
 * Se usa para rellenar automáticamente "quién genera el PPT".
 */
export function getExecutiveFromSession(
  email: string | null | undefined,
  name: string | null | undefined
): string {
  const e = (email || '').trim().toLowerCase();
  if (e && EMAIL_TO_EXECUTIVE[e]) return EMAIL_TO_EXECUTIVE[e];
  const n = (name || '').trim();
  if (n && EXECUTIVE_NAMES.includes(n)) return n;
  return EXECUTIVE_NAMES[0] ?? 'Maria Alejandra Coria';
}
