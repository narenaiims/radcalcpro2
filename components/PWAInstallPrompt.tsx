import React, { useEffect, useState } from 'react';
import { getDeferredPrompt, installPWA, incrementVisitCount } from '../src/services/pwaService';

const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect environment
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       ('standalone' in window.navigator && (window.navigator as any).standalone === true);
    setIsStandalone(standalone);

    // 2. Increment visit count
    const visits = incrementVisitCount();

    // 3. Check dismissal state
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    // 4. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // The service already stores it, but we can also trigger a re-render
      // to show the prompt if conditions are met.
      if (!standalone && !isDismissed && visits >= 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Initial check for iOS or if prompt is already available
    if (!standalone && !isDismissed && visits >= 2) {
      if (ios || getDeferredPrompt()) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const outcome = await installPWA();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = (permanent: boolean) => {
    setShowPrompt(false);
    if (permanent) {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50] transition-opacity"
        onClick={() => handleDismiss(false)}
      />
      <div 
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#1a1f2e] rounded-t-3xl shadow-2xl transform transition-transform duration-500 ease-out translate-y-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-6">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
          
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Install RadCalc</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Add to your home screen for offline access, faster loading, and a full-screen experience.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Offline Ready
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Fast Loading
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              Full Screen
            </span>
          </div>

          {isIOS ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700/50">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">To install on iOS:</p>
              <ol className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">1</span>
                  Tap the <svg className="w-5 h-5 mx-1 inline-block text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Share button
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">2</span>
                  Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">3</span>
                  Tap <span className="font-semibold">"Add"</span> in the top right
                </li>
              </ol>
            </div>
          ) : getDeferredPrompt() ? (
            <button
              onClick={handleInstall}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all mb-4"
            >
              Install App
            </button>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-sm text-slate-600 dark:text-slate-300 text-center">
              Installation is not supported in this browser. Try opening in Chrome or Safari.
            </div>
          )}

          <div className="flex justify-center gap-6 text-sm font-medium">
            <button 
              onClick={() => handleDismiss(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Not now
            </button>
            <button 
              onClick={() => handleDismiss(true)}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAInstallPrompt;
