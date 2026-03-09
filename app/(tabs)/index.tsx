import { CAT_ICONS, useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Paywall from '../../components/Paywall';
import ProfileModal from '../../components/ProfileModal';
import RecurringBills from '../../components/RecurringBills';
import StarBackground from '../../components/StarBackground';
import TrialPrompt from '../../components/TrialPrompt';
import { useBills } from '../../context/BillsContext';
import { useTheme } from '../../context/ThemeContext';

// ── Market symbols catalogue ───────────────────────────────────────────────────
export const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple', type: 'stock' as const },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' as const },
  { symbol: 'GOOGL', name: 'Google', type: 'stock' as const },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' as const },
  { symbol: 'NVDA', name: 'Nvidia', type: 'stock' as const },
  { symbol: 'META', name: 'Meta', type: 'stock' as const },
  { symbol: 'NFLX', name: 'Netflix', type: 'stock' as const },
  { symbol: 'BABA', name: 'Alibaba', type: 'stock' as const },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'stock' as const },
];
export const CRYPTO_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' as const },
  { symbol: 'XRP', name: 'XRP', type: 'crypto' as const },
  { symbol: 'BNB', name: 'BNB', type: 'crypto' as const },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto' as const },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' as const },
];
export const COMMODITY_SYMBOLS = [
  { symbol: 'GOLD', name: 'Gold', type: 'commodity' as const },
  { symbol: 'SILVER', name: 'Silver', type: 'commodity' as const },
  { symbol: 'OIL', name: 'Crude Oil', type: 'commodity' as const },
  { symbol: 'NATGAS', name: 'Natural Gas', type: 'commodity' as const },
];
export const ALL_MARKET_SYMBOLS = [...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS, ...COMMODITY_SYMBOLS];

const MARKET_RATE_LIMIT_KEY = 'jf_market_last_fetch';
const MARKET_CACHE_KEY = 'jf_market_cache';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ── Constants ──────────────────────────────────────────────────────────────────
const ALL_TABS = [
  { icon: 'bar-chart', label: 'stats', display: 'Stats', route: '/(tabs)/stats' },
  { icon: 'wallet', label: 'budgets', display: 'Budgets', route: '/(tabs)/budgets' },
  { icon: 'calendar', label: 'calendar', display: 'Calendar', route: '/(tabs)/calendar' },
  { icon: 'flag', label: 'savingGoals', display: 'Goals', route: '/(tabs)/goals' },
  { icon: 'briefcase', label: 'assets', display: 'Assets', route: '/(tabs)/assets' },
  { icon: 'card', label: 'credit', display: 'Credit', route: '/(tabs)/credit' },
  { icon: 'settings', label: 'settings', display: 'Settings', route: '/(tabs)/settings' },
] as const;

const CARD_COLORS = [
  '#1a1a4e', '#1a2a1a', '#2a1a00', '#1a001a', '#0a1428', '#000500',
  '#0a2a4a', '#0d1b4b', '#1a3a5c', '#0a3d62',
  '#2d1b69', '#4a1942', '#3d0066', '#1a0533',
  '#0d3b2e', '#1a4a1a', '#003322', '#1b4332',
  '#4a1010', '#3d1a00', '#2a0a00', '#4a2000',
  '#1a1a2e', '#2d2d2d', '#1c1c1c', '#0f0f1a',
];

// ── Animated transaction row ───────────────────────────────────────────────────
function TxnRow({ txn, onPress, onLongPress, formatAmount, c }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  const isIncome = txn.amount > 0;
  const accent = isIncome ? '#00D4AA' : '#FF6B6B';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 18, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: c.border }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: accent + '18', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: accent + '33' }}>
          <Text style={{ fontSize: 18 }}>{txn.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{txn.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>{txn.cat}</Text>
            {txn.date ? (
              <>
                <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: c.muted + '55' }} />
                <Text style={{ color: c.muted, fontSize: 11 }}>{txn.date}</Text>
              </>
            ) : null}
          </View>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: accent }}>
          {isIncome ? '+' : '-'}{formatAmount(Math.abs(txn.amount))}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { hasFeature, trialDaysLeft, plan, maxTransactions, needsPaywall } = usePlan();
  const { theme: c } = useTheme();
  const router = useRouter();
  const { formatAmount, currencySymbol, t } = useLocale();
  const { bills } = useBills();

  const showCardsOk = hasFeature('cardTracking');
  const showInvest = hasFeature('investmentTracking');

  const { cards, setCards, investments, setInvestments, transactions, setTransactions, customAssets } = useFinance();

  // ── Greeting ─────────────────────────────────────────────────────────────────
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 17) return t('goodAfternoon');
    return t('goodEvening');
  })();

  // ── User info ─────────────────────────────────────────────────────────────────
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('?');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const loadProfilePhoto = async () => {
    const pairs = await AsyncStorage.multiGet(['profile_photo', 'profile_avatar']);
    setProfilePhoto(pairs[0][1] || pairs[1][1] || null);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setUserName(name.split(' ')[0]);
      setUserInitial(name.charAt(0).toUpperCase());
    });
    loadProfilePhoto();
  }, []);

  const handleProfileClose = () => { setShowProfile(false); loadProfilePhoto(); };

  const applyMarketPrices = (data: any, invList: typeof investments) => {
    const allPrices: Record<string, { price: number; change: number }> = {};

    // Index stocks & commodities by symbol
    [...(data.stocks ?? []), ...(data.commodities ?? [])].forEach((item: any) => {
      allPrices[item.symbol] = { price: item.price, change: item.change };
    });

    // Index crypto by symbol
    (data.crypto ?? []).forEach((item: any) => {
      allPrices[item.symbol] = { price: item.price, change: item.change };
    });

    // Update investments that have a linked symbol
    const updated = invList.map(inv => {
      const sym = (inv as any).symbol;
      const qty = (inv as any).quantity ?? 1;
      if (!sym || !allPrices[sym]) return inv;
      const market = allPrices[sym];
      return {
        ...inv,
        value: Math.round(market.price * qty * 100) / 100,
        change: Math.round(market.change * 10) / 10,
        up: market.change >= 0,
      };
    });

    setInvestments(updated);
  };


  // ── Market price auto-updater (rate limited: once per day) ────────────────
  const refreshMarketPrices = async (invList: typeof investments) => {
    const linkedInvs = invList.filter(i => (i as any).symbol && (i as any).assetType);
    if (linkedInvs.length === 0) return;

    try {
      // Rate limit check — only fetch once per day
      const lastFetch = await AsyncStorage.getItem(MARKET_RATE_LIMIT_KEY);
      const now = Date.now();
      if (lastFetch && now - parseInt(lastFetch) < ONE_DAY_MS) {
        // Use cached prices instead
        const cached = await AsyncStorage.getItem(MARKET_CACHE_KEY);
        if (cached) applyMarketPrices(JSON.parse(cached), invList);
        return;
      }

      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-market-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const data = await res.json();

      // Cache the result and timestamp
      await AsyncStorage.setItem(MARKET_RATE_LIMIT_KEY, now.toString());
      await AsyncStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(data));

      applyMarketPrices(data, invList);
    } catch { /* silent fail — don't disrupt the UI */ }
  };

  useEffect(() => {
    if (showInvest && investments.length > 0) {
      refreshMarketPrices(investments);
    }
  }, [showInvest]);

  // ── Modal state ───────────────────────────────────────────────────────────────
  const [showPaywall, setShowPaywall] = useState(false);
  const [showExpiredPaywall, setShowExpiredPaywall] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddInv, setShowAddInv] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showBills, setShowBills] = useState(false);

  // ── Card form ─────────────────────────────────────────────────────────────────
  const [newBank, setNewBank] = useState('');
  const [newCardType, setNewCardType] = useState('Debit · Visa');
  const [newBalance, setNewBalance] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newCardColor, setNewCardColor] = useState('#1a1a4e');
  const [newBalanceNegative, setNewBalanceNegative] = useState(false);

  // ── Investment form ───────────────────────────────────────────────────────────
  const [newInvName, setNewInvName] = useState('');
  const [newInvSub, setNewInvSub] = useState('');
  const [newInvValue, setNewInvValue] = useState('');
  const [newInvChange, setNewInvChange] = useState('');
  const [newInvUp, setNewInvUp] = useState(true);
  const [newInvIcon, setNewInvIcon] = useState('📈');
  const [newInvSymbol, setNewInvSymbol] = useState('');
  const [newInvAssetType, setNewInvAssetType] = useState<'stock' | 'crypto' | 'commodity' | 'manual'>('manual');
  const [newInvQty, setNewInvQty] = useState('1');
  const [invTab, setInvTab] = useState<'manual' | 'market'>('manual');

  // ── Investment edit ───────────────────────────────────────────────────────────
  const [editInv, setEditInv] = useState<any | null>(null);
  const [editInvName, setEditInvName] = useState('');
  const [editInvSub, setEditInvSub] = useState('');
  const [editInvValue, setEditInvValue] = useState('');
  const [editInvChange, setEditInvChange] = useState('');
  const [editInvUp, setEditInvUp] = useState(true);

  // ── Transaction form ──────────────────────────────────────────────────────────
  const [newTxnName, setNewTxnName] = useState('');
  const [newTxnCat, setNewTxnCat] = useState('Groceries');
  const [newTxnAmt, setNewTxnAmt] = useState('');
  const [newTxnType, setNewTxnType] = useState<'income' | 'expense'>('expense');

  // ── Transaction edit ──────────────────────────────────────────────────────────
  const [editTxn, setEditTxn] = useState<any | null>(null);
  const [editTxnName, setEditTxnName] = useState('');
  const [editTxnCat, setEditTxnCat] = useState('Groceries');
  const [editTxnAmt, setEditTxnAmt] = useState('');
  const [editTxnType, setEditTxnType] = useState<'income' | 'expense'>('expense');

  // ── Quick actions ─────────────────────────────────────────────────────────────
  const [selectedTabs, setSelectedTabs] = useState<typeof ALL_TABS[number][]>([ALL_TABS[0], ALL_TABS[1], ALL_TABS[2]]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // ── Expired trial paywall ─────────────────────────────────────────────────────
  useEffect(() => {
    if (needsPaywall) {
      const timer = setTimeout(() => setShowExpiredPaywall(true), 600);
      return () => clearTimeout(timer);
    }
  }, [needsPaywall]);

  // ── Derived totals ────────────────────────────────────────────────────────────
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalInvest = showInvest ? investments.reduce((s, i) => s + i.value, 0) : 0;
  const totalCards = showCardsOk ? cards.reduce((s, card) => s + card.balance, 0) : 0;
  const totalCustomAssets = showInvest ? customAssets.reduce((s, a) => s + a.value, 0) : 0;
  const netWorth = totalIncome - totalExpense + totalInvest + totalCards + totalCustomAssets;
  const savedAmount = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((savedAmount / totalIncome) * 100))) : 0;

  const totalMonthlyBills = bills.reduce((s, b) => {
    switch (b.frequency) {
      case 'weekly': return s + b.amount * 4.33;
      case 'fortnightly': return s + b.amount * 2.17;
      case 'monthly': return s + b.amount;
      case 'yearly': return s + b.amount / 12;
    }
  }, 0);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const toggleTab = (tab: typeof ALL_TABS[number]) => {
    setSelectedTabs(prev => {
      if (prev.find(t => t.label === tab.label)) return prev.filter(t => t.label !== tab.label);
      if (prev.length >= 3) return prev;
      return [...prev, tab];
    });
  };

  const filtered = transactions.filter(tx => {
    const matchSearch = tx.name.toLowerCase().includes(search.toLowerCase()) || tx.cat.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || tx.type === filter;
    return matchSearch && matchFilter;
  });

  const displayTxns = showSearch
    ? filtered
    : filtered.slice(0, maxTransactions === Infinity ? filtered.length : maxTransactions);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const addCard = () => {
    if (!newBank || !newBalance) return;
    const raw = parseFloat(newBalance);
    const bal = newBalanceNegative ? -Math.abs(raw) : Math.abs(raw);
    setCards([...cards, { id: Date.now().toString(), bank: newBank, type: newCardType, balance: bal, number: newNumber || '0000', color: newCardColor, positive: bal >= 0 }]);
    setNewBank(''); setNewBalance(''); setNewNumber(''); setNewCardType('Debit · Visa'); setNewCardColor('#1a1a4e'); setNewBalanceNegative(false);
    setShowAddCard(false);
  };

  const addInvestment = () => {
    const isMarket = invTab === 'market' && newInvSymbol;
    if (isMarket) {
      if (!newInvSymbol || !newInvQty) return;
      const symMeta = ALL_MARKET_SYMBOLS.find(s => s.symbol === newInvSymbol);
      const newInv = {
        id: Date.now().toString(),
        icon: symMeta?.type === 'crypto' ? '₿' : symMeta?.type === 'commodity' ? '🏅' : '📈',
        name: symMeta?.name || newInvSymbol,
        sub: `${newInvSymbol} · ${newInvQty} units`,
        value: 0,
        change: 0,
        up: true,
        symbol: newInvSymbol,
        assetType: symMeta?.type || 'stock',
        quantity: parseFloat(newInvQty) || 1,
      } as any;
      const updated = [...investments, newInv];
      setInvestments(updated);
      refreshMarketPrices(updated);
    } else {
      if (!newInvName || !newInvValue) return;
      setInvestments([...investments, { id: Date.now().toString(), icon: newInvIcon, name: newInvName, sub: newInvSub, value: parseFloat(newInvValue), change: parseFloat(newInvChange) || 0, up: newInvUp } as any]);
    }
    setNewInvName(''); setNewInvSub(''); setNewInvValue(''); setNewInvChange(''); setNewInvIcon('📈');
    setNewInvSymbol(''); setNewInvQty('1'); setInvTab('manual');
    setShowAddInv(false);
  };

  const openEditInv = (inv: any) => {
    setEditInv(inv); setEditInvName(inv.name); setEditInvSub(inv.sub);
    setEditInvValue(inv.value.toString()); setEditInvChange(inv.change.toString()); setEditInvUp(inv.up);
  };

  const saveEditInv = () => {
    if (!editInv) return;
    setInvestments(investments.map(i => i.id === editInv.id
      ? { ...i, name: editInvName, sub: editInvSub, value: parseFloat(editInvValue) || 0, change: parseFloat(editInvChange) || 0, up: editInvUp }
      : i
    ));
    setEditInv(null);
  };

  const addTransaction = () => {
    if (!newTxnName || !newTxnAmt) return;
    const amt = parseFloat(newTxnAmt);
    setTransactions([{
      id: Date.now().toString(),
      icon: CAT_ICONS[newTxnCat] || '💳',
      name: newTxnName,
      cat: newTxnCat,
      amount: newTxnType === 'expense' ? -Math.abs(amt) : Math.abs(amt),
      type: newTxnType,
      date: new Date().toLocaleDateString('en-GB'),
    } as any, ...transactions]);
    setNewTxnName(''); setNewTxnAmt(''); setNewTxnCat('Groceries'); setNewTxnType('expense');
    setShowAddTxn(false);
  };

  const openEditTxn = (txn: any) => {
    setEditTxn(txn); setEditTxnName(txn.name); setEditTxnCat(txn.cat);
    setEditTxnAmt(Math.abs(txn.amount).toString());
    setEditTxnType(txn.type === 'income' ? 'income' : 'expense');
  };

  const saveEditTxn = () => {
    if (!editTxn || !editTxnName || !editTxnAmt) return;
    const amt = parseFloat(editTxnAmt);
    setTransactions(transactions.map(tx => tx.id === editTxn.id
      ? { ...tx, name: editTxnName, cat: editTxnCat, icon: CAT_ICONS[editTxnCat] || tx.icon, amount: editTxnType === 'expense' ? -Math.abs(amt) : Math.abs(amt), type: editTxnType }
      : tx
    ));
    setEditTxn(null);
  };

  const deleteTxn = (id: string) => { setTransactions(transactions.filter(tx => tx.id !== id)); setEditTxn(null); };

  // ── Reusable sub-components ───────────────────────────────────────────────────
  const Field = ({ label, val, set, ph, kb }: { label: string; val: string; set: (v: string) => void; ph: string; kb?: any }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }}
        placeholder={ph} placeholderTextColor={c.muted} value={val} onChangeText={set} keyboardType={kb || 'default'}
      />
    </View>
  );

  const TypeToggle = ({ value, onChange }: { value: 'income' | 'expense'; onChange: (v: 'income' | 'expense') => void }) => (
    <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 50, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
      <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: value === 'expense' ? '#FF6B6B' : 'transparent' }} onPress={() => onChange('expense')}>
        <Text style={{ color: value === 'expense' ? '#fff' : c.muted, fontWeight: '700', fontSize: 13 }}>↓ {t('expense')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: value === 'income' ? '#00D4AA' : 'transparent' }} onPress={() => onChange('income')}>
        <Text style={{ color: value === 'income' ? '#fff' : c.muted, fontWeight: '700', fontSize: 13 }}>↑ {t('income')}</Text>
      </TouchableOpacity>
    </View>
  );

  const CatPicker = ({ selected, onSelect }: { selected: string; onSelect: (cat: string) => void }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
      {Object.keys(CAT_ICONS).slice(0, 13).map(cat => (
        <TouchableOpacity
          key={cat}
          style={{ backgroundColor: selected === cat ? c.accent : c.card2, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: selected === cat ? c.accent : c.border }}
          onPress={() => onSelect(cat)}>
          <Text style={{ color: selected === cat ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{CAT_ICONS[cat]} {cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const PlanBadge = () => {
    if (plan === 'trial' && trialDaysLeft > 0)
      return <View style={{ backgroundColor: '#FFD70022', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FFD70044' }}><Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>TRIAL · {trialDaysLeft}d</Text></View>;
    if (plan === 'pro')
      return <View style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '44' }}><Text style={{ color: c.accent, fontSize: 10, fontWeight: '700' }}>PRO</Text></View>;
    if (plan === 'premium')
      return <View style={{ backgroundColor: '#FFD70022', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FFD70044' }}><Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>PREMIUM</Text></View>;
    return null;
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 28 }}>
          <View>
            <Text style={{ color: c.muted, fontSize: 12, marginBottom: 2 }}>{greeting}</Text>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>{userName || '...'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PlanBadge />
            <TouchableOpacity
              activeOpacity={0.8}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: c.accent + '55' }}
              onPress={() => setShowProfile(true)}>
              {profilePhoto && (profilePhoto.startsWith('http') || profilePhoto.startsWith('file'))
                ? <Image source={{ uri: profilePhoto }} style={{ width: 46, height: 46, borderRadius: 23 }} />
                : profilePhoto
                  ? <Ionicons name={profilePhoto as any} size={22} color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{userInitial}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Net Worth Card ── */}
        <TouchableOpacity
          style={{ backgroundColor: c.card, borderRadius: 26, padding: 24, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
          onPress={() => showCardsOk && setShowCards(!showCards)}
          activeOpacity={showCardsOk ? 0.85 : 1}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{t('netWorth')}</Text>
            {showCardsOk && <Ionicons name={showCards ? 'chevron-up' : 'chevron-down'} size={16} color={c.muted} />}
          </View>

          <Text style={{ color: netWorth < 0 ? '#FF6B6B' : c.text, fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 20 }}>
            {netWorth < 0 ? '-' : ''}{formatAmount(Math.abs(netWorth))}
          </Text>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { label: t('income'), value: totalIncome, color: '#00D4AA', icon: 'arrow-up-circle' as const },
              { label: t('expenses'), value: totalExpense, color: '#FF6B6B', icon: 'arrow-down-circle' as const },
              ...(showCardsOk ? [{ label: t('assets'), value: totalCustomAssets + totalInvest, color: '#a89fff', icon: 'briefcase' as const }] : []),
            ].map(item => (
              <View key={item.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: c.card2, borderRadius: 14 }}>
                <Ionicons name={item.icon} size={15} color={item.color} style={{ marginBottom: 4 }} />
                <Text style={{ color: item.color, fontSize: 13, fontWeight: '800' }}>{formatAmount(item.value)}</Text>
                <Text style={{ color: c.muted, fontSize: 10, marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Savings rate */}
          {totalIncome > 0 && (
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ color: c.muted, fontSize: 11 }}>Savings rate</Text>
                <Text style={{ color: savingsRate >= 20 ? '#00D4AA' : savingsRate >= 10 ? '#FFD700' : '#FF6B6B', fontSize: 11, fontWeight: '700' }}>{savingsRate}%</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 5, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${savingsRate}%`, borderRadius: 50, backgroundColor: savingsRate >= 20 ? '#00D4AA' : savingsRate >= 10 ? '#FFD700' : '#FF6B6B' }} />
              </View>
            </View>
          )}

          {showCardsOk ? (
            <Text style={{ color: c.accent + 'AA', fontSize: 11, textAlign: 'center', marginTop: 12, fontWeight: '600' }}>
              {showCards ? 'Tap to hide cards & investments' : 'Tap to view cards & investments'}
            </Text>
          ) : (
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ marginTop: 12 }}>
              <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center' }}>
                <Ionicons name="lock-closed" size={11} color={c.muted} /> {t('upgradeProCards')}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* ── Cards & Investments ── */}
        {showCards && showCardsOk && (
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: c.border }}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Ionicons name="card" size={13} color={c.muted} />
                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('cards')}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddCard(true)}>
                <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>+ {t('add')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {cards.length === 0 && (
                <View style={{ width: 200, height: 116, justifyContent: 'center', alignItems: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed' }}>
                  <Text style={{ color: c.muted, fontSize: 13 }}>{t('noCards')}</Text>
                </View>
              )}
              {cards.map(card => (
                <TouchableOpacity key={card.id} onLongPress={() => setCards(cards.filter(item => item.id !== card.id))}
                  style={{ width: 210, borderRadius: 18, padding: 16, marginRight: 12, height: 116, justifyContent: 'space-between', backgroundColor: card.color }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{card.bank}</Text>
                    <Ionicons name="card-outline" size={17} color="rgba(255,255,255,0.45)" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: card.positive ? '#fff' : '#FF6B6B', marginBottom: 2 }}>
                      {card.positive ? '' : '-'}{formatAmount(Math.abs(card.balance))}
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1 }}>•••• {card.number}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{card.type}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAddCard(true)} style={{ width: 88, borderRadius: 18, height: 116, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent + '55', borderStyle: 'dashed' }}>
                <Ionicons name="add" size={26} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 10, marginTop: 4, fontWeight: '600' }}>{t('addCard')}</Text>
              </TouchableOpacity>
            </ScrollView>

            {showInvest ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Ionicons name="trending-up" size={13} color={c.muted} />
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('investments')}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {investments.some(i => (i as any).symbol) && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#00D4AA55' }}
                        onPress={() => refreshMarketPrices(investments)}>
                        <Text style={{ color: '#00D4AA', fontSize: 11, fontWeight: '700' }}>↻ Update</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddInv(true)}>
                      <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>+ {t('add')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {investments.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 20 }}><Text style={{ color: c.muted, fontSize: 13 }}>{t('noInvestments')}</Text></View>}
                {investments.map(inv => (
                  <View key={inv.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                    <TouchableOpacity onLongPress={() => setInvestments(investments.filter(i => i.id !== inv.id))} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 18 }}>{inv.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{inv.name}</Text>
                          {(inv as any).symbol && (
                            <View style={{ backgroundColor: '#00D4AA22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ color: '#00D4AA', fontSize: 9, fontWeight: '700' }}>LIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{inv.sub}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                        <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{formatAmount(inv.value)}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: inv.up ? '#00D4AA' : '#FF6B6B' }}>{inv.up ? '▲' : '▼'} {inv.change}%</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditInv(inv)} style={{ backgroundColor: c.card2, borderRadius: 8, padding: 7, borderWidth: 1, borderColor: c.border }}>
                      <Ionicons name="create-outline" size={15} color={c.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setShowAddInv(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12 }}>
                  <Ionicons name="add-circle-outline" size={15} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{t('addInvestment')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                <Ionicons name="lock-closed" size={13} color={c.muted} />
                <Text style={{ color: c.muted, fontSize: 13 }}>{t('upgradePremiumInvest')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {selectedTabs.map(action => (
            <TouchableOpacity key={action.label}
              style={{ flex: 1, alignItems: 'center', backgroundColor: c.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, borderWidth: 1, borderColor: c.border }}
              onPress={() => router.push(action.route as any)}>
              <Ionicons name={action.icon as any} size={20} color={c.accent} />
              <Text style={{ color: c.muted, fontSize: 10, marginTop: 5, fontWeight: '600' }}>{action.display}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: c.accent + '44' }}
            onPress={() => setShowTabPicker(true)}>
            <Ionicons name="apps" size={20} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 10, marginTop: 5, fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Bills bar ── */}
        <TouchableOpacity onPress={() => setShowBills(true)}
          style={{ backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#FF6B6B18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="repeat" size={17} color="#FF6B6B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Recurring Bills</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>
              {bills.length > 0 ? `${bills.length} bill${bills.length !== 1 ? 's' : ''} · ${formatAmount(totalMonthlyBills)}/mo` : 'Tap to manage recurring bills'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.muted} />
        </TouchableOpacity>

        {/* ── Ad banner ── */}
        {!hasFeature('adFree') && (
          <TouchableOpacity onPress={() => setShowPaywall(true)}
            style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="megaphone-outline" size={15} color={c.muted} />
            <Text style={{ color: c.muted, fontSize: 12, flex: 1 }}>{t('advertisement')} — {t('upgradeRemoveAds')}</Text>
          </TouchableOpacity>
        )}

        {/* ── Transactions ── */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{t('recentTransactions')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: c.card, borderRadius: 50, padding: 8, borderWidth: 1, borderColor: showSearch ? c.accent : c.border }}
                onPress={() => setShowSearch(!showSearch)}>
                <Ionicons name="search" size={15} color={showSearch ? c.accent : c.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: c.accent, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }}
                onPress={() => setShowAddTxn(true)}>
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showSearch && (
            <View style={{ borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: c.accent + '33', backgroundColor: 'transparent' }}>
              <TextInput
                style={{ color: c.text, fontSize: 15, marginBottom: 10 }}
                placeholder="Search transactions..."
                placeholderTextColor={c.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <TouchableOpacity key={f}
                    style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: filter === f ? c.accent : 'transparent', borderWidth: 1, borderColor: filter === f ? c.accent : c.border }}
                    onPress={() => setFilter(f)}>
                    <Text style={{ color: filter === f ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>
                      {f === 'all' ? t('all') : f === 'income' ? t('income') : t('expense')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 44 }}>
              <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                <Ionicons name="receipt-outline" size={28} color={c.muted} />
              </View>
              <Text style={{ color: c.muted, fontSize: 14 }}>{t('noTransactions')}</Text>
            </View>
          )}

          {displayTxns.map(txn => (
            <TxnRow key={txn.id} txn={txn} onPress={() => openEditTxn(txn)} onLongPress={() => deleteTxn(txn.id)} formatAmount={formatAmount} c={c} />
          ))}

          {!hasFeature('unlimitedTransactions') && transactions.length > maxTransactions && (
            <TouchableOpacity onPress={() => setShowPaywall(true)}
              style={{ backgroundColor: c.card, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: c.accent + '44', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="lock-closed" size={13} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>{t('upgradeProCards')} — {transactions.length - maxTransactions} more hidden</Text>
            </TouchableOpacity>
          )}

          {transactions.length > 0 && (
            <Text style={{ color: c.muted + '66', fontSize: 11, textAlign: 'center', marginTop: 10 }}>Tap to edit · Hold to delete</Text>
          )}
        </View>

        {/* ── Modals ── */}

        {/* Tab Picker */}
        <Modal visible={showTabPicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 4 }}>{t('customiseQuickActions')}</Text>
              <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>{t('chooseShortcuts')} ({selectedTabs.length}/3)</Text>
              {ALL_TABS.map(tab => {
                const isSel = !!selectedTabs.find(t => t.label === tab.label);
                const isDis = !isSel && selectedTabs.length >= 3;
                return (
                  <TouchableOpacity key={tab.label}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: isSel ? c.accent : c.border, opacity: isDis ? 0.4 : 1 }}
                    onPress={() => !isDis && toggleTab(tab)} disabled={isDis}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isSel ? c.accent + '33' : c.card, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name={tab.icon as any} size={18} color={isSel ? c.accent : c.muted} />
                    </View>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{tab.display}</Text>
                    {isSel && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 }} onPress={() => setShowTabPicker(false)}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Card */}
        <Modal visible={showAddCard} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('addCard')}</Text>
              <Field label={t('bankName')} val={newBank} set={setNewBank} ph="e.g. Barclays" />
              <Field label={t('cardType')} val={newCardType} set={setNewCardType} ph="e.g. Debit · Visa" />
              <Field label={`${t('balance')} (${currencySymbol})`} val={newBalance} set={setNewBalance} ph="e.g. 1500.00" kb="decimal-pad" />
              <Field label={t('lastFourDigits')} val={newNumber} set={setNewNumber} ph="e.g. 1234" kb="number-pad" />
              <TouchableOpacity onPress={() => setNewBalanceNegative(!newBalanceNegative)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card2, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: newBalanceNegative ? '#FF6B6B' : c.border, gap: 12 }}>
                <Ionicons name="card-outline" size={20} color={newBalanceNegative ? '#FF6B6B' : c.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Negative Balance</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Overdraft or credit card debt</Text>
                </View>
                <View style={{ width: 46, height: 26, borderRadius: 50, backgroundColor: newBalanceNegative ? '#FF6B6B' : c.card, borderWidth: 1, borderColor: newBalanceNegative ? '#FF6B6B' : c.border }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: newBalanceNegative ? '#fff' : c.muted, position: 'absolute', top: 2, left: newBalanceNegative ? 22 : 2 }} />
                </View>
              </TouchableOpacity>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('cardColour')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                  {CARD_COLORS.map(col => (
                    <TouchableOpacity key={col} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: col, borderWidth: 2.5, borderColor: newCardColor === col ? '#fff' : 'transparent' }} onPress={() => setNewCardColor(col)} />
                  ))}
                </View>
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddCard(false)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newBank || !newBalance) ? 0.4 : 1 }} onPress={addCard}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('addCard')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Investment */}
        <Modal visible={showAddInv} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 16 }}>{t('addInvestment')}</Text>

                {/* Manual / Market toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 50, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: invTab === 'manual' ? c.accent : 'transparent' }} onPress={() => setInvTab('manual')}>
                    <Text style={{ color: invTab === 'manual' ? '#fff' : c.muted, fontWeight: '700', fontSize: 13 }}>Manual</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: invTab === 'market' ? c.accent : 'transparent' }} onPress={() => setInvTab('market')}>
                    <Text style={{ color: invTab === 'market' ? '#fff' : c.muted, fontWeight: '700', fontSize: 13 }}>Live Market</Text>
                  </TouchableOpacity>
                </View>

                {invTab === 'manual' ? (
                  <>
                    <Field label={t('name')} val={newInvName} set={setNewInvName} ph="e.g. Apple Inc." />
                    <Field label={t('details')} val={newInvSub} set={setNewInvSub} ph="e.g. AAPL · 10 shares" />
                    <Field label={`${t('currentValue')} (${currencySymbol})`} val={newInvValue} set={setNewInvValue} ph="e.g. 1500.00" kb="decimal-pad" />
                    <Field label={t('changePercent')} val={newInvChange} set={setNewInvChange} ph="e.g. 2.5" kb="decimal-pad" />
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: newInvUp ? '#00D4AA22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: newInvUp ? '#00D4AA' : c.border }} onPress={() => setNewInvUp(true)}>
                        <Text style={{ color: newInvUp ? '#00D4AA' : c.muted, fontWeight: '700' }}>▲ Up</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: !newInvUp ? '#FF6B6B22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: !newInvUp ? '#FF6B6B' : c.border }} onPress={() => setNewInvUp(false)}>
                        <Text style={{ color: !newInvUp ? '#FF6B6B' : c.muted, fontWeight: '700' }}>▼ Down</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Stocks */}
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Stocks</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {STOCK_SYMBOLS.map(s => (
                          <TouchableOpacity key={s.symbol} onPress={() => setNewInvSymbol(newInvSymbol === s.symbol ? '' : s.symbol)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: newInvSymbol === s.symbol ? c.accent : c.card2, borderWidth: 1, borderColor: newInvSymbol === s.symbol ? c.accent : c.border }}>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#fff' : c.muted, fontSize: 12, fontWeight: '700' }}>{s.symbol}</Text>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#ffffff99' : c.muted + '88', fontSize: 10, textAlign: 'center' }}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Crypto */}
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Crypto</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {CRYPTO_SYMBOLS.map(s => (
                          <TouchableOpacity key={s.symbol} onPress={() => setNewInvSymbol(newInvSymbol === s.symbol ? '' : s.symbol)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: newInvSymbol === s.symbol ? '#FFD700' : c.card2, borderWidth: 1, borderColor: newInvSymbol === s.symbol ? '#FFD700' : c.border }}>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#000' : c.muted, fontSize: 12, fontWeight: '700' }}>{s.symbol}</Text>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#00000088' : c.muted + '88', fontSize: 10, textAlign: 'center' }}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Commodities */}
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Commodities</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {COMMODITY_SYMBOLS.map(s => (
                          <TouchableOpacity key={s.symbol} onPress={() => setNewInvSymbol(newInvSymbol === s.symbol ? '' : s.symbol)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: newInvSymbol === s.symbol ? '#FF9F43' : c.card2, borderWidth: 1, borderColor: newInvSymbol === s.symbol ? '#FF9F43' : c.border }}>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#fff' : c.muted, fontSize: 12, fontWeight: '700' }}>{s.symbol}</Text>
                            <Text style={{ color: newInvSymbol === s.symbol ? '#ffffff99' : c.muted + '88', fontSize: 10, textAlign: 'center' }}>{s.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Quantity */}
                    <Field label="Quantity / Units" val={newInvQty} set={setNewInvQty} ph="e.g. 10" kb="decimal-pad" />

                    {newInvSymbol ? (
                      <View style={{ backgroundColor: c.accent + '18', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: c.accent + '44', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="information-circle" size={16} color={c.accent} />
                        <Text style={{ color: c.accent, fontSize: 12, flex: 1 }}>Price will update automatically from live market data once per day</Text>
                      </View>
                    ) : (
                      <View style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ color: c.muted, fontSize: 12, textAlign: 'center' }}>Select a symbol above</Text>
                      </View>
                    )}
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 20 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => { setShowAddInv(false); setInvTab('manual'); setNewInvSymbol(''); }}>
                    <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (invTab === 'manual' ? (!newInvName || !newInvValue) : !newInvSymbol) ? 0.4 : 1 }}
                    onPress={addInvestment}
                    disabled={invTab === 'manual' ? (!newInvName || !newInvValue) : !newInvSymbol}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{t('add')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Edit Investment */}
        <Modal visible={!!editInv} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Edit Investment</Text>
              <Field label={t('name')} val={editInvName} set={setEditInvName} ph="e.g. Apple Inc." />
              <Field label={t('details')} val={editInvSub} set={setEditInvSub} ph="e.g. AAPL · 10 shares" />
              <Field label={`${t('currentValue')} (${currencySymbol})`} val={editInvValue} set={setEditInvValue} ph="e.g. 1500.00" kb="decimal-pad" />
              <Field label={t('changePercent')} val={editInvChange} set={setEditInvChange} ph="e.g. 2.5" kb="decimal-pad" />
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: editInvUp ? '#00D4AA22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: editInvUp ? '#00D4AA' : c.border }} onPress={() => setEditInvUp(true)}>
                  <Text style={{ color: editInvUp ? '#00D4AA' : c.muted, fontWeight: '700' }}>▲ Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: !editInvUp ? '#FF6B6B22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: !editInvUp ? '#FF6B6B' : c.border }} onPress={() => setEditInvUp(false)}>
                  <Text style={{ color: !editInvUp ? '#FF6B6B' : c.muted, fontWeight: '700' }}>▼ Down</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setEditInv(null)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={saveEditInv}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Transaction */}
        <Modal visible={showAddTxn} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('addTransaction')}</Text>
              <TypeToggle value={newTxnType} onChange={setNewTxnType} />
              <Field label={t('name')} val={newTxnName} set={setNewTxnName} ph="e.g. Tesco" />
              <Field label={`${t('amount')} (${currencySymbol})`} val={newTxnAmt} set={setNewTxnAmt} ph="e.g. 42.80" kb="decimal-pad" />
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('category')}</Text>
              <CatPicker selected={newTxnCat} onSelect={setNewTxnCat} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddTxn(false)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newTxnName || !newTxnAmt) ? 0.4 : 1 }} onPress={addTransaction}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Transaction */}
        <Modal visible={!!editTxn} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>Edit Transaction</Text>
                <TouchableOpacity onPress={() => editTxn && deleteTxn(editTxn.id)}
                  style={{ backgroundColor: '#FF6B6B18', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                  <Ionicons name="trash-outline" size={17} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <TypeToggle value={editTxnType} onChange={setEditTxnType} />
              <Field label={t('name')} val={editTxnName} set={setEditTxnName} ph="e.g. Tesco" />
              <Field label={`${t('amount')} (${currencySymbol})`} val={editTxnAmt} set={setEditTxnAmt} ph="e.g. 42.80" kb="decimal-pad" />
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('category')}</Text>
              <CatPicker selected={editTxnCat} onSelect={setEditTxnCat} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setEditTxn(null)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!editTxnName || !editTxnAmt) ? 0.4 : 1 }} onPress={saveEditTxn}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TrialPrompt />
        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
        <Paywall visible={showExpiredPaywall} onClose={() => setShowExpiredPaywall(false)} required={true} />

      </ScrollView>

      <ProfileModal visible={showProfile} onClose={handleProfileClose} />
      <RecurringBills visible={showBills} onClose={() => setShowBills(false)} />
    </View>
  );
}