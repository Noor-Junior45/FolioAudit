import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  Layers, 
  Sliders, 
  PieChart, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  ShieldAlert,
  Building2,
  Wallet
} from 'lucide-react';

export const KnowledgeAndGuide: React.FC = () => {
  return (
    <section id="section-knowledge-and-guide" className="w-full space-y-10">
      {/* Main Section Header */}
      <div className="space-y-1.5 pb-3 border-b border-neutral-200">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neutral-700" />
          Knowledge Hub & User Guide
        </h2>
        <p className="text-xs text-neutral-500">
          Learn how mutual fund overlap affects your returns and how to use this tool effectively
        </p>
      </div>

      {/* Part 1: How to Use Our Tool */}
      <div id="how-to-use-guide" className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <HelpCircle className="w-4 h-4 text-neutral-700" />
          <h3>How to Use Our Tool</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div 
            id="guide-step-1" 
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold font-mono flex items-center justify-center">
                  01
                </span>
                <Search className="w-4 h-4 text-neutral-400" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">Select Up to 4 Funds</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Use the header dropdowns in the top table or the fund selector pills. Pick mutual funds or index ETFs to compare side-by-side.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Instant statutory data load
            </div>
          </div>

          {/* Step 2 */}
          <div 
            id="guide-step-2" 
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold font-mono flex items-center justify-center">
                  02
                </span>
                <Sliders className="w-4 h-4 text-neutral-400" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">Scan Stock Allocations</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Scroll the main table to view direct company holdings, sector tags, and exact weight percentages across all selected funds.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Color-coded weight indicators
            </div>
          </div>

          {/* Step 3 */}
          <div 
            id="guide-step-3" 
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold font-mono flex items-center justify-center">
                  03
                </span>
                <PieChart className="w-4 h-4 text-neutral-400" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">Explore Circular Venn</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Click the 4-circle Venn intersection lenses (petals) or the central CORE hub to inspect overlapping stocks and shared exposure in real time.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Live visual intelligence panel
            </div>
          </div>

          {/* Step 4 */}
          <div 
            id="guide-step-4" 
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold font-mono flex items-center justify-center">
                  04
                </span>
                <Layers className="w-4 h-4 text-neutral-400" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">Review Pairwise Matrix</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Open any pairwise card to see the exact percentage overlap and top common stocks shared between any two specific funds.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-200/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Multi-card comparison support
            </div>
          </div>
        </div>

        {/* Practical Pro-Tips Banner */}
        <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200 text-neutral-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-semibold uppercase tracking-wider">
              Tip
            </span>
            <span>
              To clean up your portfolio, identify fund pairs with <strong>&gt; 50% overlap</strong>. You may be paying two separate expense ratios for identical stocks!
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            Target: Maintain portfolio overlap &lt; 35%
          </span>
        </div>
      </div>

      {/* Part 2: Overlap Essentials (Stacked directly below) */}
      <div id="overlap-essentials-section" className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Calculator className="w-4 h-4 text-neutral-700" />
          <h3>Overlap Essentials & Fundamentals</h3>
        </div>

        <div id="knowledge-topics-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: What is Portfolio Overlap? */}
          <div 
            id="knowledge-card-concept"
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>The Illusion of Diversification</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Investing in multiple mutual funds does not automatically diversify your risk. If you own three Large Cap or Flexi Cap schemes, all three may allocate 7% to 10% each to the same companies (e.g., HDFC Bank, Reliance Industries, ICICI Bank).
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                This results in <strong>portfolio concentration risk</strong> disguised as diversification, alongside duplicated fund manager fees.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-200/60 text-[11px] text-neutral-500 font-mono">
              Key Metric: % of Common Stocks vs Distinct Exposure
            </div>
          </div>

          {/* Card 2: The SEBI Mathematical Formula */}
          <div 
            id="knowledge-card-formula"
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-sky-600" />
                <span>How Overlap is Calculated</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                We use the standard institutional minimum-weight formula:
              </p>
              <div className="py-3.5 px-4 my-3 rounded-xl bg-white font-mono text-xs sm:text-[12.5px] text-center leading-relaxed tracking-wide shadow-2xs">
                <span className="text-indigo-600 font-bold">Overlap</span>
                <span className="text-neutral-400">(</span>
                <span className="text-teal-600 font-bold">A</span>
                <span className="text-neutral-400">, </span>
                <span className="text-amber-600 font-bold">B</span>
                <span className="text-neutral-400">)</span>
                <span className="text-neutral-400 font-bold mx-2">=</span>
                <span className="text-purple-600 font-bold text-sm sm:text-base">∑</span>
                <span className="text-rose-600 font-bold ml-1.5">min</span>
                <span className="text-neutral-400">(</span>
                <span className="text-teal-600 font-semibold">Weight_A</span>
                <span className="text-neutral-400">(i), </span>
                <span className="text-amber-600 font-semibold">Weight_B</span>
                <span className="text-neutral-400">(i)</span>
                <span className="text-neutral-400">)</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                If Fund A holds 8% in Stock X and Fund B holds 5%, the mutual overlap contribution for Stock X is exactly <strong>5%</strong>.
              </p>
            </div>
            <div className="pt-3 border-t border-neutral-200/60 text-[11px] text-neutral-500 font-mono">
              Strict Mathematical Precision (SEBI Disclosures)
            </div>
          </div>

          {/* Card 3: Actionable Decision Benchmarks */}
          <div 
            id="knowledge-card-benchmarks"
            className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Decision Benchmarks</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-emerald-600 shrink-0">&lt; 30%</span>
                  <span><strong>Low Overlap</strong> — High true diversification across asset styles or market capitalization.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-amber-600 shrink-0">30% - 60%</span>
                  <span><strong>Moderate Overlap</strong> — Common among similar equity mandates. Review whether both are needed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-rose-600 shrink-0">&gt; 60%</span>
                  <span><strong>High Overlap</strong> — Significant duplication. Consider consolidating into a single scheme or low-cost index ETF.</span>
                </li>
              </ul>
            </div>
            <div className="pt-3 border-t border-neutral-200/60 text-[11px] text-neutral-500 font-mono">
              Target: Maintain total portfolio overlap below 35%
            </div>
          </div>
        </div>
      </div>

      {/* Part 3: Brokerage & Demat Compatibility (Groww, Zerodha, Kite, Indmoney, Angel One & Top AMCs) */}
      <div id="demat-amc-compatibility" className="space-y-4 pt-2 border-t border-neutral-200/70">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Building2 className="w-4 h-4 text-neutral-700" />
          <h3>Compatible with Demat Portfolios & Top Indian AMCs</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Demat Accounts */}
          <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <span>Supported Demat & Brokerage Platforms</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Invest through discount brokers or wealth apps? FolioAudit lets you audit schemes bought via:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Groww',
                'Zerodha Coin / Kite',
                'INDmoney',
                'Angel One',
                'Upstox',
                'Kuvera',
                'Dhan',
                'Paytm Money',
                'Direct AMC Portals'
              ].map((platform) => (
                <span
                  key={platform}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11.5px] font-medium text-neutral-800 shadow-2xs"
                >
                  {platform}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug pt-2 border-t border-neutral-200/60">
              No account login or portfolio sync required — simply select your funds above to see exact holding overlap.
            </p>
          </div>

          {/* Card: Top Indian AMCs */}
          <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Coverage of Top Indian Fund Houses</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Updated monthly according to SEBI statutory month-end disclosures across leading AMCs:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Parag Parikh',
                'HDFC Mutual Fund',
                'SBI Mutual Fund',
                'ICICI Prudential',
                'Quant Mutual Fund',
                'Nippon India',
                'Mirae Asset',
                'Tata Mutual Fund',
                'Axis Mutual Fund',
                'Bandhan Mutual Fund',
                'UTI Mutual Fund',
                'Nifty 50 & Next 50 ETFs'
              ].map((amc) => (
                <span
                  key={amc}
                  className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11.5px] font-medium text-neutral-800 shadow-2xs"
                >
                  {amc}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug pt-2 border-t border-neutral-200/60">
              Includes large-cap, flexi-cap, mid-cap, small-cap, focused, ELSS, and index schemes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
