import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app-theme.css';
import BootstrapClient from './bootstrap-client';
import ProgressBar from '@/components/ProgressBar';
import { Providers } from './providers';
import type { Viewport } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = { 
  title: 'Cotizador EMOs', 
  description: 'Cotizador EMOs' 
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('cotizador-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.setAttribute('data-theme','dark');else document.documentElement.setAttribute('data-theme','light');})();`,
          }}
        />
        <Providers>
          <ProgressBar />
          <BootstrapClient />
          {children}
        </Providers>
      </body>
    </html>
  );
}
