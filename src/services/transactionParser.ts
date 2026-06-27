import { Transaction } from './types';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

let _txnCounter = 0;

const DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'DD MMM YYYY',
  'D MMM YYYY',
  'MMM DD YYYY',
  'DD/MM/YY',
  'D/M/YYYY',
];

function parseDate(field: string): string | null {
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(field.trim(), fmt, true);
    if (d.isValid()) {
      return d.format('YYYY-MM-DD');
    }
  }
  return null;
}

function isAmountField(field: string): boolean {
  if (!/^[\d,]+\.?\d{0,2}$/.test(field)) {
    return false;
  }
  const val = parseFloat(field.replace(/,/g, ''));
  return !isNaN(val);
}

function guessType(description: string, context: string): 'DEBIT' | 'CREDIT' {
  const combined = (description + ' ' + context).toLowerCase();

  const creditKeywords = [
    'credit',
    'salary',
    'refund',
    'interest earned',
    'dividend',
    'deposit',
    'received',
    'reversal',
    'cashback',
    'return',
    'cr ',
  ];
  const debitKeywords = [
    'debit',
    'payment',
    'paid',
    'purchase',
    'withdrawal',
    'upi/',
    'imps/',
    'neft/',
    'nach/',
    'emi',
    'dr ',
  ];

  for (const kw of creditKeywords) {
    if (combined.includes(kw)) {
      return 'CREDIT';
    }
  }
  for (const kw of debitKeywords) {
    if (combined.includes(kw)) {
      return 'DEBIT';
    }
  }
  return 'DEBIT';
}

export function parseTransactions(rows: string[]): Transaction[] {
  const results: Transaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fields = row
      .split('\t')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (fields.length < 3) {
      continue;
    }

    // Find date in first 3 fields
    let dateStr: string | null = null;
    let dateIdx = -1;
    for (let fi = 0; fi < Math.min(3, fields.length); fi++) {
      const parsed = parseDate(fields[fi]);
      if (parsed !== null) {
        dateStr = parsed;
        dateIdx = fi;
        break;
      }
    }

    if (dateStr === null) {
      continue;
    }

    const remaining = fields.slice(dateIdx + 1);

    const amountFields: number[] = [];
    const textFields: string[] = [];

    for (const field of remaining) {
      if (isAmountField(field)) {
        amountFields.push(parseFloat(field.replace(/,/g, '')));
      } else {
        textFields.push(field);
      }
    }

    if (amountFields.length === 0) {
      continue;
    }

    const description = textFields.join(' ').trim();
    if (!description) {
      continue;
    }

    let amount: number;
    let balance: number | undefined;
    let type: 'DEBIT' | 'CREDIT';

    if (amountFields.length >= 2) {
      balance = amountFields[amountFields.length - 1];
      let txnAmount = amountFields[amountFields.length - 2];
      if (txnAmount === 0 && amountFields.length >= 3) {
        const candidate = amountFields[amountFields.length - 3];
        if (candidate !== 0) {
          txnAmount = candidate;
        }
      }
      amount = txnAmount;
      type = guessType(description, remaining.join(' '));
    } else {
      amount = amountFields[0];
      balance = undefined;
      type = guessType(description, remaining.join(' '));
    }

    // Override with explicit Dr/Cr markers
    if (/\bdr\b/i.test(row)) {
      type = 'DEBIT';
    } else if (/\bcr\b/i.test(row)) {
      type = 'CREDIT';
    }

    if (amount <= 0) continue;

    results.push({
      id: `txn_${++_txnCounter}`,
      date: dateStr,
      description,
      amount,
      type,
      ...(balance !== undefined ? { balance } : {}),
    });
  }

  return results;
}
