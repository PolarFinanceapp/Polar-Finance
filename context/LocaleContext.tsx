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
  en: { name: 'English',              nativeName: 'English',   flag: '🇬🇧', rtl: false },
  es: { name: 'Spanish',              nativeName: 'Español',   flag: '🇪🇸', rtl: false },
  fr: { name: 'French',               nativeName: 'Français',  flag: '🇫🇷', rtl: false },
  de: { name: 'German',               nativeName: 'Deutsch',   flag: '🇩🇪', rtl: false },
  it: { name: 'Italian',              nativeName: 'Italiano',  flag: '🇮🇹', rtl: false },
  pt: { name: 'Portuguese',           nativeName: 'Português', flag: '🇵🇹', rtl: false },
  ar: { name: 'Arabic',               nativeName: 'العربية',   flag: '🇸🇦', rtl: true  },
  zh: { name: 'Chinese (Simplified)', nativeName: '简体中文',  flag: '🇨🇳', rtl: false },
  ja: { name: 'Japanese',             nativeName: '日本語',    flag: '🇯🇵', rtl: false },
};

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
    edit:'Edit',
    // Common
    add:'Add', cancel:'Cancel', save:'Save', done:'Done', close:'Close', name:'Name', amount:'Amount',
    category:'Category', all:'All', expense:'Expense', description:'Description', note:'Note',
    of:'of',
    // Cards
    cards:'Cards', addCard:'Add Card', bankName:'Bank Name', balance:'Balance', cardType:'Card Type',
    lastFourDigits:'Last 4 digits', cardColour:'Card Colour', noCards:'No cards yet — add one manually',
    // Investments
    investments:'Investments', addInvestment:'Add Investment', details:'Details', currentValue:'Current Value',
    changePercent:'Change %', noInvestments:'No investments yet',
    // Stats
    weekly:'Weekly', monthly:'Monthly', yearly:'Yearly', spent:'Spent', saved:'Saved',
    overspent:'Overspent', deficit:'Deficit',
    spendVsIncome:'Spend vs Income', overIncome:'Over income', spentPercent:'spent',
    spendingByCategory:'Spending by Category', categoryShare:'Category Share',
    noDataYet:'No data yet', linkBankOrAdd:'Link your bank or add transactions to see your stats',
    upgrade:'Upgrade',
    // Calendar
    calendar:'Calendar', calendarDescription:'View your transactions by date',
    moneyIn:'Money In', moneyOut:'Money Out', noTransactionsThisDay:'No transactions this day',
    // Goals
    savingGoals:'Saving Goals', goalsDescription:'Track and manage your saving goals',
    totalSaved:'TOTAL SAVED ACROSS ALL GOALS', target:'Target',
    toGo:'to go', overall:'overall', addNewGoal:'Add New Goal', goalName:'Goal Name',
    targetAmount:'Target Amount', alreadySaved:'Already Saved', pickIcon:'Pick Icon', pickColour:'Pick Colour',
    newSavingGoal:'New Saving Goal', upgradeProGoals:'Upgrade to Pro for up to 5 goals',
    upgradePremiumGoals:'Upgrade to Premium for unlimited goals',
    noGoalsYet:'No goals yet', addFirstGoal:'Add your first saving goal to get started',
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
    tipPayOnTime:'Pay all bills on time — payment history is the biggest factor',
    tipKeepBelow30:'Keep credit card usage below 30% of your total limit',
    tipAvoidMultiple:'Avoid applying for multiple credit products in a short period',
    tipElectoralRoll:'Register on the electoral roll at your current address',
    tipKeepOldAccounts:'Keep old accounts open — longer credit history helps your score',
    // More
    allFeatures:'All your Polar Finance features in one place', features:'Features',
    quickStats:'Quick Stats', transactions:'Transactions', upgradePremium:'Upgrade to Premium',
    unlockFeatures:'Unlock Markets, Assets, custom themes, live trading signals and more.',
    viewPlans:'View Plans', from:'from',
    // Coming Soon
    comingSoon:'Coming Soon', comingSoonSub:'Exciting features on the way',
    comingSoonBankSync:'Bank Sync', comingSoonBankSyncDesc:'Automatically import transactions from your bank via Open Banking.',
    comingSoonBudgets:'Smart Budgets', comingSoonBudgetsDesc:'Set monthly spending limits per category with alerts when you\'re close.',
    comingSoonTaxReport:'Tax Report Export', comingSoonTaxReportDesc:'Export a full income & expense report ready for your tax return.',
    comingSoonShared:'Shared Finances', comingSoonSharedDesc:'Share a budget and track expenses together with a partner or family.',
    comingSoonWidgets:'Home Screen Widgets', comingSoonWidgetsDesc:'See your balance and recent transactions right from your home screen.',
    comingSoonAIInsights:'AI Spending Insights', comingSoonAIInsightsDesc:'Get personalised tips based on your spending patterns powered by AI.',
    // Income / Salary
    myIncome:'My Income', incomeSetup:'Income Setup', salaryLabel:'Salary / Income',
    salaryAmount:'Monthly Take-Home', salarySource:'Income Source', paydayLabel:'Payday',
    paydayDay:'Day of Month Paid', nextPayday:'Next Payday',
    noIncomeSet:'No income set up yet', addIncomePrompt:'Add your salary to track how much you have left to spend.',
    addIncomeSource:'Add Income Source', editIncome:'Edit Income',
    incomeSource:'Source', incomeFrequency:'Pay Frequency',
    leftToSpend:'Left to Spend', leftToSpendDesc:'After bills & expenses this month',
    incomeAdded:'Income saved!',
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
    startFreeTrial:'Start 3-Day Free Trial',
    noCreditCard:'No credit card needed. After 3 days you can choose a plan or continue on Free.',
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
    edit:'Editar',
    add:'Añadir', cancel:'Cancelar', save:'Guardar', done:'Hecho', close:'Cerrar',
    name:'Nombre', amount:'Cantidad', category:'Categoría', all:'Todo', expense:'Gasto',
    description:'Descripción', note:'Nota', of:'de', balance:'Saldo',
    cards:'Tarjetas', addCard:'Añadir Tarjeta', bankName:'Nombre del Banco',
    investments:'Inversiones', addInvestment:'Añadir Inversión',
    weekly:'Semanal', monthly:'Mensual', yearly:'Anual', spent:'Gastado', saved:'Ahorrado',
    overspent:'Gastado de más', deficit:'Déficit',
    savingGoals:'Objetivos de Ahorro', goalsDescription:'Seguimiento de tus objetivos de ahorro',
    target:'Objetivo', addNewGoal:'Nuevo Objetivo', noGoalsYet:'Sin objetivos aún',
    addFirstGoal:'Añade tu primer objetivo de ahorro',
    assets:'Activos', totalAssets:'Activos Totales', liabilities:'Pasivos',
    calendar:'Calendario', calendarDescription:'Ver transacciones por fecha',
    stocks:'Acciones', commodities:'Materias Primas', crypto:'Cripto',
    creditScore:'Puntuación Crediticia',
    tipPayOnTime:'Paga todas las facturas a tiempo', tipKeepBelow30:'Mantén el uso de la tarjeta por debajo del 30%',
    tipAvoidMultiple:'Evita solicitar múltiples productos de crédito', tipElectoralRoll:'Regístrate en el censo electoral',
    tipKeepOldAccounts:'Mantén las cuentas antiguas abiertas',
    theme:'Tema', notifications:'Notificaciones', currency:'Moneda', language:'Idioma',
    logOut:'Cerrar Sesión', perMonth:'/mes', from:'desde', upgrade:'Mejorar',
    advertisement:'Publicidad', upgradeRemoveAds:'Actualiza para eliminar anuncios',
    freePlan:'Gratis', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Prueba Premium',
    startFreeTrial:'Iniciar Prueba Gratuita de 3 Días',
    welcomeToPolar:'¡Bienvenido a Polar Finance!',
    noCreditCard:'Sin tarjeta de crédito. Después de 3 días puedes elegir un plan.',
    allFeatures:'Todas tus funciones de Polar Finance', features:'Funciones',
    quickStats:'Estadísticas Rápidas', transactions:'Transacciones',
    viewPlans:'Ver Planes', yourPlan:'Tu Plan', tapToUpgrade:'Toca para mejorar',
    upgradePremium:'Actualizar a Premium', unlockFeatures:'Desbloquea mercados, activos y más.',
    comingSoon:'Próximamente', comingSoonSub:'Nuevas funciones en camino',
    comingSoonBankSync:'Sincronización Bancaria', comingSoonBankSyncDesc:'Importa transacciones automáticamente desde tu banco.',
    comingSoonBudgets:'Presupuestos Inteligentes', comingSoonBudgetsDesc:'Establece límites de gasto mensuales por categoría.',
    comingSoonTaxReport:'Informe Fiscal', comingSoonTaxReportDesc:'Exporta un informe completo de ingresos y gastos para tu declaración.',
    comingSoonShared:'Finanzas Compartidas', comingSoonSharedDesc:'Comparte un presupuesto con tu pareja o familia.',
    comingSoonWidgets:'Widgets de Pantalla', comingSoonWidgetsDesc:'Ve tu saldo desde la pantalla de inicio.',
    comingSoonAIInsights:'Insights de IA', comingSoonAIInsightsDesc:'Consejos personalizados basados en tus patrones de gasto.',
    myIncome:'Mis Ingresos', incomeSetup:'Configuración de Ingresos', salaryLabel:'Salario / Ingresos',
    salaryAmount:'Salario Neto Mensual', salarySource:'Fuente de Ingresos', paydayLabel:'Día de Pago',
    paydayDay:'Día del Mes', nextPayday:'Próximo Pago',
    noIncomeSet:'Sin ingresos configurados', addIncomePrompt:'Añade tu salario para saber cuánto te queda.',
    addIncomeSource:'Añadir Fuente de Ingresos', editIncome:'Editar Ingresos',
    incomeSource:'Fuente', incomeFrequency:'Frecuencia de Pago',
    leftToSpend:'Disponible', leftToSpendDesc:'Después de facturas y gastos este mes',
    incomeAdded:'¡Ingresos guardados!',
  },
  fr: {
    home:'Accueil', stats:'Statistiques', markets:'Marchés', credit:'Crédit', more:'Plus', settings:'Paramètres',
    goodMorning:'Bonjour', goodAfternoon:'Bon après-midi', goodEvening:'Bonsoir',
    netWorth:'VALEUR NETTE', income:'Revenus', expenses:'Dépenses', invested:'Investi',
    recentTransactions:'Transactions Récentes', addTransaction:'Ajouter Transaction',
    noTransactions:'Aucune transaction', scanReceipt:'Scanner Reçu',
    searchTransactions:'Rechercher', longPressDelete:'Appui long pour supprimer',
    edit:'Modifier',
    add:'Ajouter', cancel:'Annuler', save:'Sauvegarder', done:'Terminé', close:'Fermer',
    name:'Nom', amount:'Montant', category:'Catégorie', all:'Tout', expense:'Dépense',
    description:'Description', note:'Note', of:'de', balance:'Solde',
    cards:'Cartes', addCard:'Ajouter Carte', bankName:'Nom de la Banque',
    investments:'Investissements', addInvestment:'Ajouter Investissement',
    weekly:'Hebdomadaire', monthly:'Mensuel', yearly:'Annuel', spent:'Dépensé', saved:'Épargné',
    overspent:'Dépassement', deficit:'Déficit',
    savingGoals:'Objectifs d\'Épargne', goalsDescription:'Suivez vos objectifs d\'épargne',
    target:'Objectif', addNewGoal:'Nouvel Objectif', noGoalsYet:'Aucun objectif',
    addFirstGoal:'Ajoutez votre premier objectif d\'épargne',
    assets:'Actifs', totalAssets:'Total Actifs', liabilities:'Passifs',
    calendar:'Calendrier', calendarDescription:'Voir les transactions par date',
    stocks:'Actions', commodities:'Matières Premières', crypto:'Crypto',
    creditScore:'Score de Crédit',
    tipPayOnTime:'Payez toutes vos factures à temps', tipKeepBelow30:'Gardez l\'utilisation sous 30%',
    tipAvoidMultiple:'Évitez les multiples demandes de crédit', tipElectoralRoll:'Inscrivez-vous sur les listes électorales',
    tipKeepOldAccounts:'Gardez vos anciens comptes ouverts',
    theme:'Thème', notifications:'Notifications', currency:'Devise', language:'Langue',
    logOut:'Déconnexion', perMonth:'/mois', from:'à partir de', upgrade:'Améliorer',
    advertisement:'Publicité', upgradeRemoveAds:'Passez à la version supérieure',
    freePlan:'Gratuit', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Essai Premium',
    startFreeTrial:'Essai Gratuit de 3 Jours',
    welcomeToPolar:'Bienvenue sur Polar Finance!',
    noCreditCard:'Pas de carte requise. Après 3 jours, choisissez un plan.',
    allFeatures:'Toutes vos fonctionnalités Polar Finance', features:'Fonctionnalités',
    quickStats:'Stats Rapides', transactions:'Transactions',
    viewPlans:'Voir les Plans', yourPlan:'Votre Plan', tapToUpgrade:'Appuyez pour améliorer',
    upgradePremium:'Passer à Premium', unlockFeatures:'Débloquez les marchés, actifs et plus.',
    comingSoon:'Bientôt disponible', comingSoonSub:'De nouvelles fonctionnalités arrivent',
    comingSoonBankSync:'Synchronisation Bancaire', comingSoonBankSyncDesc:'Importez automatiquement vos transactions bancaires.',
    comingSoonBudgets:'Budgets Intelligents', comingSoonBudgetsDesc:'Fixez des limites de dépenses mensuelles par catégorie.',
    comingSoonTaxReport:'Rapport Fiscal', comingSoonTaxReportDesc:'Exportez un rapport complet pour votre déclaration.',
    comingSoonShared:'Finances Partagées', comingSoonSharedDesc:'Partagez un budget avec votre partenaire ou famille.',
    comingSoonWidgets:'Widgets d\'Écran', comingSoonWidgetsDesc:'Voir votre solde depuis l\'écran d\'accueil.',
    comingSoonAIInsights:'Insights IA', comingSoonAIInsightsDesc:'Conseils personnalisés basés sur vos habitudes de dépenses.',
    myIncome:'Mes Revenus', incomeSetup:'Configuration des Revenus', salaryLabel:'Salaire / Revenus',
    salaryAmount:'Salaire Net Mensuel', salarySource:'Source de Revenus', paydayLabel:'Jour de Paie',
    paydayDay:'Jour du Mois', nextPayday:'Prochain Paiement',
    noIncomeSet:'Aucun revenu configuré', addIncomePrompt:'Ajoutez votre salaire pour suivre ce qu\'il vous reste.',
    addIncomeSource:'Ajouter Source de Revenus', editIncome:'Modifier les Revenus',
    incomeSource:'Source', incomeFrequency:'Fréquence de Paiement',
    leftToSpend:'Disponible', leftToSpendDesc:'Après factures et dépenses ce mois-ci',
    incomeAdded:'Revenus enregistrés!',
  },
  de: {
    home:'Startseite', stats:'Statistiken', markets:'Märkte', credit:'Kredit', more:'Mehr', settings:'Einstellungen',
    goodMorning:'Guten Morgen', goodAfternoon:'Guten Tag', goodEvening:'Guten Abend',
    netWorth:'NETTOVERMÖGEN', income:'Einnahmen', expenses:'Ausgaben', invested:'Investiert',
    recentTransactions:'Letzte Transaktionen', addTransaction:'Transaktion Hinzufügen',
    noTransactions:'Keine Transaktionen', scanReceipt:'Beleg Scannen',
    searchTransactions:'Suchen', longPressDelete:'Lange drücken zum Löschen',
    edit:'Bearbeiten',
    add:'Hinzufügen', cancel:'Abbrechen', save:'Speichern', done:'Fertig', close:'Schließen',
    name:'Name', amount:'Betrag', category:'Kategorie', all:'Alle', expense:'Ausgabe',
    description:'Beschreibung', note:'Notiz', of:'von', balance:'Kontostand',
    cards:'Karten', addCard:'Karte Hinzufügen', bankName:'Bankname',
    investments:'Investitionen', addInvestment:'Investition Hinzufügen',
    weekly:'Wöchentlich', monthly:'Monatlich', yearly:'Jährlich', spent:'Ausgegeben', saved:'Gespart',
    overspent:'Überschritten', deficit:'Defizit',
    savingGoals:'Sparziele', goalsDescription:'Sparziele verfolgen und verwalten',
    target:'Ziel', addNewGoal:'Neues Ziel', noGoalsYet:'Noch keine Ziele',
    addFirstGoal:'Füge dein erstes Sparziel hinzu',
    assets:'Vermögen', totalAssets:'Gesamtvermögen', liabilities:'Verbindlichkeiten',
    calendar:'Kalender', calendarDescription:'Transaktionen nach Datum anzeigen',
    stocks:'Aktien', commodities:'Rohstoffe', crypto:'Krypto',
    creditScore:'Kreditwürdigkeit',
    tipPayOnTime:'Zahle alle Rechnungen pünktlich', tipKeepBelow30:'Halte die Kartennutzung unter 30%',
    tipAvoidMultiple:'Vermeide mehrere Kreditanfragen', tipElectoralRoll:'Melde dich im Wählerverzeichnis an',
    tipKeepOldAccounts:'Behalte alte Konten offen',
    theme:'Thema', notifications:'Benachrichtigungen', currency:'Währung', language:'Sprache',
    logOut:'Abmelden', perMonth:'/Monat', from:'ab', upgrade:'Upgraden',
    advertisement:'Werbung', upgradeRemoveAds:'Upgrade um Werbung zu entfernen',
    freePlan:'Kostenlos', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Premium-Test',
    startFreeTrial:'3-Tage-Testversion Starten',
    welcomeToPolar:'Willkommen bei Polar Finance!',
    noCreditCard:'Keine Kreditkarte nötig. Nach 3 Tagen wählen Sie einen Plan.',
    allFeatures:'Alle Polar Finance Funktionen', features:'Funktionen',
    quickStats:'Schnellstatistiken', transactions:'Transaktionen',
    viewPlans:'Pläne Anzeigen', yourPlan:'Ihr Plan', tapToUpgrade:'Tippen zum Upgraden',
    upgradePremium:'Auf Premium upgraden', unlockFeatures:'Schalte Märkte, Vermögen und mehr frei.',
    comingSoon:'Demnächst', comingSoonSub:'Spannende neue Funktionen kommen bald',
    comingSoonBankSync:'Banksynchronisation', comingSoonBankSyncDesc:'Importiere automatisch Transaktionen von deiner Bank.',
    comingSoonBudgets:'Intelligente Budgets', comingSoonBudgetsDesc:'Setze monatliche Ausgabenlimits pro Kategorie.',
    comingSoonTaxReport:'Steuerbericht', comingSoonTaxReportDesc:'Exportiere einen vollständigen Bericht für deine Steuererklärung.',
    comingSoonShared:'Gemeinsame Finanzen', comingSoonSharedDesc:'Teile ein Budget mit deinem Partner oder deiner Familie.',
    comingSoonWidgets:'Startbildschirm-Widgets', comingSoonWidgetsDesc:'Sieh dein Guthaben direkt vom Startbildschirm.',
    comingSoonAIInsights:'KI-Einblicke', comingSoonAIInsightsDesc:'Personalisierte Tipps basierend auf deinen Ausgaben.',
    myIncome:'Mein Einkommen', incomeSetup:'Einkommenseinstellung', salaryLabel:'Gehalt / Einkommen',
    salaryAmount:'Monatliches Nettoeinkommen', salarySource:'Einkommensquelle', paydayLabel:'Zahltag',
    paydayDay:'Tag des Monats', nextPayday:'Nächste Zahlung',
    noIncomeSet:'Kein Einkommen eingerichtet', addIncomePrompt:'Füge dein Gehalt hinzu um zu sehen wie viel du übrig hast.',
    addIncome:'Einkommensquelle Hinzufügen', editIncome:'Einkommen Bearbeiten',
    incomeSource:'Quelle', incomeFrequency:'Zahlungsfrequenz',
    leftToSpend:'Verfügbar', leftToSpendDesc:'Nach Rechnungen und Ausgaben diesen Monat',
    incomeAdded:'Einkommen gespeichert!',
  },
  it: {
    home:'Home', stats:'Statistiche', markets:'Mercati', credit:'Credito', more:'Altro', settings:'Impostazioni',
    goodMorning:'Buongiorno', goodAfternoon:'Buon pomeriggio', goodEvening:'Buonasera',
    netWorth:'PATRIMONIO NETTO', income:'Entrate', expenses:'Uscite', invested:'Investito',
    recentTransactions:'Transazioni Recenti', addTransaction:'Aggiungi Transazione',
    noTransactions:'Nessuna transazione', scanReceipt:'Scansiona Ricevuta',
    searchTransactions:'Cerca', longPressDelete:'Tieni premuto per eliminare',
    edit:'Modifica',
    add:'Aggiungi', cancel:'Annulla', save:'Salva', done:'Fatto', close:'Chiudi',
    name:'Nome', amount:'Importo', category:'Categoria', all:'Tutto', expense:'Spesa',
    description:'Descrizione', note:'Nota', of:'di', balance:'Saldo',
    cards:'Carte', addCard:'Aggiungi Carta', bankName:'Nome Banca',
    investments:'Investimenti', addInvestment:'Aggiungi Investimento',
    weekly:'Settimanale', monthly:'Mensile', yearly:'Annuale', spent:'Speso', saved:'Risparmiato',
    overspent:'Speso troppo', deficit:'Deficit',
    savingGoals:'Obiettivi di Risparmio', goalsDescription:'Tieni traccia dei tuoi obiettivi',
    target:'Obiettivo', addNewGoal:'Nuovo Obiettivo', noGoalsYet:'Nessun obiettivo',
    addFirstGoal:'Aggiungi il tuo primo obiettivo di risparmio',
    assets:'Beni', totalAssets:'Totale Beni', liabilities:'Passività',
    calendar:'Calendario', calendarDescription:'Visualizza transazioni per data',
    stocks:'Azioni', commodities:'Materie Prime', crypto:'Cripto',
    creditScore:'Punteggio di Credito',
    tipPayOnTime:'Paga tutte le bollette in tempo', tipKeepBelow30:'Mantieni l\'utilizzo sotto il 30%',
    tipAvoidMultiple:'Evita più richieste di credito', tipElectoralRoll:'Registrati nelle liste elettorali',
    tipKeepOldAccounts:'Mantieni i vecchi conti aperti',
    theme:'Tema', notifications:'Notifiche', currency:'Valuta', language:'Lingua',
    logOut:'Esci', perMonth:'/mese', from:'da', upgrade:'Aggiorna',
    advertisement:'Pubblicità', upgradeRemoveAds:'Aggiorna per rimuovere annunci',
    freePlan:'Gratis', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Prova Premium',
    startFreeTrial:'Prova Gratuita di 3 Giorni',
    welcomeToPolar:'Benvenuto su Polar Finance!',
    noCreditCard:'Nessuna carta richiesta. Dopo 3 giorni scegli un piano.',
    allFeatures:'Tutte le funzioni di Polar Finance', features:'Funzioni',
    quickStats:'Statistiche Rapide', transactions:'Transazioni',
    viewPlans:'Vedi Piani', yourPlan:'Il Tuo Piano', tapToUpgrade:'Tocca per aggiornare',
    upgradePremium:'Passa a Premium', unlockFeatures:'Sblocca mercati, beni e altro.',
    comingSoon:'Prossimamente', comingSoonSub:'Nuove funzioni in arrivo',
    comingSoonBankSync:'Sincronizzazione Bancaria', comingSoonBankSyncDesc:'Importa automaticamente le transazioni dalla tua banca.',
    comingSoonBudgets:'Budget Intelligenti', comingSoonBudgetsDesc:'Imposta limiti di spesa mensili per categoria.',
    comingSoonTaxReport:'Rapporto Fiscale', comingSoonTaxReportDesc:'Esporta un rapporto completo per la tua dichiarazione.',
    comingSoonShared:'Finanze Condivise', comingSoonSharedDesc:'Condividi un budget con il tuo partner o famiglia.',
    comingSoonWidgets:'Widget Schermata', comingSoonWidgetsDesc:'Vedi il tuo saldo dalla schermata principale.',
    comingSoonAIInsights:'Insights IA', comingSoonAIInsightsDesc:'Consigli personalizzati basati sui tuoi modelli di spesa.',
    myIncome:'Il Mio Reddito', incomeSetup:'Impostazione Reddito', salaryLabel:'Stipendio / Reddito',
    salaryAmount:'Netto Mensile', salarySource:'Fonte di Reddito', paydayLabel:'Giorno di Paga',
    paydayDay:'Giorno del Mese', nextPayday:'Prossimo Pagamento',
    noIncomeSet:'Nessun reddito impostato', addIncomePrompt:'Aggiungi il tuo stipendio per vedere quanto ti rimane.',
    addIncome:'Aggiungi Fonte di Reddito', editIncome:'Modifica Reddito',
    incomeSource:'Fonte', incomeFrequency:'Frequenza di Pagamento',
    leftToSpend:'Disponibile', leftToSpendDesc:'Dopo bollette e spese questo mese',
    incomeAdded:'Reddito salvato!',
  },
  pt: {
    home:'Início', stats:'Estatísticas', markets:'Mercados', credit:'Crédito', more:'Mais', settings:'Configurações',
    goodMorning:'Bom dia', goodAfternoon:'Boa tarde', goodEvening:'Boa noite',
    netWorth:'PATRIMÔNIO LÍQUIDO', income:'Receitas', expenses:'Despesas', invested:'Investido',
    recentTransactions:'Transações Recentes', addTransaction:'Adicionar Transação',
    noTransactions:'Sem transações', scanReceipt:'Digitalizar Recibo',
    searchTransactions:'Pesquisar', longPressDelete:'Pressione para excluir',
    edit:'Editar',
    add:'Adicionar', cancel:'Cancelar', save:'Salvar', done:'Concluído', close:'Fechar',
    name:'Nome', amount:'Valor', category:'Categoria', all:'Tudo', expense:'Despesa',
    description:'Descrição', note:'Nota', of:'de', balance:'Saldo',
    cards:'Cartões', addCard:'Adicionar Cartão', bankName:'Nome do Banco',
    investments:'Investimentos', addInvestment:'Adicionar Investimento',
    weekly:'Semanal', monthly:'Mensal', yearly:'Anual', spent:'Gasto', saved:'Economizado',
    overspent:'Gasto excessivo', deficit:'Déficit',
    savingGoals:'Metas de Economia', goalsDescription:'Acompanhe suas metas de economia',
    target:'Meta', addNewGoal:'Nova Meta', noGoalsYet:'Sem metas ainda',
    addFirstGoal:'Adicione sua primeira meta de economia',
    assets:'Ativos', totalAssets:'Total de Ativos', liabilities:'Passivos',
    calendar:'Calendário', calendarDescription:'Ver transações por data',
    stocks:'Ações', commodities:'Commodities', crypto:'Cripto',
    creditScore:'Pontuação de Crédito',
    tipPayOnTime:'Pague todas as contas em dia', tipKeepBelow30:'Mantenha o uso abaixo de 30%',
    tipAvoidMultiple:'Evite múltiplas solicitações de crédito', tipElectoralRoll:'Registre-se nos registros eleitorais',
    tipKeepOldAccounts:'Mantenha contas antigas abertas',
    theme:'Tema', notifications:'Notificações', currency:'Moeda', language:'Idioma',
    logOut:'Sair', perMonth:'/mês', from:'a partir de', upgrade:'Melhorar',
    advertisement:'Publicidade', upgradeRemoveAds:'Atualize para remover anúncios',
    freePlan:'Grátis', proPlan:'Pro', premiumPlan:'Premium', trialPlan:'Teste Premium',
    startFreeTrial:'Teste Grátis de 3 Dias',
    welcomeToPolar:'Bem-vindo ao Polar Finance!',
    noCreditCard:'Sem cartão necessário. Após 3 dias escolha um plano.',
    allFeatures:'Todos os recursos do Polar Finance', features:'Recursos',
    quickStats:'Estatísticas Rápidas', transactions:'Transações',
    viewPlans:'Ver Planos', yourPlan:'Seu Plano', tapToUpgrade:'Toque para melhorar',
    upgradePremium:'Atualizar para Premium', unlockFeatures:'Desbloqueie mercados, ativos e mais.',
    comingSoon:'Em Breve', comingSoonSub:'Novos recursos a caminho',
    comingSoonBankSync:'Sincronização Bancária', comingSoonBankSyncDesc:'Importe transações automaticamente do seu banco.',
    comingSoonBudgets:'Orçamentos Inteligentes', comingSoonBudgetsDesc:'Defina limites de gastos mensais por categoria.',
    comingSoonTaxReport:'Relatório Fiscal', comingSoonTaxReportDesc:'Exporte um relatório completo para sua declaração.',
    comingSoonShared:'Finanças Compartilhadas', comingSoonSharedDesc:'Compartilhe um orçamento com seu parceiro ou família.',
    comingSoonWidgets:'Widgets de Tela', comingSoonWidgetsDesc:'Veja seu saldo na tela inicial.',
    comingSoonAIInsights:'Insights de IA', comingSoonAIInsightsDesc:'Dicas personalizadas baseadas nos seus padrões de gastos.',
    myIncome:'Minha Renda', incomeSetup:'Configuração de Renda', salaryLabel:'Salário / Renda',
    salaryAmount:'Salário Líquido Mensal', salarySource:'Fonte de Renda', paydayLabel:'Dia de Pagamento',
    paydayDay:'Dia do Mês', nextPayday:'Próximo Pagamento',
    noIncomeSet:'Nenhuma renda configurada', addIncomePrompt:'Adicione seu salário para saber quanto sobra.',
    addIncome:'Adicionar Fonte de Renda', editIncome:'Editar Renda',
    incomeSource:'Fonte', incomeFrequency:'Frequência de Pagamento',
    leftToSpend:'Disponível', leftToSpendDesc:'Após contas e despesas deste mês',
    incomeAdded:'Renda salva!',
  },
  ar: {
    home:'الرئيسية', stats:'الإحصاءات', markets:'الأسواق', credit:'الائتمان', more:'المزيد', settings:'الإعدادات',
    goodMorning:'صباح الخير', goodAfternoon:'مساء الخير', goodEvening:'مساء النور',
    netWorth:'صافي الثروة', income:'الدخل', expenses:'المصروفات', invested:'مستثمر',
    recentTransactions:'المعاملات الأخيرة', addTransaction:'إضافة معاملة',
    noTransactions:'لا توجد معاملات', scanReceipt:'مسح الإيصال',
    searchTransactions:'بحث', longPressDelete:'اضغط مطولاً للحذف',
    edit:'تعديل',
    add:'إضافة', cancel:'إلغاء', save:'حفظ', done:'تم', close:'إغلاق',
    name:'الاسم', amount:'المبلغ', category:'الفئة', all:'الكل', expense:'مصروف',
    description:'الوصف', note:'ملاحظة', of:'من', balance:'الرصيد',
    cards:'البطاقات', addCard:'إضافة بطاقة', bankName:'اسم البنك',
    investments:'الاستثمارات', addInvestment:'إضافة استثمار',
    weekly:'أسبوعي', monthly:'شهري', yearly:'سنوي', spent:'المنفق', saved:'المدخر',
    overspent:'إنفاق زائد', deficit:'عجز',
    savingGoals:'أهداف الادخار', goalsDescription:'تتبع أهداف الادخار',
    target:'الهدف', addNewGoal:'هدف جديد', noGoalsYet:'لا توجد أهداف بعد',
    addFirstGoal:'أضف هدف ادخارك الأول',
    assets:'الأصول', totalAssets:'إجمالي الأصول', liabilities:'الالتزامات',
    calendar:'التقويم', calendarDescription:'عرض المعاملات حسب التاريخ',
    stocks:'الأسهم', commodities:'السلع', crypto:'العملات الرقمية',
    creditScore:'درجة الائتمان',
    tipPayOnTime:'ادفع جميع الفواتير في الوقت المحدد', tipKeepBelow30:'حافظ على استخدام البطاقة أقل من 30%',
    tipAvoidMultiple:'تجنب تقديم طلبات ائتمان متعددة', tipElectoralRoll:'سجل في قوائم الناخبين',
    tipKeepOldAccounts:'احتفظ بالحسابات القديمة مفتوحة',
    theme:'المظهر', notifications:'الإشعارات', currency:'العملة', language:'اللغة',
    logOut:'تسجيل الخروج', perMonth:'/شهر', from:'من', upgrade:'ترقية',
    advertisement:'إعلان', upgradeRemoveAds:'قم بالترقية لإزالة الإعلانات',
    freePlan:'مجاني', proPlan:'برو', premiumPlan:'بريميوم', trialPlan:'تجربة مجانية',
    startFreeTrial:'ابدأ التجربة المجانية لمدة 3 أيام',
    welcomeToPolar:'مرحبا بك في Polar Finance!',
    noCreditCard:'لا حاجة لبطاقة. بعد 3 أيام اختر خطة.',
    allFeatures:'جميع ميزات Polar Finance', features:'الميزات',
    quickStats:'إحصاءات سريعة', transactions:'المعاملات',
    viewPlans:'عرض الخطط', yourPlan:'خطتك', tapToUpgrade:'اضغط للترقية',
    upgradePremium:'الترقية إلى Premium', unlockFeatures:'افتح الأسواق والأصول والمزيد.',
    comingSoon:'قريباً', comingSoonSub:'ميزات مثيرة قادمة',
    comingSoonBankSync:'مزامنة البنك', comingSoonBankSyncDesc:'استيراد المعاملات تلقائياً من بنكك.',
    comingSoonBudgets:'ميزانيات ذكية', comingSoonBudgetsDesc:'حدد حدود الإنفاق الشهرية لكل فئة.',
    comingSoonTaxReport:'تقرير ضريبي', comingSoonTaxReportDesc:'صدّر تقريراً كاملاً للإيرادات والمصروفات.',
    comingSoonShared:'مالية مشتركة', comingSoonSharedDesc:'شارك الميزانية مع شريكك أو عائلتك.',
    comingSoonWidgets:'أدوات الشاشة', comingSoonWidgetsDesc:'اعرض رصيدك مباشرة من الشاشة الرئيسية.',
    comingSoonAIInsights:'رؤى الذكاء الاصطناعي', comingSoonAIInsightsDesc:'نصائح مخصصة بناءً على أنماط إنفاقك.',
    myIncome:'دخلي', incomeSetup:'إعداد الدخل', salaryLabel:'الراتب / الدخل',
    salaryAmount:'الدخل الشهري الصافي', salarySource:'مصدر الدخل', paydayLabel:'يوم الدفع',
    paydayDay:'يوم الشهر', nextPayday:'الدفع القادم',
    noIncomeSet:'لم يتم إعداد دخل بعد', addIncomePrompt:'أضف راتبك لمتابعة ما تبقى.',
    addIncome:'إضافة مصدر دخل', editIncome:'تعديل الدخل',
    incomeSource:'المصدر', incomeFrequency:'تكرار الدفع',
    leftToSpend:'المتاح للإنفاق', leftToSpendDesc:'بعد الفواتير والمصروفات هذا الشهر',
    incomeAdded:'تم حفظ الدخل!',
  },
  zh: {
    home:'首页', stats:'统计', markets:'市场', credit:'信用', more:'更多', settings:'设置',
    goodMorning:'早上好', goodAfternoon:'下午好', goodEvening:'晚上好',
    netWorth:'净资产', income:'收入', expenses:'支出', invested:'已投资',
    recentTransactions:'最近交易', addTransaction:'添加交易',
    noTransactions:'暂无交易', scanReceipt:'扫描收据',
    searchTransactions:'搜索', longPressDelete:'长按删除',
    edit:'编辑',
    add:'添加', cancel:'取消', save:'保存', done:'完成', close:'关闭',
    name:'名称', amount:'金额', category:'类别', all:'全部', expense:'支出',
    description:'描述', note:'备注', of:'的', balance:'余额',
    cards:'卡片', addCard:'添加卡片', bankName:'银行名称',
    investments:'投资', addInvestment:'添加投资',
    weekly:'每周', monthly:'每月', yearly:'每年', spent:'已花费', saved:'已节省',
    overspent:'超支', deficit:'赤字',
    savingGoals:'储蓄目标', goalsDescription:'跟踪您的储蓄目标',
    target:'目标', addNewGoal:'新目标', noGoalsYet:'暂无目标',
    addFirstGoal:'添加您的第一个储蓄目标',
    assets:'资产', totalAssets:'总资产', liabilities:'负债',
    calendar:'日历', calendarDescription:'按日期查看交易',
    stocks:'股票', commodities:'大宗商品', crypto:'加密货币',
    creditScore:'信用评分',
    tipPayOnTime:'按时支付所有账单', tipKeepBelow30:'保持信用卡使用率低于30%',
    tipAvoidMultiple:'避免在短期内多次申请信用', tipElectoralRoll:'在选民登记册上登记',
    tipKeepOldAccounts:'保持旧账户开放',
    theme:'主题', notifications:'通知', currency:'货币', language:'语言',
    logOut:'退出', perMonth:'/月', from:'起', upgrade:'升级',
    advertisement:'广告', upgradeRemoveAds:'升级以删除广告',
    freePlan:'免费', proPlan:'专业版', premiumPlan:'高级版', trialPlan:'试用版',
    startFreeTrial:'开始3天免费试用',
    welcomeToPolar:'欢迎使用 Polar Finance！',
    noCreditCard:'无需信用卡。3天后选择计划。',
    allFeatures:'所有 Polar Finance 功能', features:'功能',
    quickStats:'快速统计', transactions:'交易',
    viewPlans:'查看计划', yourPlan:'您的计划', tapToUpgrade:'点击升级',
    upgradePremium:'升级到高级版', unlockFeatures:'解锁市场、资产等更多功能。',
    comingSoon:'即将推出', comingSoonSub:'令人兴奋的新功能即将到来',
    comingSoonBankSync:'银行同步', comingSoonBankSyncDesc:'通过开放银行自动导入您的银行交易。',
    comingSoonBudgets:'智能预算', comingSoonBudgetsDesc:'按类别设置每月支出限额。',
    comingSoonTaxReport:'税务报告', comingSoonTaxReportDesc:'导出完整的收支报告用于报税。',
    comingSoonShared:'共享财务', comingSoonSharedDesc:'与伴侣或家人共享预算并追踪支出。',
    comingSoonWidgets:'主屏幕小组件', comingSoonWidgetsDesc:'直接从主屏幕查看余额和最近交易。',
    comingSoonAIInsights:'AI 消费洞察', comingSoonAIInsightsDesc:'基于您的消费模式获得个性化建议。',
    myIncome:'我的收入', incomeSetup:'收入设置', salaryLabel:'工资 / 收入',
    salaryAmount:'月净收入', salarySource:'收入来源', paydayLabel:'发薪日',
    paydayDay:'月份中的天数', nextPayday:'下次发薪',
    noIncomeSet:'尚未设置收入', addIncomePrompt:'添加您的工资以追踪剩余可用金额。',
    addIncome:'添加收入来源', editIncome:'编辑收入',
    incomeSource:'来源', incomeFrequency:'支付频率',
    leftToSpend:'可用余额', leftToSpendDesc:'本月账单和支出后剩余',
    incomeAdded:'收入已保存！',
  },
  ja: {
    home:'ホーム', stats:'統計', markets:'市場', credit:'クレジット', more:'もっと', settings:'設定',
    goodMorning:'おはようございます', goodAfternoon:'こんにちは', goodEvening:'こんばんは',
    netWorth:'純資産', income:'収入', expenses:'支出', invested:'投資済み',
    recentTransactions:'最近の取引', addTransaction:'取引を追加',
    noTransactions:'取引なし', scanReceipt:'レシートをスキャン',
    searchTransactions:'検索', longPressDelete:'長押しで削除',
    edit:'編集',
    add:'追加', cancel:'キャンセル', save:'保存', done:'完了', close:'閉じる',
    name:'名前', amount:'金額', category:'カテゴリ', all:'すべて', expense:'支出',
    description:'説明', note:'メモ', of:'の', balance:'残高',
    cards:'カード', addCard:'カードを追加', bankName:'銀行名',
    investments:'投資', addInvestment:'投資を追加',
    weekly:'週間', monthly:'月間', yearly:'年間', spent:'支出額', saved:'貯蓄額',
    overspent:'超過支出', deficit:'赤字',
    savingGoals:'貯蓄目標', goalsDescription:'貯蓄目標を追跡・管理',
    target:'目標', addNewGoal:'新しい目標', noGoalsYet:'目標なし',
    addFirstGoal:'最初の貯蓄目標を追加',
    assets:'資産', totalAssets:'総資産', liabilities:'負債',
    calendar:'カレンダー', calendarDescription:'日付別に取引を表示',
    stocks:'株式', commodities:'商品', crypto:'暗号通貨',
    creditScore:'クレジットスコア',
    tipPayOnTime:'すべての請求書を期限通りに支払う', tipKeepBelow30:'クレジットカードの使用率を30%以下に',
    tipAvoidMultiple:'短期間に複数のクレジット申請を避ける', tipElectoralRoll:'選挙人名簿に登録する',
    tipKeepOldAccounts:'古いアカウントを開いたままにする',
    theme:'テーマ', notifications:'通知', currency:'通貨', language:'言語',
    logOut:'ログアウト', perMonth:'/月', from:'から', upgrade:'アップグレード',
    advertisement:'広告', upgradeRemoveAds:'広告を削除するにはアップグレード',
    freePlan:'無料', proPlan:'プロ', premiumPlan:'プレミアム', trialPlan:'トライアル',
    startFreeTrial:'3日間無料トライアル開始',
    welcomeToPolar:'Polar Finance へようこそ！',
    noCreditCard:'カード不要。3日後にプランを選択。',
    allFeatures:'すべての Polar Finance 機能', features:'機能',
    quickStats:'クイック統計', transactions:'取引',
    viewPlans:'プランを見る', yourPlan:'あなたのプラン', tapToUpgrade:'タップしてアップグレード',
    upgradePremium:'プレミアムにアップグレード', unlockFeatures:'市場、資産などをアンロック。',
    comingSoon:'近日公開', comingSoonSub:'新機能が登場予定',
    comingSoonBankSync:'銀行同期', comingSoonBankSyncDesc:'オープンバンキングで銀行取引を自動インポート。',
    comingSoonBudgets:'スマート予算', comingSoonBudgetsDesc:'カテゴリ別に月次支出上限を設定。',
    comingSoonTaxReport:'税務レポート', comingSoonTaxReportDesc:'確定申告用の収支レポートをエクスポート。',
    comingSoonShared:'共有ファイナンス', comingSoonSharedDesc:'パートナーや家族と予算を共有して管理。',
    comingSoonWidgets:'ホーム画面ウィジェット', comingSoonWidgetsDesc:'ホーム画面から残高や取引を確認。',
    comingSoonAIInsights:'AI支出インサイト', comingSoonAIInsightsDesc:'支出パターンに基づくパーソナライズされたアドバイス。',
    myIncome:'収入管理', incomeSetup:'収入設定', salaryLabel:'給与 / 収入',
    salaryAmount:'月手取り額', salarySource:'収入源', paydayLabel:'給料日',
    paydayDay:'月の日付', nextPayday:'次の給料日',
    noIncomeSet:'収入未設定', addIncomePrompt:'給与を追加して残額を確認しましょう。',
    addIncome:'収入源を追加', editIncome:'収入を編集',
    incomeSource:'収入源', incomeFrequency:'支払頻度',
    leftToSpend:'使用可能額', leftToSpendDesc:'今月の請求と支出後の残高',
    incomeAdded:'収入を保存しました！',
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