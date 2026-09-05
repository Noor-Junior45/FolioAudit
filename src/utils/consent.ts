/**
 * Consent management for Google Analytics and Personalized Ads
 * Requirement:
 * - Google Analytics is enabled by default ('granted')
 * - Personalized ads are controlled by the user via the pop-card consent modal
 */

const STORAGE_KEY = 'folioaudit_personalized_ads_consent';

export function getSavedAdsConsent(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'granted') return true;
  if (val === 'denied') return false;
  return null;
}

export function applyGtagConsent(adsGranted: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, adsGranted ? 'granted' : 'denied');

    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        ad_storage: adsGranted ? 'granted' : 'denied',
        ad_user_data: adsGranted ? 'granted' : 'denied',
        ad_personalization: adsGranted ? 'granted' : 'denied',
        analytics_storage: 'granted', // Always active by default
      });
    }
  }
}

export function initDefaultConsent() {
  if (typeof window === 'undefined') return;

  const saved = getSavedAdsConsent();
  const adsGranted = saved === true;

  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('consent', 'default', {
      ad_storage: adsGranted ? 'granted' : 'denied',
      ad_user_data: adsGranted ? 'granted' : 'denied',
      ad_personalization: adsGranted ? 'granted' : 'denied',
      analytics_storage: 'granted', // By default Google Analytics is yes
    });
  }
}
