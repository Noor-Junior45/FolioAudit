import React, { useMemo } from 'react';
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

export const TransposedTable: React.FC<TransposedTableProps> = ({
  funds,
  allFunds,
  fundColors,
  onSelectFund,
  onClearFund
}) => {
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

  return (
    <div id="transposed-comparison-table-section" className="w-full">
      {/* Exchanged Comparison Table: 4 Funds in 1st row, all stocks in rows without separate vertical scroll */}
      <div className="w-full overflow-x-auto rounded-2xl bg-neutral-50/50 border border-neutral-300 shadow-2xs">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[760px]">
          <thead className="sticky top-0 z-20 bg-neutral-100 backdrop-blur-sm shadow-xs">
            <tr>
              {/* Column 1 Header: Stock Name / ISIN */}
              <th
                scope="col"
                className="p-3 w-60 min-w-[200px] max-w-[260px] text-xs font-semibold text-neutral-800 align-top border-r border-neutral-300 border-b border-neutral-300 bg-neutral-100"
              >
                <div className="space-y-0.5">
                  <span className="uppercase tracking-wider text-[10px] text-neutral-500 font-semibold block">
                    Holdings
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-neutral-900 text-xs">
                      Stock Details
                    </div>
                    <span className="text-xs font-mono font-semibold text-neutral-900">
                      {unionStocks.length} Stocks
                    </span>
                  </div>
                </div>
              </th>

              {/* Columns 2 through 5: Fund 1 to Fund 4 in 1st row */}
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
                    className="p-3 w-64 min-w-[220px] max-w-[280px] align-top font-normal border-r border-neutral-300 last:border-r-0 border-b border-neutral-300 bg-neutral-100"
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
                      placeholder={`Select fund ${index + 1}...`}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="bg-white">
            {/* Rows: Each unique stock across selected funds */}
            {unionStocks.map((stock) => (
              <tr
                key={stock.isin}
                className="hover:bg-neutral-50/80 transition-colors"
              >
                {/* Column 1: Stock Details stacked */}
                <td className="p-3 align-top w-60 min-w-[200px] max-w-[260px] border-r border-neutral-300 border-b border-neutral-300">
                  <div className="space-y-0.5">
                    <div
                      className="text-xs font-semibold text-neutral-900 leading-snug break-words"
                      title={stock.name}
                    >
                      {stock.name}
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

                  return (
                    <td
                      key={`${stock.isin}-fund-${fundIndex}`}
                      className="p-3 align-middle text-center border-r border-neutral-300 last:border-r-0 border-b border-neutral-300"
                    >
                      {fund ? (
                        holding ? (
                          <span className="text-xs font-mono font-semibold text-black block">
                            {holding.weight.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-semibold text-black block">
                            —
                          </span>
                        )
                      ) : (
                        <span className="text-xs font-mono font-semibold text-black block">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {unionStocks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-xs text-neutral-400 font-normal"
                >
                  No stocks to display. Please select at least one fund above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
