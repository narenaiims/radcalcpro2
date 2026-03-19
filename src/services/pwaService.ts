let deferredPrompt: any = null;

export const setDeferredPrompt = (prompt: any) => {
  deferredPrompt = prompt;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
};

export const getDeferredPrompt = () => deferredPrompt;

export const clearDeferredPrompt = () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-prompt-cleared'));
};

export const installPWA = async () => {
  if (!deferredPrompt) {
    console.log('No install prompt available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    clearDeferredPrompt();
    return true;
  }
  
  return false;
};
