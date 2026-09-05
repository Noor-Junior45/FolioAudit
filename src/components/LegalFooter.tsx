import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface LegalFooterProps {
  onOpenConsent?: () => void;
  adsConsent?: boolean | null;
}

export const LegalFooter: React.FC<LegalFooterProps> = ({
  onOpenConsent,
  adsConsent,
}) => {
  return (
    <footer
      id="legal-compliance-footer"
      className="w-full bg-emerald-50/60 rounded-none p-6 md:py-8 space-y-6 text-emerald-950 border-t border-emerald-200/40 border-b-0 border-x-0 m-0"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Section 1: AMC Scope Notice */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>AMC Scope Notice</span>
          </div>
          <p className="text-xs md:text-sm text-emerald-900/90 leading-relaxed pl-5.5">
            Coverage Scope: Currently indexing statutory monthly portfolio disclosures from the Top 10 Indian Asset Management Companies (AMCs) and major benchmark index ETFs (Nifty 50, Nifty Next 50, Nifty Midcap 150, Nifty Smallcap 250).
          </p>
        </div>

        {/* Section 2: Statutory Legal Disclaimer (SEBI Non-Advisory Protection) */}
        <div className="space-y-1.5 pt-4 border-t border-emerald-200/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-yellow-600 font-bold">Statutory Legal Disclaimer</span>
            <span className="text-emerald-900/80">(SEBI Non-Advisory Protection)</span>
          </div>
          <p className="text-xs md:text-sm text-emerald-900/80 leading-relaxed pl-5.5">
            <span className="text-yellow-600 font-bold">Statutory Disclaimer:</span> This application is purely an educational and informational data comparison tool. It is NOT registered under the SEBI (Investment Advisers) Regulations, 2013, nor does it provide financial, investment, legal, or tax advice. We do not provide buy, hold, or sell recommendations for any security, mutual fund scheme, or ETF. All portfolio data is derived directly from publicly available monthly statutory disclosures published by respective AMCs and exchange indices under SEBI regulatory guidelines. Holdings and percentage allocations are subject to periodic change. Users are strongly advised to conduct independent research and consult a SEBI-registered financial advisor before making any investment decisions. By accessing this information, you acknowledge that performance history does not guarantee future results.
          </p>
        </div>

        <div className="pt-3.5 border-t border-emerald-200/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 text-[11px] leading-relaxed text-emerald-900/75">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 font-mono text-[10.5px] sm:text-[11px]">
            <span>SEBI Circular Compliance: SEBI/HO/IMD/DF2/CIR/P/2018/19</span>
            <span className="hidden sm:inline text-emerald-300">•</span>
            <span>Portfolio Snapshot as of statutory month-end disclosures</span>
          </div>

          {onOpenConsent && (
            <div className="w-full sm:w-auto flex items-center justify-start lg:justify-end">
              <button
                id="footer-open-consent-btn"
                type="button"
                onClick={onOpenConsent}
                className="text-emerald-900 hover:text-emerald-950 underline underline-offset-4 decoration-emerald-500/70 hover:decoration-emerald-700 font-sans font-medium text-xs transition-colors cursor-pointer bg-transparent border-0 p-0"
                title="Manage personalized ads and cookie preferences"
              >
                Consent Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
