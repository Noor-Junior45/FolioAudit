import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Fund, Holding } from '../types';
import { FundCombobox } from './FundCombobox';
import { getUnionStocks } from '../utils/overlapCalculator';

interface TransposedTableProps {
  funds: (Fund | null)[];
  allFunds: Fund[];
  fundColors: string[];
  onSelectFund: (index: number, fund: Fund) => void;
  onClearFund: (index: number) => void;
}

const HIGH_WEIGHT_THRESHOLD = 5.0;

export const TransposedTable: React.FC<TransposedTableProps> = ({
  funds,
  allFunds,
  fundColors,
  onSelectFund,
  onClearFund
}) => {
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(57);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Calculate unique union of stocks across selected funds sorted alphabetically
  const unionStocks = useMemo(() => {
    return getUnionStocks(funds);
  }, [funds]);

  // Pre-calculate holdings mapping for fast lookup: fundIndex -> Map<isin, Holding>
  const fundHoldingsMap = useMemo(() => {
    return funds.map((f) => {
      if (!f) return new Map<string, Holding>();
      const map = new Map<string, Holding>();
      f.holdings.forEach((h) => map.set(h.isin, h));
      return map;
    });
  }, [funds]);

  // Monitor scroll position to fix top row at the navbar when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current) return;
      const rect = tableContainerRef.current.getBoundingClientRect();
      const navbar = document.getElementById('top-navbar');
      const currentNavHeight = navbar ? navbar.offsetHeight : 57;
      setNavbarHeight(currentNavHeight);

      // Show sticky header when the real table header has scrolled behind or to the navbar,
      // and hide when the user has scrolled past the table rows (reaching the charts below)
      const headerHeight = 65;
      const shouldShow =
        rect.top <= currentNavHeight &&
        rect.bottom >= currentNavHeight + headerHeight + 50;

      setIsStickyVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Synchronize horizontal scroll position between main table and sticky header
  useEffect(() => {
    if (isStickyVisible && stickyScrollRef.current && tableContainerRef.current) {
      stickyScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, [isStickyVisible]);

  const handleTableScroll = () => {
    if (!stickyScrollRef.current || !tableContainerRef.current) return;
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    stickyScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleStickyScroll = () => {
    if (!stickyScrollRef.current || !tableContainerRef.current) return;
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    tableContainerRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  return (
    <div id="transposed-comparison-table-section" className="w-full relative">
      {/* Pinned Top Row: Fixed directly at the top navbar when scrolling down long stock lists */}
      {isStickyVisible && (
        <div
          id="pinned-transposed-table-header"
          style={{ top: `${navbarHeight}px` }}
          className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-300 shadow-md transition-opacity duration-150 animate-in fade-in"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div
              ref={stickyScrollRef}
              onScroll={handleStickyScroll}
              className="w-full overflow-x-auto border-x border-neutral-300 bg-neutral-100/95 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <table className="w-full text-left border-separate border-spacing-0 min-w-[940px] sm:min-w-[1080px]">
                <thead>
                  <tr>
                    {/* Fixed Column 1 Header: Holdings Column */}
                    <th
                      scope="col"
                      className="pl-4 sm:pl-6 pr-2.5 sm:pr-3 py-2.5 sm:py-3 w-44 min-w-[160px] max-w-[200px] sm:w-64 sm:min-w-[220px] sm:max-w-[280px] text-xs font-semibold text-neutral-800 align-top border-l border-r border-neutral-300 bg-neutral-100 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
                    >
                      <div className="space-y-0.5">
                        <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-semibold block">
                          Holdings
                        </span>
                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                          <div className="font-semibold text-neutral-900 text-xs">
                            Stock Details
                          </div>
                          <span className="text-xs font-mono font-semibold text-neutral-900 shrink-0">
                            {unionStocks.length} Stocks
                          </span>
                        </div>
                      </div>
                    </th>

                    {/* Columns 2 through 5: 4 Funds */}
                    {funds.map((fund, index) => {
                      const rowLabel = `Fund ${index + 1}`;
                      const isRemovable = index >= 2;
                      const otherSelectedIds = funds
                        .filter((f, i): f is Fund => i !== index && f !== null)
                        .map((f) => f.id);

                      return (
                        <th
                          key={`pinned-fund-col-${index}`}
                          scope="col"
                          className="p-2.5 sm:p-3 w-56 min-w-[200px] sm:w-64 sm:min-w-[220px] sm:max-w-[280px] align-top font-normal border-r border-neutral-300 bg-neutral-100"
                        >
                          <FundCombobox
                            selectedFund={fund}
                            allFunds={allFunds}
                            excludedFundIds={otherSelectedIds}
                            onSelect={(f) => onSelectFund(index, f)}
                            onClear={() => onClearFund(index)}
                            rowLabel={rowLabel}
                            isRemovable={isRemovable}
                            color={fundColors[index]}
                            dropdownAlign={index >= 2 ? 'right' : 'left'}
                            placeholder={`+ Choose ${rowLabel}...`}
                            idPrefix="pinned"
                          />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Exchanged Comparison Table: 4 Funds in 1st row, all stocks in rows without separate vertical scroll */}
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="w-full overflow-x-auto rounded-xl sm:rounded-2xl bg-neutral-50/50 border border-neutral-300 shadow-2xs min-h-[460px] scroll-smooth"
      >
        <table className="w-full text-left border-separate border-spacing-0 min-w-[940px] sm:min-w-[1080px]">
          <thead className="sticky top-0 z-20 bg-neutral-100 backdrop-blur-sm shadow-xs">
            <tr>
              {/* Column 1 Header: Fixed / Sticky Holdings Column */}
              <th
                scope="col"
                className="pl-4 sm:pl-6 pr-2.5 sm:pr-3 py-2.5 sm:py-3 w-44 min-w-[160px] max-w-[200px] sm:w-64 sm:min-w-[220px] sm:max-w-[280px] text-xs font-semibold text-neutral-800 align-top border-l border-r border-neutral-300 border-b border-neutral-300 bg-neutral-100 sticky left-0 top-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]"
              >
                <div className="space-y-0.5">
                  <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-semibold block">
                    Holdings
                  </span>
                  <div className="flex items-center justify-between gap-1 sm:gap-2">
                    <div className="font-semibold text-neutral-900 text-xs">
                      Stock Details
                    </div>
                    <span className="text-xs font-mono font-semibold text-neutral-900 shrink-0">
                      {unionStocks.length} Stocks
                    </span>
                  </div>
                </div>
              </th>

              {/* Columns 2 through 5: Fund 1 to Fund 4 in 1st row (scrollable horizontally) */}
              {funds.map((fund, index) => {
                const rowLabel = `Fund ${index + 1}`;
                const isRemovable = index >= 2;
                const otherSelectedIds = funds
                  .filter((f, i): f is Fund => i !== index && f !== null)
                  .map((f) => f.id);

                return (
                  <th
                    key={`fund-col-${index}`}
                    scope="col"
                    className="p-2.5 sm:p-3 w-56 min-w-[200px] sm:w-64 sm:min-w-[220px] sm:max-w-[280px] align-top font-normal border-r border-neutral-300 border-b border-neutral-300 bg-neutral-100"
                  >
                    <FundCombobox
                      selectedFund={fund}
                      allFunds={allFunds}
                      excludedFundIds={otherSelectedIds}
                      onSelect={(f) => onSelectFund(index, f)}
                      onClear={() => onClearFund(index)}
                      rowLabel={rowLabel}
                      isRemovable={isRemovable}
                      color={fundColors[index]}
                      dropdownAlign={index >= 2 ? 'right' : 'left'}
                      placeholder={`+ Choose ${rowLabel}...`}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="bg-white">
            {/* Rows: Each unique stock across selected funds */}
            {unionStocks.map((stock) => {
              // Check if stock is held across multiple selected funds
              const fundsWithStock = funds.filter(
                (f, idx) => f && fundHoldingsMap[idx].has(stock.isin)
              );
              const isOverlapping = fundsWithStock.length > 1;

              return (
                <tr
                  key={stock.isin}
                  className="group hover:bg-neutral-50/80 transition-colors"
                >
                  {/* Column 1: Fixed / Sticky Stock Details stacked */}
                  <td className="pl-4 sm:pl-6 pr-2.5 sm:pr-3 py-2.5 sm:py-3 align-top w-44 min-w-[160px] max-w-[200px] sm:w-64 sm:min-w-[220px] sm:max-w-[280px] border-l border-r border-neutral-300 border-b border-neutral-300 sticky left-0 z-10 bg-white group-hover:bg-neutral-50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                    <div className="space-y-0.5">
                      <div
                        className="text-xs font-semibold text-neutral-900 leading-snug break-words flex items-start justify-between gap-1.5"
                        title={stock.name}
                      >
                        <span>{stock.name}</span>
                        {isOverlapping && (
                          <span
                            className="shrink-0 text-[10px] font-medium font-sans px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80"
                            title={`Held in ${fundsWithStock.length} selected funds`}
                          >
                            {fundsWithStock.length} funds
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 leading-tight">
                        {stock.isin}
                      </div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-sans leading-tight">
                        {stock.sector}
                      </div>
                    </div>
                  </td>

                  {/* Columns 2 through 5: Weights for Fund 1, Fund 2, Fund 3, Fund 4 */}
                  {funds.map((fund, fundIndex) => {
                    const holding = fund
                      ? fundHoldingsMap[fundIndex].get(stock.isin)
                      : null;
                    const isHighWeight = Boolean(
                      holding && holding.weight >= HIGH_WEIGHT_THRESHOLD
                    );

                    return (
                      <td
                        key={`${stock.isin}-fund-${fundIndex}`}
                        className={`p-2.5 sm:p-3 align-middle text-center border-r border-neutral-300 border-b border-neutral-300 transition-colors ${
                          isHighWeight
                            ? 'bg-[#FFFDF0] group-hover:bg-[#FEF9D9]'
                            : ''
                        }`}
                        title={
                          holding
                            ? `${stock.name}: ${holding.weight.toFixed(2)}% in ${fund?.name}${
                                isHighWeight ? ' (High weight >5%)' : ''
                              }`
                            : undefined
                        }
                      >
                        {fund ? (
                          holding ? (
                            <div className="inline-flex items-center justify-center">
                              <span
                                className={`text-xs font-mono block ${
                                  isHighWeight
                                    ? 'font-bold text-amber-950'
                                    : 'font-semibold text-neutral-900'
                                }`}
                              >
                                {holding.weight.toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-neutral-300 block">
                              —
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-mono text-neutral-300 block">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {unionStocks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-32 px-6 text-center"
                >
                  <div className="max-w-md mx-auto space-y-2.5 text-center">
                    <div className="text-sm font-semibold text-neutral-800">
                      No funds selected yet
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Click on any of the dashed boxes above (<strong>+ Choose Fund 1</strong> to <strong>+ Choose Fund 4</strong>) to pick mutual funds or index ETFs and audit their shared equity holdings.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
