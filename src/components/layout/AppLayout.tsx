import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { MusicPlayer } from '../player/MusicPlayer';
import { InstallPromptModal } from '../pwa/InstallPromptModal';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const AppLayout: React.FC = () => {
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const { currentTrack } = useAudioPlayer();
  const { hasNativePrompt, promptInstall } = usePWAInstall();

  const handleInstallTrigger = async () => {
    if (hasNativePrompt) {
      const installed = await promptInstall();
      if (!installed) {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-dark-text transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar onOpenInstallModal={handleInstallTrigger} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar onOpenInstallModal={handleInstallTrigger} />
        <OfflineBanner />

        {/* Scrollable Page Content */}
        <main
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
            currentTrack ? 'pb-36 md:pb-28' : 'pb-24 md:pb-12'
          }`}
        >
          <Outlet />
        </main>

        {/* Global Persistent Audio Player */}
        <MusicPlayer />

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* PWA Install Modal */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
