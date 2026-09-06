import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { Fund } from './types';
import { Navbar } from './components/Navbar';
import { TransposedTable } from './components/TransposedTable';
import { CircularOverlapChart } from './components/CircularOverlapChart';
import { PairwiseMatrix } from './components/PairwiseMatrix';
import { KnowledgeAndGuide } from './components/KnowledgeAndGuide';
import { LegalFooter } from './components/LegalFooter';
import { ConsentModal } from './components/ConsentModal';
import { fetchBackendFunds } from './utils/api';
import {
  getSavedAdsConsent,
  applyGtagConsent,
  initDefaultConsent,
} from './utils/consent';
import {
  trackFundSelect,
  trackFundComparison,
} from './utils/analytics';

const FUND_COLORS = [
  '#00A896', // Fund 1: Teal (Top)
  '#FF6B4A', // Fund 2: Coral / Orange (Left)
  '#0284C7', // Fund 3: Sky Blue (Bottom)
  '#334155', // Fund 4: Slate Charcoal (Right)
];

export default function App() {
  const [backendFunds, setBackendFunds] = useState<Fund[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<{ source: string; message?: string }>({ source: 'loading' });
  const [selectedFunds, setSelectedFunds] = useState<(Fund | null)[]>([null, null, null, null]);

  // Consent modal state: NOT shown until user presses consent button in footer
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [adsConsent, setAdsConsent] = useState<boolean | null>(() => getSavedAdsConsent());

  useEffect(() => {
    // Initialize default consent: Google Analytics is active by default
    initDefaultConsent();
  }, []);

  // Fetch only backend funds on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFunds() {
      setIsLoadingFunds(true);
      const res = await fetchBackendFunds();
      if (!isMounted) return;

      setBackendFunds(res.funds);
      setBackendStatus({ source: res.source, message: res.message });

      // Keep all funds unfilled on initial load so visitors can choose their own schemes
      setSelectedFunds([null, null, null, null]);
      setIsLoadingFunds(false);
    }

    loadFunds();
    return () => {
      isMounted = false;
    };
  }, []);

  // Track active fund comparisons in Google Analytics whenever selected funds change
  useEffect(() => {
    const validFundNames = selectedFunds.filter((f): f is Fund => f !== null).map((f) => f.name);
    if (validFundNames.length >= 2) {
      trackFundComparison(validFundNames);
    }
  }, [selectedFunds]);

  const handleAcceptAds = () => {
    applyGtagConsent(true);
    setAdsConsent(true);
    setIsConsentModalOpen(false);
  };

  const handleRejectAds = () => {
    applyGtagConsent(false);
    setAdsConsent(false);
    setIsConsentModalOpen(false);
  };

  const handleSelectFund = (index: number, fund: Fund) => {
    trackFundSelect(fund.name, fund.category, index);
    const updated = [...selectedFunds];
    updated[index] = fund;
    setSelectedFunds(updated);
  };

  const handleClearFund = (index: number) => {
    const updated = [...selectedFunds];
    updated[index] = null;
    setSelectedFunds(updated);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-200 flex flex-col">
      {/* 1. Top Navbar: Ultra-clean header with borderless bottom */}
      <Navbar />

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col space-y-16 pb-0 pt-6">
        {/* 2. The Transposed Comparison Table (Horizontal Scroll) */}
        <section id="section-transposed-table" className="max-w-7xl mx-auto px-4 sm:px-6 w-full space-y-6">
          <div className="space-y-3">
            <div className="pb-2.5 border-b border-neutral-200">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-neutral-700" />
                Fund Selection
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Select up to 4 Indian mutual funds or index ETFs to audit shared equity allocations, stock weights, and cross-portfolio exposure
              </p>
            </div>

            {/* Simple inline text details without box design */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-600 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Side-by-Side Comparison:</strong> Choose schemes in the column headers below</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span><strong>Stock Weights:</strong> Inspect company-level percentage allocations</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Concentration Check:</strong> Identify overlapping stocks across multiple funds</span>
              </span>
            </div>
          </div>

          {isLoadingFunds && (
            <div className="flex items-center justify-center py-6 text-xs text-neutral-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              <span>Loading funds from backend database...</span>
            </div>
          )}

          <TransposedTable
            funds={selectedFunds}
            allFunds={backendFunds}
            fundColors={FUND_COLORS}
            onSelectFund={handleSelectFund}
            onClearFund={handleClearFund}
          />
        </section>

        {/* 3. Circular Overlap Visualization & Pairwise Comparison */}
        <section id="section-circular-overlap" className="max-w-7xl mx-auto px-6 w-full space-y-8 pt-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 pb-2.5 border-b border-neutral-200">
              Circular Overlap Visualization
            </h2>
            <p className="text-xs text-neutral-500">
              Interactive radial chord mapping of shared equity allocations and portfolio cross-holding densities
            </p>
          </div>

          {/* The Circular Overlap Graph */}
          <div className="w-full">
            <CircularOverlapChart
              funds={selectedFunds}
              fundColors={FUND_COLORS}
            />
          </div>

          {/* Pairwise Overlap Matrix */}
          <div className="pt-4">
            <PairwiseMatrix
              funds={selectedFunds}
              fundColors={FUND_COLORS}
            />
          </div>
        </section>

        {/* 4. Knowledge Hub & User Guide */}
        <section id="section-knowledge-guide" className="max-w-7xl mx-auto px-6 w-full pt-4">
          <KnowledgeAndGuide />
        </section>

        {/* 5. Scope Note & Legal Compliance Footer */}
        <section id="section-legal-compliance" className="w-full mt-auto pt-10">
          <LegalFooter
            onOpenConsent={() => setIsConsentModalOpen(true)}
            adsConsent={adsConsent}
          />
        </section>
      </main>

      {/* Pop Card Consent Modal (Shown ONLY when user clicks Consent Preferences button in footer) */}
      <ConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAcceptAds={handleAcceptAds}
        onRejectAds={handleRejectAds}
        currentAdsConsent={adsConsent}
      />
    </div>
  );
}
