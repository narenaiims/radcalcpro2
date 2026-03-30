// Store the deferred prompt globally so any component can trigger install
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;

export function getDeferredPrompt() { return _deferredPrompt; }
export function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  _deferredPrompt = e;
}

export async function installPWA(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!_deferredPrompt) return 'unavailable';
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  return outcome;
}

// Visit counter — increment each session, return current count
export function incrementVisitCount(): number {
  const key = 'pwa_visit_count';
  const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(count));
  return count;
}

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
