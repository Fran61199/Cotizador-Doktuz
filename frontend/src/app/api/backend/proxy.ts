import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/auth.config';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BACKEND_API_SECRET = process.env.BACKEND_API_SECRET || '';

const PUBLIC_PATHS = [
  '/api/auth/verify',
  '/api/auth/allowed',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

function isPublicPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return PUBLIC_PATHS.some((p) => normalized === p || normalized.startsWith(p + '?'));
}

export async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const isPublic = isPublicPath(path);

  if (!BACKEND_API_SECRET) {
    return NextResponse.json(
      { detail: 'BACKEND_API_SECRET no configurado' },
      { status: 500 }
    );
  }

  const session = await getServerSession(authOptions);

  if (!isPublic && !session) {
    return NextResponse.json({ detail: 'Sesión requerida' }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const backendPath = path + (query ? `?${query}` : '');
  const backendFullUrl = `${BACKEND_URL.replace(/\/$/, '')}/${backendPath}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${BACKEND_API_SECRET}`,
    'Content-Type': request.headers.get('content-type') || 'application/json',
  };
  if (session?.user?.id ?? session?.user?.email) {
    headers['X-User-Id'] = String(session.user.id ?? '');
    headers['X-User-Email'] = String(session.user.email ?? '');
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    init.duplex = 'half';
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      init.body = request.body;
      (init.headers as Record<string, string>)['Content-Type'] = contentType;
    } else {
      try {
        init.body = await request.text();
      } catch {
        init.body = undefined;
      }
    }
  }

  try {
    const res = await fetch(backendFullUrl, init);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isBlob =
      contentType.includes('application/zip') ||
      contentType.includes('application/vnd.openxmlformats') ||
      contentType.includes('application/octet-stream');

    if (isBlob) {
      const blob = await res.blob();
      return new NextResponse(blob, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
          'Content-Disposition': res.headers.get('content-disposition') || '',
        },
      });
    }

    if (isJson) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Error de conexión con el backend' },
      { status: 502 }
    );
  }
}
