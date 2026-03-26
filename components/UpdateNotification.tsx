import React, { useState, useEffect } from 'react';
import { RefreshCw, X, ArrowUpCircle } from 'lucide-react';
import { APP_VERSION } from '../src/constants';

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // Fetch the version file from the server
        // Adding a timestamp to bypass cache
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const serverVersion = data.version;

        if (serverVersion && serverVersion !== APP_VERSION) {
          setNewVersion(serverVersion);
          setUpdateAvailable(true);
          
          // Show after a short delay
          setTimeout(() => setIsVisible(true), 2000);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    checkUpdate();
    
    // Listen for Service Worker updates
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
      setIsVisible(true);
    };
    window.addEventListener('sw-update-available', handleSWUpdate);
    
    // Check every hour if the app stays open
    const interval = setInterval(checkUpdate, 3600000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[110] md:left-auto md:right-4 md:w-80"
      style={{
        animation: isExiting
          ? 'updateSlideOut 0.3s ease-in forwards'
          : 'updateSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }}
    >
      <style>{`
        @keyframes updateSlideIn  { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:none} }
        @keyframes updateSlideOut { from{opacity:1;transform:none} to{opacity:0;transform:translateY(-20px)} }
      `}</style>
      
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 flex items-center gap-4 overflow-hidden relative">
        <div className="bg-blue-500 p-2.5 rounded-xl text-white shrink-0 animate-pulse">
          <ArrowUpCircle className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Update Available</h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono">
              v{newVersion}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            A newer version of RadOnc Pro is ready.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap"
          >
            <RefreshCw className="w-3 h-3" />
            Update Now
          </button>
          <button 
            onClick={dismiss} 
            className="text-slate-500 hover:text-slate-300 transition self-center p-1" 
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full -z-10 blur-xl" />
      </div>
    </div>
  );
};

export default UpdateNotification;
