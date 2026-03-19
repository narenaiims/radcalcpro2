import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { setDeferredPrompt, installPWA } from '../src/services/pwaService';

// Pure-CSS slide-up — no motion/react dependency needed for a simple toast
const PWAInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    const clearHandler = () => dismiss();
    window.addEventListener('pwa-prompt-cleared', clearHandler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-cleared', clearHandler);
    };
  }, []);

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(() => { setIsVisible(false); setIsExiting(false); }, 280);
  };

  const handleInstallClick = async () => {
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
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 flex items-center gap-4 overflow-hidden relative">
        <div className="bg-blue-600 p-3 rounded-xl text-white shrink-0">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">Install RadOnc Pro</h3>
          <p className="text-[11px] text-slate-500 leading-tight">Save to home screen for offline access.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition uppercase tracking-wider"
          >
            Install
          </button>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 transition self-center" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full -z-10 opacity-50" />
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
