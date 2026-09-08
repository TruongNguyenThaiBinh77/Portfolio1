'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveReload() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const eventSource = new EventSource('http://localhost:3000/api/live-reload');
      
      eventSource.onmessage = (event) => {
        if (event.data === 'reload') {
          console.log('[LiveReload] Data changed, refreshing page...');
          router.refresh();
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [router]);

  return null;
}
