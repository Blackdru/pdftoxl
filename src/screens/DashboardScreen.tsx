/**
 * DashboardScreen - Full statement analysis dashboard with 5 tabs
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@react-native-vector-icons/feather';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import dayjs from 'dayjs';
import { Colors, wp, hp, ms, fontSize, spacing, radius } from '../theme';
import {
  AnalysisResult,
  Transaction,
  ExpenseCategory,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from '../services/types';
import { useSubscription } from '../context';
import BannerAdView from '../components/BannerAdView';
import { exportAnalysisReportToPDF } from '../services/exportService';
import { showRewardedInterstitialAd } from '../services/ads';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardScreenProps {
  navigation: any;
  route: {
    params: {
      result: AnalysisResult;
      fileName: string;
    };
  };
}

type Tab = 'Overview' | 'Categories' | 'Trends' | 'Merchants' | 'Transactions';
const TABS: Tab[] = [
  'Overview',
  'Categories',
  'Trends',
  'Merchants',
  'Transactions',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (n: number): string =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (iso: string): string =>
  iso ? dayjs(iso).format('DD MMM YYYY') : '—';

// ─── Sub-components ──────────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyState}>
    <Feather name="inbox" size={ms(40)} color={Colors.textTertiary} />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

const PieCenterLabel: React.FC<{ value: string }> = ({ value }) => (
  <View style={styles.pieCenterLabel}>
    <Text style={styles.pieCenterValue}>{value}</Text>
    <Text style={styles.pieCenterSub}>Total</Text>
  </View>
);

// ─── Screen ──────────────────────────────────────────────────────────────────

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  navigation,
  route,
}) => {
  const { result, fileName } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { isPro, canExportBankReport, recordBankExport, showPaywall } = useSubscription();

  // ─── Open / Share the generated PDF properly ───────────────────────────────
  const openPDF = useCallback(async (filePath: string) => {
    if (Platform.OS === 'android') {
      // On Android: open with native PDF viewer / share sheet
      // actionViewIntent triggers a proper "Open with" dialog (PDF viewers, Drive, etc.)
      await ReactNativeBlobUtil.android.actionViewIntent(
        filePath,
        'application/pdf',
      );
    } else {
      // On iOS: use system share sheet — supports AirDrop, Files, Mail, etc.
      const { Share } = require('react-native');
      await Share.share({ url: `file://${filePath}` });
    }
  }, []);

  // ─── Export Handler ───────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (isPro) {
      // Pro: export directly, open PDF
      try {
        setIsExporting(true);
        const filePath = await exportAnalysisReportToPDF(result, fileName);
        await openPDF(filePath);
      } catch (e: any) {
        Alert.alert('Export Failed', e?.message || 'Could not generate PDF report.');
      } finally {
        setIsExporting(false);
      }
    } else if (canExportBankReport()) {
      // Free: show rewarded ad first, then export
      Alert.alert(
        'Export Report',
        'Watch a short ad to export your analysis report as PDF. You get 1 free export per month.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Watch Ad & Export',
            onPress: async () => {
              try {
                setIsExporting(true);
                await showRewardedInterstitialAd(false);
                const filePath = await exportAnalysisReportToPDF(result, fileName);
                await recordBankExport();
                await openPDF(filePath);
              } catch (e: any) {
                Alert.alert('Export Failed', e?.message || 'Could not generate PDF report.');
              } finally {
                setIsExporting(false);
              }
            },
          },
        ],
      );
    } else {
      // Free limit exhausted
      Alert.alert(
        'Monthly Limit Reached',
        "You've used your 1 free export this month. Upgrade to Pro for unlimited exports.",
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => showPaywall() },
        ],
      );
    }
  }, [isPro, canExportBankReport, recordBankExport, showPaywall, result, fileName, openPDF]);

  if (!result || result.transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather
              name="arrow-left"
              size={ms(22)}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Statement Analysis</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Feather name="inbox" size={48} color={Colors.textTertiary} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: Colors.textPrimary,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            No Transactions Found
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.textSecondary,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Could not extract any transactions from this statement. Try a
            different file or format.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginTop: 24,
              backgroundColor: Colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pieCenterLabel = useCallback(
    () => <PieCenterLabel value={formatCurrency(result.totalExpenses)} />,
    [result.totalExpenses],
  );
  const [txFilter, setTxFilter] = useState<'All' | 'Debit' | 'Credit'>('All');

  // ─── OVERVIEW ──────────────────────────────────────────────────────────────

  const renderOverview = () => {
    const barData = result.monthlyTrends.flatMap(trend => [
      {
        value: trend.income,
        label: trend.month.substring(0, 3),
        frontColor: Colors.success,
        spacing: 2,
        labelWidth: 30,
        topLabelComponent: () => null,
      },
      {
        value: trend.expenses,
        frontColor: Colors.error,
        spacing: 16,
      },
    ]);

    return (
      <View style={styles.tabContent}>
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: Colors.successLight },
            ]}
          >
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(result.totalIncome)}
            </Text>
          </View>
          <View
            style={[styles.summaryCard, { backgroundColor: Colors.errorLight }]}
          >
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              {formatCurrency(result.totalExpenses)}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: Colors.primaryMuted },
            ]}
          >
            <Text style={styles.summaryLabel}>Savings</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: result.savings >= 0 ? Colors.primary : Colors.error },
              ]}
            >
              {(result.savings < 0 ? '−' : '') + formatCurrency(result.savings)}
            </Text>
          </View>
        </View>

        {/* Statement period */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={ms(16)} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Statement Period</Text>
          </View>
          <Text style={styles.periodText}>
            {formatDate(result.statementPeriod.from)} –{' '}
            {formatDate(result.statementPeriod.to)}
          </Text>
        </View>

        {/* Monthly bar chart */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="bar-chart-2" size={ms(16)} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Monthly Overview</Text>
          </View>
          {result.monthlyTrends.length === 0 ? (
            <EmptyState message="No monthly data available" />
          ) : (
            <>
              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: Colors.success },
                    ]}
                  />
                  <Text style={styles.legendLabel}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: Colors.error },
                    ]}
                  />
                  <Text style={styles.legendLabel}>Expenses</Text>
                </View>
              </View>
              <BarChart
                data={barData}
                width={wp(75)}
                height={hp(22)}
                barWidth={ms(14)}
                barBorderRadius={3}
                noOfSections={4}
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={Colors.border}
                yAxisTextStyle={{
                  color: Colors.textTertiary,
                  fontSize: ms(10),
                }}
                xAxisLabelTextStyle={{
                  color: Colors.textTertiary,
                  fontSize: ms(10),
                }}
                showLine={false}
                isAnimated
              />
            </>
          )}
        </View>

        {/* Subscriptions */}
        {result.subscriptions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="refresh-cw" size={ms(16)} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Detected Subscriptions</Text>
            </View>
            {result.subscriptions.map((sub, idx) => (
              <View key={idx} style={styles.subscriptionRow}>
                <View
                  style={[
                    styles.subIconBox,
                    {
                      backgroundColor:
                        (sub.category
                          ? CATEGORY_COLORS[sub.category]
                          : Colors.accent) + '20',
                    },
                  ]}
                >
                  <Feather
                    name={
                      sub.category
                        ? (CATEGORY_ICONS[sub.category] as any)
                        : 'refresh-cw'
                    }
                    size={ms(16)}
                    color={
                      sub.category
                        ? CATEGORY_COLORS[sub.category]
                        : Colors.accent
                    }
                  />
                </View>
                <View style={styles.subInfo}>
                  <Text style={styles.subMerchant}>{sub.merchant}</Text>
                  <Text style={styles.subFrequency}>{sub.frequency}</Text>
                  {sub.nextExpectedDate && (
                    <Text style={styles.subNextDate}>
                      Next: {dayjs(sub.nextExpectedDate).format('DD MMM YYYY')}
                    </Text>
                  )}
                </View>
                <Text style={styles.subAmount}>
                  {formatCurrency(sub.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ─── CATEGORIES ────────────────────────────────────────────────────────────

  const renderCategories = () => {
    const entries = Object.entries(result.categoryBreakdown) as [
      ExpenseCategory,
      number,
    ][];
    const sorted = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

    const totalExpenses = sorted.reduce((s, [, v]) => s + v, 0);

    const pieData = sorted.map(([cat, val]) => ({
      value: val,
      color: CATEGORY_COLORS[cat],
      text: cat,
    }));

    return (
      <View style={styles.tabContent}>
        {sorted.length === 0 ? (
          <EmptyState message="No expense data found" />
        ) : (
          <>
            {/* Pie chart */}
            <View style={styles.sectionCardCentered}>
              <View style={styles.sectionHeader}>
                <Feather
                  name="pie-chart"
                  size={ms(16)}
                  color={Colors.primary}
                />
                <Text style={styles.sectionTitle}>Spending by Category</Text>
              </View>
              <PieChart
                data={pieData}
                donut
                radius={ms(90)}
                innerRadius={ms(55)}
                centerLabelComponent={pieCenterLabel}
              />
            </View>

            {/* Legend list */}
            <View style={styles.sectionCard}>
              {sorted.map(([cat, val]) => {
                const pct =
                  totalExpenses > 0
                    ? ((val / totalExpenses) * 100).toFixed(1)
                    : '0';
                return (
                  <View key={cat} style={styles.categoryRow}>
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: CATEGORY_COLORS[cat] },
                      ]}
                    />
                    <Feather
                      name={CATEGORY_ICONS[cat] as any}
                      size={ms(14)}
                      color={CATEGORY_COLORS[cat]}
                      style={{ marginRight: spacing.sm }}
                    />
                    <Text style={styles.catName}>{cat}</Text>
                    <View style={styles.catRight}>
                      <Text style={styles.catAmount}>
                        {formatCurrency(val)}
                      </Text>
                      <Text style={styles.catPct}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  // ─── TRENDS ────────────────────────────────────────────────────────────────

  const renderTrends = () => {
    const trends = result.monthlyTrends;

    if (trends.length === 0) {
      return (
        <View style={styles.tabContent}>
          <EmptyState message="Not enough data for trend analysis" />
        </View>
      );
    }

    const incomeData = trends.map(t => ({ value: t.income }));
    const expenseData = trends.map(t => ({ value: t.expenses }));
    const labels = trends.map(t => t.month.substring(0, 3));

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={ms(16)} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Monthly Income vs Expenses</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: Colors.success }]}
              />
              <Text style={styles.legendLabel}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: Colors.error }]}
              />
              <Text style={styles.legendLabel}>Expenses</Text>
            </View>
          </View>
          <LineChart
            data={incomeData}
            data2={expenseData}
            width={wp(75)}
            height={hp(25)}
            color1={Colors.success}
            color2={Colors.error}
            dataPointsColor1={Colors.success}
            dataPointsColor2={Colors.error}
            startFillColor1={Colors.success + '40'}
            startFillColor2={Colors.error + '40'}
            endFillColor1={Colors.success + '05'}
            endFillColor2={Colors.error + '05'}
            areaChart
            curved
            noOfSections={4}
            xAxisThickness={1}
            yAxisThickness={0}
            xAxisColor={Colors.border}
            yAxisTextStyle={{ color: Colors.textTertiary, fontSize: ms(10) }}
            xAxisLabelTexts={labels}
            xAxisLabelTextStyle={{
              color: Colors.textTertiary,
              fontSize: ms(10),
            }}
            isAnimated
          />
        </View>

        {/* Savings trend */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={ms(16)} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Monthly Savings</Text>
          </View>
          {trends.map((t, idx) => {
            const savings = t.income - t.expenses;
            const isPositive = savings >= 0;
            return (
              <View key={idx} style={styles.trendRow}>
                <Text style={styles.trendMonth}>{t.month}</Text>
                <View style={styles.trendBarBg}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        width: `${
                          Math.min(
                            Math.abs(savings) / Math.max(t.income, 1),
                            1,
                          ) * 100
                        }%`,
                        backgroundColor: isPositive
                          ? Colors.success
                          : Colors.error,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.trendValue,
                    { color: isPositive ? Colors.success : Colors.error },
                  ]}
                >
                  {(savings < 0 ? '−' : '+') + formatCurrency(savings)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── MERCHANTS ─────────────────────────────────────────────────────────────

  const renderMerchants = () => {
    const merchants = result.topMerchants.slice(0, 10);
    const maxAmount = merchants.length > 0 ? merchants[0].amount : 1;

    if (merchants.length === 0) {
      return (
        <View style={styles.tabContent}>
          <EmptyState message="No merchant data available" />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="shopping-bag" size={ms(16)} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Top Merchants</Text>
          </View>
          {merchants.map((m, idx) => {
            const catColor = m.category
              ? CATEGORY_COLORS[m.category]
              : Colors.accent;
            const barWidth = maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
            return (
              <View key={idx} style={styles.merchantRow}>
                <View style={styles.merchantRankBox}>
                  <Text style={styles.merchantRank}>{idx + 1}</Text>
                </View>
                <View style={styles.merchantInfo}>
                  <View style={styles.merchantNameRow}>
                    <Text style={styles.merchantName} numberOfLines={1}>
                      {m.merchant}
                    </Text>
                    {m.category && (
                      <View
                        style={[
                          styles.merchantCatBadge,
                          { backgroundColor: catColor + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.merchantCatLabel, { color: catColor }]}
                        >
                          {m.category}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.merchantBarBg}>
                    <View
                      style={[
                        styles.merchantBarFill,
                        { width: `${barWidth}%`, backgroundColor: catColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.merchantCount}>
                    {m.count} transactions
                  </Text>
                </View>
                <Text style={styles.merchantAmount}>
                  {formatCurrency(m.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    let txs = [...result.transactions].sort(
      (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
    );

    if (txFilter !== 'All') {
      txs = txs.filter(t => t.type === txFilter.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          (t.merchant?.toLowerCase().includes(q) ?? false),
      );
    }

    return txs;
  }, [result.transactions, txFilter, searchQuery]);

  const renderTransaction = ({
    item,
    index,
  }: {
    item: Transaction;
    index: number;
  }) => {
    const isDebit = item.type === 'DEBIT';
    const catColor = item.category
      ? CATEGORY_COLORS[item.category]
      : Colors.textTertiary;
    const bg = index % 2 === 0 ? Colors.surface : Colors.gray50;

    return (
      <View style={[styles.txRow, { backgroundColor: bg }]}>
        <View style={styles.txLeft}>
          <Text style={styles.txDate}>{formatDate(item.date)}</Text>
          <Text style={styles.txDesc} numberOfLines={1}>
            {item.merchant || item.description}
          </Text>
          {item.category && (
            <View
              style={[styles.txCatBadge, { backgroundColor: catColor + '20' }]}
            >
              <Text style={[styles.txCatLabel, { color: catColor }]}>
                {item.category}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.txAmount,
            { color: isDebit ? Colors.error : Colors.success },
          ]}
        >
          {isDebit ? '−' : '+'}
          {formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  const renderTransactions = () => (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Feather name="search" size={ms(16)} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={ms(16)} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter buttons */}
      <View style={styles.filterRow}>
        {(['All', 'Debit', 'Credit'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, txFilter === f && styles.filterBtnActive]}
            onPress={() => setTxFilter(f)}
          >
            <Text
              style={[
                styles.filterBtnText,
                txFilter === f && styles.filterBtnTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      <Text style={styles.txCount}>
        {filteredTransactions.length} transactions
      </Text>

      {/* List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState message="No transactions match your search" />
      ) : (
        filteredTransactions.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderTransaction({ item, index })}
          </React.Fragment>
        ))
      )}
    </View>
  );

  // ─── TAB CONTENT ───────────────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return renderOverview();
      case 'Categories':
        return renderCategories();
      case 'Trends':
        return renderTrends();
      case 'Merchants':
        return renderMerchants();
      case 'Transactions':
        return renderTransactions();
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={ms(22)} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Statement Analysis</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Feather name="award" size={ms(10)} color="#FFF" style={{ marginRight: 2 }} />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
        {/* Export button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Feather name="download" size={ms(20)} color={Colors.primary} />
          }
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab}
              </Text>
              {isActive && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderTabContent()}
      </ScrollView>

      {/* Banner Ad — fixed footer, only for free users, no overlap with content */}
      <BannerAdView style={styles.adFooter} />
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    gap: spacing.sm,
  },
  backBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  proBadgeText: { fontSize: ms(9), fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  exportBtn: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.md,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adFooter: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  headerSpacer: { width: ms(44) },

  // Tab bar
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    maxHeight: ms(48),
  },
  tabBarContent: { paddingHorizontal: wp(3) },
  tabItem: {
    paddingHorizontal: wp(4),
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
    minHeight: ms(44),
    justifyContent: 'center',
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: wp(4),
    right: wp(4),
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: hp(4) },

  // Tab content wrapper
  tabContent: {
    paddingHorizontal: wp(5),
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // Section card
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionCardCentered: {
    backgroundColor: Colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Summary cards
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: { fontSize: fontSize.sm, fontWeight: '700' },

  // Period
  periodText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: ms(10), height: ms(10), borderRadius: ms(5) },
  legendLabel: { fontSize: fontSize.xs, color: Colors.textSecondary },

  // Subscriptions
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: spacing.md,
  },
  subIconBox: {
    width: ms(40),
    height: ms(40),
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subInfo: { flex: 1 },
  subMerchant: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subFrequency: { fontSize: fontSize.xs, color: Colors.textTertiary },
  subNextDate: { fontSize: fontSize.xs, color: Colors.primary, marginTop: 1, fontWeight: '600' },
  subAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: hp(5), gap: spacing.md },
  emptyStateText: {
    fontSize: fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Pie center
  pieCenterLabel: { alignItems: 'center' },
  pieCenterValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pieCenterSub: { fontSize: fontSize.xs, color: Colors.textTertiary },

  // Category list
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  catDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    marginRight: spacing.sm,
  },
  catName: { flex: 1, fontSize: fontSize.sm, color: Colors.textPrimary },
  catRight: { alignItems: 'flex-end' },
  catAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  catPct: { fontSize: fontSize.xs, color: Colors.textTertiary },

  // Trends
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  trendMonth: {
    width: ms(50),
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
  },
  trendBarBg: {
    flex: 1,
    height: ms(8),
    backgroundColor: Colors.borderLight,
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  trendBarFill: { height: '100%', borderRadius: ms(4) },
  trendValue: {
    width: ms(80),
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Merchants
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: spacing.sm,
  },
  merchantRankBox: {
    width: ms(28),
    height: ms(28),
    borderRadius: radius.sm,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantRank: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  merchantInfo: { flex: 1 },
  merchantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  merchantName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  merchantCatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  merchantCatLabel: { fontSize: ms(10), fontWeight: '600' },
  merchantBarBg: {
    height: ms(4),
    backgroundColor: Colors.borderLight,
    borderRadius: ms(2),
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  merchantBarFill: { height: '100%', borderRadius: ms(2) },
  merchantCount: { fontSize: ms(10), color: Colors.textTertiary },
  merchantAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Transactions
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: { color: Colors.textInverse, fontWeight: '700' },
  txCount: {
    fontSize: fontSize.xs,
    color: Colors.textTertiary,
    marginBottom: spacing.xs,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  txLeft: { flex: 1, gap: 2 },
  txDate: { fontSize: ms(10), color: Colors.textTertiary },
  txDesc: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  txCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  txCatLabel: { fontSize: ms(10), fontWeight: '600' },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});

export default DashboardScreen;
