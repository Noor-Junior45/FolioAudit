export interface Holding {
  isin: string;
  name: string;
  ticker?: string;
  sector: string;
  weight: number; // percentage, e.g. 7.85
}

export interface Fund {
  id: string;
  name: string;
  shortName: string;
  amc: string;
  category: string;
  benchmark: string;
  aumCr: number; // In INR Crores
  color: string; // Distinct vibrant color used solely in the circular overlap chart & indicators
  colorLight: string;
  holdings: Holding[];
}

export interface PairwiseOverlap {
  fundA: Fund;
  fundB: Fund;
  overlapPercentage: number; // Sum(min(wA, wB))
  commonStockCount: number;
  totalStocksUnion: number;
  commonHoldings: {
    stock: Holding;
    weightA: number;
    weightB: number;
    overlapContribution: number;
  }[];
}
