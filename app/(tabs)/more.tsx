import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { useTheme } from '../../context/ThemeContext';

// ── Types ──────────────────────────────────────────────────────────────────────
type PayFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
type IncomeSource = {
  id: string;
  label: string;       // e.g. "Main Job", "Freelance"
  amount: number;      // take-home amount per frequency
  frequency: PayFrequency;
  paydayDay: number;   // 1-31 day of month (or week day 1-7 for weekly)
  emoji: string;
};

const PAY_FREQS: { key: PayFrequency; label: string; tKey: string }[] = [
  { key: 'weekly',      label: 'Weekly',      tKey: 'weekly'      },
  { key: 'fortnightly', label: 'Fortnightly', tKey: 'fortnightly' },
  { key: 'monthly',     label: 'Monthly',     tKey: 'monthly'     },
  { key: 'yearly',      label: 'Yearly',      tKey: 'yearly'      },
];

const INCOME_EMOJIS = ['💼','💰','🏦','📊','🖥️','🔧','🎨','🚚','👨‍⚕️','👨‍🏫','🏪','📱'];

const COMING_SOON_ITEMS: { icon: string; titleKey: string; descKey: string }[] = [
  { icon: 'business',           titleKey: 'comingSoonBankSync',   descKey: 'comingSoonBankSyncDesc'   },
  { icon: 'pie-chart',          titleKey: 'comingSoonBudgets',    descKey: 'comingSoonBudgetsDesc'    },
  { icon: 'people',             titleKey: 'comingSoonShared',     descKey: 'comingSoonSharedDesc'     },
  { icon: 'hardware-chip',      titleKey: 'comingSoonAIInsights', descKey: 'comingSoonAIInsightsDesc' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function toMonthly(amount: number, freq: PayFrequency): number {
  switch (freq) {
    case 'weekly':      return amount * 4.33;
    case 'fortnightly': return amount * 2.17;
    case 'monthly':     return amount;
    case 'yearly':      return amount / 12;
  }
}

function nextPaydate(paydayDay: number, freq: PayFrequency): string {
  const now = new Date();
  let next = new Date(now);
  if (freq === 'monthly' || freq === 'yearly') {
    next.setDate(paydayDay);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (freq === 'weekly') {
    const diff = (paydayDay - now.getDay() + 7) % 7 || 7;
    next.setDate(now.getDate() + diff);
  } else {
    // fortnightly — just add 14 days from today as approximation
    next.setDate(now.getDate() + 14);
  }
  return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function MoreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { transactions } = useFinance();
  const { formatAmount, convertPrice, currencySymbol, t } = useLocale();
  const router = useRouter();

  const [showPaywall,      setShowPaywall]      = useState(false);
  const [comingSoonOpen,   setComingSoonOpen]   = useState(false);
  const [incomeOpen,       setIncomeOpen]       = useState(false);
  const [showAddIncome,    setShowAddIncome]    = useState(false);
  const [editingIncome,    setEditingIncome]    = useState<IncomeSource | null>(null);
  const [sources,          setSources]          = useState<IncomeSource[]>([]);
  const [storageKey,       setStorageKey]       = useState('polar_income_local');

  // ── Form state ─────────────────────────────────────────────────────────────
  const [fLabel,   setFLabel]   = useState('');
  const [fAmount,  setFAmount]  = useState('');
  const [fFreq,    setFFreq]    = useState<PayFrequency>('monthly');
  const [fDay,     setFDay]     = useState('25');
  const [fEmoji,   setFEmoji]   = useState('💼');
  const [fSaved,   setFSaved]   = useState(false);

  // ── Load income sources ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const key = `polar_income_${user?.id || 'local'}`;
        setStorageKey(key);
        const raw = await AsyncStorage.getItem(key);
        if (raw) setSources(JSON.parse(raw));
      } catch {}
    };
    load();
  }, []);

  const saveSources = async (data: IncomeSource[]) => {
    setSources(data);
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFLabel(''); setFAmount(''); setFFreq('monthly');
    setFDay('25'); setFEmoji('💼'); setFSaved(false); setEditingIncome(null);
  };

  const openAdd = () => { resetForm(); setShowAddIncome(true); };

  const openEdit = (src: IncomeSource) => {
    setEditingIncome(src);
    setFLabel(src.label); setFAmount(src.amount.toString());
    setFFreq(src.frequency); setFDay(src.paydayDay.toString()); setFEmoji(src.emoji);
    setShowAddIncome(true);
  };

  const handleSave = async () => {
    if (!fLabel || !fAmount) return;
    const entry: IncomeSource = {
      id: editingIncome?.id || Date.now().toString(),
      label: fLabel, amount: parseFloat(fAmount),
      frequency: fFreq, paydayDay: parseInt(fDay) || 1, emoji: fEmoji,
    };
    const updated = editingIncome
      ? sources.map(s => s.id === editingIncome.id ? entry : s)
      : [...sources, entry];
    await saveSources(updated);
    setFSaved(true);
    setTimeout(() => { setShowAddIncome(false); resetForm(); }, 1200);
  };

  const handleDelete = async (id: string) => {
    await saveSources(sources.filter(s => s.id !== id));
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalMonthlyIncome = sources.reduce((s, src) => s + toMonthly(src.amount, src.frequency), 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalIncome  = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalSaved   = totalIncome - totalExpense;
  const leftToSpend  = totalMonthlyIncome - totalExpense;

  const menuItems = [
    { icon: 'trending-up',  label: t('markets'),        sub: t('marketsDescription')    || 'Live signals & forecasts',       route: '/(tabs)/explore',  lock: true,  feature: 'investmentTracking' },
    { icon: 'calendar',     label: t('calendar'),       sub: t('calendarDescription')   || 'View transactions by date',      route: '/(tabs)/calendar', lock: false },
    { icon: 'flag',         label: t('savingGoals'),    sub: t('goalsDescription')      || 'Track your saving goals',        route: '/(tabs)/goals',    lock: false },
    { icon: 'briefcase',    label: t('assets'),         sub: t('assetsDescription')     || 'Cards, investments & property',  route: '/(tabs)/assets',   lock: true,  feature: 'investmentTracking' },
    { icon: 'receipt',      label: 'Tax Helper',        sub: 'Estimate tax, bands & checklist',                              route: '/(tabs)/tax',      lock: false },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 8 }}>{t('more')}</Text>
      <Text style={{ color: c.muted, fontSize: 14, marginBottom: 28 }}>{t('allFeatures')}</Text>

      {/* ── Features ── */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 24 }}>
        {menuItems.map((item, i) => {
          const locked = item.lock && !hasFeature(item.feature as any);
          return (
            <TouchableOpacity key={i}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 14, opacity: locked ? 0.6 : 1 }}
              onPress={() => locked ? setShowPaywall(true) : router.push(item.route as any)}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={item.icon as any} size={22} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
              </View>
              {locked
                ? <Ionicons name="lock-closed" size={16} color={c.muted} />
                : <Ionicons name="chevron-forward" size={18} color={c.muted} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Income Section ── */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('myIncome')}</Text>
      <TouchableOpacity
        onPress={() => setIncomeOpen(o => !o)}
        style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="wallet" size={22} color="#00D4AA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t('myIncome')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
              {sources.length > 0
                ? `${sources.length} source${sources.length !== 1 ? 's' : ''} · ${formatAmount(totalMonthlyIncome)}${t('perMonth')}`
                : t('addIncomePrompt')}
            </Text>
          </View>
          <Ionicons name={incomeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </View>

        {incomeOpen && (
          <View style={{ borderTopWidth: 1, borderTopColor: c.border }}>

            {/* Summary bar */}
            {sources.length > 0 && (
              <View style={{ margin: 16, backgroundColor: c.card2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border }}>
                <View style={{ flexDirection: 'row', gap: 0 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{t('monthly')}</Text>
                    <Text style={{ color: '#00D4AA', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalMonthlyIncome)}</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600' }}>{t('leftToSpend')}</Text>
                    <Text style={{ color: leftToSpend >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 4 }}>
                      {leftToSpend < 0 ? '-' : ''}{formatAmount(Math.abs(leftToSpend))}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>{t('leftToSpendDesc')}</Text>
              </View>
            )}

            {/* Empty state */}
            {sources.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>💰</Text>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>{t('noIncomeSet')}</Text>
                <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>{t('addIncomePrompt')}</Text>
              </View>
            )}

            {/* Source list */}
            {sources.map((src, i) => (
              <View key={src.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i === 0 && sources.length > 0 ? 0 : 1, borderTopColor: c.border, gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{src.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{src.label}</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                    {PAY_FREQS.find(f => f.key === src.frequency)?.label} · {t('nextPayday')}: {nextPaydate(src.paydayDay, src.frequency)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '800' }}>{formatAmount(src.amount)}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => openEdit(src)}>
                      <Ionicons name="create-outline" size={16} color={c.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(src.id)}>
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Add button */}
            <TouchableOpacity
              onPress={openAdd}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, backgroundColor: '#00D4AA18', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#00D4AA44', borderStyle: 'dashed' }}>
              <Ionicons name="add-circle-outline" size={18} color="#00D4AA" />
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700' }}>{t('addIncomeSource')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
      <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginBottom: 24 }}>{t('longPressDelete')}</Text>

      {/* ── Quick Stats ── */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('quickStats')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'calendar-outline', color: c.accent,  value: transactions.length,       label: t('transactions') },
          { icon: 'wallet-outline',   color: totalSaved >= 0 ? '#00D4AA' : '#FF6B6B', value: formatAmount(Math.abs(totalSaved)), label: totalSaved >= 0 ? t('saved') : t('overspent') },
          { icon: 'trending-down',    color: '#FF6B6B', value: transactions.filter(tx => tx.type === 'expense').length, label: t('expenses') },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
            <Text style={{ color: item.color, fontSize: typeof item.value === 'number' ? 20 : 15, fontWeight: '900', marginTop: 8 }}>{item.value}</Text>
            <Text style={{ color: c.muted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Coming Soon ── */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('comingSoon')}</Text>
      <TouchableOpacity
        onPress={() => setComingSoonOpen(o => !o)}
        style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', overflow: 'hidden', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>🚀</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t('comingSoon')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('comingSoonSub')}</Text>
          </View>
          <View style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: c.accent + '44', marginRight: 6 }}>
            <Text style={{ color: c.accent, fontSize: 10, fontWeight: '700' }}>{COMING_SOON_ITEMS.length} new</Text>
          </View>
          <Ionicons name={comingSoonOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </View>

        {comingSoonOpen && (
          <View style={{ borderTopWidth: 1, borderTopColor: c.border }}>
            {COMING_SOON_ITEMS.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.border, gap: 14 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={item.icon as any} size={22} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{t(item.titleKey)}</Text>
                    <View style={{ backgroundColor: '#FFD70022', borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#FFD70044' }}>
                      <Text style={{ color: '#FFD700', fontSize: 9, fontWeight: '700' }}>SOON</Text>
                    </View>
                  </View>
                  <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t(item.descKey)}</Text>
                </View>
              </View>
            ))}
            <View style={{ padding: 16, paddingTop: 0 }}>
              <View style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
                <Text style={{ color: c.muted, fontSize: 12, textAlign: 'center' }}>
                  💡 Have a feature request? Email us at{'\n'}
                  <Text style={{ color: c.accent, fontWeight: '600' }}>contact@polarfinance.app</Text>
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Upgrade prompt ── */}
      {!hasFeature('customTheme') && (
        <View style={{ backgroundColor: c.accent + '18', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.accent + '44', marginBottom: 40 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>👑 {t('upgradePremium')}</Text>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{t('unlockFeatures')}</Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{t('viewPlans')} — {t('from')} {convertPrice(3.99)}{t('perMonth')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Add / Edit Income Modal ── */}
      <Modal visible={showAddIncome} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 24 }}>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>
                {editingIncome ? t('editIncome') : t('addIncomeSource')}
              </Text>

              {/* Label */}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('incomeSource')}</Text>
              <TextInput
                style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                placeholder="e.g. Main Job, Freelance"
                placeholderTextColor={c.muted}
                value={fLabel}
                onChangeText={setFLabel}
              />

              {/* Amount */}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('salaryAmount')} ({currencySymbol})</Text>
              <TextInput
                style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                placeholder="e.g. 2500"
                placeholderTextColor={c.muted}
                keyboardType="decimal-pad"
                value={fAmount}
                onChangeText={setFAmount}
              />

              {/* Frequency */}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('incomeFrequency')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {PAY_FREQS.map(f => (
                  <TouchableOpacity key={f.key} onPress={() => setFFreq(f.key)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: fFreq === f.key ? '#00D4AA' : c.card2, borderWidth: 1, borderColor: fFreq === f.key ? '#00D4AA' : c.border }}>
                    <Text style={{ color: fFreq === f.key ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{t(f.tKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Payday */}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('paydayDay')} (1–31)</Text>
              <TextInput
                style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                placeholder="e.g. 25"
                placeholderTextColor={c.muted}
                keyboardType="number-pad"
                value={fDay}
                onChangeText={setFDay}
              />

              {/* Emoji */}
              <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickIcon')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {INCOME_EMOJIS.map(ic => (
                  <TouchableOpacity key={ic}
                    style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: fEmoji === ic ? '#00D4AA' : 'transparent' }}
                    onPress={() => setFEmoji(ic)}>
                    <Text style={{ fontSize: 22 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              {fSaved ? (
                <View style={{ backgroundColor: '#00D4AA', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 40 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>✓ {t('incomeAdded')}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 40 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => { setShowAddIncome(false); resetForm(); }}>
                    <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#00D4AA', borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!fLabel || !fAmount) ? 0.4 : 1 }}
                    onPress={handleSave} disabled={!fLabel || !fAmount}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}