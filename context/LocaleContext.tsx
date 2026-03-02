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

const DEFAULT_RATES: Record<CurrencyKey, number> = {
  GBP: 1, USD: 1.27, EUR: 1.17, JPY: 190.5, AUD: 1.95, CAD: 1.73, CHF: 1.12, AED: 4.67,
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

// ─── Full translations for every screen ───
const T: Record<LanguageKey, Record<string, string>> = {
  en: {
    // Navigation
    home:'Home', stats:'Stats', markets:'Markets', credit:'Credit', more:'More', settings:'Settings',
    // Greetings
    goodMorning:'Good morning', goodAfternoon:'Good afternoon', goodEvening:'Good evening',
    // Home
    netWorth:'NET WORTH', income:'Income', expenses:'Expenses', invested:'Invested',
    recentTransactions:'Recent Transactions', addTransaction:'Add Transaction',
    noTransactions:'No transactions yet', scanReceipt:'Scan Receipt',
    tapToView:'Tap to view cards & investments', tapToHide:'Tap to hide cards & investments',
    upgradeProCards:'Upgrade to Pro to see cards & investments',
    upgradePremiumInvest:'Upgrade to Premium to track investments',
    upgradeRemoveAds:'Upgrade to remove ads', advertisement:'Advertisement',
    searchTransactions:'Search Transactions', longPressDelete:'Long press any item to delete',
    customiseQuickActions:'Customise Quick Actions', chooseShortcuts:'Choose up to 3 shortcuts',
    // Common
    add:'Add', cancel:'Cancel', save:'Save', done:'Done', close:'Close', name:'Name', amount:'Amount',
    category:'Category', all:'All', expense:'Expense', description:'Description', note:'Note',
    // Cards
    cards:'Cards', addCard:'Add Card', bankName:'Bank Name', balance:'Balance', cardType:'Card Type',
    lastFourDigits:'Last 4 digits', cardColour:'Card Colour', noCards:'No cards yet — add one manually',
    // Investments
    investments:'Investments', addInvestment:'Add Investment', details:'Details', currentValue:'Current Value',
    changePercent:'Change %', noInvestments:'No investments yet',
    // Stats
    weekly:'Weekly', monthly:'Monthly', yearly:'Yearly', spent:'Spent', saved:'Saved',
    spendVsIncome:'Spend vs Income', overIncome:'Over income', spentPercent:'spent',
    spendingByCategory:'Spending by Category', categoryShare:'Category Share',
    noDataYet:'No data yet', linkBankOrAdd:'Link your bank or add transactions to see your stats',
    // Calendar
    moneyIn:'Money In', moneyOut:'Money Out', noTransactionsThisDay:'No transactions this day',
    // Goals
    savingGoals:'Saving Goals', totalSaved:'TOTAL SAVED ACROSS ALL GOALS', target:'Target',
    toGo:'to go', overall:'overall', addNewGoal:'Add New Goal', goalName:'Goal Name',
    targetAmount:'Target Amount', alreadySaved:'Already Saved', pickIcon:'Pick Icon', pickColour:'Pick Colour',
    newSavingGoal:'New Saving Goal', upgradeProGoals:'Upgrade to Pro for up to 5 goals',
    upgradePremiumGoals:'Upgrade to Premium for unlimited goals',
    // Assets
    assets:'Assets', netWorthLabel:'NET WORTH', totalAssets:'Total Assets', liabilities:'Liabilities',
    noAssetsYet:'No assets yet', addProperty:'Property', addVehicle:'Vehicle', addOther:'Other',
    estValue:'Est. Value', estMarketValue:'Est. Market Value', outstandingMortgage:'Outstanding Mortgage',
    equity:'Equity', address:'Address / Name', propertyType:'Property Type', make:'Make', model:'Model',
    year:'Year', longPressDeleteAsset:'Long press any custom asset to delete it',
    upgradePremiumAssets:'Upgrade to Premium', assetsDescription:'Track your cards, investments, property and more.',
    // Markets
    liveSignals:'Live signals', pullToRefresh:'Pull to refresh', stocks:'Stocks',
    commodities:'Commodities', crypto:'Crypto', fetchingMarketData:'Fetching live market data...',
    tradingSignals:'Trading Signals', analystForecast:'Analyst Forecast', analystConsensus:'Analyst consensus',
    tapForSignals:'Tap for signals', notFinancialAdvice:'Not Financial Advice',
    notFinancialAdviceDesc:'Trading signals and forecasts shown here are for informational purposes only. Polar Finance is not a financial advisor. Always do your own research before investing. Capital at risk.',
    infoOnly:'For informational purposes only. Not financial advice.',
    strongBuy:'Strong Buy', buy:'Buy', hold:'Hold', sell:'Sell', strongSell:'Strong Sell',
    mktCap:'Mkt Cap', tryAgain:'Try Again',
    upgradePremiumMarkets:'Upgrade to Premium', marketsDescription:'Get live trading signals, analyst forecasts and trending picks.',
    // Credit
    creditScore:'Credit Score', checkFreeScore:'Check your free credit score with a trusted UK provider',
    whyNoScore:'Why we don\'t show your score directly',
    whyNoScoreDesc:'Credit scores are held by Experian, Equifax and TransUnion. Accessing them directly requires FCA authorisation. We recommend these trusted free services instead.',
    freeCreditServices:'Free Credit Score Services', tipsToImprove:'Tips to Improve Your Score',
    checkScoreFree:'Check your score free on',
    // More
    allFeatures:'All your Polar Finance features in one place', features:'Features',
    quickStats:'Quick Stats', transactions:'Transactions', upgradePremium:'Upgrade to Premium',
    unlockFeatures:'Unlock Markets, Assets, custom themes, live trading signals and more.',
    viewPlans:'View Plans', from:'from',
    // Settings
    theme:'Theme', general:'General', about:'About', notifications:'Notifications',
    budgetAlerts:'Budget alerts, reminders & tips', privacyPolicy:'Privacy Policy',
    termsOfService:'Terms of Service', currency:'Currency', privacySecurity:'Privacy & Security',
    backupSync:'Backup & Sync', language:'Language', version:'Version', rateApp:'Rate the App',
    feedback:'Feedback', leaveReview:'Leave a review', sendThoughts:'Send us your thoughts',
    financialDisclaimer:'Financial Disclaimer',
    financialDisclaimerDesc:'Polar Finance is not a financial advisor. Market data and signals are for informational purposes only. Always do your own research. Capital is at risk.',
    logOut:'Log Out', chooseCurrency:'Choose Currency', chooseLanguage:'Choose Language',
    chooseTheme:'Choose Theme', themesLocked:'Themes locked', upgradeProThemes:'Upgrade to Pro to unlock all themes',
    yourPlan:'Your Plan', tapToUpgrade:'Tap to upgrade and unlock all features', allFeaturesUnlocked:'All features unlocked',
    // Paywall
    upgradePolar:'Upgrade Polar', unlockFullExperience:'Unlock the full experience',
    selectPlanAbove:'Select a plan above', subscribeTo:'Subscribe to',
    havePromoCode:'Have a promo code?', enterPromoCode:'Enter Promo Code', apply:'Apply',
    invalidPromoCode:'Invalid promo code. Try again.',
    subscriptionTerms:'Subscriptions auto-renew monthly unless cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID / Google Play account.',
    // Trial
    welcomeToPolar:'Welcome to Polar Finance!',
    trialDescription:'Enjoy full Premium access free for 3 days. No payment required — explore everything the app has to offer.',
    startFreeTrial:'Start 3-Day Free Trial', noCreditCard:'No credit card needed. After 3 days you can choose a plan or continue on Free.',
    trialExpired:'Free trial expired', chooseAPlan:'Choose Pro or Premium to unlock all features',
    // Plan names
    freePlan:'Free', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Premium Trial',
    perMonth:'/mo',
    // Add screen
    recurring:'Recurring Transaction', recurringDesc:'Mark as a monthly recurring payment',
    addExpense:'Add Expense', addIncome:'Add Income', transactionSaved:'Transaction Saved!',
    recentlyAdded:'Recently Added',
  },
  es: {
    home:'Inicio', stats:'Estadísticas', markets:'Mercados', credit:'Crédito', more:'Más', settings:'Ajustes',
    goodMorning:'Buenos días', goodAfternoon:'Buenas tardes', goodEvening:'Buenas noches',
    netWorth:'PATRIMONIO NETO', income:'Ingresos', expenses:'Gastos', invested:'Invertido',
    recentTransactions:'Transacciones Recientes', addTransaction:'Añadir Transacción',
    noTransactions:'Sin transacciones', scanReceipt:'Escanear Recibo',
    searchTransactions:'Buscar Transacciones', longPressDelete:'Mantén pulsado para eliminar',
    add:'Añadir', cancel:'Cancelar', save:'Guardar', done:'Hecho', close:'Cerrar',
    name:'Nombre', amount:'Cantidad', category:'Categoría', all:'Todo', expense:'Gasto',
    description:'Descripción', note:'Nota', cards:'Tarjetas', addCard:'Añadir Tarjeta',
    bankName:'Nombre del Banco', balance:'Saldo', investments:'Inversiones',
    weekly:'Semanal', monthly:'Mensual', yearly:'Anual', spent:'Gastado', saved:'Ahorrado',
    savingGoals:'Objetivos de Ahorro', target:'Objetivo', addNewGoal:'Nuevo Objetivo',
    assets:'Activos', totalAssets:'Activos Totales', liabilities:'Pasivos',
    stocks:'Acciones', commodities:'Materias Primas', crypto:'Cripto',
    creditScore:'Puntuación Crediticia', settings_:'Ajustes',
    theme:'Tema', notifications:'Notificaciones', currency:'Moneda', language:'Idioma',
    logOut:'Cerrar Sesión', perMonth:'/mes', from:'desde',
    advertisement:'Publicidad', upgradeRemoveAds:'Actualiza para eliminar anuncios',
    freePlan:'Gratis', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Prueba Premium',
    startFreeTrial:'Iniciar Prueba Gratuita de 3 Días',
    welcomeToPolar:'¡Bienvenido a Polar Finance!',
    noCreditCard:'Sin tarjeta de crédito. Después de 3 días puedes elegir un plan o continuar gratis.',
  },
  fr: {
    home:'Accueil', stats:'Statistiques', markets:'Marchés', credit:'Crédit', more:'Plus', settings:'Paramètres',
    goodMorning:'Bonjour', goodAfternoon:'Bon après-midi', goodEvening:'Bonsoir',
    netWorth:'VALEUR NETTE', income:'Revenus', expenses:'Dépenses', invested:'Investi',
    recentTransactions:'Transactions Récentes', addTransaction:'Ajouter Transaction',
    noTransactions:'Aucune transaction', scanReceipt:'Scanner Reçu',
    searchTransactions:'Rechercher', longPressDelete:'Appui long pour supprimer',
    add:'Ajouter', cancel:'Annuler', save:'Sauvegarder', done:'Terminé', close:'Fermer',
    name:'Nom', amount:'Montant', category:'Catégorie', all:'Tout', expense:'Dépense',
    description:'Description', note:'Note', cards:'Cartes', addCard:'Ajouter Carte',
    bankName:'Nom de la Banque', balance:'Solde', investments:'Investissements',
    weekly:'Hebdomadaire', monthly:'Mensuel', yearly:'Annuel', spent:'Dépensé', saved:'Épargné',
    savingGoals:'Objectifs d\'Épargne', target:'Objectif', addNewGoal:'Nouvel Objectif',
    assets:'Actifs', totalAssets:'Total Actifs', liabilities:'Passifs',
    stocks:'Actions', commodities:'Matières Premières', crypto:'Crypto',
    creditScore:'Score de Crédit',
    theme:'Thème', notifications:'Notifications', currency:'Devise', language:'Langue',
    logOut:'Déconnexion', perMonth:'/mois', from:'à partir de',
    advertisement:'Publicité', upgradeRemoveAds:'Passez à la version supérieure',
    freePlan:'Gratuit', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Essai Premium',
    startFreeTrial:'Essai Gratuit de 3 Jours',
    welcomeToPolar:'Bienvenue sur Polar Finance!',
    noCreditCard:'Pas de carte requise. Après 3 jours, choisissez un plan ou restez gratuit.',
  },
  de: {
    home:'Startseite', stats:'Statistiken', markets:'Märkte', credit:'Kredit', more:'Mehr', settings:'Einstellungen',
    goodMorning:'Guten Morgen', goodAfternoon:'Guten Tag', goodEvening:'Guten Abend',
    netWorth:'NETTOVERMÖGEN', income:'Einnahmen', expenses:'Ausgaben', invested:'Investiert',
    recentTransactions:'Letzte Transaktionen', addTransaction:'Transaktion Hinzufügen',
    noTransactions:'Keine Transaktionen', scanReceipt:'Beleg Scannen',
    searchTransactions:'Suchen', longPressDelete:'Lange drücken zum Löschen',
    add:'Hinzufügen', cancel:'Abbrechen', save:'Speichern', done:'Fertig', close:'Schließen',
    name:'Name', amount:'Betrag', category:'Kategorie', all:'Alle', expense:'Ausgabe',
    description:'Beschreibung', note:'Notiz', cards:'Karten', addCard:'Karte Hinzufügen',
    bankName:'Bankname', balance:'Kontostand', investments:'Investitionen',
    weekly:'Wöchentlich', monthly:'Monatlich', yearly:'Jährlich', spent:'Ausgegeben', saved:'Gespart',
    savingGoals:'Sparziele', target:'Ziel', addNewGoal:'Neues Ziel',
    assets:'Vermögen', totalAssets:'Gesamtvermögen', liabilities:'Verbindlichkeiten',
    stocks:'Aktien', commodities:'Rohstoffe', crypto:'Krypto',
    creditScore:'Kreditwürdigkeit',
    theme:'Thema', notifications:'Benachrichtigungen', currency:'Währung', language:'Sprache',
    logOut:'Abmelden', perMonth:'/Monat', from:'ab',
    advertisement:'Werbung', upgradeRemoveAds:'Upgrade um Werbung zu entfernen',
    freePlan:'Kostenlos', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Premium-Test',
    startFreeTrial:'3-Tage-Testversion Starten',
    welcomeToPolar:'Willkommen bei Polar Finance!',
    noCreditCard:'Keine Kreditkarte nötig. Nach 3 Tagen wählen Sie einen Plan oder nutzen Sie die Gratisversion.',
  },
  it: {
    home:'Home', stats:'Statistiche', markets:'Mercati', credit:'Credito', more:'Altro', settings:'Impostazioni',
    goodMorning:'Buongiorno', goodAfternoon:'Buon pomeriggio', goodEvening:'Buonasera',
    netWorth:'PATRIMONIO NETTO', income:'Entrate', expenses:'Uscite', invested:'Investito',
    recentTransactions:'Transazioni Recenti', addTransaction:'Aggiungi Transazione',
    noTransactions:'Nessuna transazione', scanReceipt:'Scansiona Ricevuta',
    searchTransactions:'Cerca', longPressDelete:'Tieni premuto per eliminare',
    add:'Aggiungi', cancel:'Annulla', save:'Salva', done:'Fatto', close:'Chiudi',
    name:'Nome', amount:'Importo', category:'Categoria', all:'Tutto', expense:'Spesa',
    cards:'Carte', bankName:'Nome Banca', balance:'Saldo', investments:'Investimenti',
    weekly:'Settimanale', monthly:'Mensile', yearly:'Annuale', spent:'Speso', saved:'Risparmiato',
    savingGoals:'Obiettivi di Risparmio', target:'Obiettivo', addNewGoal:'Nuovo Obiettivo',
    assets:'Beni', stocks:'Azioni', commodities:'Materie Prime', crypto:'Cripto',
    creditScore:'Punteggio di Credito',
    theme:'Tema', notifications:'Notifiche', currency:'Valuta', language:'Lingua',
    logOut:'Esci', perMonth:'/mese', from:'da',
    advertisement:'Pubblicità', freePlan:'Gratis', proPlan:'Pro', premiumPlan:'Premium',
    startFreeTrial:'Prova Gratuita di 3 Giorni', welcomeToPolar:'Benvenuto su Polar Finance!',
  },
  pt: {
    home:'Início', stats:'Estatísticas', markets:'Mercados', credit:'Crédito', more:'Mais', settings:'Configurações',
    goodMorning:'Bom dia', goodAfternoon:'Boa tarde', goodEvening:'Boa noite',
    netWorth:'PATRIMÔNIO LÍQUIDO', income:'Receitas', expenses:'Despesas', invested:'Investido',
    recentTransactions:'Transações Recentes', addTransaction:'Adicionar Transação',
    noTransactions:'Sem transações', scanReceipt:'Digitalizar Recibo',
    searchTransactions:'Pesquisar', longPressDelete:'Pressione para excluir',
    add:'Adicionar', cancel:'Cancelar', save:'Salvar', done:'Concluído', close:'Fechar',
    name:'Nome', amount:'Valor', category:'Categoria', all:'Tudo', expense:'Despesa',
    cards:'Cartões', bankName:'Nome do Banco', balance:'Saldo', investments:'Investimentos',
    weekly:'Semanal', monthly:'Mensal', yearly:'Anual', spent:'Gasto', saved:'Economizado',
    savingGoals:'Metas de Economia', target:'Meta', addNewGoal:'Nova Meta',
    assets:'Ativos', stocks:'Ações', commodities:'Commodities', crypto:'Cripto',
    creditScore:'Pontuação de Crédito',
    theme:'Tema', notifications:'Notificações', currency:'Moeda', language:'Idioma',
    logOut:'Sair', perMonth:'/mês', from:'a partir de',
    freePlan:'Grátis', proPlan:'Pro', premiumPlan:'Premium',
    startFreeTrial:'Teste Grátis de 3 Dias', welcomeToPolar:'Bem-vindo ao Polar Finance!',
  },
  ar: {
    home:'الرئيسية', stats:'الإحصاءات', markets:'الأسواق', credit:'الائتمان', more:'المزيد', settings:'الإعدادات',
    goodMorning:'صباح الخير', goodAfternoon:'مساء الخير', goodEvening:'مساء النور',
    netWorth:'صافي الثروة', income:'الدخل', expenses:'المصروفات', invested:'مستثمر',
    recentTransactions:'المعاملات الأخيرة', addTransaction:'إضافة معاملة',
    noTransactions:'لا توجد معاملات', scanReceipt:'مسح الإيصال',
    searchTransactions:'بحث', longPressDelete:'اضغط مطولاً للحذف',
    add:'إضافة', cancel:'إلغاء', save:'حفظ', done:'تم', close:'إغلاق',
    name:'الاسم', amount:'المبلغ', category:'الفئة', all:'الكل', expense:'مصروف',
    cards:'البطاقات', bankName:'اسم البنك', balance:'الرصيد', investments:'الاستثمارات',
    weekly:'أسبوعي', monthly:'شهري', yearly:'سنوي', spent:'المنفق', saved:'المدخر',
    savingGoals:'أهداف الادخار', target:'الهدف',
    assets:'الأصول', stocks:'الأسهم', commodities:'السلع', crypto:'العملات الرقمية',
    creditScore:'درجة الائتمان',
    theme:'المظهر', notifications:'الإشعارات', currency:'العملة', language:'اللغة',
    logOut:'تسجيل الخروج', perMonth:'/شهر', from:'من',
    freePlan:'مجاني', proPlan:'برو', premiumPlan:'بريميوم',
    startFreeTrial:'ابدأ التجربة المجانية لمدة 3 أيام', welcomeToPolar:'!مرحبا بك في Polar Finance',
  },
  zh: {
    home:'首页', stats:'统计', markets:'市场', credit:'信用', more:'更多', settings:'设置',
    goodMorning:'早上好', goodAfternoon:'下午好', goodEvening:'晚上好',
    netWorth:'净资产', income:'收入', expenses:'支出', invested:'已投资',
    recentTransactions:'最近交易', addTransaction:'添加交易',
    noTransactions:'暂无交易', scanReceipt:'扫描收据',
    searchTransactions:'搜索', longPressDelete:'长按删除',
    add:'添加', cancel:'取消', save:'保存', done:'完成', close:'关闭',
    name:'名称', amount:'金额', category:'类别', all:'全部', expense:'支出',
    cards:'卡片', bankName:'银行名称', balance:'余额', investments:'投资',
    weekly:'每周', monthly:'每月', yearly:'每年', spent:'已花费', saved:'已节省',
    savingGoals:'储蓄目标', target:'目标',
    assets:'资产', stocks:'股票', commodities:'大宗商品', crypto:'加密货币',
    creditScore:'信用评分',
    theme:'主题', notifications:'通知', currency:'货币', language:'语言',
    logOut:'退出', perMonth:'/月', from:'起',
    freePlan:'免费', proPlan:'专业版', premiumPlan:'高级版',
    startFreeTrial:'开始3天免费试用', welcomeToPolar:'欢迎使用 Polar Finance！',
  },
  ja: {
    home:'ホーム', stats:'統計', markets:'市場', credit:'クレジット', more:'もっと', settings:'設定',
    goodMorning:'おはようございます', goodAfternoon:'こんにちは', goodEvening:'こんばんは',
    netWorth:'純資産', income:'収入', expenses:'支出', invested:'投資済み',
    recentTransactions:'最近の取引', addTransaction:'取引を追加',
    noTransactions:'取引なし', scanReceipt:'レシートをスキャン',
    searchTransactions:'検索', longPressDelete:'長押しで削除',
    add:'追加', cancel:'キャンセル', save:'保存', done:'完了', close:'閉じる',
    name:'名前', amount:'金額', category:'カテゴリ', all:'すべて', expense:'支出',
    cards:'カード', bankName:'銀行名', balance:'残高', investments:'投資',
    weekly:'週間', monthly:'月間', yearly:'年間', spent:'支出額', saved:'貯蓄額',
    savingGoals:'貯蓄目標', target:'目標',
    assets:'資産', stocks:'株式', commodities:'商品', crypto:'暗号通貨',
    creditScore:'クレジットスコア',
    theme:'テーマ', notifications:'通知', currency:'通貨', language:'言語',
    logOut:'ログアウト', perMonth:'/月', from:'から',
    freePlan:'無料', proPlan:'プロ', premiumPlan:'プレミアム',
    startFreeTrial:'3日間無料トライアル開始', welcomeToPolar:'Polar Finance へようこそ！',
  },
};

type LocaleContextType = {
  language: LanguageKey;
  currency: CurrencyKey;
  setLanguage: (l: LanguageKey) => void;
  setCurrency: (c: CurrencyKey) => void;
  t: (key: string) => string;
  formatAmount: (amount: number) => string;
  convertPrice: (gbpPrice: number) => string;
  convertRaw: (gbpAmount: number) => number;
  currencySymbol: string;
  isRTL: boolean;
  exchangeRate: number;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageKey>('en');
  const [currency, setCurrencyState] = useState<CurrencyKey>('GBP');
  const [rates, setRates] = useState<Record<CurrencyKey, number>>(DEFAULT_RATES);

  useEffect(() => {
    AsyncStorage.multiGet(['app_language', 'app_currency']).then(pairs => {
      const lang = pairs[0][1] as LanguageKey;
      const curr = pairs[1][1] as CurrencyKey;
      if (lang && LANGUAGES[lang]) setLanguageState(lang);
      if (curr && CURRENCIES[curr]) setCurrencyState(curr);
    });
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/GBP');
        const data = await res.json();
        if (data?.rates) {
          const updated: Record<CurrencyKey, number> = { ...DEFAULT_RATES };
          (Object.keys(DEFAULT_RATES) as CurrencyKey[]).forEach(key => {
            if (data.rates[key]) updated[key] = data.rates[key];
          });
          setRates(updated);
          await AsyncStorage.setItem('cached_rates', JSON.stringify(updated));
        }
      } catch {
        try {
          const cached = await AsyncStorage.getItem('cached_rates');
          if (cached) setRates(JSON.parse(cached));
        } catch {}
      }
    };
    fetchRates();
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
    T[language]?.[key] || T['en']?.[key] || key;

  const exchangeRate = rates[currency] || 1;

  const formatAmount = (amount: number): string => {
    const curr = CURRENCIES[currency];
    const absAmount = Math.abs(amount);
    if (currency === 'JPY') {
      return `${curr.symbol}${Math.round(absAmount).toLocaleString(curr.locale)}`;
    }
    return `${curr.symbol}${absAmount.toLocaleString(curr.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertRaw = (gbpAmount: number): number => gbpAmount * exchangeRate;

  const convertPrice = (gbpPrice: number): string => {
    if (currency === 'GBP') return formatAmount(gbpPrice);
    const converted = gbpPrice * exchangeRate;
    const rounded = currency === 'JPY'
      ? Math.ceil(converted / 100) * 100 - 1
      : Math.ceil(converted) - 0.01;
    return formatAmount(rounded);
  };

  const currencySymbol = CURRENCIES[currency].symbol;
  const isRTL = LANGUAGES[language].rtl;

  return (
    <LocaleContext.Provider value={{
      language, currency, setLanguage, setCurrency,
      t, formatAmount, convertPrice, convertRaw,
      currencySymbol, isRTL, exchangeRate,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}