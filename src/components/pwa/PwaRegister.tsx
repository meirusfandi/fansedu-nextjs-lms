"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isRunningStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("PWA Service Worker registration failed:", err);
          });
      });
    }

    // Capture beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed prompt recently
      const dismissed = localStorage.getItem("fansedu_pwa_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("fansedu_pwa_dismissed", "true");
  };

  if (isStandalone || (!showInstallBanner && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-sky-500/20 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md md:left-auto md:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600 shadow-md">
          <img src="/icon-192.png" alt="FansEdu" className="h-8 w-8 rounded-lg object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">Pasang Aplikasi FansEdu</h4>
          <p className="mt-0.5 text-xs text-slate-300">
            Akses materi, tryout, dan kelas lebih cepat langsung dari layar utama ponsel Anda.
          </p>
          {isIOS && !deferredPrompt && (
            <p className="mt-2 text-[11px] text-sky-300 bg-sky-950/60 p-2 rounded-lg border border-sky-800/40">
              Ketuk tombol <strong>Bagikan (Share)</strong> <span className="text-xs">⎙</span> lalu pilih <strong>&quot;Tambah ke Layar Utama&quot;</strong>.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-400 active:scale-95 transition"
              >
                Pasang Sekarang
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
