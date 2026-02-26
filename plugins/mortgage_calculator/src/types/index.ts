export interface LoanType {
  id: 'commercial' | 'provident' | 'combined';
  name: string;
  description: string;
  icon: string;
}

export interface RateComparison {
  bank: string;
  rate: number;
  term: string;
  notes: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}