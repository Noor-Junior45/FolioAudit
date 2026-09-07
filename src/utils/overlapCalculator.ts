import { Fund, Holding, PairwiseOverlap } from '../types';

export interface UniqueStock {
  isin: string;
  name: string;
  sector: string;
}

/**
 * Normalizes sector names to group related industries cleanly (e.g. Banking & Financial Services)
 */
function normalizeSectorGroup(sector?: string): string {
  if (!sector) return 'Other';
  const clean = sector.trim();
  const lower = clean.toLowerCase();

  if (
    lower.includes('financ') ||
    lower.includes('bank') ||
    lower.includes('nbfc') ||
    lower.includes('insurance')
  ) {
    return 'Financial Services';
  }
  if (lower.startsWith('auto')) {
    return 'Automobile';
  }
  if (lower.includes('tech') || lower === 'it' || lower.includes('information tech')) {
    return 'Technology';
  }
  if (lower.includes('pharma') || lower.includes('health')) {
    return 'Healthcare';
  }
  if (lower.includes('fmcg') || lower.includes('consumer good')) {
    return 'Consumer Goods';
  }
  if (lower.includes('energy') || lower.includes('oil') || lower.includes('gas') || lower.includes('petroleum')) {
    return 'Energy';
  }
  if (lower.includes('metal') || lower.includes('mining')) {
    return 'Metals & Mining';
  }
  if (lower.includes('telecom')) {
    return 'Telecommunication';
  }
  if (lower.includes('infra') || lower.includes('construction')) {
    return 'Construction & Infrastructure';
  }
  return clean;
}

/**
 * Calculates the union of all unique stocks from the provided funds,
 * sorted with Finance sector stocks first, followed by other sectors alphabetically,
 * and with stocks sorted A to Z within each sector.
 */
export function getUnionStocks(funds: (Fund | null)[]): UniqueStock[] {
  const stockMap = new Map<string, UniqueStock>();

  funds.forEach((fund) => {
    if (!fund) return;
    fund.holdings.forEach((h) => {
      if (!stockMap.has(h.isin)) {
        stockMap.set(h.isin, {
          isin: h.isin,
          name: h.name,
          sector: h.sector || 'Other'
        });
      }
    });
  });

  return Array.from(stockMap.values()).sort((a, b) => {
    const groupA = normalizeSectorGroup(a.sector);
    const groupB = normalizeSectorGroup(b.sector);

    const isFinanceA = groupA === 'Financial Services';
    const isFinanceB = groupB === 'Financial Services';

    // 1. Finance sector stocks always display first
    if (isFinanceA && !isFinanceB) return -1;
    if (!isFinanceA && isFinanceB) return 1;

    // If both are in Finance, sort A to Z alphabetically by stock name
    if (isFinanceA && isFinanceB) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }

    const isOtherA = !a.sector || groupA.toLowerCase() === 'other' || groupA.toLowerCase() === 'others';
    const isOtherB = !b.sector || groupB.toLowerCase() === 'other' || groupB.toLowerCase() === 'others';

    // 2. Uncategorized / 'Other' sectors go to the bottom
    if (isOtherA && !isOtherB) return 1;
    if (!isOtherA && isOtherB) return -1;

    // 3. Other sectors are sorted alphabetically (e.g. Automobile, Chemicals, Energy, Healthcare, Technology)
    const sectorCompare = groupA.localeCompare(groupB, undefined, { sensitivity: 'base' });
    if (sectorCompare !== 0) {
      return sectorCompare;
    }

    // 4. Within each sector, stocks are sorted A to Z alphabetically
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

/**
 * Computes the pairwise overlap between two funds:
 * Overlap(A, B) = Sum(min(Weight_A, Weight_B)) across all common holdings.
 */
export function calculatePairwiseOverlap(fundA: Fund, fundB: Fund): PairwiseOverlap {
  const mapA = new Map<string, Holding>();
  fundA.holdings.forEach((h) => mapA.set(h.isin, h));

  const commonHoldings: {
    stock: Holding;
    weightA: number;
    weightB: number;
    overlapContribution: number;
  }[] = [];

  let overlapPercentage = 0;

  fundB.holdings.forEach((hB) => {
    const hA = mapA.get(hB.isin);
    if (hA) {
      const minWeight = Math.min(hA.weight, hB.weight);
      overlapPercentage += minWeight;
      commonHoldings.push({
        stock: hA,
        weightA: hA.weight,
        weightB: hB.weight,
        overlapContribution: minWeight
      });
    }
  });

  // Sort common holdings by overlap contribution descending
  commonHoldings.sort((a, b) => b.overlapContribution - a.overlapContribution);

  // Union of stocks between these two
  const unionSet = new Set<string>();
  fundA.holdings.forEach((h) => unionSet.add(h.isin));
  fundB.holdings.forEach((h) => unionSet.add(h.isin));

  return {
    fundA,
    fundB,
    overlapPercentage: Math.round(overlapPercentage * 100) / 100,
    commonStockCount: commonHoldings.length,
    totalStocksUnion: unionSet.size,
    commonHoldings
  };
}

/**
 * Calculates all pairwise overlaps between an array of selected funds.
 * Formatted cleanly:
 * Fund 1 vs Fund 2, Fund 1 vs Fund 3, Fund 1 vs Fund 4
 * Fund 2 vs Fund 3, Fund 2 vs Fund 4
 * Fund 3 vs Fund 4
 */
export function getAllPairwiseOverlaps(funds: (Fund | null)[]): PairwiseOverlap[] {
  const activeFunds = funds.filter((f): f is Fund => f !== null);
  const pairs: PairwiseOverlap[] = [];

  for (let i = 0; i < activeFunds.length; i++) {
    for (let j = i + 1; j < activeFunds.length; j++) {
      pairs.push(calculatePairwiseOverlap(activeFunds[i], activeFunds[j]));
    }
  }

  return pairs;
}
