import { ExpenseCategory } from './types';

// ─── Known subscription merchants (for single-occurrence detection) ─────────
export const KNOWN_SUBSCRIPTION_MERCHANTS = new Set([
  'Netflix', 'Spotify', 'YouTube Premium', 'Amazon Prime', 'Disney+ Hotstar',
  'JioCinema', 'Apple', 'Microsoft', 'ChatGPT', 'Google One', 'Dropbox',
  'Adobe', 'Canva', 'Grammarly', 'NordVPN', 'ExpressVPN', 'LinkedIn Premium',
  'Zoom', 'Slack', 'Notion', 'Figma', 'GitHub', 'JetBrains', 'Coursera',
  'Udemy', 'Headspace', 'Calm', 'Audible', 'Kindle Unlimited', 'Medium',
  'Substack', 'Twitch', 'Discord Nitro', 'PlayStation Plus', 'Xbox Game Pass',
  'EA Play', 'SonyLIV', 'MX Player', 'ZEE5', 'Voot', 'Alt Balaji', 'Eros Now',
  'Hungama', 'Gaana', 'JioSaavn', 'Wynk', 'Apple Music', 'Tidal',
  'Bajaj Finance', 'SBI Card', 'HDFC Credit', 'ICICI Credit', 'Axis Credit',
  'Jio', 'Airtel', 'BSNL', 'Vodafone', 'Vi', 'ACT Fibernet', 'Hathway',
]);

// ─── Merchant map (200+ merchants) ─────────────────────────────────────────
const MERCHANT_MAP: Record<string, string> = {
  // Food delivery
  zomato: 'Zomato',
  swiggy: 'Swiggy',
  'swiggy instamart': 'Swiggy Instamart',

  // Grocery & Quick Commerce
  bigbasket: 'BigBasket',
  'big basket': 'BigBasket',
  blinkit: 'Blinkit',
  grofers: 'Blinkit',
  zepto: 'Zepto',
  dunzo: 'Dunzo',
  jiomart: 'JioMart',
  'jio mart': 'JioMart',
  ninjacart: 'Ninjacart',
  milkbasket: 'Milkbasket',
  moreapp: 'More Supermarket',
  fresho: 'Fresho',

  // Restaurants / QSR
  dominos: "Domino's",
  "domino's": "Domino's",
  'pizza hut': 'Pizza Hut',
  kfc: 'KFC',
  mcdonalds: "McDonald's",
  "mcdonald's": "McDonald's",
  'burger king': 'Burger King',
  starbucks: 'Starbucks',
  subway: 'Subway',
  "mcdonald": "McDonald's",
  'baskin robbins': 'Baskin Robbins',
  haldirams: "Haldiram's",
  "haldiram's": "Haldiram's",
  "haldiram": "Haldiram's",

  // E-commerce
  amazon: 'Amazon',
  amzn: 'Amazon',
  flipkart: 'Flipkart',
  myntra: 'Myntra',
  nykaa: 'Nykaa',
  ajio: 'AJIO',
  meesho: 'Meesho',
  snapdeal: 'Snapdeal',
  tatacliq: 'Tata CLiQ',
  'tata cliq': 'Tata CLiQ',
  shopclues: 'ShopClues',
  indiamart: 'IndiaMART',
  pepperfry: 'Pepperfry',
  'urban ladder': 'Urban Ladder',
  firstcry: 'FirstCry',
  'nykaa fashion': 'Nykaa Fashion',
  bewakoof: 'Bewakoof',
  "levi's": "Levi's",
  levis: "Levi's",
  'h&m': 'H&M',
  zara: 'Zara',
  uniqlo: 'Uniqlo',
  decathlon: 'Decathlon',
  'w for woman': 'W',

  // Electronics retail
  croma: 'Croma',
  'reliance digital': 'Reliance Digital',
  vijay: 'Vijay Sales',
  'vijay sales': 'Vijay Sales',
  poorvika: 'Poorvika',
  sangeetha: 'Sangeetha',

  // Streaming
  netflix: 'Netflix',
  spotify: 'Spotify',
  youtube: 'YouTube Premium',
  hotstar: 'Disney+ Hotstar',
  disney: 'Disney+ Hotstar',
  jiocinema: 'JioCinema',
  'jio cinema': 'JioCinema',
  primevideo: 'Amazon Prime',
  'prime video': 'Amazon Prime',
  sonyliv: 'SonyLIV',
  'sony liv': 'SonyLIV',
  zee5: 'ZEE5',
  voot: 'Voot',
  mxplayer: 'MX Player',
  'mx player': 'MX Player',
  altbalaji: 'ALT Balaji',
  'alt balaji': 'ALT Balaji',
  hungama: 'Hungama',
  erosnow: 'Eros Now',
  'eros now': 'Eros Now',

  // Music
  gaana: 'Gaana',
  jiosaavn: 'JioSaavn',
  'jio saavn': 'JioSaavn',
  wynk: 'Wynk Music',
  'apple music': 'Apple Music',

  // Productivity / SaaS
  openai: 'ChatGPT',
  chatgpt: 'ChatGPT',
  microsoft: 'Microsoft',
  google: 'Google',
  'google one': 'Google One',
  dropbox: 'Dropbox',
  adobe: 'Adobe',
  canva: 'Canva',
  grammarly: 'Grammarly',
  notion: 'Notion',
  slack: 'Slack',
  zoom: 'Zoom',
  figma: 'Figma',
  github: 'GitHub',

  // Payment apps
  'google pay': 'Google Pay',
  gpay: 'Google Pay',
  phonepe: 'PhonePe',
  paytm: 'Paytm',
  bhim: 'BHIM UPI',
  amazonpay: 'Amazon Pay',
  'amazon pay': 'Amazon Pay',
  mobikwik: 'MobiKwik',
  freecharge: 'FreeCharge',
  paypal: 'PayPal',
  razorpay: 'Razorpay',

  // Ride-hailing / Transport
  uber: 'Uber',
  'ola cabs': 'Ola',
  olacabs: 'Ola',
  ' ola ': 'Ola',
  rapido: 'Rapido',
  meru: 'Meru Cabs',
  jugnu: 'Jugnu',
  'indian oil': 'Indian Oil',
  'hp petrol': 'HP Petrol',
  hpcl: 'HPCL',
  bpcl: 'BPCL',
  iocl: 'IOCL',
  fastag: 'FASTag',

  // Travel
  makemytrip: 'MakeMyTrip',
  mmt: 'MakeMyTrip',
  yatra: 'Yatra',
  goibibo: 'Goibibo',
  irctc: 'IRCTC',
  indigo: 'IndiGo',
  'air india': 'Air India',
  spicejet: 'SpiceJet',
  vistara: 'Vistara',
  airindia: 'Air India',
  goair: 'Go Air',
  akasaair: 'Akasa Air',
  'booking.com': 'Booking.com',
  oyo: 'OYO',
  'fab hotels': 'Fab Hotels',
  treebo: 'Treebo',
  airbnb: 'Airbnb',
  cleartrip: 'Cleartrip',
  ixigo: 'ixigo',
  redbus: 'redBus',
  abhibus: 'AbhiBus',

  // Telecom / ISP
  jio: 'Jio',
  airtel: 'Airtel',
  bsnl: 'BSNL',
  vodafone: 'Vodafone',
  'vi-': 'Vi',
  ' vi ': 'Vi',
  mtnl: 'MTNL',
  'act fibernet': 'ACT Fibernet',
  hathway: 'Hathway',
  '7star': '7Star',

  // Banking / Finance
  lic: 'LIC',
  licpremium: 'LIC',
  hdfc: 'HDFC Bank',
  icici: 'ICICI Bank',
  sbi: 'SBI',
  'axis bank': 'Axis Bank',
  axisbank: 'Axis Bank',
  kotak: 'Kotak Bank',
  'yes bank': 'Yes Bank',
  yesbank: 'Yes Bank',
  'indusind': 'IndusInd Bank',
  'federal bank': 'Federal Bank',
  'rbl bank': 'RBL Bank',
  'bajaj finance': 'Bajaj Finance',
  'bajaj finserv': 'Bajaj Finserv',
  'idfc first': 'IDFC FIRST Bank',
  'bank of baroda': 'Bank of Baroda',
  'canara bank': 'Canara Bank',
  'pnb': 'Punjab National Bank',
  'union bank': 'Union Bank',

  // Insurance
  'policybazaar': 'PolicyBazaar',
  'tata aia': 'Tata AIA',
  'tata aig': 'Tata AIG',
  'sbi life': 'SBI Life',
  'hdfc life': 'HDFC Life',
  'max life': 'Max Life',
  'icici pru': 'ICICI Prudential',
  'bajaj allianz': 'Bajaj Allianz',
  'new india': 'New India Assurance',

  // Investments
  zerodha: 'Zerodha',
  groww: 'Groww',
  upstox: 'Upstox',
  angelone: 'Angel One',
  'angel one': 'Angel One',
  '5paisa': '5paisa',
  icicidirect: 'ICICI Direct',
  hdfcsec: 'HDFC Securities',
  sbisec: 'SBI Securities',
  motilaloswal: 'Motilal Oswal',
  'motilal oswal': 'Motilal Oswal',
  smallcase: 'Smallcase',
  navi: 'Navi',
  fisdom: 'Fisdom',

  // Healthcare
  apollo: 'Apollo Pharmacy',
  medplus: 'MedPlus',
  '1mg': '1mg',
  pharmeasy: 'PharmEasy',
  netmeds: 'Netmeds',
  practo: 'Practo',
  mfine: 'mfine',
  'tata 1mg': '1mg',

  // Education
  byjus: "BYJU'S",
  "byju's": "BYJU'S",
  unacademy: 'Unacademy',
  'vedantu': 'Vedantu',
  'toppr': 'Toppr',
  coursera: 'Coursera',
  udemy: 'Udemy',
  upgrad: 'upGrad',
  simplilearn: 'Simplilearn',
  whitehat: 'WhiteHat Jr',

  // Entertainment
  bookmyshow: 'BookMyShow',
  'book my show': 'BookMyShow',
  pvr: 'PVR Cinemas',
  inox: 'INOX',

  // Supermarkets
  dmart: 'D-Mart',
  'd-mart': 'D-Mart',
  'big bazaar': 'Big Bazaar',
  reliance: 'Reliance Fresh',
  'reliance fresh': 'Reliance Fresh',
  more: 'More Supermarket',
  spencers: "Spencer's",
  "spencer's": "Spencer's",
  'star bazaar': 'Star Bazaar',

  // Apple
  apple: 'Apple',
};

// ─── Strip patterns for UPI/bank cryptic codes ─────────────────────────────
const STRIP_PREFIXES =
  /^(upi[/-]|neft[/-]|imps[/-]|nach[/-]|pos[/-]|atm[/-]|mmt[/-]|bil[/-]|ach[/-]|ecs[/-]|emi[/-]|int[/-]|chq[/-]|clg[/-]|mob[/-]|pmt[/-]|si[/-]|sip[/-]|bnk[/-]|dmt[/-]|rtgs[/-]|trf[/-]|inb[/-])/i;

// Matches UPI trace IDs, ref numbers, etc.
const STRIP_REFERENCE_NUMBERS =
  /\b(ref|no|#|txn|tran|transaction|utr|rrn|trace|id|seq)[\s:\/]?[a-z0-9]{6,20}\b/gi;

const STRIP_UPI_SUFFIX =
  /\b[a-z0-9._%+\-]+@[a-z]{2,}\b/gi; // strips VPA like someone@okaxis

const STRIP_BANK_CODES =
  /\b(to|from|by|for|via|net|mob|trf|ref|p2p|p2m|mr|ms|mrs|dr|cr|nri|cas|pos|atm)\b/gi;

/**
 * Extracts merchant name from UPI VPA (e.g., "zomato@okaxis" → "Zomato")
 */
function extractFromVPA(description: string): string | null {
  const vpaMatch = description.match(/([a-z0-9._%+\-]+)@([a-z]{2,})/i);
  if (!vpaMatch) return null;

  const localPart = vpaMatch[1].toLowerCase();

  // Look for known merchants in VPA local part
  for (const key of Object.keys(MERCHANT_MAP)) {
    if (localPart.includes(key.replace(/\s+/g, ''))) {
      return MERCHANT_MAP[key];
    }
  }

  // Try to use VPA local part as merchant name if it looks like one
  // e.g., "amazonseller" → "Amazonseller"
  if (!/^\d+$/.test(localPart) && localPart.length > 2 && localPart.length < 25) {
    // Remove common UPI suffixes that aren't merchant names
    const cleaned = localPart
      .replace(/\d{6,}/, '') // remove long numbers
      .replace(/^(pay|upi|txn|pg)/, '') // remove payment prefixes
      .trim();
    if (cleaned.length > 2) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return null;
}

export function cleanMerchantName(description: string): string {
  let cleaned = description.trim();

  // Try extracting from UPI VPA first
  const vpaResult = extractFromVPA(cleaned);
  if (vpaResult) {
    // Check if the extracted VPA result matches a known merchant
    const lower = vpaResult.toLowerCase();
    for (const key of Object.keys(MERCHANT_MAP)) {
      if (lower.includes(key)) return MERCHANT_MAP[key];
    }
  }

  // Normalize
  cleaned = cleaned.toLowerCase();

  // Strip protocol/transfer prefixes
  cleaned = cleaned.replace(STRIP_PREFIXES, '');

  // Check known merchants in raw description first (before stripping)
  for (const key of Object.keys(MERCHANT_MAP)) {
    if (cleaned.includes(key)) {
      return MERCHANT_MAP[key];
    }
  }

  // Strip reference numbers, VPAs, bank codes for fallback
  cleaned = cleaned
    .replace(STRIP_UPI_SUFFIX, '')
    .replace(STRIP_REFERENCE_NUMBERS, '')
    .replace(STRIP_BANK_CODES, '')
    .replace(/[\/\\\-_|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Fallback: take first 2-3 meaningful tokens, title-case
  const tokens = cleaned
    .split(/[\s]+/)
    .filter(t => t.length > 2 && !/^\d+$/.test(t)) // skip pure numbers and tiny words
    .slice(0, 2)
    .map(t => t.charAt(0).toUpperCase() + t.slice(1));

  if (tokens.length > 0) return tokens.join(' ');

  // Last resort: return first 20 chars of original, title-cased
  return description.slice(0, 20).trim();
}

// ─── Merchant → Category map ────────────────────────────────────────────────
const MERCHANT_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  'Zomato': 'Food',
  'Swiggy': 'Food',
  'Swiggy Instamart': 'Food',
  'BigBasket': 'Food',
  'Blinkit': 'Food',
  'Zepto': 'Food',
  'Dunzo': 'Food',
  'JioMart': 'Food',
  "Domino's": 'Food',
  'Pizza Hut': 'Food',
  'KFC': 'Food',
  "McDonald's": 'Food',
  'Burger King': 'Food',
  'Starbucks': 'Food',
  'Subway': 'Food',
  "Haldiram's": 'Food',
  'Ninjacart': 'Food',
  'Milkbasket': 'Food',
  'More Supermarket': 'Food',
  'D-Mart': 'Food',
  'Big Bazaar': 'Food',
  'Reliance Fresh': 'Food',
  "Spencer's": 'Food',
  'Star Bazaar': 'Food',
  'Baskin Robbins': 'Food',

  'Amazon': 'Shopping',
  'Flipkart': 'Shopping',
  'Myntra': 'Shopping',
  'Nykaa': 'Shopping',
  'AJIO': 'Shopping',
  'Meesho': 'Shopping',
  'Snapdeal': 'Shopping',
  'Tata CLiQ': 'Shopping',
  'Pepperfry': 'Shopping',
  'Urban Ladder': 'Shopping',
  'FirstCry': 'Shopping',
  'Bewakoof': 'Shopping',
  "Levi's": 'Shopping',
  'H&M': 'Shopping',
  'Zara': 'Shopping',
  'Uniqlo': 'Shopping',
  'Decathlon': 'Shopping',
  'Croma': 'Shopping',
  'Reliance Digital': 'Shopping',
  'Vijay Sales': 'Shopping',
  'Poorvika': 'Shopping',

  'Netflix': 'Subscription',
  'Spotify': 'Subscription',
  'YouTube Premium': 'Subscription',
  'ChatGPT': 'Subscription',
  'Apple': 'Subscription',
  'Microsoft': 'Subscription',
  'Disney+ Hotstar': 'Subscription',
  'JioCinema': 'Subscription',
  'Amazon Prime': 'Subscription',
  'SonyLIV': 'Subscription',
  'ZEE5': 'Subscription',
  'Voot': 'Subscription',
  'MX Player': 'Subscription',
  'ALT Balaji': 'Subscription',
  'Hungama': 'Subscription',
  'Eros Now': 'Subscription',
  'Gaana': 'Subscription',
  'JioSaavn': 'Subscription',
  'Wynk Music': 'Subscription',
  'Apple Music': 'Subscription',
  'Google One': 'Subscription',
  'Dropbox': 'Subscription',
  'Adobe': 'Subscription',
  'Canva': 'Subscription',
  'Grammarly': 'Subscription',
  'Notion': 'Subscription',
  'Zoom': 'Subscription',
  'Slack': 'Subscription',
  'Figma': 'Subscription',
  'GitHub': 'Subscription',
  'Coursera': 'Subscription',
  'Udemy': 'Subscription',

  'Uber': 'Transportation',
  'Ola': 'Transportation',
  'Rapido': 'Transportation',
  'HPCL': 'Transportation',
  'BPCL': 'Transportation',
  'IOCL': 'Transportation',
  'FASTag': 'Transportation',
  'Indian Oil': 'Transportation',

  'MakeMyTrip': 'Travel',
  'Yatra': 'Travel',
  'Goibibo': 'Travel',
  'IRCTC': 'Travel',
  'IndiGo': 'Travel',
  'Air India': 'Travel',
  'SpiceJet': 'Travel',
  'Vistara': 'Travel',
  'OYO': 'Travel',
  'Booking.com': 'Travel',
  'Airbnb': 'Travel',
  'Cleartrip': 'Travel',
  'ixigo': 'Travel',
  'redBus': 'Travel',

  'PhonePe': 'Transfers',
  'Paytm': 'Transfers',
  'Google Pay': 'Transfers',
  'Amazon Pay': 'Transfers',
  'MobiKwik': 'Transfers',
  'BHIM UPI': 'Transfers',

  'Jio': 'Bills',
  'Airtel': 'Bills',
  'BSNL': 'Bills',
  'Vodafone': 'Bills',
  'Vi': 'Bills',
  'ACT Fibernet': 'Bills',
  'Hathway': 'Bills',
  'LIC': 'Bills',
  'HDFC Bank': 'Bills',
  'ICICI Bank': 'Bills',
  'SBI': 'Bills',
  'Axis Bank': 'Bills',
  'PolicyBazaar': 'Bills',
  'Tata AIA': 'Bills',
  'SBI Life': 'Bills',
  'HDFC Life': 'Bills',
  'Bajaj Finance': 'Bills',
  'Bajaj Finserv': 'Bills',

  'Apollo Pharmacy': 'Healthcare',
  'MedPlus': 'Healthcare',
  '1mg': 'Healthcare',
  'PharmEasy': 'Healthcare',
  'Netmeds': 'Healthcare',
  'Practo': 'Healthcare',

  "BYJU'S": 'Education',
  'Unacademy': 'Education',
  'Vedantu': 'Education',
  'upGrad': 'Education',

  'Zerodha': 'Investments',
  'Groww': 'Investments',
  'Upstox': 'Investments',
  'Angel One': 'Investments',
  '5paisa': 'Investments',
  'Smallcase': 'Investments',
  'Motilal Oswal': 'Investments',

  'BookMyShow': 'Entertainment',
  'PVR Cinemas': 'Entertainment',
  'INOX': 'Entertainment',
};

const KEYWORD_CATEGORY: Array<{
  keywords: string[];
  category: ExpenseCategory;
}> = [
  {
    keywords: ['salary', 'wage', 'income earned', 'bonus', 'stipend', 'payroll'],
    category: 'Income',
  },
  {
    keywords: ['refund', 'cashback', 'reversal', 'return credit', 'chargeback'],
    category: 'Shopping',
  },
  { keywords: ['interest earned', 'dividend', 'interest credit'], category: 'Investments' },
  {
    keywords: [
      'food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'dining',
      'eat', 'grocery', 'supermarket', 'kitchen', 'bakery', 'sweets',
      'snacks', 'juice', 'dhaba', 'biryani', 'thali',
    ],
    category: 'Food',
  },
  {
    keywords: [
      'hotel', 'flight', 'airline', 'airport', 'travel', 'tour', 'holiday',
      'vacation', 'booking', 'resort', 'lodge', 'hostel', 'cab booking',
    ],
    category: 'Travel',
  },
  {
    keywords: [
      'uber', 'ola', 'metro', 'bus pass', 'train', 'auto', 'cab', 'taxi',
      'fuel', 'petrol', 'diesel', 'parking', 'fastag', 'toll', 'e-way',
    ],
    category: 'Transportation',
  },
  {
    keywords: [
      'electric', 'electricity', 'water bill', 'gas bill', 'broadband',
      'internet bill', 'mobile bill', 'recharge', 'utility', 'emi',
      'loan', 'insurance', 'premium', 'rent', 'maintenance', 'society',
    ],
    category: 'Bills',
  },
  {
    keywords: [
      'netflix', 'spotify', 'youtube', 'subscription', 'monthly plan',
      'annual plan', 'prime video', 'hotstar', 'streaming', 'saas',
      'renewal', 'auto-debit', 'auto debit',
    ],
    category: 'Subscription',
  },
  {
    keywords: [
      'movie', 'cinema', 'pvr', 'inox', 'game', 'gaming', 'concert',
      'event', 'bookmyshow', 'amusement', 'park', 'comedy', 'show',
    ],
    category: 'Entertainment',
  },
  {
    keywords: [
      'hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'health',
      'medical', 'dental', 'apollo', 'medplus', 'pharmeasy', 'diagnostic',
      'lab test', 'pathology', 'nursing',
    ],
    category: 'Healthcare',
  },
  {
    keywords: [
      'school', 'college', 'university', 'course', 'education', 'fee',
      'tuition', 'book', 'udemy', 'coursera', 'byju', 'unacademy',
      'class', 'coaching', 'exam', 'library',
    ],
    category: 'Education',
  },
  {
    keywords: [
      'mutual fund', 'sip', 'stock', 'invest', 'zerodha', 'groww',
      'upstox', 'shares', 'demat', 'nse', 'bse', 'smallcase', 'elss',
      'ppf', 'nps', 'fd', 'fixed deposit', 'rd', 'recurring deposit',
    ],
    category: 'Investments',
  },
  {
    keywords: ['neft', 'imps', 'rtgs', 'transfer', 'send money', 'wallet', 'p2p'],
    category: 'Transfers',
  },
  {
    keywords: [
      'shopping', 'mall', 'store', 'market', 'retail', 'cloth', 'fashion',
      'shoe', 'apparel', 'accessories', 'cosmetics', 'beauty',
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
      ['salary', 'wage', 'income earned', 'bonus', 'stipend', 'payroll'].some(k =>
        combined.includes(k),
      )
    ) {
      return 'Income';
    }
    if (
      ['refund', 'cashback', 'reversal', 'return credit', 'chargeback'].some(k =>
        combined.includes(k),
      )
    ) {
      return 'Shopping';
    }
    if (['interest earned', 'dividend', 'interest credit'].some(k => combined.includes(k))) {
      return 'Investments';
    }
    return 'Income';
  }

  // Check merchant map first
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
