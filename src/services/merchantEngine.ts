import { ExpenseCategory } from './types';

const MERCHANT_MAP: Record<string, string> = {
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  amazon: 'Amazon',
  amzn: 'Amazon',
  flipkart: 'Flipkart',
  netflix: 'Netflix',
  spotify: 'Spotify',
  youtube: 'YouTube Premium',
  'google pay': 'Google Pay',
  gpay: 'Google Pay',
  uber: 'Uber',
  'ola cabs': 'Ola',
  ' ola ': 'Ola',
  rapido: 'Rapido',
  bigbasket: 'BigBasket',
  blinkit: 'Blinkit',
  zepto: 'Zepto',
  dunzo: 'Dunzo',
  myntra: 'Myntra',
  nykaa: 'Nykaa',
  ajio: 'AJIO',
  meesho: 'Meesho',
  phonepe: 'PhonePe',
  paytm: 'Paytm',
  openai: 'ChatGPT',
  chatgpt: 'ChatGPT',
  microsoft: 'Microsoft',
  hotstar: 'Disney+ Hotstar',
  disney: 'Disney+ Hotstar',
  jiocinema: 'JioCinema',
  primevideo: 'Amazon Prime',
  apple: 'Apple',
  jio: 'Jio',
  airtel: 'Airtel',
  bsnl: 'BSNL',
  vodafone: 'Vodafone',
  'vi-': 'Vi',
  ' vi ': 'Vi',
  lic: 'LIC',
  hdfc: 'HDFC Bank',
  icici: 'ICICI Bank',
  sbi: 'SBI',
  'axis bank': 'Axis Bank',
  kotak: 'Kotak Bank',
  zerodha: 'Zerodha',
  groww: 'Groww',
  upstox: 'Upstox',
  makemytrip: 'MakeMyTrip',
  yatra: 'Yatra',
  goibibo: 'Goibibo',
  irctc: 'IRCTC',
  indigo: 'IndiGo',
  'air india': 'Air India',
};

const STRIP_PREFIXES =
  /^(upi\/|upi-|neft\/|neft-|imps\/|imps-|nach\/|pos\/|atm\/|mmt\/|bil\/|ach\/)/i;

export function cleanMerchantName(description: string): string {
  let cleaned = description.toLowerCase();
  cleaned = cleaned.replace(STRIP_PREFIXES, '');

  for (const key of Object.keys(MERCHANT_MAP)) {
    if (cleaned.includes(key)) {
      return MERCHANT_MAP[key];
    }
  }

  // Fallback: split by whitespace or separators, take first 3 tokens, title-case
  const tokens = cleaned
    .split(/[\s\-_\\]+/)
    .filter(t => t.length > 0)
    .slice(0, 3)
    .map(t => t.charAt(0).toUpperCase() + t.slice(1));

  return tokens.join(' ');
}

const MERCHANT_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  Zomato: 'Food',
  Swiggy: 'Food',
  BigBasket: 'Food',
  Blinkit: 'Food',
  Zepto: 'Food',
  Dunzo: 'Food',
  Amazon: 'Shopping',
  Flipkart: 'Shopping',
  Myntra: 'Shopping',
  Nykaa: 'Shopping',
  AJIO: 'Shopping',
  Meesho: 'Shopping',
  Netflix: 'Subscription',
  Spotify: 'Subscription',
  'YouTube Premium': 'Subscription',
  ChatGPT: 'Subscription',
  Apple: 'Subscription',
  Microsoft: 'Subscription',
  'Disney+ Hotstar': 'Subscription',
  JioCinema: 'Subscription',
  'Amazon Prime': 'Subscription',
  Uber: 'Transportation',
  Ola: 'Transportation',
  Rapido: 'Transportation',
  MakeMyTrip: 'Travel',
  Yatra: 'Travel',
  Goibibo: 'Travel',
  IRCTC: 'Travel',
  IndiGo: 'Travel',
  'Air India': 'Travel',
  PhonePe: 'Transfers',
  Paytm: 'Transfers',
  'Google Pay': 'Transfers',
  Jio: 'Bills',
  Airtel: 'Bills',
  BSNL: 'Bills',
  Vodafone: 'Bills',
  Vi: 'Bills',
  LIC: 'Bills',
  'HDFC Bank': 'Bills',
  'ICICI Bank': 'Bills',
  SBI: 'Bills',
  Zerodha: 'Investments',
  Groww: 'Investments',
  Upstox: 'Investments',
};

const KEYWORD_CATEGORY: Array<{
  keywords: string[];
  category: ExpenseCategory;
}> = [
  {
    keywords: ['salary', 'wage', 'income earned', 'bonus'],
    category: 'Income',
  },
  {
    keywords: ['refund', 'cashback', 'reversal', 'return credit'],
    category: 'Shopping',
  },
  { keywords: ['interest earned', 'dividend'], category: 'Investments' },
  {
    keywords: [
      'food',
      'restaurant',
      'cafe',
      'coffee',
      'pizza',
      'burger',
      'dining',
      'eat',
      'grocery',
      'supermarket',
      'kitchen',
    ],
    category: 'Food',
  },
  {
    keywords: [
      'hotel',
      'flight',
      'airline',
      'airport',
      'travel',
      'tour',
      'holiday',
      'vacation',
      'booking.com',
      'makemytrip',
      'yatra',
      'goibibo',
    ],
    category: 'Travel',
  },
  {
    keywords: [
      'uber',
      'ola',
      'metro',
      'bus pass',
      'train',
      'auto',
      'cab',
      'taxi',
      'fuel',
      'petrol',
      'diesel',
      'parking',
      'fastag',
      'toll',
    ],
    category: 'Transportation',
  },
  {
    keywords: [
      'electric',
      'electricity',
      'water bill',
      'gas bill',
      'broadband',
      'internet bill',
      'mobile bill',
      'recharge',
      'utility',
      'emi',
      'loan',
      'insurance',
      'premium',
    ],
    category: 'Bills',
  },
  {
    keywords: [
      'netflix',
      'spotify',
      'youtube',
      'subscription',
      'monthly plan',
      'annual plan',
      'prime video',
      'hotstar',
    ],
    category: 'Subscription',
  },
  {
    keywords: [
      'movie',
      'cinema',
      'pvr',
      'inox',
      'game',
      'gaming',
      'concert',
      'event',
      'bookmyshow',
    ],
    category: 'Entertainment',
  },
  {
    keywords: [
      'hospital',
      'clinic',
      'doctor',
      'pharmacy',
      'medicine',
      'health',
      'medical',
      'dental',
      'apollo',
      'medplus',
    ],
    category: 'Healthcare',
  },
  {
    keywords: [
      'school',
      'college',
      'university',
      'course',
      'education',
      'fee',
      'tuition',
      'book',
      'udemy',
      'coursera',
    ],
    category: 'Education',
  },
  {
    keywords: [
      'mutual fund',
      'sip',
      'stock',
      'invest',
      'zerodha',
      'groww',
      'upstox',
      'shares',
      'demat',
      'nse',
      'bse',
      'smallcase',
    ],
    category: 'Investments',
  },
  {
    keywords: ['neft', 'imps', 'rtgs', 'transfer', 'send money', 'wallet'],
    category: 'Transfers',
  },
  {
    keywords: [
      'shopping',
      'mall',
      'store',
      'market',
      'retail',
      'cloth',
      'fashion',
      'shoe',
    ],
    category: 'Shopping',
  },
];

export function categorizeTransaction(
  description: string,
  merchant: string,
  type: 'DEBIT' | 'CREDIT',
): ExpenseCategory {
  const combined = (description + ' ' + merchant).toLowerCase();

  // CREDIT: check salary/refund/interest first, then default to Income
  if (type === 'CREDIT') {
    if (
      ['salary', 'wage', 'income earned', 'bonus'].some(k =>
        combined.includes(k),
      )
    ) {
      return 'Income';
    }
    if (
      ['refund', 'cashback', 'reversal', 'return credit'].some(k =>
        combined.includes(k),
      )
    ) {
      return 'Shopping';
    }
    if (['interest earned', 'dividend'].some(k => combined.includes(k))) {
      return 'Investments';
    }
    return 'Income';
  }

  // Check merchant map
  if (MERCHANT_CATEGORY_MAP[merchant]) {
    return MERCHANT_CATEGORY_MAP[merchant];
  }

  // Check keyword map
  for (const entry of KEYWORD_CATEGORY) {
    for (const kw of entry.keywords) {
      if (combined.includes(kw)) {
        return entry.category;
      }
    }
  }

  return 'Others';
}
