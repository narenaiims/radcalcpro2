let deferredPrompt: any = null;

const VISIT_COUNT_KEY = 'radcalc_visit_count';
const CALC_DONE_KEY = 'radcalc_first_calc_done';

export const incrementVisitCount = () => {
  const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  localStorage.setItem(VISIT_COUNT_KEY, (count + 1).toString());
  checkInstallTrigger();
};

export const markFirstCalculationDone = () => {
  localStorage.setItem(CALC_DONE_KEY, 'true');
  checkInstallTrigger();
};

const checkInstallTrigger = () => {
  const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  const calcDone = localStorage.getItem(CALC_DONE_KEY) === 'true';

  if (visits >= 3 || calcDone) {
    window.dispatchEvent(new CustomEvent('pwa-trigger-prompt'));
  }
};

export const setDeferredPrompt = (prompt: any) => {
  deferredPrompt = prompt;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  checkInstallTrigger();
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

export const getDeepLinkParams = () => {
  const params = new URLSearchParams(window.location.search);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
};

export const generateDeepLink = (path: string, params: Record<string, string | number>) => {
  const url = new URL(window.location.origin + path);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.toString();
};
