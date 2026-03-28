import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { setDeferredPrompt, installPWA } from '../src/services/pwaService';

// Pure-CSS slide-up — no motion/react dependency needed for a simple toast
const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect if we are in Google AI Studio or an iframe
    const restricted = window.location.hostname.includes('google') || window.self !== window.top;
    setIsRestricted(restricted);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const triggerHandler = () => {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('pwa-trigger-prompt', triggerHandler);

    if (restricted) {
      // In restricted mode, we show the banner once if not dismissed
      const dismissed = localStorage.getItem('pwa-restricted-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately, wait for trigger
    };

    window.addEventListener('beforeinstallprompt', handler);
    const clearHandler = () => dismiss();
    window.addEventListener('pwa-prompt-cleared', clearHandler);

    return () => {
      window.removeEventListener('pwa-trigger-prompt', triggerHandler);
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-cleared', clearHandler);
    };
  }, []);

  const dismiss = () => {
    setIsExiting(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    if (isRestricted) {
      localStorage.setItem('pwa-restricted-dismissed', 'true');
    }
    if (isIOS) {
      localStorage.setItem('pwa-ios-dismissed', 'true');
    }
    setTimeout(() => { setIsVisible(false); setIsExiting(false); setShowIOSGuide(false); }, 280);
  };

  const handleInstallClick = async () => {
    if (isRestricted) {
      window.open(window.location.href, '_blank');
      return;
    }
    
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const success = await installPWA();
    if (success) dismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
      style={{
        animation: isExiting
          ? 'pwaSlideOut 0.28s ease-in forwards'
          : 'pwaSlideIn 0.3s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes pwaSlideIn  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes pwaSlideOut { from{opacity:1;transform:none} to{opacity:0;transform:translateY(24px)} }
      `}</style>
      
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 flex flex-col gap-3 overflow-hidden relative">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              Install RadOnc Pro
            </h3>
            <p className="text-[11px] text-slate-500 leading-tight">
              {isRestricted 
                ? 'Open in Chrome directly to install app.' 
                : isIOS 
                  ? 'Add to Home Screen for the best experience.' 
                  : 'Save to home screen for offline access.'}
            </p>
          </div>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 transition" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIOSGuide ? (
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] text-blue-800 font-medium flex items-center gap-2">
              1. Tap the <Share className="w-3.5 h-3.5 inline" /> icon in the toolbar.
            </p>
            <p className="text-[11px] text-blue-800 font-medium mt-1">
              2. Scroll down and tap "Add to Home Screen".
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-700 transition uppercase tracking-wider shadow-md shadow-blue-200"
          >
            {isRestricted ? 'Open in Browser' : isIOS ? 'How to Install' : 'Install App'}
          </button>
        )}
        
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full -z-10 opacity-50" />
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

