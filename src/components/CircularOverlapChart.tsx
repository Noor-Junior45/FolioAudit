import React, { useState, useMemo } from 'react';
import { Fund } from '../types';
import { calculatePairwiseOverlap, getUnionStocks } from '../utils/overlapCalculator';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Info, 
  ArrowRightLeft,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Percent
} from 'lucide-react';

interface CircularOverlapChartProps {
  funds: (Fund | null)[];
  fundColors: string[];
}

type InspectionType = 
  | { kind: 'core' }
  | { kind: 'petal'; pairKey: string; indexA: number; indexB: number }
  | { kind: 'cross'; pairKey: string; indexA: number; indexB: number }
  | { kind: 'fund'; fundIndex: number };

// Helper to wrap long mutual fund names into two clean lines
function getWrappedNameLines(name: string, maxChars = 22): [string, string] {
  if (!name) return ['', ''];
  const clean = name.trim();
  if (clean.length <= maxChars) return [clean, ''];
  const words = clean.split(' ');
  const line1Words: string[] = [];
  let currentLen = 0;
  let i = 0;
  while (i < words.length && (currentLen + words[i].length <= maxChars || line1Words.length === 0)) {
    line1Words.push(words[i]);
    currentLen += words[i].length + 1;
    i++;
  }
  const line1 = line1Words.join(' ');
  const remaining = words.slice(i).join(' ');
  const line2 = remaining.length > maxChars + 6 ? remaining.slice(0, maxChars + 4) + '…' : remaining;
  return [line1, line2];
}

export const CircularOverlapChart: React.FC<CircularOverlapChartProps> = ({
  funds,
  fundColors
}) => {
  // Inspection state: default to 'core' or first active pair
  const [selectedItem, setSelectedItem] = useState<InspectionType>({ kind: 'core' });
  const [hoveredItem, setHoveredItem] = useState<InspectionType | null>(null);

  // 4 positions: 0 = Top, 1 = Left, 2 = Bottom, 3 = Right
  const fundPositions = [
    { position: 'Top', index: 0, defaultColor: '#00A896', role: 'Fund 1' },
    { position: 'Left', index: 1, defaultColor: '#FF6B4A', role: 'Fund 2' },
    { position: 'Bottom', index: 2, defaultColor: '#0284C7', role: 'Fund 3' },
    { position: 'Right', index: 3, defaultColor: '#334155', role: 'Fund 4' }
  ];

  // Active funds map
  const activeFundsList = useMemo(() => {
    return funds
      .map((fund, index) => ({ fund, index, color: fundColors[index] || fundPositions[index].defaultColor }))
      .filter((item): item is { fund: Fund; index: number; color: string } => item.fund !== null);
  }, [funds, fundColors]);

  // Precompute pairwise overlaps for all 6 possible combinations
  const pairwiseMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculatePairwiseOverlap>>();
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const fundA = funds[i];
        const fundB = funds[j];
        if (fundA && fundB) {
          const overlap = calculatePairwiseOverlap(fundA, fundB);
          map.set(`${i}-${j}`, overlap);
        }
      }
    }
    return map;
  }, [funds]);

  // 4 Adjacent Petals:
  // Petal 0-1: Top & Left
  // Petal 0-3: Top & Right
  // Petal 1-2: Bottom & Left
  // Petal 2-3: Bottom & Right
  const petals = [
    {
      id: 'petal-top-left',
      pairKey: '0-1',
      indexA: 0,
      indexB: 1,
      title: 'Top × Left',
      color: '#FF6B4A',
      patternId: 'petal-h-stripes',
      cx: 480,
      cy: 350,
      clipCircleId: 'clip-circle-0',
      fillCircleIndex: 1
    },
    {
      id: 'petal-top-right',
      pairKey: '0-3',
      indexA: 0,
      indexB: 3,
      title: 'Top × Right',
      color: '#00A896',
      patternId: 'petal-dots',
      cx: 600,
      cy: 350,
      clipCircleId: 'clip-circle-0',
      fillCircleIndex: 3
    },
    {
      id: 'petal-bottom-left',
      pairKey: '1-2', // fund 1 & 2 in sorted order
      indexA: 1,
      indexB: 2,
      title: 'Bottom × Left',
      color: '#0284C7',
      patternId: 'petal-grid',
      cx: 480,
      cy: 470,
      clipCircleId: 'clip-circle-2',
      fillCircleIndex: 1
    },
    {
      id: 'petal-bottom-right',
      pairKey: '2-3',
      indexA: 2,
      indexB: 3,
      title: 'Bottom × Right',
      color: '#334155',
      patternId: 'petal-diag-stripes',
      cx: 600,
      cy: 470,
      clipCircleId: 'clip-circle-2',
      fillCircleIndex: 3
    }
  ];

  // Core Common Stocks across ALL active selected funds (minimum 2)
  const coreIntersection = useMemo(() => {
    if (activeFundsList.length < 2) {
      return { commonStocks: [], totalCoreOverlapWeight: 0, count: 0 };
    }

    const firstFund = activeFundsList[0].fund;
    const common: {
      stock: { isin: string; name: string; sector: string };
      weights: { fundIndex: number; fundName: string; weight: number; color: string }[];
      minWeight: number;
      avgWeight: number;
    }[] = [];

    firstFund.holdings.forEach((h) => {
      let isCommonToAll = true;
      const weightsList: { fundIndex: number; fundName: string; weight: number; color: string }[] = [
        {
          fundIndex: activeFundsList[0].index,
          fundName: firstFund.shortName,
          weight: h.weight,
          color: activeFundsList[0].color
        }
      ];

      for (let i = 1; i < activeFundsList.length; i++) {
        const otherFund = activeFundsList[i].fund;
        const match = otherFund.holdings.find((item) => item.isin === h.isin);
        if (!match) {
          isCommonToAll = false;
          break;
        }
        weightsList.push({
          fundIndex: activeFundsList[i].index,
          fundName: otherFund.shortName,
          weight: match.weight,
          color: activeFundsList[i].color
        });
      }

      if (isCommonToAll) {
        const minW = Math.min(...weightsList.map((w) => w.weight));
        const avgW = weightsList.reduce((acc, curr) => acc + curr.weight, 0) / weightsList.length;
        common.push({
          stock: { isin: h.isin, name: h.name, sector: h.sector },
          weights: weightsList,
          minWeight: minW,
          avgWeight: avgW
        });
      }
    });

    common.sort((a, b) => b.minWeight - a.minWeight);
    const totalCoreOverlapWeight = common.reduce((acc, curr) => acc + curr.minWeight, 0);

    return {
      commonStocks: common,
      totalCoreOverlapWeight: Math.round(totalCoreOverlapWeight * 100) / 100,
      count: common.length
    };
  }, [activeFundsList]);

  // Overall statistics for high-level cards
  const unionStocksCount = useMemo(() => {
    return getUnionStocks(funds).length;
  }, [funds]);

  const highestOverlap = useMemo(() => {
    let max = { pairKey: '', val: 0, nameA: '', nameB: '' };
    pairwiseMap.forEach((val, key) => {
      if (val.overlapPercentage > max.val) {
        max = {
          pairKey: key,
          val: val.overlapPercentage,
          nameA: val.fundA.shortName,
          nameB: val.fundB.shortName
        };
      }
    });
    return max;
  }, [pairwiseMap]);

  // Determine which item is currently in focus for inspection
  const activeFocus = hoveredItem || selectedItem;

  // Geometry constants for the 4-circle cloverleaf diagram with outside label cards
  const svgWidth = 1080;
  const svgHeight = 820;
  const centerCoordX = 540;
  const centerCoordY = 410;
  const circleRadius = 135;
  const offset = 120;

  // Circle centers:
  // 0: Top (540, 410 - 120 = 290)
  // 1: Left (540 - 120 = 420, 410)
  // 2: Bottom (540, 410 + 120 = 530)
  // 3: Right (540 + 120 = 660, 410)
  const circleCoordinates = [
    { cx: 540, cy: 290, role: 'Fund 1 (Top)', shortRole: 'F1', innerTextY: 245 },
    { cx: 420, cy: 410, role: 'Fund 2 (Left)', shortRole: 'F2', innerTextY: 410 },
    { cx: 540, cy: 530, role: 'Fund 3 (Bottom)', shortRole: 'F3', innerTextY: 575 },
    { cx: 660, cy: 410, role: 'Fund 4 (Right)', shortRole: 'F4', innerTextY: 410 }
  ];

  // 4 Outer Cards positioned strictly outside the circles with balanced leader indicator lines
  const outerCards = [
    // Top Fund
    {
      index: 0,
      role: 'Fund 1 (Top)',
      shortRole: 'F1',
      cardX: 540,
      cardY: 66,
      cardW: 300,
      cardH: 74,
      lineFrom: { x: 540, y: 103 },
      lineTo: { x: 540, y: 155 }
    },
    // Left Fund (Fund 2) - clean connecting line to the left circle
    {
      index: 1,
      role: 'Fund 2 (Left)',
      shortRole: 'F2',
      cardX: 122,
      cardY: 410,
      cardW: 216,
      cardH: 86,
      lineFrom: { x: 230, y: 410 },
      lineTo: { x: 285, y: 410 }
    },
    // Bottom Fund
    {
      index: 2,
      role: 'Fund 3 (Bottom)',
      shortRole: 'F3',
      cardX: 540,
      cardY: 754,
      cardW: 300,
      cardH: 74,
      lineFrom: { x: 540, y: 717 },
      lineTo: { x: 540, y: 665 }
    },
    // Right Fund (Fund 4) - clean connecting line to the right circle
    {
      index: 3,
      role: 'Fund 4 (Right)',
      shortRole: 'F4',
      cardX: 958,
      cardY: 410,
      cardW: 216,
      cardH: 86,
      lineFrom: { x: 850, y: 410 },
      lineTo: { x: 795, y: 410 }
    }
  ];

  // Helper to check if a circle is highlighted
  const isCircleActive = (idx: number) => {
    if (activeFocus.kind === 'core') return true;
    if (activeFocus.kind === 'fund') return activeFocus.fundIndex === idx;
    if (activeFocus.kind === 'petal' || activeFocus.kind === 'cross') {
      return activeFocus.indexA === idx || activeFocus.indexB === idx;
    }
    return false;
  };

  // Helper to check if a petal is highlighted
  const isPetalActive = (pairKey: string) => {
    if (activeFocus.kind === 'petal' && activeFocus.pairKey === pairKey) return true;
    return false;
  };

  return (
    <div id="venn-diagram-infographic-container" className="w-full space-y-6">
      {/* 4 Legend Indicators: 1 line on PC, 2x2 grid on mobile */}
      <div className="w-full pb-3 border-b border-neutral-200/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 items-center">
          {fundPositions.map((pos) => {
            const fund = funds[pos.index];
            const color = fundColors[pos.index] || pos.defaultColor;
            return (
              <button
                key={`legend-${pos.index}`}
                type="button"
                onClick={() => {
                  if (fund) setSelectedItem({ kind: 'fund', fundIndex: pos.index });
                }}
                className={`flex items-center gap-2 py-1 transition-colors text-left cursor-pointer ${
                  activeFocus.kind === 'fund' && activeFocus.fundIndex === pos.index
                    ? 'text-black font-bold'
                    : 'text-neutral-900 font-semibold hover:text-black'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-xs sm:text-sm">
                  {fund ? fund.shortName : `+ ${pos.role}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Left SVG Infographic / Right Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The 4-Circle Venn SVG Canvas */}
        <div className="lg:col-span-7 lg:sticky lg:top-6 flex flex-col items-center justify-center p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs relative overflow-hidden">
          
          {/* Subtle Corner Infographic Cards with Leader Lines */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2 px-2 select-none">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />
              F1 × F2 Mutual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A896]" />
              F1 × F4 Mutual
            </span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full max-w-[720px] h-auto overflow-visible select-none drop-shadow-xs"
          >
            <defs>
              {/* Pattern 1: Redesigned Diagonal Precision Hatch with Micro-dots (Top-Left Petal: F1 x F2) */}
              <pattern
                id="petal-h-stripes"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke="#FF6B4A"
                  strokeWidth="2.2"
                  strokeOpacity="0.85"
                />
                <circle
                  cx="5"
                  cy="5"
                  r="1.2"
                  fill="#FF6B4A"
                  fillOpacity="0.8"
                />
              </pattern>

              {/* Pattern 2: Redesigned Precision Isometric Stipple Matrix (Top-Right Petal: F1 x F4) */}
              <pattern
                id="petal-dots"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="5"
                  cy="5"
                  r="2.2"
                  fill="#00A896"
                  fillOpacity="0.85"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="1.1"
                  fill="#00A896"
                  fillOpacity="0.5"
                />
                <circle
                  cx="10"
                  cy="0"
                  r="1.1"
                  fill="#00A896"
                  fillOpacity="0.5"
                />
                <circle
                  cx="0"
                  cy="10"
                  r="1.1"
                  fill="#00A896"
                  fillOpacity="0.5"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="1.1"
                  fill="#00A896"
                  fillOpacity="0.5"
                />
              </pattern>

              {/* Pattern 3: Redesigned Architectural Cross-hatch Micro-Grid (Bottom-Left Petal: F2 x F3) */}
              <pattern
                id="petal-grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 5 L 10 5 M 5 0 L 5 10"
                  stroke="#0284C7"
                  strokeWidth="1.4"
                  strokeOpacity="0.8"
                />
                <rect
                  x="4"
                  y="4"
                  width="2"
                  height="2"
                  fill="#0284C7"
                  fillOpacity="0.6"
                />
              </pattern>

              {/* Pattern 4: Redesigned Diamond Herringbone Weave (Bottom-Right Petal: F3 x F4) */}
              <pattern
                id="petal-diag-stripes"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="10"
                  stroke="#334155"
                  strokeWidth="2.2"
                  strokeOpacity="0.85"
                />
                <circle
                  cx="5"
                  cy="5"
                  r="1.2"
                  fill="#334155"
                  fillOpacity="0.8"
                />
              </pattern>

              {/* Clip Paths for the 4 Circles to create exact intersection lenses */}
              <clipPath id="clip-circle-0">
                <circle
                  cx={circleCoordinates[0].cx}
                  cy={circleCoordinates[0].cy}
                  r={circleRadius}
                />
              </clipPath>
              <clipPath id="clip-circle-1">
                <circle
                  cx={circleCoordinates[1].cx}
                  cy={circleCoordinates[1].cy}
                  r={circleRadius}
                />
              </clipPath>
              <clipPath id="clip-circle-2">
                <circle
                  cx={circleCoordinates[2].cx}
                  cy={circleCoordinates[2].cy}
                  r={circleRadius}
                />
              </clipPath>
              <clipPath id="clip-circle-3">
                <circle
                  cx={circleCoordinates[3].cx}
                  cy={circleCoordinates[3].cy}
                  r={circleRadius}
                />
              </clipPath>

              {/* Filter for glow on active petal & core */}
              <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
              <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* Step 1: Base Circles background fills */}
            {circleCoordinates.map((coord, idx) => {
              const fund = funds[idx];
              const isFocused = isCircleActive(idx);

              return (
                <circle
                  key={`bg-circle-${idx}`}
                  cx={coord.cx}
                  cy={coord.cy}
                  r={circleRadius}
                  fill="#FFFFFF"
                  className="transition-all duration-200"
                  style={{
                    opacity: fund ? (isFocused ? 1 : 0.8) : 0.4
                  }}
                />
              );
            })}

            {/* Step 2: The 4 Intersecting Petals (Lenses) */}
            {petals.map((petal) => {
              const fundA = funds[petal.indexA];
              const fundB = funds[petal.indexB];
              const isEnabled = fundA !== null && fundB !== null;
              const overlapData = pairwiseMap.get(petal.pairKey);
              const isActive = isPetalActive(petal.pairKey);
              const fillCoord = circleCoordinates[petal.fillCircleIndex];
              const hasOverlap = Boolean(isEnabled && overlapData && overlapData.overlapPercentage > 0);

              if (!isEnabled) {
                return null;
              }

              // User requirement: If zero overlap between two funds, do NOT create shade or touch it!
              if (!hasOverlap) {
                return null;
              }

              return (
                <g
                  key={petal.id}
                  id={petal.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedItem({
                      kind: 'petal',
                      pairKey: petal.pairKey,
                      indexA: petal.indexA,
                      indexB: petal.indexB
                    })
                  }
                  onMouseEnter={() =>
                    setHoveredItem({
                      kind: 'petal',
                      pairKey: petal.pairKey,
                      indexA: petal.indexA,
                      indexB: petal.indexB
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Clipped semi-transparent color background */}
                  <g clipPath={`url(#${petal.clipCircleId})`}>
                    <circle
                      cx={fillCoord.cx}
                      cy={fillCoord.cy}
                      r={circleRadius}
                      fill={petal.color}
                      fillOpacity={isActive ? 0.38 : 0.22}
                      className="transition-all duration-150"
                    />
                    {/* Pattern layer for authentic infographic styling */}
                    <circle
                      cx={fillCoord.cx}
                      cy={fillCoord.cy}
                      r={circleRadius}
                      fill={`url(#${petal.patternId})`}
                      className="transition-all duration-150"
                    />
                  </g>

                  {/* Outer lens perimeter strokes */}
                  <g clipPath={`url(#${petal.clipCircleId})`}>
                    <circle
                      cx={fillCoord.cx}
                      cy={fillCoord.cy}
                      r={circleRadius}
                      fill="none"
                      stroke={petal.color}
                      strokeWidth={isActive ? 3 : 1.5}
                      strokeOpacity={isActive ? 1 : 0.6}
                      className="transition-all duration-150"
                    />
                  </g>
                </g>
              );
            })}

            {/* Step 3: Main Circle Outlines */}
            {circleCoordinates.map((coord, idx) => {
              const fund = funds[idx];
              const isFocused = isCircleActive(idx);
              const color = fundColors[idx] || fundPositions[idx].defaultColor;

              return (
                <g
                  key={`stroke-circle-${idx}`}
                  className={fund ? 'cursor-pointer' : 'cursor-default'}
                  onClick={() => {
                    if (fund) setSelectedItem({ kind: 'fund', fundIndex: idx });
                  }}
                  onMouseEnter={() => {
                    if (fund) setHoveredItem({ kind: 'fund', fundIndex: idx });
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <circle
                    cx={coord.cx}
                    cy={coord.cy}
                    r={circleRadius}
                    fill="none"
                    stroke={color}
                    strokeWidth={isFocused ? 5.5 : 4}
                    strokeDasharray={fund ? 'none' : '6 5'}
                    strokeOpacity={fund ? (isFocused ? 1 : 0.75) : 0.3}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}

            {/* Step 4: Circular Target Badges inside each Petal (as in reference image) */}
            {petals.map((petal) => {
              const fundA = funds[petal.indexA];
              const fundB = funds[petal.indexB];
              const isEnabled = fundA !== null && fundB !== null;
              const overlapData = pairwiseMap.get(petal.pairKey);
              const isActive = isPetalActive(petal.pairKey);
              const hasOverlap = Boolean(isEnabled && overlapData && overlapData.overlapPercentage > 0);

              if (!isEnabled || !overlapData) return null;

              return (
                <g
                  key={`badge-${petal.id}`}
                  transform={`translate(${petal.cx}, ${petal.cy})`}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedItem({
                      kind: 'petal',
                      pairKey: petal.pairKey,
                      indexA: petal.indexA,
                      indexB: petal.indexB
                    })
                  }
                  onMouseEnter={() =>
                    setHoveredItem({
                      kind: 'petal',
                      pairKey: petal.pairKey,
                      indexA: petal.indexA,
                      indexB: petal.indexB
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {hasOverlap ? (
                    <>
                      {/* Outer white base */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isActive ? 22 : 18}
                        fill="#FFFFFF"
                        stroke="#E2E8F0"
                        strokeWidth="1.5"
                        filter="url(#badge-shadow)"
                        className="transition-all duration-200"
                      />
                      {/* Distinct target ring matching reference */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isActive ? 17 : 14}
                        fill="none"
                        stroke={petal.color}
                        strokeWidth={isActive ? 3.5 : 3}
                        className="transition-all duration-200"
                      />
                      {/* Center percentage text */}
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-neutral-900 pointer-events-none select-none"
                      >
                        {overlapData.overlapPercentage.toFixed(0)}%
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Zero overlap badge: neutral dashed ring, no colored shade */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isActive ? 18 : 15}
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        filter="url(#badge-shadow)"
                        className="transition-all duration-200"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        className="text-[9px] font-mono font-semibold fill-neutral-400 pointer-events-none select-none"
                      >
                        0%
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Step 5: Center Hub (Stocks common to ALL active funds) */}
            <g
              transform={`translate(${centerCoordX}, ${centerCoordY})`}
              className="cursor-pointer"
              onClick={() => setSelectedItem({ kind: 'core' })}
              onMouseEnter={() => setHoveredItem({ kind: 'core' })}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Outer shadow plate */}
              <circle
                cx="0"
                cy="0"
                r={activeFocus.kind === 'core' ? 36 : 32}
                fill="#FFFFFF"
                stroke={activeFocus.kind === 'core' ? '#0F172A' : '#CBD5E1'}
                strokeWidth={activeFocus.kind === 'core' ? 3 : 2}
                filter="url(#badge-shadow)"
                className="transition-all duration-200"
              />
              {/* Inner dotted core circle */}
              <circle
                cx="0"
                cy="0"
                r={activeFocus.kind === 'core' ? 28 : 25}
                fill={activeFocus.kind === 'core' ? '#F1F5F9' : '#F8FAFC'}
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="transition-all duration-200"
              />
              {/* Center Hub Labels */}
              <text
                x="0"
                y="-4"
                textAnchor="middle"
                className="text-[8px] font-bold tracking-widest uppercase fill-neutral-600 pointer-events-none select-none"
              >
                CORE
              </text>
              <text
                x="0"
                y="9"
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-neutral-950 pointer-events-none select-none"
              >
                {coreIntersection.count}
              </text>
              <text
                x="0"
                y="18"
                textAnchor="middle"
                className="text-[7px] font-mono uppercase fill-neutral-400 pointer-events-none select-none"
              >
                SHARED
              </text>
            </g>

            {/* Step 6: Text Inside Each of the 4 Circles (Minimal F1-F4 badge & stock count) */}
            {circleCoordinates.map((coord, idx) => {
              const fund = funds[idx];
              const isFocused = isCircleActive(idx);
              const color = fundColors[idx] || fundPositions[idx].defaultColor;

              return (
                <g
                  key={`inner-circle-label-${idx}`}
                  transform={`translate(${coord.cx}, ${coord.innerTextY})`}
                  className="pointer-events-none select-none text-center"
                >
                  {fund ? (
                    <>
                      <circle
                        cx="0"
                        cy="-10"
                        r="16"
                        fill={isFocused ? color : '#F8FAFC'}
                        stroke={color}
                        strokeWidth="1.5"
                        className="transition-colors duration-200"
                      />
                      <text
                        textAnchor="middle"
                        y="-5"
                        className={`text-[10px] font-mono font-bold ${
                          isFocused ? 'fill-white' : 'fill-neutral-900'
                        }`}
                      >
                        {coord.shortRole}
                      </text>
                      <text
                        textAnchor="middle"
                        y="14"
                        className="text-[10px] font-mono font-semibold fill-neutral-700"
                      >
                        {fund.holdings.length} stocks
                      </text>
                    </>
                  ) : (
                    <>
                      <circle
                        cx="0"
                        cy="-8"
                        r="14"
                        fill="#F1F5F9"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                      />
                      <text
                        textAnchor="middle"
                        y="-4"
                        className="text-[9px] font-mono font-bold fill-neutral-400"
                      >
                        {coord.shortRole}
                      </text>
                      <text
                        textAnchor="middle"
                        y="14"
                        className="text-[9px] font-mono fill-neutral-400"
                      >
                        Empty
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Step 7: Dedicated Mutual Fund Cards Outside Each Circle with Leader Lines */}
            {outerCards.map((card) => {
              const fund = funds[card.index];
              const color = fundColors[card.index] || fundPositions[card.index].defaultColor;
              const isFocused = isCircleActive(card.index);
              const [line1, line2] = fund
                ? getWrappedNameLines(fund.name || fund.shortName, card.index % 2 === 0 ? 26 : 20)
                : ['', ''];

              return (
                <g key={`outer-card-${card.index}`}>
                  {/* Connector line from outer card to circle edge */}
                  <g
                    className="pointer-events-none transition-opacity duration-200"
                    style={{ opacity: isFocused ? 1 : 0.75 }}
                  >
                    <line
                      x1={card.lineFrom.x}
                      y1={card.lineFrom.y}
                      x2={card.lineTo.x}
                      y2={card.lineTo.y}
                      stroke={fund ? color : '#CBD5E1'}
                      strokeWidth={isFocused ? 2.5 : 1.75}
                      strokeDasharray={fund ? '4 3' : '3 3'}
                    />
                    {/* Anchor node on the card edge */}
                    <circle
                      cx={card.lineFrom.x}
                      cy={card.lineFrom.y}
                      r={isFocused ? 3.5 : 2.5}
                      fill={fund ? color : '#94A3B8'}
                    />
                    {/* Boundary indicator node on the circle perimeter */}
                    <circle
                      cx={card.lineTo.x}
                      cy={card.lineTo.y}
                      r={isFocused ? 5 : 4}
                      fill={fund ? color : '#94A3B8'}
                    />
                  </g>

                  {/* Outer Card */}
                  <g
                    className={fund ? 'cursor-pointer' : 'cursor-default'}
                    onClick={() => {
                      if (fund) setSelectedItem({ kind: 'fund', fundIndex: card.index });
                    }}
                    onMouseEnter={() => {
                      if (fund) setHoveredItem({ kind: 'fund', fundIndex: card.index });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <rect
                      x={card.cardX - card.cardW / 2}
                      y={card.cardY - card.cardH / 2}
                      width={card.cardW}
                      height={card.cardH}
                      rx="12"
                      fill="#FFFFFF"
                      stroke={fund ? (isFocused ? color : '#CBD5E1') : '#E2E8F0'}
                      strokeWidth={isFocused ? 2.5 : 1.5}
                      filter="url(#card-shadow)"
                      className="transition-all duration-200"
                    />

                    {fund ? (
                      <>
                        {/* Header: Role badge and category */}
                        <circle
                          cx={card.cardX - card.cardW / 2 + 16}
                          cy={card.cardY - card.cardH / 2 + 16}
                          r="4.5"
                          fill={color}
                        />
                        <text
                          x={card.cardX - card.cardW / 2 + 26}
                          y={card.cardY - card.cardH / 2 + 19}
                          className="text-[10px] font-mono font-bold uppercase tracking-wider"
                          fill={color}
                        >
                          {card.role}
                        </text>
                        <text
                          x={card.cardX + card.cardW / 2 - 14}
                          y={card.cardY - card.cardH / 2 + 19}
                          textAnchor="end"
                          className="text-[10px] font-medium fill-neutral-400"
                        >
                          {fund.category}
                        </text>

                        {/* Mutual Fund Name (cleanly rendered outside circle, wrapped if long) */}
                        <text
                          x={card.cardX}
                          y={card.cardY + (line2 ? -2 : 5)}
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-neutral-900 select-none"
                        >
                          {line1}
                        </text>
                        {line2 && (
                          <text
                            x={card.cardX}
                            y={card.cardY + 13}
                            textAnchor="middle"
                            className="text-[11px] font-bold fill-neutral-900 select-none"
                          >
                            {line2}
                          </text>
                        )}

                        {/* Subtitle / holdings count */}
                        <text
                          x={card.cardX}
                          y={card.cardY + card.cardH / 2 - 10}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-neutral-500 select-none"
                        >
                          {fund.holdings.length} Holdings • {fund.amc || 'Mutual Fund'}
                        </text>
                      </>
                    ) : (
                      <>
                        <circle
                          cx={card.cardX - card.cardW / 2 + 16}
                          cy={card.cardY - card.cardH / 2 + 16}
                          r="4.5"
                          fill="#CBD5E1"
                        />
                        <text
                          x={card.cardX - card.cardW / 2 + 26}
                          y={card.cardY - card.cardH / 2 + 19}
                          className="text-[10px] font-mono font-semibold uppercase tracking-wider fill-neutral-400"
                        >
                          {card.role}
                        </text>
                        <text
                          x={card.cardX}
                          y={card.cardY + 5}
                          textAnchor="middle"
                          className="text-xs font-medium fill-neutral-400 select-none"
                        >
                          + Slot Empty
                        </text>
                        <text
                          x={card.cardX}
                          y={card.cardY + card.cardH / 2 - 10}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-neutral-400 select-none"
                        >
                          Select fund in table above
                        </text>
                      </>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Bottom helper prompt */}
          <div className="mt-2 text-center text-xs text-neutral-400">
            Click any petal, center core, or circle to inspect common holdings
          </div>
        </div>

        {/* Right Column: Dynamic Intelligence & Stock Breakdown Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick-Selector Tabs for All Combinations */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Direct Switcher
            </span>
            <div className="grid grid-cols-3 gap-2">
              {/* Core Hub Button */}
              <button
                type="button"
                onClick={() => setSelectedItem({ kind: 'core' })}
                className={`px-2 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center text-center gap-1.5 min-h-[38px] ${
                  activeFocus.kind === 'core'
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All 4 Core ({coreIntersection.count})
              </button>

              {/* 4 Petal Buttons */}
              {petals.map((petal) => {
                const isEnabled = funds[petal.indexA] && funds[petal.indexB];
                const overlap = pairwiseMap.get(petal.pairKey);
                const isCurrent = isPetalActive(petal.pairKey);

                if (!isEnabled || !overlap) return null;

                return (
                  <button
                    key={`tab-${petal.id}`}
                    type="button"
                    onClick={() =>
                      setSelectedItem({
                        kind: 'petal',
                        pairKey: petal.pairKey,
                        indexA: petal.indexA,
                        indexB: petal.indexB
                      })
                    }
                    className={`px-2 py-2 text-xs rounded-lg transition-all flex items-center justify-center text-center gap-1.5 min-h-[38px] ${
                      isCurrent
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: petal.color }}
                    />
                    <span className="truncate">
                      {petal.title}: {overlap.overlapPercentage.toFixed(0)}%
                    </span>
                  </button>
                );
              })}

              {/* Cross Pairs (Top x Bottom and Left x Right) */}
              {funds[0] && funds[2] && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedItem({
                      kind: 'cross',
                      pairKey: '0-2',
                      indexA: 0,
                      indexB: 2
                    })
                  }
                  className={`px-2 py-2 text-xs rounded-lg transition-all flex items-center justify-center text-center gap-1.5 min-h-[38px] ${
                    activeFocus.kind === 'cross' && activeFocus.pairKey === '0-2'
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    Top × Bottom:{' '}
                    {pairwiseMap.get('0-2')?.overlapPercentage.toFixed(0) || 0}%
                  </span>
                </button>
              )}

              {funds[1] && funds[3] && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedItem({
                      kind: 'cross',
                      pairKey: '1-3',
                      indexA: 1,
                      indexB: 3
                    })
                  }
                  className={`px-2 py-2 text-xs rounded-lg transition-all flex items-center justify-center text-center gap-1.5 min-h-[38px] ${
                    activeFocus.kind === 'cross' && activeFocus.pairKey === '1-3'
                      ? 'bg-neutral-900 text-white font-semibold'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    Left × Right:{' '}
                    {pairwiseMap.get('1-3')?.overlapPercentage.toFixed(0) || 0}%
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Inspection View Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200 space-y-4">
            {/* 1. Core All 4 Funds View */}
            {activeFocus.kind === 'core' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase text-neutral-400">
                      Center Core Analysis
                    </span>
                    <h4 className="text-sm font-bold text-neutral-900">
                      Stocks Present in ALL {activeFundsList.length} Selected Funds
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-bold text-neutral-950 block">
                      {coreIntersection.totalCoreOverlapWeight}%
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Guaranteed Overlap
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  These companies are universally held across every selected scheme. Even if you hold multiple funds to diversify, these core stocks remain concentrated in your combined portfolio.
                </p>

                {/* Common Stocks Table */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <span>Common Holdings ({coreIntersection.count})</span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Sorted by Min Weight
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-200/70 rounded-lg border border-neutral-200 bg-white shadow-2xs">
                    {coreIntersection.commonStocks.map((item) => (
                      <div
                        key={item.stock.isin}
                        className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-neutral-900 leading-snug">
                            {item.stock.name}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {item.stock.sector} • {item.stock.isin}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-black block">
                            {item.minWeight.toFixed(2)}%
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            min weight
                          </span>
                        </div>
                      </div>
                    ))}
                    {coreIntersection.commonStocks.length === 0 && (
                      <div className="p-4 text-center text-xs text-neutral-500">
                        No stocks are held across all selected funds simultaneously.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Petal or Cross Pair View */}
            {(activeFocus.kind === 'petal' || activeFocus.kind === 'cross') && (
              (() => {
                const pairData = pairwiseMap.get(activeFocus.pairKey);
                const fundA = funds[activeFocus.indexA];
                const fundB = funds[activeFocus.indexB];

                if (!pairData || !fundA || !fundB) {
                  return (
                    <div className="text-xs text-neutral-500">
                      Select funds to view pairwise details.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                          Pairwise Petal Overlap
                        </span>
                        <h4 className="text-sm font-bold text-neutral-900">
                          {fundA.shortName} <span className="text-neutral-400">×</span> {fundB.shortName}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-mono font-bold text-black block">
                          {pairData.overlapPercentage.toFixed(2)}%
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Common Weight
                        </span>
                      </div>
                    </div>

                    {/* Overlap Intensity Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                        <span>Overlap Intensity</span>
                        <span>{pairData.commonStockCount} common of {pairData.totalStocksUnion} union stocks</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, pairData.overlapPercentage * 1.8)}%`,
                            backgroundColor:
                              pairData.overlapPercentage > 35
                                ? '#EF4444'
                                : pairData.overlapPercentage > 20
                                ? '#F59E0B'
                                : '#10B981'
                          }}
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-neutral-800">
                          Common Holdings ({pairData.commonStockCount})
                        </span>
                      </div>

                      <div className="divide-y divide-neutral-200/70 rounded-lg border border-neutral-200 bg-white shadow-2xs">
                        {pairData.commonHoldings.map((item) => (
                          <div
                            key={item.stock.isin}
                            className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-neutral-900 leading-snug">
                                {item.stock.name}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {item.stock.sector}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] font-mono text-neutral-400 block">
                                  Weights
                                </span>
                                <span className="text-[11px] font-mono text-neutral-600">
                                  {item.weightA.toFixed(1)}% / {item.weightB.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-right w-12">
                                <span className="text-xs font-mono font-bold text-black block">
                                  {item.overlapContribution.toFixed(2)}%
                                </span>
                                <span className="text-[9px] font-mono text-neutral-400">
                                  min
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {pairData.commonHoldings.length === 0 && (
                          <div className="p-4 text-center text-xs text-neutral-500">
                            No common holdings found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* 3. Single Fund Spotlight View */}
            {activeFocus.kind === 'fund' && (
              (() => {
                const targetFund = funds[activeFocus.fundIndex];
                if (!targetFund) return null;

                // Compute unique stocks held ONLY by this fund
                const otherFunds = funds.filter((_, idx) => idx !== activeFocus.fundIndex && _ !== null) as Fund[];
                const otherISINs = new Set<string>();
                otherFunds.forEach((f) => f.holdings.forEach((h) => otherISINs.add(h.isin)));

                const uniqueStocks = targetFund.holdings.filter((h) => !otherISINs.has(h.isin));
                const uniqueWeight = uniqueStocks.reduce((acc, curr) => acc + curr.weight, 0);

                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                          Single Scheme Focus
                        </span>
                        <h4 className="text-sm font-bold text-neutral-900">
                          {targetFund.name}
                        </h4>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {targetFund.category} • ₹{targetFund.aumCr.toLocaleString()} Cr AUM
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-mono font-bold text-black block">
                          {uniqueStocks.length}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Unique Stocks
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-neutral-200/80 flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Unique Non-Overlapping Weight</span>
                      <span className="font-mono font-bold text-neutral-900">
                        {uniqueWeight.toFixed(2)}%
                      </span>
                    </div>

                    {/* Unique holdings list */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <span className="text-xs font-semibold text-neutral-800 block">
                        Exclusive Holdings (Not held by other selected funds)
                      </span>
                      <div className="divide-y divide-neutral-200/70 rounded-lg border border-neutral-200 bg-white shadow-2xs">
                        {uniqueStocks.map((h) => (
                          <div
                            key={h.isin}
                            className="p-2.5 flex items-center justify-between text-xs hover:bg-neutral-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-neutral-900 leading-snug">
                                {h.name}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {h.sector}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-black">
                              {h.weight.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                        {uniqueStocks.length === 0 && (
                          <div className="p-3 text-center text-xs text-neutral-500">
                            No exclusive holdings; all stocks are shared with at least one other fund.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
