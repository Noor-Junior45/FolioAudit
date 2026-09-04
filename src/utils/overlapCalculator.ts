import { Fund, Holding, PairwiseOverlap } from '../types';

export interface UniqueStock {
  isin: string;
  name: string;
  sector: string;
}

/**
 * Calculates the union of all unique stocks from the provided funds,
 * sorted alphabetically (A to Z) by stock name.
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
          sector: h.sector
        });
      }
    });
  });

  return Array.from(stockMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
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
