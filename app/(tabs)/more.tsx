import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { IncomeSource, useUserData } from '@/context/UserDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

type PayFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
// IncomeSource imported from UserDataContext

const PAY_FREQS: { key: PayFrequency; label: string; tKey: string }[] = [
  { key: 'weekly', label: 'Weekly', tKey: 'weekly' },
  { key: 'fortnightly', label: 'Fortnightly', tKey: 'fortnightly' },
  { key: 'monthly', label: 'Monthly', tKey: 'monthly' },
  { key: 'yearly', label: 'Yearly', tKey: 'yearly' },
];

const INCOME_ICONS = ['briefcase', 'cash', 'business', 'bar-chart', 'desktop', 'construct', 'color-palette', 'car', 'medkit', 'school', 'storefront', 'phone-portrait'] as const;
type IncomeIcon = typeof INCOME_ICONS[number];

const COMING_SOON_ITEMS = [
  { icon: 'business', titleKey: 'comingSoonBankSync', descKey: 'comingSoonBankSyncDesc' },
  { icon: 'pie-chart', titleKey: 'comingSoonBudgets', descKey: 'comingSoonBudgetsDesc' },
  { icon: 'people', titleKey: 'comingSoonShared', descKey: 'comingSoonSharedDesc' },
  { icon: 'hardware-chip', titleKey: 'comingSoonAIInsights', descKey: 'comingSoonAIInsightsDesc' },
];

function toMonthly(amount: number, freq: PayFrequency) {
  switch (freq) {
    case 'weekly': return amount * 4.33;
    case 'fortnightly': return amount * 2.17;
    case 'monthly': return amount;
    case 'yearly': return amount / 12;
  }
}

function nextPaydate(paydayDay: number, freq: PayFrequency) {
  const now = new Date();
  const next = new Date(now);
  if (freq === 'monthly' || freq === 'yearly') {
    next.setDate(paydayDay);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (freq === 'weekly') {
    const diff = (paydayDay - now.getDay() + 7) % 7 || 7;
    next.setDate(now.getDate() + diff);
  } else {
    next.setDate(now.getDate() + 14);
  }
  return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCompact(val: string | number, formatAmount: (n: number) => string, currencySymbol?: string): string {
  const sym = currencySymbol || '';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return sym + (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (Math.abs(val) >= 1_000) return sym + (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return formatAmount(val);
  }
  return val;
}

export default function MoreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { transactions } = useFinance();
  const { formatAmount, convertPrice, currencySymbol, t } = useLocale();
  const router = useRouter();

  const { incomeSources: sources, setIncomeSources: setSources } = useUserData();


  const [showPaywall, setShowPaywall] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);

  const [fLabel, setFLabel] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fFreq, setFFreq] = useState<PayFrequency>('monthly');
  const [fDay, setFDay] = useState('25');
  const [fEmoji, setFEmoji] = useState<string>('briefcase');
  const [fSaved, setFSaved] = useState(false);

  const saveSources = (data: IncomeSource[]) => setSources(data);

  const resetForm = () => { setFLabel(''); setFAmount(''); setFFreq('monthly'); setFDay('25'); setFEmoji('briefcase'); setFSaved(false); setEditingIncome(null); };
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
    const updated = editingIncome ? sources.map(s => s.id === editingIncome.id ? entry : s) : [...sources, entry];
    saveSources(updated);
    setFSaved(true);
    setTimeout(() => { setShowAddIncome(false); resetForm(); }, 1200);
  };

  const handleDelete = async (id: string) => saveSources(sources.filter(s => s.id !== id));

  const totalMonthlyIncome = sources.reduce((s, src) => s + toMonthly(src.amount, src.frequency), 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalSaved = Math.round(totalIncome - totalExpense);
  const leftToSpend = Math.round(totalMonthlyIncome - totalExpense);

  const menuItems = [
    { icon: 'trending-up', label: t('markets'), sub: 'Live signals & forecasts', route: '/(tabs)/explore', lock: true, feature: 'investmentTracking' },
    { icon: 'wallet', label: 'Budgets', sub: 'Set monthly spending limits', route: '/(tabs)/budgets', lock: false },
    { icon: 'calendar', label: t('calendar'), sub: 'View transactions by date', route: '/(tabs)/calendar', lock: false },
    { icon: 'flag', label: t('savingGoals'), sub: 'Track your saving goals', route: '/(tabs)/goals', lock: false },
    { icon: 'briefcase', label: t('assets'), sub: 'Cards, investments & property', route: '/(tabs)/assets', lock: true, feature: 'investmentTracking' },
    { icon: 'card', label: 'Credit Score', sub: 'Check your free credit score', route: '/(tabs)/credit', lock: false },
    { icon: 'receipt', label: 'Tax Helper', sub: 'Estimate tax, bands & checklist', route: '/(tabs)/tax', lock: false },
  ] as const; return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />

      {/* contentContainerStyle paddingBottom ensures bottom content is never hidden behind the tab bar */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 60, marginBottom: 28 }}>
          <View>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>{t('more')}</Text>
            <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>{t('allFeatures')}</Text>
          </View>

        </View>

        {/* Features */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 24 }}>
          {menuItems.map((item, i) => {
            const locked = item.lock && !hasFeature(item.feature as any);
            return (
              <TouchableOpacity key={i}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 14, opacity: locked ? 0.6 : 1 }}
                onPress={() => locked ? setShowPaywall(true) : router.push(item.route as any)}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + '12', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={item.icon as any} size={22} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
                </View>
                {locked ? <Ionicons name="lock-closed" size={16} color={c.muted} /> : <Ionicons name="chevron-forward" size={18} color={c.muted} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Income */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('myIncome')}</Text>
        <TouchableOpacity onPress={() => setIncomeOpen(o => !o)}
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
              {sources.length > 0 && (
                <View style={{ margin: 16, backgroundColor: c.card2, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border }}>
                  <View style={{ flexDirection: 'row' }}>
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
                </View>
              )}
              {sources.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }}>
                  <Ionicons name="wallet-outline" size={40} color={c.muted} style={{ marginBottom: 10 }} />
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>{t('noIncomeSet')}</Text>
                  <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>{t('addIncomePrompt')}</Text>
                </View>
              )}
              {sources.map((src) => (
                <View key={src.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.border, gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={(src.emoji || 'briefcase') as any} size={22} color="#00D4AA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{src.label}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                      {PAY_FREQS.find(f => f.key === src.frequency)?.label} · Next: {nextPaydate(src.paydayDay, src.frequency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '800' }}>{formatAmount(src.amount)}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => openEdit(src)}><Ionicons name="create-outline" size={16} color={c.accent} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(src.id)}><Ionicons name="trash-outline" size={16} color="#FF6B6B" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={openAdd}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, backgroundColor: '#00D4AA18', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#00D4AA44', borderStyle: 'dashed' }}>
                <Ionicons name="add-circle-outline" size={18} color="#00D4AA" />
                <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700' }}>{t('addIncomeSource')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
        <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginBottom: 24 }}>{t('longPressDelete')}</Text>

        {/* Quick Stats */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('quickStats')}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {[
            { icon: 'calendar-outline', color: c.accent, value: transactions.length, label: t('transactions') },
            { icon: 'wallet-outline', color: totalSaved >= 0 ? '#00D4AA' : '#FF6B6B', value: formatCompact(Math.abs(totalSaved), formatAmount, currencySymbol), label: totalSaved >= 0 ? t('saved') : t('overspent') },
            { icon: 'trending-down', color: '#FF6B6B', value: transactions.filter(tx => tx.type === 'expense').length, label: t('expenses') },
          ].map((item, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
              <Text style={{ color: item.color, fontSize: 16, fontWeight: '900', marginTop: 8, textAlign: 'center' }}>{item.value}</Text>
              <Text style={{ color: c.muted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Coming Soon */}
        <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('comingSoon')}</Text>
        <TouchableOpacity onPress={() => setComingSoonOpen(o => !o)}
          style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', overflow: 'hidden', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + '12', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="rocket" size={22} color={c.accent} />
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
                    Have a feature request? Email us at{'\n'}
                    <Text style={{ color: c.accent, fontWeight: '600' }}>contact@jamesfinance.app</Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Upgrade */}
        {!hasFeature('customTheme') && (
          <View style={{ backgroundColor: c.accent + '18', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.accent + '44', marginBottom: 16 }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>{t('upgradePremium')}</Text>
            <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{t('unlockFeatures')}</Text>
            <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {t('viewPlans')} — {t('from')} {convertPrice(3.99)}{t('perMonth')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add / Edit Income Modal */}
        <Modal visible={showAddIncome} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <ScrollView
              style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ padding: 24 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>
                  {editingIncome ? t('editIncome') : t('addIncomeSource')}
                </Text>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('incomeSource')}</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                  placeholder="e.g. Main Job, Freelance" placeholderTextColor={c.muted} value={fLabel} onChangeText={setFLabel} />
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{t('salaryAmount')} ({currencySymbol})</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                  placeholder="e.g. 2500" placeholderTextColor={c.muted} keyboardType="decimal-pad" value={fAmount} onChangeText={setFAmount} />
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('incomeFrequency')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {PAY_FREQS.map(f => (
                    <TouchableOpacity key={f.key} onPress={() => setFFreq(f.key)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: fFreq === f.key ? '#00D4AA' : c.card2, borderWidth: 1, borderColor: fFreq === f.key ? '#00D4AA' : c.border }}>
                      <Text style={{ color: fFreq === f.key ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{t(f.tKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Payday (1-31)</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, marginBottom: 14 }}
                  placeholder="e.g. 25" placeholderTextColor={c.muted} keyboardType="number-pad" value={fDay} onChangeText={setFDay} />
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('pickIcon')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {INCOME_ICONS.map(ic => (
                    <TouchableOpacity key={ic} onPress={() => setFEmoji(ic)}
                      style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: fEmoji === ic ? '#00D4AA' : 'transparent' }}>
                      <Ionicons name={ic as any} size={22} color={fEmoji === ic ? '#00D4AA' : c.muted} />
                    </TouchableOpacity>
                  ))}
                </View>
                {fSaved ? (
                  <View style={{ backgroundColor: '#00D4AA', borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{t('incomeAdded')}</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }}
                      onPress={() => { setShowAddIncome(false); resetForm(); }}>
                      <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#00D4AA', borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!fLabel || !fAmount) ? 0.4 : 1 }}
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
    </View>
  );
}