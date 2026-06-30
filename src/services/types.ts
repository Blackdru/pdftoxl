/**
 * Shared types for Bank Statement Analyzer
 */

export type ExpenseCategory =
  | 'Food'
  | 'Shopping'
  | 'Travel'
  | 'Transportation'
  | 'Bills'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Investments'
  | 'Income'
  | 'Transfers'
  | 'Subscription'
  | 'Others';

export const ALL_CATEGORIES: ExpenseCategory[] = [
  'Food', 'Shopping', 'Travel', 'Transportation', 'Bills',
  'Entertainment', 'Healthcare', 'Education', 'Investments',
  'Income', 'Transfers', 'Subscription', 'Others',
];

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: 'coffee',
  Shopping: 'shopping-bag',
  Travel: 'map',
  Transportation: 'truck',
  Bills: 'file-text',
  Entertainment: 'film',
  Healthcare: 'heart',
  Education: 'book',
  Investments: 'trending-up',
  Income: 'dollar-sign',
  Transfers: 'repeat',
  Subscription: 'refresh-cw',
  Others: 'more-horizontal',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#F59E0B',
  Shopping: '#EC4899',
  Travel: '#8B5CF6',
  Transportation: '#6366F1',
  Bills: '#EF4444',
  Entertainment: '#F97316',
  Healthcare: '#14B8A6',
  Education: '#0EA5E9',
  Investments: '#10B981',
  Income: '#16A34A',
  Transfers: '#64748B',
  Subscription: '#A855F7',
  Others: '#94A3B8',
};

export interface Transaction {
  id: string;
  date: string;        // ISO: YYYY-MM-DD
  description: string;
  amount: number;      // always positive
  type: 'DEBIT' | 'CREDIT';
  balance?: number;
  merchant?: string;
  category?: ExpenseCategory;
  isRecurring?: boolean;
}

export interface TopMerchant {
  merchant: string;
  amount: number;
  count: number;
  category?: ExpenseCategory;
}

export interface MonthlyTrend {
  month: string;     // e.g. 'Jan 2026'
  income: number;
  expenses: number;
}

export interface Subscription {
  merchant: string;
  amount: number;
  frequency: string;  // 'Monthly' | 'Weekly' | 'Quarterly' | 'Yearly' | 'Recurring'
  lastDate: string;
  nextExpectedDate?: string; // predicted next charge date
  category?: ExpenseCategory;
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  categoryBreakdown: Partial<Record<ExpenseCategory, number>>;
  topMerchants: TopMerchant[];
  monthlyTrends: MonthlyTrend[];
  subscriptions: Subscription[];
  statementPeriod: { from: string; to: string };
}
