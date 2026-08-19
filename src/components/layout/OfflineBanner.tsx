import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500/90 dark:bg-amber-600/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-16 z-20 backdrop-blur-md shadow-md animate-fade-in">
      <WifiOff className="w-4 h-4" />
      <span>You're currently offline. Your saved playlists and cached music are still available.</span>
    </div>
  );
};
