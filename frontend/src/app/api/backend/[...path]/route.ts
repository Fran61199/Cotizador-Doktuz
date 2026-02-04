import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../proxy';

type RouteContext = { params: Promise<{ path: string[] }> };

function getSegments(params: { path?: string[] } | undefined): string[] {
  const path = params?.path;
  return Array.isArray(path) ? path : [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyToBackend(request, getSegments(params));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyToBackend(request, getSegments(params));
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyToBackend(request, getSegments(params));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyToBackend(request, getSegments(params));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyToBackend(request, getSegments(params));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
