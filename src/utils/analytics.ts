/**
 * Google Analytics Event Tracking Utility for FolioAudit (Measurement ID: G-3GN8ZM0CDF)
 * Allows real-time tracking of what users are searching, comparing, and viewing most.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Generic GA4 Event Trigger
 */
export function trackGAEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...eventParams,
      send_to: 'G-3GN8ZM0CDF',
    });
  }
}

/**
 * Track which mutual fund or ETF is selected by users
 */
export function trackFundSelect(fundName: string, category: string, slotIndex: number) {
  trackGAEvent('select_fund', {
    fund_name: fundName,
    fund_category: category,
    slot_index: slotIndex + 1,
    event_category: 'Fund Comparison',
    event_label: fundName,
  });
}

/**
 * Track the active comparison between chosen funds
 */
export function trackFundComparison(fundNames: string[]) {
  if (fundNames.length < 2) return;
  trackGAEvent('compare_funds', {
    funds_compared: fundNames.join(' | '),
    total_funds: fundNames.length,
    event_category: 'Fund Comparison',
    event_label: fundNames.join(' vs '),
  });
}

/**
 * Track search queries entered into the fund search box
 */
export function trackFundSearch(query: string, matchCount: number) {
  if (!query || query.trim().length < 2) return;
  trackGAEvent('search_fund', {
    search_term: query.trim(),
    results_found: matchCount,
    event_category: 'Search',
  });
}

/**
 * Track when a user inspects a pair in the overlap matrix or chart
 */
export function trackInspectOverlap(fundA: string, fundB: string, overlapPercentage: number) {
  trackGAEvent('inspect_overlap_pair', {
    fund_a: fundA,
    fund_b: fundB,
    overlap_percentage: overlapPercentage,
    event_category: 'Analysis',
  });
}

/**
 * Track interaction with specific sections of the tool
 */
export function trackSectionView(sectionName: string) {
  trackGAEvent('view_section', {
    section_name: sectionName,
    event_category: 'Engagement',
  });
}
