import {
  Transaction,
  AnalysisResult,
  TopMerchant,
  MonthlyTrend,
  Subscription,
  ExpenseCategory,
} from './types';
import { cleanMerchantName, categorizeTransaction, KNOWN_SUBSCRIPTION_MERCHANTS } from './merchantEngine';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

// Known subscription keywords for detecting subscriptions from single occurrences
const SUBSCRIPTION_KEYWORDS = [
  'subscription', 'monthly plan', 'annual plan', 'auto-debit', 'auto debit',
  'renewal', 'recurring', 'standing instruction', 'si debit', 'nach debit',
  'nach emi', 'ecs', 'mandate',
];

function getIntervalDays(frequency: string): number {
  switch (frequency) {
    case 'Weekly': return 7;
    case 'Monthly': return 30;
    case 'Quarterly': return 91;
    case 'Yearly': return 365;
    default: return 30;
  }
}

function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const debitTxns = transactions.filter(t => t.type === 'DEBIT');
  const subscriptions: Subscription[] = [];
  const addedMerchants = new Set<string>();

  // ── Pass 1: Recurring pattern detection (2+ transactions) ──────────────────
  const merchantGroups: Record<string, Transaction[]> = {};
  for (const t of debitTxns) {
    const m = t.merchant ?? '';
    if (!m) continue;
    if (!merchantGroups[m]) merchantGroups[m] = [];
    merchantGroups[m].push(t);
  }

  for (const merchant of Object.keys(merchantGroups)) {
    const group = merchantGroups[merchant];
    if (group.length < 2) continue;

    // Check if amounts are similar (within 15% of average — allows GST/price changes)
    const avgAmount = group.reduce((sum, t) => sum + t.amount, 0) / group.length;
    const amountsSimilar = group.every(
      t => Math.abs(t.amount - avgAmount) / (avgAmount || 1) <= 0.15,
    );

    if (!amountsSimilar) continue;

    // Sort by date and compute intervals
    const sorted = [...group].sort((a, b) => (a.date < b.date ? -1 : 1));
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = dayjs(sorted[i].date).diff(dayjs(sorted[i - 1].date), 'day');
      intervals.push(diff);
    }

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const isRegular = intervals.every(iv => Math.abs(iv - avgInterval) <= 8);

    if (!isRegular) continue;

    let frequency: string;
    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'Monthly';
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      frequency = 'Weekly';
    } else if (avgInterval >= 83 && avgInterval <= 97) {
      frequency = 'Quarterly';
    } else if (avgInterval >= 355 && avgInterval <= 375) {
      frequency = 'Yearly';
    } else if (avgInterval >= 12 && avgInterval <= 18) {
      frequency = 'Bi-Weekly';
    } else {
      frequency = 'Recurring';
    }

    const lastTxn = sorted[sorted.length - 1];
    const intervalDays = getIntervalDays(frequency);
    const nextDate = dayjs(lastTxn.date).add(intervalDays, 'day').format('YYYY-MM-DD');

    subscriptions.push({
      merchant,
      amount: avgAmount,
      frequency,
      lastDate: lastTxn.date,
      nextExpectedDate: nextDate,
      category: lastTxn.category,
    });
    addedMerchants.add(merchant);
  }

  // ── Pass 2: Known subscription merchants (single occurrence is enough) ──────
  for (const t of debitTxns) {
    const m = t.merchant ?? '';
    if (!m || addedMerchants.has(m)) continue;

    const isKnownSub = KNOWN_SUBSCRIPTION_MERCHANTS.has(m);
    const descLower = t.description.toLowerCase();
    const hasSubKeyword = SUBSCRIPTION_KEYWORDS.some(kw => descLower.includes(kw));

    if (isKnownSub || hasSubKeyword) {
      const nextDate = dayjs(t.date).add(30, 'day').format('YYYY-MM-DD');
      subscriptions.push({
        merchant: m,
        amount: t.amount,
        frequency: 'Monthly',
        lastDate: t.date,
        nextExpectedDate: nextDate,
        category: t.category,
      });
      addedMerchants.add(m);
    }
  }

  return subscriptions.sort((a, b) => b.amount - a.amount);
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
    .slice(0, 15);

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
