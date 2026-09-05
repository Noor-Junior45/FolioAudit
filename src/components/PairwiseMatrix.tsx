import React, { useState } from 'react';
import { Fund } from '../types';
import { calculatePairwiseOverlap } from '../utils/overlapCalculator';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { trackInspectOverlap } from '../utils/analytics';

interface PairwiseMatrixProps {
  funds: (Fund | null)[];
  fundColors: string[];
}

export const PairwiseMatrix: React.FC<PairwiseMatrixProps> = ({
  funds,
  fundColors
}) => {
  const [expandedPairKeys, setExpandedPairKeys] = useState<Record<string, boolean>>({});

  const togglePairExpanded = (key: string, fundA?: Fund, fundB?: Fund, overlapPct?: number) => {
    setExpandedPairKeys((prev) => {
      const willBeExpanded = !prev[key];
      if (willBeExpanded && fundA && fundB && overlapPct !== undefined) {
        trackInspectOverlap(fundA.name, fundB.name, overlapPct);
      }
      return {
        ...prev,
        [key]: willBeExpanded
      };
    });
  };

  // Group pairs according to user requirement:
  // - Fund 1 vs Fund 2, Fund 1 vs Fund 3, Fund 1 vs Fund 4
  // - Fund 2 vs Fund 1, Fund 2 vs Fund 3, Fund 2 vs Fund 4
  // - Fund 3 vs Fund 1, Fund 3 vs Fund 2, Fund 3 vs Fund 4
  // - Fund 4 vs Fund 1, Fund 4 vs Fund 2, Fund 4 vs Fund 3
  const pairGroups: {
    baseFundIndex: number;
    pairs: {
      key: string;
      label: string;
      indexA: number;
      indexB: number;
      fundA: Fund;
      fundB: Fund;
    }[];
  }[] = [];

  for (let i = 0; i < funds.length; i++) {
    const fundA = funds[i];
    if (!fundA) continue;

    const groupPairs: {
      key: string;
      label: string;
      indexA: number;
      indexB: number;
      fundA: Fund;
      fundB: Fund;
    }[] = [];

    for (let j = 0; j < funds.length; j++) {
      if (i === j) continue;
      const fundB = funds[j];
      if (!fundB) continue;

      groupPairs.push({
        key: `pair-${i}-${j}`,
        label: `Fund ${i + 1} vs Fund ${j + 1}`,
        indexA: i,
        indexB: j,
        fundA,
        fundB
      });
    }

    if (groupPairs.length > 0) {
      pairGroups.push({
        baseFundIndex: i,
        pairs: groupPairs
      });
    }
  }

  const allPairKeys = pairGroups.flatMap((g) => g.pairs.map((p) => p.key));
  const areAllExpanded =
    allPairKeys.length > 0 && allPairKeys.every((k) => !!expandedPairKeys[k]);

  const toggleAllPairs = () => {
    if (areAllExpanded) {
      setExpandedPairKeys({});
    } else {
      const next: Record<string, boolean> = {};
      allPairKeys.forEach((k) => {
        next[k] = true;
      });
      setExpandedPairKeys(next);
    }
  };

  const hasPairs = pairGroups.some((g) => g.pairs.length > 0);

  if (!hasPairs) {
    return (
      <div id="pairwise-overlap-matrix" className="w-full p-8 rounded-2xl bg-neutral-50/70 border border-dashed border-neutral-300 text-center space-y-2">
        <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center mx-auto text-neutral-500 shadow-2xs">
          <Layers className="w-4 h-4 text-neutral-600" />
        </div>
        <div className="text-xs font-semibold text-neutral-800">
          Pairwise Overlap Matrix
        </div>
        <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
          Select at least two funds in the comparison table above to calculate pairwise stock overlaps and common portfolio weights.
        </p>
      </div>
    );
  }

  return (
    <div id="pairwise-overlap-matrix" className="w-full space-y-6">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-200">
            <h3 className="text-base font-semibold text-neutral-900">
              Pairwise Overlap Matrix
            </h3>
            <button
              type="button"
              onClick={toggleAllPairs}
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
            >
              {areAllExpanded ? 'Collapse All Cards' : 'Expand All Cards'}
            </button>
          </div>
          <p className="text-xs font-mono text-neutral-700 mt-2.5">
            Overlap(A, B) = ∑ min(Weight_A(i), Weight_B(i)) for all common stocks i ∈ (A ∩ B)
          </p>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            First, common securities between Fund A and Fund B are identified by matching ISINs. Next, the lower portfolio weight is taken for each shared stock: min(Weight_A, Weight_B). Finally, all minimum weights are summed to calculate the total shared portfolio percentage.
          </p>
        </div>
      </div>

      {/* Grid of clean pairwise comparison cards */}
      <div className="space-y-8">
        {pairGroups.map((group, groupIdx) => (
          <div
            key={`group-${group.baseFundIndex}`}
            className={`space-y-3 ${groupIdx > 0 ? 'pt-6 border-t border-neutral-200' : ''}`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-neutral-400">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: fundColors[group.baseFundIndex] }}
              />
              <span>Pairings starting from Fund {group.baseFundIndex + 1}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
              {group.pairs.map(({ key, label, indexA, indexB, fundA, fundB }) => {
                const overlap = calculatePairwiseOverlap(fundA, fundB);
                const isExpanded = !!expandedPairKeys[key];
                const percentage = overlap.overlapPercentage;

                // Overlap badge severity
                const overlapLevel =
                  percentage < 15
                    ? { label: 'Low Overlap', class: 'bg-neutral-100 text-neutral-600' }
                    : percentage < 35
                    ? { label: 'Moderate Overlap', class: 'bg-neutral-200 text-neutral-800' }
                    : { label: 'High Overlap', class: 'bg-neutral-900 text-white' };

                return (
                  <div
                    key={key}
                    className="p-4 rounded-2xl bg-neutral-50/70 hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      {/* Pair header with custom colors */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono font-medium text-neutral-400">
                          {label}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${overlapLevel.class}`}
                        >
                          {overlapLevel.label}
                        </span>
                      </div>

                      {/* Fund short names */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: fundColors[indexA] }}
                          />
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {fundA.shortName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: fundColors[indexB] }}
                          />
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {fundB.shortName}
                          </span>
                        </div>
                      </div>

                      {/* Metric display: borderless clean text for common stocks and portfolio weight */}
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <div>
                          <span className="text-neutral-500">Common Stocks: </span>
                          <span className="font-mono font-semibold text-neutral-900">
                            {overlap.commonStockCount} {overlap.commonStockCount === 1 ? 'stock' : 'stocks'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-500">Portfolio Weight: </span>
                          <span className="font-mono font-semibold text-neutral-900">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Weight Progress Bar */}
                      <div className="w-full bg-neutral-200/70 rounded-full h-1.5 overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(2, percentage))}%`,
                            background: `linear-gradient(90deg, ${fundColors[indexA]}, ${fundColors[indexB]})`
                          }}
                        />
                      </div>
                    </div>

                    {/* Common Stocks Accordion */}
                    <div className="pt-2 border-t border-neutral-200/50">
                      <button
                        type="button"
                        onClick={() => togglePairExpanded(key, fundA, fundB, percentage)}
                        className="w-full flex items-center justify-between text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1 text-[11px]">
                          <Layers className="w-3 h-3 text-neutral-400" />
                          {isExpanded ? 'Hide Common Stocks' : 'View Top Common Holdings'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-neutral-900" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-900" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-1.5">
                          {overlap.commonHoldings.length === 0 ? (
                            <p className="text-[11px] text-neutral-400 py-1">
                              No overlapping stocks found between these two schemes.
                            </p>
                          ) : (
                            overlap.commonHoldings.map((item) => (
                              <div
                                key={item.stock.isin}
                                className="flex items-center justify-between text-[11px] py-1 border-b border-neutral-100 last:border-0"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="text-neutral-800 font-medium truncate">
                                    {item.stock.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-neutral-400">
                                    {item.stock.isin}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-mono font-semibold text-neutral-900">
                                    +{item.overlapContribution.toFixed(2)}%
                                  </div>
                                  <div className="text-[10px] font-mono text-neutral-400">
                                    {item.weightA.toFixed(1)}% / {item.weightB.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
