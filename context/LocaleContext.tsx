import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type CurrencyKey = 'GBP' | 'USD' | 'EUR' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'AED';
export type LanguageKey = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ar' | 'zh' | 'ja';

export const CURRENCIES: Record<CurrencyKey, { symbol: string; name: string; flag: string; locale: string }> = {
  GBP: { symbol: '£',   name: 'British Pound',     flag: '🇬🇧', locale: 'en-GB' },
  USD: { symbol: '$',   name: 'US Dollar',          flag: '🇺🇸', locale: 'en-US' },
  EUR: { symbol: '€',   name: 'Euro',               flag: '🇪🇺', locale: 'de-DE' },
  JPY: { symbol: '¥',   name: 'Japanese Yen',       flag: '🇯🇵', locale: 'ja-JP' },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',  flag: '🇦🇺', locale: 'en-AU' },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar',    flag: '🇨🇦', locale: 'en-CA' },
  CHF: { symbol: 'Fr',  name: 'Swiss Franc',        flag: '🇨🇭', locale: 'de-CH' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham',         flag: '🇦🇪', locale: 'ar-AE' },
};

export const LANGUAGES: Record<LanguageKey, { name: string; nativeName: string; flag: string; rtl: boolean }> = {
  en: { name: 'English',              nativeName: 'English',    flag: '🇬🇧', rtl: false },
  es: { name: 'Spanish',              nativeName: 'Español',    flag: '🇪🇸', rtl: false },
  fr: { name: 'French',               nativeName: 'Français',   flag: '🇫🇷', rtl: false },
  de: { name: 'German',               nativeName: 'Deutsch',    flag: '🇩🇪', rtl: false },
  it: { name: 'Italian',              nativeName: 'Italiano',   flag: '🇮🇹', rtl: false },
  pt: { name: 'Portuguese',           nativeName: 'Português',  flag: '🇵🇹', rtl: false },
  ar: { name: 'Arabic',               nativeName: 'العربية',    flag: '🇸🇦', rtl: true  },
  zh: { name: 'Chinese (Simplified)', nativeName: '简体中文',   flag: '🇨🇳', rtl: false },
  ja: { name: 'Japanese',             nativeName: '日本語',     flag: '🇯🇵', rtl: false },
};

const translations: Record<LanguageKey, Record<string, string>> = {
  en: {
    home: 'Home', stats: 'Stats', markets: 'Markets', credit: 'Credit', more: 'More', settings: 'Settings',
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    netWorth: 'NET WORTH', income: 'Income', expenses: 'Expenses', invested: 'Invested',
    recentTransactions: 'Recent Transactions', addTransaction: 'Add Transaction',
    noTransactions: 'No transactions yet', scanReceipt: 'Scan Receipt',
    add: 'Add', cancel: 'Cancel', save: 'Save', done: 'Done', close: 'Close',
    expense: 'Expense', upgrade: 'Upgrade to Pro', name: 'Name', amount: 'Amount',
    category: 'Category', bankName: 'Bank Name', balance: 'Balance',
    cards: 'Cards', investments: 'Investments', addCard: 'Add Card',
    longPressDelete: 'Long press any item to delete',
    searchTransactions: 'Search Transactions', all: 'All',
  },
  es: {
    home: 'Inicio', stats: 'Estadísticas', markets: 'Mercados', credit: 'Crédito', more: 'Más', settings: 'Ajustes',
    goodMorning: 'Buenos días', goodAfternoon: 'Buenas tardes', goodEvening: 'Buenas noches',
    netWorth: 'PATRIMONIO NETO', income: 'Ingresos', expenses: 'Gastos', invested: 'Invertido',
    recentTransactions: 'Transacciones Recientes', addTransaction: 'Añadir Transacción',
    noTransactions: 'Sin transacciones', scanReceipt: 'Escanear Recibo',
    add: 'Añadir', cancel: 'Cancelar', save: 'Guardar', done: 'Hecho', close: 'Cerrar',
    expense: 'Gasto', upgrade: 'Actualizar a Pro', name: 'Nombre', amount: 'Cantidad',
    category: 'Categoría', bankName: 'Nombre del Banco', balance: 'Saldo',
    cards: 'Tarjetas', investments: 'Inversiones', addCard: 'Añadir Tarjeta',
    longPressDelete: 'Mantén pulsado para eliminar',
    searchTransactions: 'Buscar Transacciones', all: 'Todo',
  },
  fr: {
    home: 'Accueil', stats: 'Statistiques', markets: 'Marchés', credit: 'Crédit', more: 'Plus', settings: 'Paramètres',
    goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir',
    netWorth: 'VALEUR NETTE', income: 'Revenus', expenses: 'Dépenses', invested: 'Investi',
    recentTransactions: 'Transactions Récentes', addTransaction: 'Ajouter Transaction',
    noTransactions: 'Aucune transaction', scanReceipt: 'Scanner Reçu',
    add: 'Ajouter', cancel: 'Annuler', save: 'Sauvegarder', done: 'Terminé', close: 'Fermer',
    expense: 'Dépense', upgrade: 'Passer à Pro', name: 'Nom', amount: 'Montant',
    category: 'Catégorie', bankName: 'Nom de la Banque', balance: 'Solde',
    cards: 'Cartes', investments: 'Investissements', addCard: 'Ajouter Carte',
    longPressDelete: 'Appui long pour supprimer',
    searchTransactions: 'Rechercher Transactions', all: 'Tout',
  },
  de: {
    home: 'Startseite', stats: 'Statistiken', markets: 'Märkte', credit: 'Kredit', more: 'Mehr', settings: 'Einstellungen',
    goodMorning: 'Guten Morgen', goodAfternoon: 'Guten Tag', goodEvening: 'Guten Abend',
    netWorth: 'NETTOVERMÖGEN', income: 'Einnahmen', expenses: 'Ausgaben', invested: 'Investiert',
    recentTransactions: 'Letzte Transaktionen', addTransaction: 'Transaktion Hinzufügen',
    noTransactions: 'Keine Transaktionen', scanReceipt: 'Beleg Scannen',
    add: 'Hinzufügen', cancel: 'Abbrechen', save: 'Speichern', done: 'Fertig', close: 'Schließen',
    expense: 'Ausgabe', upgrade: 'Auf Pro upgraden', name: 'Name', amount: 'Betrag',
    category: 'Kategorie', bankName: 'Bankname', balance: 'Kontostand',
    cards: 'Karten', investments: 'Investitionen', addCard: 'Karte Hinzufügen',
    longPressDelete: 'Lange drücken zum Löschen',
    searchTransactions: 'Transaktionen Suchen', all: 'Alle',
  },
  it: {
    home: 'Home', stats: 'Statistiche', markets: 'Mercati', credit: 'Credito', more: 'Altro', settings: 'Impostazioni',
    goodMorning: 'Buongiorno', goodAfternoon: 'Buon pomeriggio', goodEvening: 'Buonasera',
    netWorth: 'PATRIMONIO NETTO', income: 'Entrate', expenses: 'Uscite', invested: 'Investito',
    recentTransactions: 'Transazioni Recenti', addTransaction: 'Aggiungi Transazione',
    noTransactions: 'Nessuna transazione', scanReceipt: 'Scansiona Ricevuta',
    add: 'Aggiungi', cancel: 'Annulla', save: 'Salva', done: 'Fatto', close: 'Chiudi',
    expense: 'Spesa', upgrade: 'Passa a Pro', name: 'Nome', amount: 'Importo',
    category: 'Categoria', bankName: 'Nome Banca', balance: 'Saldo',
    cards: 'Carte', investments: 'Investimenti', addCard: 'Aggiungi Carta',
    longPressDelete: 'Tieni premuto per eliminare',
    searchTransactions: 'Cerca Transazioni', all: 'Tutto',
  },
  pt: {
    home: 'Início', stats: 'Estatísticas', markets: 'Mercados', credit: 'Crédito', more: 'Mais', settings: 'Configurações',
    goodMorning: 'Bom dia', goodAfternoon: 'Boa tarde', goodEvening: 'Boa noite',
    netWorth: 'PATRIMÔNIO LÍQUIDO', income: 'Receitas', expenses: 'Despesas', invested: 'Investido',
    recentTransactions: 'Transações Recentes', addTransaction: 'Adicionar Transação',
    noTransactions: 'Sem transações', scanReceipt: 'Digitalizar Recibo',
    add: 'Adicionar', cancel: 'Cancelar', save: 'Salvar', done: 'Concluído', close: 'Fechar',
    expense: 'Despesa', upgrade: 'Atualizar para Pro', name: 'Nome', amount: 'Valor',
    category: 'Categoria', bankName: 'Nome do Banco', balance: 'Saldo',
    cards: 'Cartões', investments: 'Investimentos', addCard: 'Adicionar Cartão',
    longPressDelete: 'Pressione longamente para excluir',
    searchTransactions: 'Pesquisar Transações', all: 'Tudo',
  },
  ar: {
    home: 'الرئيسية', stats: 'الإحصاءات', markets: 'الأسواق', credit: 'الائتمان', more: 'المزيد', settings: 'الإعدادات',
    goodMorning: 'صباح الخير', goodAfternoon: 'مساء الخير', goodEvening: 'مساء النور',
    netWorth: 'صافي الثروة', income: 'الدخل', expenses: 'المصروفات', invested: 'مستثمر',
    recentTransactions: 'المعاملات الأخيرة', addTransaction: 'إضافة معاملة',
    noTransactions: 'لا توجد معاملات', scanReceipt: 'مسح الإيصال',
    add: 'إضافة', cancel: 'إلغاء', save: 'حفظ', done: 'تم', close: 'إغلاق',
    expense: 'مصروف', upgrade: 'الترقية إلى برو', name: 'الاسم', amount: 'المبلغ',
    category: 'الفئة', bankName: 'اسم البنك', balance: 'الرصيد',
    cards: 'البطاقات', investments: 'الاستثمارات', addCard: 'إضافة بطاقة',
    longPressDelete: 'اضغط مطولاً للحذف',
    searchTransactions: 'البحث في المعاملات', all: 'الكل',
  },
  zh: {
    home: '首页', stats: '统计', markets: '市场', credit: '信用', more: '更多', settings: '设置',
    goodMorning: '早上好', goodAfternoon: '下午好', goodEvening: '晚上好',
    netWorth: '净资产', income: '收入', expenses: '支出', invested: '已投资',
    recentTransactions: '最近交易', addTransaction: '添加交易',
    noTransactions: '暂无交易', scanReceipt: '扫描收据',
    add: '添加', cancel: '取消', save: '保存', done: '完成', close: '关闭',
    expense: '支出', upgrade: '升级到专业版', name: '名称', amount: '金额',
    category: '类别', bankName: '银行名称', balance: '余额',
    cards: '卡片', investments: '投资', addCard: '添加卡片',
    longPressDelete: '长按删除',
    searchTransactions: '搜索交易', all: '全部',
  },
  ja: {
    home: 'ホーム', stats: '統計', markets: '市場', credit: 'クレジット', more: 'もっと', settings: '設定',
    goodMorning: 'おはようございます', goodAfternoon: 'こんにちは', goodEvening: 'こんばんは',
    netWorth: '純資産', income: '収入', expenses: '支出', invested: '投資済み',
    recentTransactions: '最近の取引', addTransaction: '取引を追加',
    noTransactions: '取引なし', scanReceipt: 'レシートをスキャン',
    add: '追加', cancel: 'キャンセル', save: '保存', done: '完了', close: '閉じる',
    expense: '支出', upgrade: 'プロにアップグレード', name: '名前', amount: '金額',
    category: 'カテゴリ', bankName: '銀行名', balance: '残高',
    cards: 'カード', investments: '投資', addCard: 'カードを追加',
    longPressDelete: '長押しで削除',
    searchTransactions: '取引を検索', all: 'すべて',
  },
};

type LocaleContextType = {
  language: LanguageKey;
  currency: CurrencyKey;
  setLanguage: (l: LanguageKey) => void;
  setCurrency: (c: CurrencyKey) => void;
  t: (key: string) => string;
  formatAmount: (amount: number) => string;
  currencySymbol: string;
  isRTL: boolean;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageKey>('en');
  const [currency, setCurrencyState] = useState<CurrencyKey>('GBP');

  useEffect(() => {
    AsyncStorage.multiGet(['app_language', 'app_currency']).then(pairs => {
      const lang = pairs[0][1] as LanguageKey;
      const curr = pairs[1][1] as CurrencyKey;
      if (lang && LANGUAGES[lang]) setLanguageState(lang);
      if (curr && CURRENCIES[curr]) setCurrencyState(curr);
    });
  }, []);

  const setLanguage = async (l: LanguageKey) => {
    setLanguageState(l);
    await AsyncStorage.setItem('app_language', l);
  };

  const setCurrency = async (c: CurrencyKey) => {
    setCurrencyState(c);
    await AsyncStorage.setItem('app_currency', c);
  };

  const t = (key: string): string =>
    translations[language]?.[key] || translations['en']?.[key] || key;

  const formatAmount = (amount: number): string => {
    const curr = CURRENCIES[currency];
    const absAmount = Math.abs(amount);
    if (currency === 'JPY') {
      return `${curr.symbol}${Math.round(absAmount).toLocaleString(curr.locale)}`;
    }
    return `${curr.symbol}${absAmount.toLocaleString(curr.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currencySymbol = CURRENCIES[currency].symbol;
  const isRTL = LANGUAGES[language].rtl;

  return (
    <LocaleContext.Provider value={{ language, currency, setLanguage, setCurrency, t, formatAmount, currencySymbol, isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}