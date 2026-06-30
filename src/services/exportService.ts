/**
 * exportService - Generate PDF analysis report from AnalysisResult
 * Uses react-native-html-to-pdf to produce a professional report
 */

import { generatePDF } from 'react-native-html-to-pdf';
import { AnalysisResult, CATEGORY_COLORS } from './types';
import dayjs from 'dayjs';

const formatCurrency = (n: number): string =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const formatDate = (iso: string): string =>
  iso ? dayjs(iso).format('DD MMM YYYY') : '—';

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function buildSvgDonutChart(catEntries: [string, number][], totalExpenses: number): string {
  const size = 200;
  const cx = 100;
  const cy = 100;
  const radius = 70;
  const strokeWidth = 24;
  
  if (catEntries.length === 0 || totalExpenses === 0) {
    return `<svg viewBox="0 0 ${size} ${size}" style="width:140px; height:140px;">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="${strokeWidth}" />
    </svg>`;
  }
  
  let currentAngle = 0;
  const paths: string[] = [];
  
  for (let i = 0; i < catEntries.length; i++) {
    const [cat, val] = catEntries[i];
    const pct = val / totalExpenses;
    const angleDelta = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleDelta;
    currentAngle = endAngle;
    
    const color = (CATEGORY_COLORS as any)[cat] ?? '#6366F1';
    
    if (pct >= 0.999) {
      paths.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`);
      break;
    }
    
    const d = describeArc(cx, cy, radius, startAngle, endAngle);
    paths.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`);
  }
  
  return `
    <svg viewBox="0 0 ${size} ${size}" style="width:140px; height:140px; flex-shrink:0;">
      ${paths.join('\n')}
      <!-- Text in center -->
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="13" font-weight="800" fill="#1E293B" font-family="-apple-system, sans-serif">${formatCurrency(totalExpenses)}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="7.5" font-weight="700" fill="#94A3B8" letter-spacing="0.5" font-family="-apple-system, sans-serif">TOTAL EXPENSE</text>
    </svg>
  `;
}

function buildSvgLineChart(trends: { month: string; income: number; expenses: number }[]): string {
  if (trends.length === 0) return '';
  
  const width = 600;
  const height = 200;
  const paddingX = 55;
  const paddingY = 25;
  
  const maxVal = Math.max(...trends.flatMap(t => [t.income, t.expenses])) || 1;
  
  const pointsIncome: [number, number][] = [];
  const pointsExpenses: [number, number][] = [];
  
  for (let i = 0; i < trends.length; i++) {
    const t = trends[i];
    const x = paddingX + (i * (width - 2 * paddingX)) / (trends.length > 1 ? trends.length - 1 : 1);
    const yInc = height - paddingY - (t.income / maxVal) * (height - 2 * paddingY);
    const yExp = height - paddingY - (t.expenses / maxVal) * (height - 2 * paddingY);
    
    pointsIncome.push([x, yInc]);
    pointsExpenses.push([x, yExp]);
  }
  
  let incomeLinePath = '';
  let expensesLinePath = '';
  let incomeAreaPath = '';
  let expensesAreaPath = '';
  
  if (trends.length === 1) {
    const x = pointsIncome[0][0];
    incomeLinePath = `M ${x - 10} ${pointsIncome[0][1]} L ${x + 10} ${pointsIncome[0][1]}`;
    expensesLinePath = `M ${x - 10} ${pointsExpenses[0][1]} L ${x + 10} ${pointsExpenses[0][1]}`;
  } else {
    incomeLinePath = 'M ' + pointsIncome.map(p => `${p[0]} ${p[1]}`).join(' L ');
    expensesLinePath = 'M ' + pointsExpenses.map(p => `${p[0]} ${p[1]}`).join(' L ');
    
    incomeAreaPath = `${incomeLinePath} L ${pointsIncome[pointsIncome.length - 1][0]} ${height - paddingY} L ${pointsIncome[0][0]} ${height - paddingY} Z`;
    expensesAreaPath = `${expensesLinePath} L ${pointsExpenses[pointsExpenses.length - 1][0]} ${height - paddingY} L ${pointsExpenses[0][0]} ${height - paddingY} Z`;
  }
  
  const labelsHtml = trends.map((t, i) => {
    const x = pointsIncome[i][0];
    return `<text x="${x}" y="${height - 6}" text-anchor="middle" font-size="9" fill="#94A3B8" font-weight="600" font-family="-apple-system, sans-serif">${t.month.substring(0,3)}</text>`;
  }).join('');
  
  const gridHtml = [0, 0.25, 0.5, 0.75, 1].map(r => {
    const y = height - paddingY - r * (height - 2 * paddingY);
    const labelVal = maxVal * r;
    return `
      <line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#F1F5F9" stroke-width="1" />
      <text x="${paddingX - 10}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94A3B8" font-family="-apple-system, sans-serif">${formatCurrency(labelVal)}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; margin-top:15px; margin-bottom:15px;">
      <!-- Grid Lines & Y Labels -->
      ${gridHtml}
      
      <!-- Baseline -->
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#E2E8F0" stroke-width="1.5" />
      
      <!-- Area fills -->
      ${incomeAreaPath ? `<path d="${incomeAreaPath}" fill="#10B981" fill-opacity="0.08" />` : ''}
      ${expensesAreaPath ? `<path d="${expensesAreaPath}" fill="#EF4444" fill-opacity="0.08" />` : ''}
      
      <!-- Lines -->
      <path d="${incomeLinePath}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="${expensesLinePath}" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Points -->
      ${pointsIncome.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#FFFFFF" stroke="#10B981" stroke-width="2" />`).join('')}
      ${pointsExpenses.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#FFFFFF" stroke="#EF4444" stroke-width="2" />`).join('')}
      
      <!-- X-axis Labels -->
      ${labelsHtml}
    </svg>
  `;
}

function buildSvgSavingsChart(trends: { month: string; income: number; expenses: number }[]): string {
  if (trends.length === 0) return '';
  
  const width = 600;
  const height = 160;
  const paddingX = 55;
  const paddingY = 20;
  
  const savingsData = trends.map(t => t.income - t.expenses);
  
  const colWidth = (width - 2 * paddingX) / trends.length;
  const barWidth = Math.max(colWidth * 0.4, 12);
  
  const minSavings = Math.min(...savingsData);
  const maxSavingsActual = Math.max(...savingsData);
  
  let zeroLineY = height - paddingY;
  if (minSavings < 0 && maxSavingsActual > 0) {
    const range = maxSavingsActual - minSavings;
    zeroLineY = paddingY + (maxSavingsActual / range) * (height - 2 * paddingY);
  } else if (maxSavingsActual <= 0) {
    zeroLineY = paddingY;
  }
  
  const range = Math.max(maxSavingsActual - minSavings, 1);
  const scale = (height - 2 * paddingY) / range;
  
  const gridHtml = [0, 0.5, 1].map(r => {
    const isMin = r === 0;
    const isMax = r === 1;
    const value = isMin ? minSavings : isMax ? maxSavingsActual : 0;
    const y = height - paddingY - r * (height - 2 * paddingY);
    
    if (Math.abs(y - zeroLineY) < 15 && value !== 0) return '';
    
    return `
      <line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#F8FAFC" stroke-width="1" />
      <text x="${paddingX - 10}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94A3B8" font-family="-apple-system, sans-serif">${formatCurrency(value)}</text>
    `;
  }).join('');
  
  const barsHtml = trends.map((t, i) => {
    const sav = t.income - t.expenses;
    const x = paddingX + (i * colWidth) + (colWidth - barWidth) / 2;
    const isPositive = sav >= 0;
    const color = isPositive ? '#10B981' : '#EF4444';
    
    const barHeight = Math.max(Math.abs(sav) * scale, 2);
    const y = isPositive ? zeroLineY - barHeight : zeroLineY;
    
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2" />
      <text x="${x + barWidth/2}" y="${height - 2}" text-anchor="middle" font-size="9" fill="#94A3B8" font-weight="600" font-family="-apple-system, sans-serif">${t.month.substring(0,3)}</text>
    `;
  }).join('');
  
  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; margin-top:15px; margin-bottom:15px;">
      <!-- Grid -->
      ${gridHtml}
      
      <!-- Zero line -->
      <line x1="${paddingX}" y1="${zeroLineY}" x2="${width - paddingX}" y2="${zeroLineY}" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3,3" />
      <text x="${width - paddingX + 8}" y="${zeroLineY + 3}" font-size="9" fill="#94A3B8" font-weight="600" font-family="-apple-system, sans-serif">0</text>
      
      <!-- Bars & Labels -->
      ${barsHtml}
    </svg>
  `;
}

function buildBarHtml(label: string, value: number, max: number, color: string, pctText?: string): string {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return `
    <div class="bar-row">
      <span class="bar-label">${label}${pctText ? ` <span class="pct-text">(${pctText}%)</span>` : ''}</span>
      <div class="bar-bg">
        <div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div>
      </div>
      <span class="bar-value">${formatCurrency(value)}</span>
    </div>`;
}

export async function exportAnalysisReportToPDF(
  result: AnalysisResult,
  fileName: string,
): Promise<string> {
  const { totalIncome, totalExpenses, savings, categoryBreakdown, topMerchants, subscriptions, monthlyTrends, statementPeriod } = result;

  const savingsColor = savings >= 0 ? '#10B981' : '#EF4444';
  const savingsSign = savings >= 0 ? '+' : '−';
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const savingsRateText = totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : '0.0%';

  // Category breakdown sorted
  const catEntries = (Object.entries(categoryBreakdown) as [string, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxCatAmount = catEntries.length > 0 ? catEntries[0][1] : 1;

  // Top merchants
  const maxMerchantAmount = topMerchants.length > 0 ? topMerchants[0].amount : 1;

  // Monthly trends table rows
  const monthRows = monthlyTrends.map(t => {
    const sav = t.income - t.expenses;
    const savColor = sav >= 0 ? '#10B981' : '#EF4444';
    return `<tr>
      <td>${t.month}</td>
      <td style="color:#10B981;font-weight:600">${formatCurrency(t.income)}</td>
      <td style="color:#EF4444;font-weight:600">${formatCurrency(t.expenses)}</td>
      <td style="color:${savColor};font-weight:700">${sav >= 0 ? '+' : '−'}${formatCurrency(Math.abs(sav))}</td>
    </tr>`;
  }).join('');

  // Category bars with percentages
  const catBars = catEntries.map(([cat, val]) => {
    const pctVal = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0';
    return buildBarHtml(cat, val, maxCatAmount, (CATEGORY_COLORS as any)[cat] ?? '#6366F1', pctVal);
  }).join('');

  // Category legend for Donut
  const catLegendItems = catEntries.slice(0, 5).map(([cat, val]) => {
    const color = (CATEGORY_COLORS as any)[cat] ?? '#6366F1';
    const pctVal = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0';
    return `
      <div class="legend-row">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-text">${cat}</span>
        <span class="legend-pct">${pctVal}%</span>
      </div>
    `;
  }).join('');

  // Merchant bars
  const merchantBars = topMerchants.slice(0, 10).map((m, i) => {
    const color = m.category ? (CATEGORY_COLORS as any)[m.category] ?? '#6366F1' : '#6366F1';
    return `<div class="merchant-row">
      <span class="merchant-rank">${i + 1}</span>
      <div class="merchant-info">
        <span class="merchant-name">${m.merchant}</span>
        ${m.category ? `<span class="cat-badge" style="background:${color}22;color:${color}">${m.category}</span>` : ''}
        <div class="bar-bg" style="margin-top:4px">
          <div class="bar-fill" style="width:${((m.amount / maxMerchantAmount) * 100).toFixed(1)}%;background:${color}"></div>
        </div>
        <span style="font-size:11px;color:#94A3B8">${m.count} transactions</span>
      </div>
      <span class="merchant-amount">${formatCurrency(m.amount)}</span>
    </div>`;
  }).join('');

  // Subscriptions rows
  const subRows = subscriptions.map(s => {
    const color = s.category ? (CATEGORY_COLORS as any)[s.category] ?? '#A855F7' : '#A855F7';
    return `<tr>
      <td>${s.merchant}</td>
      <td>${s.frequency}</td>
      <td style="color:${color};font-weight:600">${formatCurrency(s.amount)}</td>
      <td>${formatDate(s.lastDate)}</td>
      <td>${s.nextExpectedDate ? formatDate(s.nextExpectedDate) : '—'}</td>
    </tr>`;
  }).join('');

  // Detailed transactions list (sorted date descending)
  const sortedTxs = [...result.transactions].sort(
    (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
  );

  const txRows = sortedTxs.map(t => {
    const isDebit = t.type === 'DEBIT';
    const amountColor = isDebit ? '#EF4444' : '#10B981';
    const amountSign = isDebit ? '−' : '+';
    const catColor = t.category ? (CATEGORY_COLORS as any)[t.category] ?? '#64748B' : '#64748B';
    return `<tr>
      <td style="white-space:nowrap">${formatDate(t.date)}</td>
      <td>
        <div style="font-weight:600;color:#1E293B">${t.merchant || t.description}</div>
        ${t.merchant && t.description ? `<div style="font-size:10px;color:#64748B;margin-top:2px">${t.description}</div>` : ''}
      </td>
      <td>
        ${t.category ? `<span class="cat-badge" style="background:${catColor}22;color:${catColor};margin-left:0;display:inline-block">${t.category}</span>` : '—'}
      </td>
      <td style="color:${amountColor};font-weight:700;text-align:right;white-space:nowrap">
        ${amountSign}${formatCurrency(t.amount)}
      </td>
    </tr>`;
  }).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Bank Statement Analysis Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; color: #1E293B; font-size: 13px; }
  
  .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 28px 32px; }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  .header .period { font-size: 13px; font-weight: 600; margin-top: 8px; opacity: 0.9; }
  .header .brand { font-size: 11px; opacity: 0.6; margin-top: 4px; }

  .content { padding: 24px 32px; }

  .summary-grid { display: flex; flex-direction: row; gap: 12px; margin-bottom: 24px; width: 100%; }
  .summary-card { flex: 1; background: white; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
  .summary-label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .summary-value { font-size: 18px; font-weight: 800; }

  .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; page-break-inside: avoid; }
  .section h2 { font-size: 14px; font-weight: 700; color: #1E293B; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #F1F5F9; display: flex; align-items: center; gap: 8px; }
  .section h3 { margin-top: 5px; }
  .section-icon { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  .category-chart-wrapper { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 40px; margin-top: 15px; margin-bottom: 5px; }
  .category-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .legend-row { display: flex; align-items: center; font-size: 12px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; flex-shrink: 0; display: inline-block; }
  .legend-text { color: #374151; font-weight: 500; flex: 1; }
  .legend-pct { color: #64748B; font-weight: 700; text-align: right; width: 50px; }

  .bar-row { display: flex; align-items: center; margin-bottom: 10px; gap: 8px; }
  .bar-label { width: 160px; font-size: 12px; color: #374151; font-weight: 500; flex-shrink: 0; }
  .pct-text { font-size: 11px; color: #64748B; font-weight: normal; margin-left: 2px; }
  .bar-bg { flex: 1; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .bar-value { width: 90px; font-size: 12px; font-weight: 700; text-align: right; color: #1E293B; flex-shrink: 0; }

  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #F8FAFC; color: #64748B; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; border-bottom: 2px solid #E2E8F0; }
  td { padding: 9px 10px; border-bottom: 1px solid #F1F5F9; color: #334155; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #FAFAFA; }
  tr { page-break-inside: avoid; }

  .merchant-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F1F5F9; page-break-inside: avoid; }
  .merchant-row:last-child { border-bottom: none; }
  .merchant-rank { width: 24px; height: 24px; border-radius: 6px; background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .merchant-info { flex: 1; }
  .merchant-name { font-size: 13px; font-weight: 600; color: #1E293B; }
  .cat-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
  .merchant-amount { font-size: 13px; font-weight: 700; color: #1E293B; flex-shrink: 0; }

  .footer { text-align: center; padding: 16px; color: #94A3B8; font-size: 10px; border-top: 1px solid #E2E8F0; margin-top: 8px; }
</style>
</head>
<body>
  <div class="header">
    <h1>📊 Bank Statement Analysis</h1>
    <p>File: ${fileName}</p>
    <p class="period">Period: ${formatDate(statementPeriod.from)} — ${formatDate(statementPeriod.to)}</p>
    <p class="brand">Generated by RobotPDF · ${dayjs().format('DD MMM YYYY, hh:mm A')}</p>
  </div>

  <div class="content">
    <!-- Summary -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Income</div>
        <div class="summary-value" style="color:#10B981">${formatCurrency(totalIncome)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Expenses</div>
        <div class="summary-value" style="color:#EF4444">${formatCurrency(totalExpenses)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Net Savings</div>
        <div class="summary-value" style="color:${savingsColor}">${savingsSign}${formatCurrency(Math.abs(savings))}</div>
        <div style="font-size:10px;color:#64748B;margin-top:4px;font-weight:600">Savings Rate: ${savingsRateText}</div>
      </div>
    </div>

    <!-- Monthly Trends -->
    ${monthlyTrends.length > 0 ? `
    <div class="section">
      <h2><span class="section-icon" style="background:#4F46E5"></span>Monthly Income vs Expenses</h2>
      ${buildSvgLineChart(monthlyTrends)}
    </div>
    
    <div class="section">
      <h2><span class="section-icon" style="background:#06B6D4"></span>Monthly Savings Trend</h2>
      ${buildSvgSavingsChart(monthlyTrends)}
    </div>

    <div class="section">
      <h2><span class="section-icon" style="background:#10B981"></span>Monthly Summary Table</h2>
      <table style="width:100%">
        <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th></tr></thead>
        <tbody>${monthRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Category Breakdown -->
    ${catEntries.length > 0 ? `
    <div class="section">
      <h2><span class="section-icon" style="background:#EC4899"></span>Spending by Category</h2>
      <div class="category-chart-wrapper">
        ${buildSvgDonutChart(catEntries, totalExpenses)}
        <div class="category-legend">
          ${catLegendItems}
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2><span class="section-icon" style="background:#F43F5E"></span>Category Spending Details</h2>
      ${catBars}
    </div>` : ''}

    <!-- Top Merchants -->
    ${topMerchants.length > 0 ? `
    <div class="section">
      <h2><span class="section-icon" style="background:#F59E0B"></span>Top Merchants</h2>
      ${merchantBars}
    </div>` : ''}

    <!-- Subscriptions -->
    ${subscriptions.length > 0 ? `
    <div class="section">
      <h2><span class="section-icon" style="background:#A855F7"></span>Detected Subscriptions & Recurring Charges</h2>
      <table>
        <thead><tr><th>Service</th><th>Frequency</th><th>Amount</th><th>Last Charged</th><th>Next Expected</th></tr></thead>
        <tbody>${subRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Detailed Transactions -->
    ${sortedTxs.length > 0 ? `
    <div class="section" style="page-break-before:always;page-break-inside:auto">
      <h2><span class="section-icon" style="background:#6366F1"></span>Detailed Transaction History</h2>
      <table style="margin-top:12px;width:100%">
        <thead>
          <tr>
            <th style="width:15%">Date</th>
            <th style="width:45%">Description</th>
            <th style="width:20%">Category</th>
            <th style="text-align:right;width:20%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${txRows}
        </tbody>
      </table>
    </div>` : ''}
  </div>

  <div class="footer">
    Generated by RobotPDF Bank Statement Analyzer · Privacy-First, Local Processing
  </div>
</body>
</html>`;

  const pdf = await generatePDF({
    html: htmlContent,
    fileName: `BankAnalysis_${dayjs().format('YYYYMMDD_HHmm')}`,
    directory: 'Documents',
    base64: false,
  });
  if (!pdf.filePath) {
    throw new Error('PDF generation failed — no file path returned');
  }
  return pdf.filePath;
}
