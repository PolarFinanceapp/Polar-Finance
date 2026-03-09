import { CAT_ICONS, useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import ProfileModal from '../../components/ProfileModal';
import RecurringBills from '../../components/RecurringBills';
import TrialPrompt from '../../components/TrialPrompt';
import { useBills } from '../../context/BillsContext';
import { useTheme } from '../../context/ThemeContext';

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

export default function HomeScreen() {
  const { hasFeature, trialDaysLeft, plan, maxTransactions, needsPaywall } = usePlan();
  const { theme: c } = useTheme();
  const router = useRouter();
  const { formatAmount, currencySymbol, t } = useLocale();
  const { bills } = useBills();

  const showCardsOk = hasFeature('cardTracking');
  const showInvest = hasFeature('investmentTracking');

  const { cards, setCards, investments, setInvestments, transactions, setTransactions, customAssets } = useFinance();

  // ── Greeting ──────────────────────────────────────────────────────────────
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 17) return t('goodAfternoon');
    return t('goodEvening');
  })();

  // ── User info ─────────────────────────────────────────────────────────────
  const [userName, setUserName] = useState('');
  const [userInitial, setUserInitial] = useState('?');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const loadProfilePhoto = async () => {
    const pairs = await AsyncStorage.multiGet(['profile_photo', 'profile_avatar']);
    const photo = pairs[0][1];
    const emoji = pairs[1][1];
    setProfilePhoto(photo || emoji || null);
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

  const handleProfileClose = () => {
    setShowProfile(false);
    loadProfilePhoto();
  };

  // ── Modal state ───────────────────────────────────────────────────────────
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

  // ── Card form ─────────────────────────────────────────────────────────────
  const [newBank, setNewBank] = useState('');
  const [newCardType, setNewCardType] = useState('Debit · Visa');
  const [newBalance, setNewBalance] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newCardColor, setNewCardColor] = useState('#1a1a4e');
  const [newBalanceNegative, setNewBalanceNegative] = useState(false);

  // ── Investment form ───────────────────────────────────────────────────────
  const [newInvName, setNewInvName] = useState('');
  const [newInvSub, setNewInvSub] = useState('');
  const [newInvValue, setNewInvValue] = useState('');
  const [newInvChange, setNewInvChange] = useState('');
  const [newInvUp, setNewInvUp] = useState(true);
  const [newInvIcon, setNewInvIcon] = useState('📈');

  // ── Investment edit ───────────────────────────────────────────────────────
  const [editInv, setEditInv] = useState<any | null>(null);
  const [editInvName, setEditInvName] = useState('');
  const [editInvSub, setEditInvSub] = useState('');
  const [editInvValue, setEditInvValue] = useState('');
  const [editInvChange, setEditInvChange] = useState('');
  const [editInvUp, setEditInvUp] = useState(true);

  // ── Transaction form ──────────────────────────────────────────────────────
  const [newTxnName, setNewTxnName] = useState('');
  const [newTxnCat, setNewTxnCat] = useState('Groceries');
  const [newTxnAmt, setNewTxnAmt] = useState('');
  const [newTxnType, setNewTxnType] = useState<'income' | 'expense'>('expense');

  // ── Transaction edit ──────────────────────────────────────────────────────
  const [editTxn, setEditTxn] = useState<any | null>(null);
  const [editTxnName, setEditTxnName] = useState('');
  const [editTxnCat, setEditTxnCat] = useState('Groceries');
  const [editTxnAmt, setEditTxnAmt] = useState('');
  const [editTxnType, setEditTxnType] = useState<'income' | 'expense'>('expense');

  // ── Quick actions ─────────────────────────────────────────────────────────
  const [selectedTabs, setSelectedTabs] = useState<typeof ALL_TABS[number][]>([ALL_TABS[0], ALL_TABS[1], ALL_TABS[2]]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // ── Force paywall on expired trial ────────────────────────────────────────
  useEffect(() => {
    if (needsPaywall) {
      const timer = setTimeout(() => setShowExpiredPaywall(true), 600);
      return () => clearTimeout(timer);
    }
  }, [needsPaywall]);

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalInvest = showInvest ? investments.reduce((s, i) => s + i.value, 0) : 0;
  const totalCards = showCardsOk ? cards.reduce((s, card) => s + card.balance, 0) : 0;
  const totalCustomAssets = showInvest ? customAssets.reduce((s, a) => s + a.value, 0) : 0;
  const netWorth = totalIncome - totalExpense + totalInvest + totalCards + totalCustomAssets;

  // Bills summary for bar
  const totalMonthlyBills = bills.reduce((s, b) => {
    switch (b.frequency) {
      case 'weekly': return s + b.amount * 4.33;
      case 'fortnightly': return s + b.amount * 2.17;
      case 'monthly': return s + b.amount;
      case 'yearly': return s + b.amount / 12;
    }
  }, 0);

  const toggleTab = (tab: typeof ALL_TABS[number]) => {
    setSelectedTabs((prev: typeof ALL_TABS[number][]) => {
      if (prev.find(t => t.label === tab.label)) return prev.filter(t => t.label !== tab.label);
      if (prev.length >= 3) return prev;
      return [...prev, tab];
    });
  };

  const filtered = transactions.filter(tx => {
    const mS = tx.name.toLowerCase().includes(search.toLowerCase()) || tx.cat.toLowerCase().includes(search.toLowerCase());
    const mF = filter === 'all' || tx.type === filter;
    return mS && mF;
  });

  const displayTxns = showSearch
    ? filtered
    : filtered.slice(0, maxTransactions === Infinity ? filtered.length : maxTransactions);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addCard = () => {
    if (!newBank || !newBalance) return;
    const raw = parseFloat(newBalance);
    const bal = newBalanceNegative ? -Math.abs(raw) : Math.abs(raw);
    setCards([...cards, { id: Date.now().toString(), bank: newBank, type: newCardType, balance: bal, number: newNumber || '0000', color: newCardColor, positive: bal >= 0 }]);
    setNewBank(''); setNewBalance(''); setNewNumber(''); setNewCardType('Debit · Visa'); setNewCardColor('#1a1a4e'); setNewBalanceNegative(false);
    setShowAddCard(false);
  };

  const addInvestment = () => {
    if (!newInvName || !newInvValue) return;
    setInvestments([...investments, { id: Date.now().toString(), icon: newInvIcon, name: newInvName, sub: newInvSub, value: parseFloat(newInvValue), change: parseFloat(newInvChange) || 0, up: newInvUp }]);
    setNewInvName(''); setNewInvSub(''); setNewInvValue(''); setNewInvChange(''); setNewInvIcon('📈');
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
      id: Date.now().toString(), icon: CAT_ICONS[newTxnCat] || '💳',
      name: newTxnName, cat: newTxnCat,
      amount: newTxnType === 'expense' ? -Math.abs(amt) : Math.abs(amt),
      type: newTxnType, date: new Date().toLocaleDateString('en-GB'),
    } as any, ...transactions]);
    setNewTxnName(''); setNewTxnAmt(''); setNewTxnCat('Groceries'); setNewTxnType('expense');
    setShowAddTxn(false);
  };

  // ── Transaction edit helpers ──────────────────────────────────────────────
  const openEditTxn = (txn: any) => {
    setEditTxn(txn);
    setEditTxnName(txn.name);
    setEditTxnCat(txn.cat);
    setEditTxnAmt(Math.abs(txn.amount).toString());
    setEditTxnType(txn.type === 'income' ? 'income' : 'expense');
  };

  const saveEditTxn = () => {
    if (!editTxn || !editTxnName || !editTxnAmt) return;
    const amt = parseFloat(editTxnAmt);
    setTransactions(transactions.map(tx => tx.id === editTxn.id
      ? {
        ...tx,
        name: editTxnName,
        cat: editTxnCat,
        icon: CAT_ICONS[editTxnCat] || tx.icon,
        amount: editTxnType === 'expense' ? -Math.abs(amt) : Math.abs(amt),
        type: editTxnType,
      }
      : tx
    ));
    setEditTxn(null);
  };

  const deleteTxn = (id: string) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
    setEditTxn(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>🐻‍❄️</Text>
            </View>
            <View>
              <Text style={{ color: c.muted, fontSize: 12 }}>{greeting} 👋</Text>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{userName || '...'}</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
            onPress={() => setShowProfile(true)}>
            {profilePhoto && (profilePhoto.startsWith('http') || profilePhoto.startsWith('file'))
              ? <Image source={{ uri: profilePhoto }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              : profilePhoto && profilePhoto.length <= 8
                ? <Text style={{ fontSize: 22 }}>{profilePhoto}</Text>
                : <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{userInitial}</Text>}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <TouchableOpacity
          style={{ backgroundColor: c.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}
          onPress={() => showCardsOk && setShowCards(!showCards)}
          activeOpacity={showCardsOk ? 0.85 : 1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
              {t('netWorth')}  {showCardsOk ? (showCards ? '▲' : '▼') : ''}
            </Text>
            {plan === 'trial' && trialDaysLeft > 0 && (
              <View style={{ backgroundColor: '#FFD70022', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#FFD70044' }}>
                <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: '700' }}>👑 {t('trialPlan')} · {trialDaysLeft}d</Text>
              </View>
            )}
            {(plan === 'pro' || plan === 'premium') && (
              <View style={{ backgroundColor: plan === 'premium' ? '#FFD70022' : '#6C63FF22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: plan === 'premium' ? '#FFD70044' : '#6C63FF44' }}>
                <Text style={{ color: plan === 'premium' ? '#FFD700' : '#6C63FF', fontSize: 10, fontWeight: '700' }}>
                  {plan === 'premium' ? '👑' : '⚡'} {plan === 'premium' ? t('premiumPlan') : t('proPlan')}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: netWorth < 0 ? '#FF6B6B' : c.text, fontSize: 36, fontWeight: '900', marginVertical: 6 }}>
            {netWorth < 0 ? '-' : ''}{formatAmount(Math.abs(netWorth))}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>↑ {t('income')}</Text>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalIncome)}</Text>
            </View>
            <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>↓ {t('expenses')}</Text>
              <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalExpense)}</Text>
            </View>
            {showCardsOk && (
              <>
                <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: c.muted, fontSize: 11 }}>💼 {t('assets')}</Text>
                  <Text style={{ color: '#a89fff', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalCustomAssets + totalInvest)}</Text>
                </View>
              </>
            )}
          </View>
          {showCardsOk
            ? <Text style={{ color: c.accent, fontSize: 11, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>{showCards ? t('tapToHide') : t('tapToView')}</Text>
            : <TouchableOpacity onPress={() => setShowPaywall(true)}><Text style={{ color: c.muted, fontSize: 11, marginTop: 10, textAlign: 'center' }}>🔒 {t('upgradeProCards')}</Text></TouchableOpacity>
          }
        </TouchableOpacity>

        {/* Cards & Investments */}
        {showCards && showCardsOk && (
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>💳 {t('cards')}</Text>
              <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddCard(true)}>
                <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>＋ {t('add')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {cards.length === 0 && (
                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20, width: 220 }}>
                  <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>{t('noCards')}</Text>
                </View>
              )}
              {cards.map(card => (
                <TouchableOpacity key={card.id} onLongPress={() => setCards(cards.filter(item => item.id !== card.id))}
                  style={{ width: 220, borderRadius: 18, padding: 16, marginRight: 12, height: 120, justifyContent: 'space-between', backgroundColor: card.color }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{card.bank}</Text>
                    <View style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{card.type}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: card.positive ? '#fff' : '#FF6B6B' }}>
                    {card.positive ? '' : '-'}{formatAmount(Math.abs(card.balance))}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1 }}>•••• •••• •••• {card.number}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAddCard(true)} style={{ width: 100, borderRadius: 18, height: 120, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent + '55', borderStyle: 'dashed' }}>
                <Ionicons name="add" size={28} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 11, marginTop: 4, fontWeight: '600' }}>{t('addCard')}</Text>
              </TouchableOpacity>
            </ScrollView>

            {showInvest ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>📈 {t('investments')}</Text>
                  <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddInv(true)}>
                    <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>＋ {t('add')}</Text>
                  </TouchableOpacity>
                </View>
                {investments.length === 0 && <View style={{ alignItems: 'center', padding: 20 }}><Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>{t('noInvestments')}</Text></View>}
                {investments.map(inv => (
                  <View key={inv.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                    <TouchableOpacity onLongPress={() => setInvestments(investments.filter(i => i.id !== inv.id))} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 20 }}>{inv.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{inv.name}</Text>
                        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{inv.sub}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                        <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{formatAmount(inv.value)}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: inv.up ? '#00D4AA' : '#FF6B6B' }}>{inv.up ? '▲' : '▼'} {inv.change}%</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditInv(inv)} style={{ backgroundColor: c.card2, borderRadius: 8, padding: 6, borderWidth: 1, borderColor: c.border }}>
                      <Ionicons name="create-outline" size={16} color={c.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setShowAddInv(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
                  <Ionicons name="add-circle-outline" size={16} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{t('addInvestment')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="lock-closed" size={14} color={c.muted} />
                <Text style={{ color: c.muted, fontSize: 13 }}>{t('upgradePremiumInvest')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 }}>
          {selectedTabs.map(action => (
            <TouchableOpacity key={action.label}
              style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, flex: 1, borderWidth: 1, borderColor: c.border }}
              onPress={() => router.push(action.route as any)}>
              <Ionicons name={action.icon as any} size={22} color={c.accent} />
              <Text style={{ color: c.muted, fontSize: 10, marginTop: 6, fontWeight: '600', textAlign: 'center' }}>{action.display}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.accent + '55', justifyContent: 'center' }}
            onPress={() => setShowTabPicker(true)}>
            <Ionicons name="create" size={22} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 10, marginTop: 6, fontWeight: '600', textAlign: 'center' }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity
          style={{ backgroundColor: c.card, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: showSearch ? c.accent : c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}
          onPress={() => setShowSearch(!showSearch)}>
          <Ionicons name="search" size={18} color={showSearch ? c.accent : c.muted} />
          <Text style={{ color: showSearch ? c.accent : c.muted, fontSize: 14, fontWeight: '600' }}>{t('searchTransactions')}</Text>
        </TouchableOpacity>

        {showSearch && (
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.accent + '4D' }}>
            <TextInput style={{ color: c.text, fontSize: 15, paddingVertical: 4, marginBottom: 10 }} placeholder={t('searchTransactions')} placeholderTextColor={c.muted} value={search} onChangeText={setSearch} autoFocus />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['all', 'income', 'expense'] as const).map(f => (
                <TouchableOpacity key={f} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: filter === f ? c.accent : c.card2, borderWidth: 1, borderColor: filter === f ? c.accent : c.border }} onPress={() => setFilter(f)}>
                  <Text style={{ color: filter === f ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>
                    {t(f === 'all' ? 'all' : f === 'income' ? 'income' : 'expense')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ad banner */}
        {!hasFeature('adFree') && (
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="megaphone-outline" size={16} color={c.muted} />
            <Text style={{ color: c.muted, fontSize: 12, flex: 1 }}>{t('advertisement')} — {t('upgradeRemoveAds')}</Text>
          </TouchableOpacity>
        )}

        {/* Recurring Bills bar — now shows live summary */}
        <TouchableOpacity
          onPress={() => setShowBills(true)}
          style={{ backgroundColor: c.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF6B6B18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="repeat" size={18} color="#FF6B6B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Recurring Bills</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 1 }}>
              {bills.length > 0
                ? `${bills.length} bill${bills.length !== 1 ? 's' : ''} · ${formatAmount(totalMonthlyBills)}/mo`
                : 'Tap to manage recurring bills'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </TouchableOpacity>

        {/* Transactions */}
        <View style={{ marginBottom: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{t('recentTransactions')}</Text>
            <TouchableOpacity
              style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: c.accent + '55', flexDirection: 'row', alignItems: 'center', gap: 5 }}
              onPress={() => setShowAddTxn(true)}>
              <Ionicons name="add" size={14} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{t('add')}</Text>
            </TouchableOpacity>
          </View>

          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', padding: 30 }}>
              <Ionicons name="receipt-outline" size={48} color={c.muted} style={{ marginBottom: 10 }} />
              <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center' }}>{t('noTransactions')}</Text>
            </View>
          )}

          {/* FIX: tap opens edit modal, long press deletes */}
          {displayTxns.map(txn => (
            <TouchableOpacity key={txn.id}
              onPress={() => openEditTxn(txn)}
              onLongPress={() => deleteTxn(txn.id)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 18 }}>{txn.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{txn.name}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{txn.cat}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: txn.amount > 0 ? '#00D4AA' : '#FF6B6B' }}>
                {txn.amount > 0 ? '+' : '-'}{formatAmount(Math.abs(txn.amount))}
              </Text>
            </TouchableOpacity>
          ))}

          {!hasFeature('unlimitedTransactions') && transactions.length > maxTransactions && (
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent + '18', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: c.accent + '44', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="lock-closed" size={14} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>{t('upgradeProCards')} — {transactions.length - maxTransactions} more hidden</Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>Tap to edit · Long press to delete</Text>
        </View>

        {/* ── Modals ── */}

        {/* Tab Picker */}
        <Modal visible={showTabPicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 6 }}>{t('customiseQuickActions')}</Text>
              <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>{t('chooseShortcuts')} ({selectedTabs.length}/3)</Text>
              {ALL_TABS.map(tab => {
                const isSel = !!selectedTabs.find(t => t.label === tab.label);
                const isDis = !isSel && selectedTabs.length >= 3;
                return (
                  <TouchableOpacity key={tab.label}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: isSel ? c.accent : c.border, opacity: isDis ? 0.4 : 1 }}
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('addCard')}</Text>
              {[
                { label: t('bankName'), val: newBank, set: setNewBank, ph: 'e.g. Barclays', kb: 'default' as const },
                { label: t('cardType'), val: newCardType, set: setNewCardType, ph: 'e.g. Debit · Visa', kb: 'default' as const },
                { label: `${t('balance')} (${currencySymbol})`, val: newBalance, set: setNewBalance, ph: 'e.g. 1500.00', kb: 'decimal-pad' as const },
                { label: t('lastFourDigits'), val: newNumber, set: setNewNumber, ph: 'e.g. 1234', kb: 'number-pad' as const },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                </View>
              ))}
              <TouchableOpacity onPress={() => setNewBalanceNegative(!newBalanceNegative)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card2, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: newBalanceNegative ? '#FF6B6B' : c.border, gap: 12 }}>
                <Ionicons name="card-outline" size={20} color={newBalanceNegative ? '#FF6B6B' : c.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Negative Balance</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Overdraft or credit card debt</Text>
                </View>
                <View style={{ width: 46, height: 26, borderRadius: 50, backgroundColor: newBalanceNegative ? '#FF6B6B' : c.card, borderWidth: 1, borderColor: newBalanceNegative ? '#FF6B6B' : c.border, position: 'relative' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: newBalanceNegative ? '#fff' : c.muted, position: 'absolute', top: 2, left: newBalanceNegative ? 22 : 2 }} />
                </View>
              </TouchableOpacity>
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('cardColour')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                  {CARD_COLORS.map(col => (
                    <TouchableOpacity key={col} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col, borderWidth: 2.5, borderColor: newCardColor === col ? '#fff' : 'transparent' }} onPress={() => setNewCardColor(col)} />
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('addInvestment')}</Text>
              {[
                { label: t('name'), val: newInvName, set: setNewInvName, ph: 'e.g. Apple Inc.', kb: 'default' as const },
                { label: t('details'), val: newInvSub, set: setNewInvSub, ph: 'e.g. AAPL · 10 shares', kb: 'default' as const },
                { label: `${t('currentValue')} (${currencySymbol})`, val: newInvValue, set: setNewInvValue, ph: 'e.g. 1500.00', kb: 'decimal-pad' as const },
                { label: t('changePercent'), val: newInvChange, set: setNewInvChange, ph: 'e.g. 2.5', kb: 'decimal-pad' as const },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: newInvUp ? '#00D4AA22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: newInvUp ? '#00D4AA' : c.border }} onPress={() => setNewInvUp(true)}>
                  <Text style={{ color: newInvUp ? '#00D4AA' : c.muted, fontWeight: '700' }}>▲ Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: !newInvUp ? '#FF6B6B22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: !newInvUp ? '#FF6B6B' : c.border }} onPress={() => setNewInvUp(false)}>
                  <Text style={{ color: !newInvUp ? '#FF6B6B' : c.muted, fontWeight: '700' }}>▼ Down</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddInv(false)}>
                  <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newInvName || !newInvValue) ? 0.4 : 1 }} onPress={addInvestment}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t('add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Investment */}
        <Modal visible={!!editInv} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>✏️ Edit Investment</Text>
              {[
                { label: t('name'), val: editInvName, set: setEditInvName, ph: 'e.g. Apple Inc.', kb: 'default' as const },
                { label: t('details'), val: editInvSub, set: setEditInvSub, ph: 'e.g. AAPL · 10 shares', kb: 'default' as const },
                { label: `${t('currentValue')} (${currencySymbol})`, val: editInvValue, set: setEditInvValue, ph: 'e.g. 1500.00', kb: 'decimal-pad' as const },
                { label: t('changePercent'), val: editInvChange, set: setEditInvChange, ph: 'e.g. 2.5', kb: 'decimal-pad' as const },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                </View>
              ))}
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('addTransaction')}</Text>
              <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 50, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: newTxnType === 'expense' ? '#FF6B6B' : 'transparent' }} onPress={() => setNewTxnType('expense')}>
                  <Text style={{ color: newTxnType === 'expense' ? '#fff' : c.muted, fontWeight: '700' }}>↓ {t('expense')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: newTxnType === 'income' ? '#00D4AA' : 'transparent' }} onPress={() => setNewTxnType('income')}>
                  <Text style={{ color: newTxnType === 'income' ? '#fff' : c.muted, fontWeight: '700' }}>↑ {t('income')}</Text>
                </TouchableOpacity>
              </View>
              {[
                { label: t('name'), val: newTxnName, set: setNewTxnName, ph: 'e.g. Tesco', kb: 'default' as const },
                { label: `${t('amount')} (${currencySymbol})`, val: newTxnAmt, set: setNewTxnAmt, ph: 'e.g. 42.80', kb: 'decimal-pad' as const },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                </View>
              ))}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('category')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {Object.keys(CAT_ICONS).slice(0, 13).map(cat => (
                  <TouchableOpacity key={cat} style={{ backgroundColor: newTxnCat === cat ? c.accent : c.card2, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: newTxnCat === cat ? c.accent : c.border }} onPress={() => setNewTxnCat(cat)}>
                    <Text style={{ color: newTxnCat === cat ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{CAT_ICONS[cat]} {cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '900' }}>✏️ Edit Transaction</Text>
                <TouchableOpacity onPress={() => editTxn && deleteTxn(editTxn.id)}
                  style={{ backgroundColor: '#FF6B6B18', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 50, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: editTxnType === 'expense' ? '#FF6B6B' : 'transparent' }} onPress={() => setEditTxnType('expense')}>
                  <Text style={{ color: editTxnType === 'expense' ? '#fff' : c.muted, fontWeight: '700' }}>↓ {t('expense')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: editTxnType === 'income' ? '#00D4AA' : 'transparent' }} onPress={() => setEditTxnType('income')}>
                  <Text style={{ color: editTxnType === 'income' ? '#fff' : c.muted, fontWeight: '700' }}>↑ {t('income')}</Text>
                </TouchableOpacity>
              </View>
              {[
                { label: t('name'), val: editTxnName, set: setEditTxnName, ph: 'e.g. Tesco', kb: 'default' as const },
                { label: `${t('amount')} (${currencySymbol})`, val: editTxnAmt, set: setEditTxnAmt, ph: 'e.g. 42.80', kb: 'decimal-pad' as const },
              ].map((f, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                </View>
              ))}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('category')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {Object.keys(CAT_ICONS).slice(0, 13).map(cat => (
                  <TouchableOpacity key={cat} style={{ backgroundColor: editTxnCat === cat ? c.accent : c.card2, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: editTxnCat === cat ? c.accent : c.border }} onPress={() => setEditTxnCat(cat)}>
                    <Text style={{ color: editTxnCat === cat ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{CAT_ICONS[cat]} {cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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