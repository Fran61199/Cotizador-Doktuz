import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BACKEND_API_SECRET = process.env.BACKEND_API_SECRET || '';

/** Rutas que no requieren sesión (login, registro, reset). */
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

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const isPublic = isPublicPath(path);

  if (!BACKEND_API_SECRET) {
    return NextResponse.json(
      { detail: 'BACKEND_API_SECRET no configurado' },
      { status: 500 }
    );
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!isPublic && !token) {
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
  if (token?.id ?? token?.sub) {
    // Preferir token.id (id de BD del backend); token.sub es el subject del proveedor (ej. Google, muy largo)
    headers['X-User-Id'] = String(token.id ?? token.sub);
    headers['X-User-Email'] = String(token.email ?? '');
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    init.duplex = 'half'; // requerido en Node 18+ (undici) cuando se envía body
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const segments = path ?? [];
  return proxyRequest(request, segments);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const segments = path ?? [];
  return proxyRequest(request, segments);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const segments = path ?? [];
  return proxyRequest(request, segments);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const segments = path ?? [];
  return proxyRequest(request, segments);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  const segments = path ?? [];
  return proxyRequest(request, segments);
}
