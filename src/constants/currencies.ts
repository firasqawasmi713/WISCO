import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    rateToUSD: 1.0,
    position: 'prefix',
    decimalPlaces: 2
  },
  JOD: {
    code: 'JOD',
    symbol: 'JOD',
    name: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    rateToUSD: 1.41,
    position: 'suffix',
    decimalPlaces: 3
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nameAr: 'يورو',
    rateToUSD: 1.08,
    position: 'prefix',
    decimalPlaces: 2
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    nameAr: 'جنيه إسترليني',
    rateToUSD: 1.28,
    position: 'prefix',
    decimalPlaces: 2
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    rateToUSD: 0.272,
    position: 'suffix',
    decimalPlaces: 2
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    rateToUSD: 0.267,
    position: 'suffix',
    decimalPlaces: 2
  },
  KWD: {
    code: 'KWD',
    symbol: 'KWD',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    rateToUSD: 3.25,
    position: 'suffix',
    decimalPlaces: 3
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    nameAr: 'دولار كندي',
    rateToUSD: 0.74,
    position: 'prefix',
    decimalPlaces: 2
  },
  QAR: {
    code: 'QAR',
    symbol: 'QAR',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    rateToUSD: 0.275,
    position: 'suffix',
    decimalPlaces: 2
  },
  BHD: {
    code: 'BHD',
    symbol: 'BHD',
    name: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    rateToUSD: 2.65,
    position: 'suffix',
    decimalPlaces: 3
  },
  OMR: {
    code: 'OMR',
    symbol: 'OMR',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    rateToUSD: 2.60,
    position: 'suffix',
    decimalPlaces: 3
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$',
    name: 'Australian Dollar',
    nameAr: 'دولار أسترالي',
    rateToUSD: 0.65,
    position: 'prefix',
    decimalPlaces: 2
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    nameAr: 'ين ياباني',
    rateToUSD: 0.0066,
    position: 'prefix',
    decimalPlaces: 0
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    nameAr: 'ليرة تركية',
    rateToUSD: 0.031,
    position: 'suffix',
    decimalPlaces: 2
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    nameAr: 'فرنك سويسري',
    rateToUSD: 1.13,
    position: 'prefix',
    decimalPlaces: 2
  },
  EGP: {
    code: 'EGP',
    symbol: 'EGP',
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    rateToUSD: 0.021,
    position: 'suffix',
    decimalPlaces: 2
  }
};

export function formatCurrency(
  amount: number, 
  currencyCode: CurrencyCode = 'USD', 
  isArabic: boolean = false
): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const validAmount = isNaN(amount) ? 0 : amount;
  
  const formattedNum = validAmount.toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces
  });

  const symbol = isArabic ? (config.nameAr.split(' ')[0] || config.symbol) : config.symbol;

  if (config.position === 'prefix') {
    return isArabic ? `${formattedNum} ${symbol}` : `${symbol}${formattedNum}`;
  } else {
    return `${formattedNum} ${symbol}`;
  }
}
