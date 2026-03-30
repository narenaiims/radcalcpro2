import React, { useEffect, useState } from 'react';

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Already a waiting SW when component mounts
      if (registration.waiting) {
        setUpdateAvailable(true);
      }

      // New SW found during this session
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    };

    checkForUpdate();

    // Listen for the controller change (SW activated after skip waiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const interval = setInterval(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const applyUpdate = async () => {
    setIsUpdating(true);
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f1a2e]/95 backdrop-blur-xl border-b border-white/8 transition-transform duration-500 ease-out translate-y-0 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </div>
          <div>
            <div className="text-[12px] font-bold text-white leading-tight">Update available</div>
            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">A new version of the app is ready.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={applyUpdate}
            disabled={isUpdating}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-70"
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              'Update now'
            )}
          </button>
          <button
            onClick={() => setUpdateAvailable(false)}
            className="text-slate-400 hover:text-white w-6 h-6 rounded flex items-center justify-center transition-colors"
            aria-label="Dismiss update notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
