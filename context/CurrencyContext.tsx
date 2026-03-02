import React, { createContext, useCallback, useContext, useState } from 'react';

export type CurrencyCode = 'GBP' | 'USD' | 'EUR' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'KRW';

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  GBP: { code: 'GBP', symbol: '£',  name: 'British Pound',    locale: 'en-GB', flag: '🇬🇧' },
  USD: { code: 'USD', symbol: '$',  name: 'US Dollar',        locale: 'en-US', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€',  name: 'Euro',             locale: 'de-DE', flag: '🇪🇺' },
  JPY: { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',     locale: 'ja-JP', flag: '🇯🇵' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',  locale: 'en-CA', flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', flag: '🇦🇺' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',      locale: 'de-CH', flag: '🇨🇭' },
  CNY: { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',     locale: 'zh-CN', flag: '🇨🇳' },
  INR: { code: 'INR', symbol: '₹',  name: 'Indian Rupee',     locale: 'en-IN', flag: '🇮🇳' },
  KRW: { code: 'KRW', symbol: '₩',  name: 'South Korean Won', locale: 'ko-KR', flag: '🇰🇷' },
};

type CurrencyContextType = {
  currency: CurrencyInfo;
  setCurrencyCode: (code: CurrencyCode) => void;
  /** Format a number as currency, e.g. £1,234.56 */
  fmt: (amount: number, decimals?: number) => string;
  /** Just the symbol, e.g. £ */
  sym: string;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES.GBP,
  setCurrencyCode: () => {},
  fmt: () => '',
  sym: '£',
});

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [code, setCode] = useState<CurrencyCode>('GBP');
  const currency = CURRENCIES[code];

  const fmt = useCallback(
    (amount: number, decimals?: number) => {
      const d = decimals ?? (currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2);
      return `${currency.symbol}${Math.abs(amount).toLocaleString(currency.locale, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrencyCode: setCode,
        fmt,
        sym: currency.symbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);