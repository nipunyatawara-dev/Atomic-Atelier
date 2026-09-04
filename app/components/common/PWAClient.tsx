"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { WifiOff } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWAState = {
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  install: () => Promise<boolean>;
};

const PWAContext = createContext<PWAState>({ canInstall: false, isIOS: false, isStandalone: false, install: async () => false });

export function PWAProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstallPrompt(null); setIsStandalone(true); };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // The app remains fully usable online when registration is unavailable.
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const value = useMemo<PWAState>(() => ({
    canInstall: Boolean(installPrompt),
    isIOS,
    isStandalone,
    install: async () => {
      if (!installPrompt) return false;
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      return choice.outcome === "accepted";
    },
  }), [installPrompt, isIOS, isStandalone]);

  return (
    <PWAContext.Provider value={value}>
      {children}
      {offline && <div className="offline-banner" role="status"><WifiOff /> Offline mode · saved chemistry remains available</div>}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
