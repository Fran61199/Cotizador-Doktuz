import 'bootstrap/dist/css/bootstrap.min.css';
import './app-theme.css';
import BootstrapClient from './bootstrap-client';
import ProgressBar from '@/components/ProgressBar';
import { Providers } from './providers';
import type { Viewport } from 'next';

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
    <html lang="es">
      <body>
        <Providers>
          <ProgressBar />
          <BootstrapClient />
          {children}
        </Providers>
      </body>
    </html>
  );
}
