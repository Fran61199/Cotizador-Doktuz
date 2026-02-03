import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { API_URL } from '@/api/client';

function backendAuthHeaders(): Record<string, string> {
  const secret = process.env.BACKEND_API_SECRET;
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) h['Authorization'] = `Bearer ${secret}`;
  return h;
}

/** Opciones de NextAuth compartidas (proxy usa getServerSession con esto). */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Email y contraseña',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          method: 'POST',
          headers: backendAuthHeaders(),
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) return null;
        const user = await res.json();
        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        if (account?.provider === 'google' && user.email) {
          try {
            const res = await fetch(
              `${API_URL}/api/auth/user-by-email?email=${encodeURIComponent(user.email)}`,
              { headers: backendAuthHeaders() }
            );
            if (res.ok) {
              const text = await res.text();
              try {
                const dbUser = text ? (JSON.parse(text) as { id?: number; email?: string; name?: string | null }) : {};
                if (dbUser.id != null) token.id = String(dbUser.id);
                if (dbUser.email) token.email = dbUser.email;
                if (dbUser.name != null) token.name = dbUser.name;
              } catch {
                token.id = (user as { id?: string }).id ?? token.sub ?? '';
              }
            } else {
              token.id = (user as { id?: string }).id ?? token.sub ?? '';
            }
          } catch {
            token.id = (user as { id?: string }).id ?? token.sub ?? '';
          }
        } else {
          token.id = user.id ?? token.sub ?? '';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : String(token.id ?? '');
        session.user.email = token.email ?? '';
        session.user.name = token.name ?? '';
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        try {
          const url = `${API_URL}/api/auth/allowed?email=${encodeURIComponent(user.email)}`;
          const res = await fetch(url, { headers: backendAuthHeaders() });
          const text = await res.text();
          let data: { allowed?: boolean } = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            console.error('[NextAuth Google] Backend response no es JSON. Status:', res.status);
            return false;
          }
          if (!res.ok) {
            console.error('[NextAuth Google] Backend /api/auth/allowed devolvió', res.status);
            return false;
          }
          if (!data?.allowed) {
            console.error('[NextAuth Google] El email no está autorizado en la BD.', user.email);
            return false;
          }
        } catch (err) {
          console.error('[NextAuth Google] No se pudo conectar al backend', err);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
