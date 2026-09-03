'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loader on route changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    let requestCount = 0;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      requestCount++;
      setIsLoading(true);
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        requestCount--;
        if (requestCount <= 0) {
          requestCount = 0;
          setIsLoading(false);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 sm:h-1 bg-indigo-500/20 overflow-hidden pointer-events-none">
      <div
        className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-r transition-all"
        style={{
          width: '50%',
          animation: 'indeterminate-loader 1.2s infinite ease-in-out',
          transformOrigin: '0% 50%',
        }}
      />
      <style>{`
        @keyframes indeterminate-loader {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(50%) scaleX(1); }
          100% { transform: translateX(250%) scaleX(0.2); }
        }
      `}</style>
    </div>
  );
}
