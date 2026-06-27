import {
  Transaction,
  AnalysisResult,
  TopMerchant,
  MonthlyTrend,
  Subscription,
  ExpenseCategory,
} from './types';
import { cleanMerchantName, categorizeTransaction } from './merchantEngine';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const debitTxns = transactions.filter(t => t.type === 'DEBIT');

  const merchantGroups: Record<string, Transaction[]> = {};
  for (const t of debitTxns) {
    const m = t.merchant ?? '';
    if (!m) continue;
    if (!merchantGroups[m]) {
      merchantGroups[m] = [];
    }
    merchantGroups[m].push(t);
  }

  const subscriptions: Subscription[] = [];

  for (const merchant of Object.keys(merchantGroups)) {
    const group = merchantGroups[merchant];
    if (group.length < 2) {
      continue;
    }

    // Check if amounts are similar (within 10% of average)
    const avgAmount =
      group.reduce((sum, t) => sum + t.amount, 0) / group.length;
    const amountsSimilar = group.every(
      t => Math.abs(t.amount - avgAmount) / (avgAmount || 1) <= 0.1,
    );

    if (!amountsSimilar) {
      continue;
    }

    // Sort by date and compute intervals
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : 1));
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = dayjs(sorted[i].date).diff(dayjs(sorted[i - 1].date), 'day');
      intervals.push(diff);
    }

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const isRegular = intervals.every(iv => Math.abs(iv - avgInterval) <= 7);

    if (!isRegular) {
      continue;
    }

    let frequency: string;
    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'Monthly';
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      frequency = 'Weekly';
    } else if (avgInterval >= 85 && avgInterval <= 95) {
      frequency = 'Quarterly';
    } else if (avgInterval >= 360 && avgInterval <= 370) {
      frequency = 'Yearly';
    } else {
      frequency = 'Recurring';
    }

    const lastTxn = sorted[sorted.length - 1];
    subscriptions.push({
      merchant,
      amount: avgAmount,
      frequency,
      lastDate: lastTxn.date,
      category: lastTxn.category,
    });
  }

  return subscriptions;
}

export function analyzeTransactions(
  transactions: Transaction[],
): AnalysisResult {
  // Enrich transactions
  const enriched: Transaction[] = transactions.map(t => {
    const merchant = cleanMerchantName(t.description);
    const category = categorizeTransaction(t.description, merchant, t.type);
    return { ...t, merchant, category, isRecurring: false };
  });

  // Totals
  const totalIncome = enriched
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = enriched
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalIncome - totalExpenses;

  // Category breakdown (DEBIT only)
  const categoryBreakdown: Partial<Record<ExpenseCategory, number>> = {};
  for (const t of enriched.filter(tx => tx.type === 'DEBIT')) {
    const cat = t.category ?? 'Others';
    categoryBreakdown[cat] = (categoryBreakdown[cat] ?? 0) + t.amount;
  }

  // Top merchants (DEBIT only)
  const merchantMap: Record<
    string,
    { amount: number; count: number; category?: ExpenseCategory }
  > = {};
  for (const t of enriched.filter(tx => tx.type === 'DEBIT')) {
    const m = t.merchant ?? 'Unknown';
    if (!merchantMap[m]) {
      merchantMap[m] = { amount: 0, count: 0, category: t.category };
    }
    merchantMap[m].amount += t.amount;
    merchantMap[m].count += 1;
  }

  const topMerchants: TopMerchant[] = Object.entries(merchantMap)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Monthly trends
  const monthMap: Record<string, { income: number; expenses: number }> = {};
  for (const t of enriched) {
    const month = dayjs(t.date).format('MMM YYYY');
    if (!monthMap[month]) {
      monthMap[month] = { income: 0, expenses: 0 };
    }
    if (t.type === 'CREDIT') {
      monthMap[month].income += t.amount;
    } else {
      monthMap[month].expenses += t.amount;
    }
  }

  const monthlyTrends: MonthlyTrend[] = Object.entries(monthMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const da = dayjs(a.month, 'MMM YYYY');
      const db = dayjs(b.month, 'MMM YYYY');
      return da.isBefore(db) ? -1 : 1;
    });

  // Subscriptions
  const subscriptions = detectSubscriptions(enriched);

  // Mark isRecurring on matching transactions
  const subscriptionMerchants = new Set(subscriptions.map(s => s.merchant));
  const finalTransactions = enriched.map(t => ({
    ...t,
    isRecurring: subscriptionMerchants.has(t.merchant ?? ''),
  }));

  // Statement period
  const today = dayjs().format('YYYY-MM-DD');
  let from = today;
  let to = today;
  if (enriched.length > 0) {
    const dates = enriched.map(t => t.date).sort();
    from = dates[0];
    to = dates[dates.length - 1];
  }

  return {
    transactions: finalTransactions,
    totalIncome,
    totalExpenses,
    savings,
    categoryBreakdown,
    topMerchants,
    monthlyTrends,
    subscriptions,
    statementPeriod: { from, to },
  };
}
