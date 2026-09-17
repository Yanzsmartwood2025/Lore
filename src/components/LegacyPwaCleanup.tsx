'use client';

import { useEffect } from 'react';

const LEGACY_CACHE_PREFIX = 'lore-vip-';
const CLEANUP_RELOAD_KEY = 'lore-legacy-sw-cleanup-reload-v1';

export function LegacyPwaCleanup() {
  useEffect(() => {
    let cancelled = false;

    const cleanup = async () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const legacyController = hasServiceWorker
        ? Boolean(navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js'))
        : false;

      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => name.startsWith(LEGACY_CACHE_PREFIX))
            .map((name) => caches.delete(name)),
        );
      }

      if (hasServiceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations
            .filter((registration) => {
              const urls = [
                registration.active?.scriptURL,
                registration.waiting?.scriptURL,
                registration.installing?.scriptURL,
              ].filter(Boolean) as string[];
              return urls.some((url) => url.endsWith('/sw.js'));
            })
            .map((registration) => registration.unregister()),
        );
      }

      if (
        !cancelled &&
        legacyController &&
        !sessionStorage.getItem(CLEANUP_RELOAD_KEY)
      ) {
        sessionStorage.setItem(CLEANUP_RELOAD_KEY, '1');
        window.location.reload();
      }
    };

    void cleanup();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
