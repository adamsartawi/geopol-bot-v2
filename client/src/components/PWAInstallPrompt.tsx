import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA Install Prompt
 * Shows a bottom banner on mobile when the app is installable.
 * Handles both Android (beforeinstallprompt) and iOS (manual instructions).
 */
export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (don't show again for 7 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions after a short delay
      setTimeout(() => setShowBanner(true), 3000);
    }

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto max-w-md rounded-xl border border-cyan-500/30 bg-[#0d1420]/95 backdrop-blur-md shadow-2xl shadow-cyan-500/10 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cyan-300 font-mono tracking-wide">
              INSTALL GEOPOL-INT
            </p>
            {isIOS ? (
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Tap <span className="text-cyan-400">Share</span> then{" "}
                <span className="text-cyan-400">"Add to Home Screen"</span> to install as an app.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Install for faster access, offline support, and a full-screen experience.
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Install button (Android only) */}
        {!isIOS && installEvent && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-mono font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            INSTALL APP
          </button>
        )}
      </div>
    </div>
  );
}
