'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failures (unsupported browser, etc.) shouldn't break the app.
      });
    }
  }, []);

  return null;
}
