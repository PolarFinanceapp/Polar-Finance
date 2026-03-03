import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { useTheme } from '../../context/ThemeContext';

export default function MoreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { transactions } = useFinance();
  const { formatAmount, convertPrice, t } = useLocale();
  const router = useRouter();
  const [showPaywall, setShowPaywall] = useState(false);

  const menuItems = [
    { icon: 'trending-up',  label: t('markets'),            sub: t('marketsDescription') || 'Live signals & forecasts', route: '/(tabs)/explore',  lock: true,  feature: 'investmentTracking' },
    { icon: 'calendar',     label: t('calendar') || 'Calendar', sub: t('calendarDescription') || 'View transactions by date', route: '/(tabs)/calendar', lock: false },
    { icon: 'flag',         label: t('savingGoals') || 'Goals',  sub: t('goalsDescription') || 'Track your saving goals',    route: '/(tabs)/goals',    lock: false },
    { icon: 'briefcase',    label: t('assets'),             sub: t('assetsDescription') || 'Cards, investments & property', route: '/(tabs)/assets',   lock: true,  feature: 'investmentTracking' },
  ] as const;

  const totalIncome  = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalSaved   = totalIncome - totalExpense;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 8 }}>{t('more')}</Text>
      <Text style={{ color: c.muted, fontSize: 14, marginBottom: 28 }}>{t('allFeatures')}</Text>

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 24 }}>
        {menuItems.map((item, i) => {
          const locked = item.lock && !hasFeature(item.feature as any);
          return (
            <TouchableOpacity
              key={i}
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
                : <Ionicons name="chevron-forward" size={18} color={c.muted} />
              }
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('quickStats')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'calendar-outline',  color: c.accent,  value: transactions.length,                                       label: t('transactions') },
          { icon: 'wallet-outline',    color: totalSaved >= 0 ? '#00D4AA' : '#FF6B6B', value: formatAmount(Math.abs(totalSaved)), label: totalSaved >= 0 ? t('saved') : t('overspent') || 'Overspent' },
          { icon: 'trending-down',     color: '#FF6B6B', value: transactions.filter(tx => tx.type === 'expense').length,   label: t('expenses') },
        ].map((item, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
            <Text style={{ color: item.color, fontSize: typeof item.value === 'number' ? 20 : 15, fontWeight: '900', marginTop: 8 }}>{item.value}</Text>
            <Text style={{ color: c.muted, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {!hasFeature('customTheme') && (
        <View style={{ backgroundColor: c.accent + '18', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.accent + '44', marginBottom: 40 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>👑 {t('upgradePremium')}</Text>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{t('unlockFeatures')}</Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{t('viewPlans')} — {t('from')} {convertPrice(3.99)}{t('perMonth')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}