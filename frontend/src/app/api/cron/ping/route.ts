import { NextRequest } from 'next/server';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Llamado por Vercel Cron cada ~10 min para hacer ping al backend en Render
 * y evitar que se duerma por inactividad.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    const ok = res.ok;
    const data = ok ? await res.json().catch(() => ({})) : null;
    return Response.json({
      ok,
      backend: data?.ok === true ? 'awake' : 'error',
      status: res.status,
    });
  } catch (err) {
    return Response.json(
      { ok: false, backend: 'unreachable', error: String(err) },
      { status: 502 }
    );
  }
}
