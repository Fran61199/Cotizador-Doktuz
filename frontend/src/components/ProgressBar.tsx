'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  easing: 'ease',
  speed: 800,
  trickleSpeed: 200,
});

function ProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Cuando cambia la ruta, finalizar la barra
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Interceptar clics en enlaces para iniciar la barra
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && !anchor.href.startsWith('#') && anchor.target !== '_blank') {
        const currentUrl = window.location.href;
        const newUrl = anchor.href;
        
        if (currentUrl !== newUrl) {
          NProgress.start();
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null;
}

export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  );
}
