'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsVisible(false);
    }

    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full flex justify-center mb-8 px-4">
      <button
        onClick={handleInstallClick}
        className="w-full max-w-xs animate-float bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-500 flex items-center justify-center space-x-3"
      >
        <div className="w-6 h-6 rounded-full border border-white relative overflow-hidden">
          <Image src="/images/Lore-32x32.png" alt="Lore App" fill sizes="24px" className="object-cover" />
        </div>
        <span>Instalar App Oficial</span>
      </button>
    </div>
  );
}