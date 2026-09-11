import { useState, useEffect } from 'react';
import { Download, X, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay so it doesn't interrupt initial load
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[90] animate-in slide-in-from-bottom">
      <div className="gold-glow-panel p-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-obsidian-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-obsidian-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white mb-1">Install Surge.AI</h4>
            <p className="text-xs text-obsidian-400 leading-relaxed mb-3">
              Add Surge.AI to your home screen for quick access to your AI creation tools and daily rewards.
            </p>
            <button
              onClick={handleInstall}
              className="gold-capsule-button py-2 px-4 text-xs flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
