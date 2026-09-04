import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Fund } from './types';
import { MOCK_FUNDS } from './data/mockFunds';
import { Navbar } from './components/Navbar';
import { TransposedTable } from './components/TransposedTable';
import { CircularOverlapChart } from './components/CircularOverlapChart';
import { PairwiseMatrix } from './components/PairwiseMatrix';
import { KnowledgeAndGuide } from './components/KnowledgeAndGuide';
import { LegalFooter } from './components/LegalFooter';

const FUND_COLORS = [
  '#00A896', // Fund 1: Teal (Top)
  '#FF6B4A', // Fund 2: Coral / Orange (Left)
  '#0284C7', // Fund 3: Sky Blue (Bottom)
  '#334155', // Fund 4: Slate Charcoal (Right)
];

export default function App() {
  // All 4 funds pre-selected for rich 4-circle Venn overlap visualization
  const [selectedFunds, setSelectedFunds] = useState<(Fund | null)[]>([
    MOCK_FUNDS[0], // Fund 1: Parag Parikh Flexi Cap Fund
    MOCK_FUNDS[1], // Fund 2: HDFC Nifty 50 ETF
    MOCK_FUNDS[2], // Fund 3: Mirae Large & Midcap Fund
    MOCK_FUNDS[3]  // Fund 4: Quant Active Fund
  ]);

  const handleSelectFund = (index: number, fund: Fund) => {
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
        <section id="section-transposed-table" className="max-w-7xl mx-auto px-6 w-full space-y-6">
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

          <TransposedTable
            funds={selectedFunds}
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
          <LegalFooter />
        </section>
      </main>
    </div>
  );
}
