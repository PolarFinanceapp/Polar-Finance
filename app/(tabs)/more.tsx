import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
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
    { icon: '📈', label: t('markets'),  sub: t('marketsDescription') || 'Live signals, forecasts & trending picks', route: '/(tabs)/explore',  lock: true,  feature: 'investmentTracking' },
    { icon: '🗓️', label: t('calendar') || 'Calendar', sub: t('recentTransactions'),  route: '/(tabs)/calendar', lock: false },
    { icon: '🎯', label: t('savingGoals') || 'Goals',  sub: t('target'),              route: '/(tabs)/goals',    lock: false },
    { icon: '💼', label: t('assets'),    sub: t('assetsDescription') || 'Cards, investments & property', route: '/(tabs)/assets', lock: true, feature: 'investmentTracking' },
  ];

  const totalSaved = transactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0)
                   - transactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 8 }}>{t('more')}</Text>
      <Text style={{ color: c.muted, fontSize: 14, marginBottom: 28 }}>{t('allFeatures')}</Text>

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 24 }}>
        {menuItems.map((item, i) => {
          const locked = item.lock && !hasFeature(item.feature as any);
          return (
            <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 14, opacity: locked ? 0.6 : 1 }}
              onPress={() => locked ? setShowPaywall(true) : router.push(item.route as any)}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
              </View>
              {locked ? <Text style={{ color: c.muted, fontSize: 13 }}>🔒</Text> : <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('quickStats')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>📅</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginTop: 8 }}>{transactions.length}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('transactions')}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>💰</Text>
          <Text style={{ color: totalSaved >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 8 }}>{formatAmount(Math.abs(totalSaved))}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{totalSaved >= 0 ? t('saved') : 'Deficit'}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>📊</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginTop: 8 }}>{transactions.filter(tx => tx.type === 'expense').length}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('expenses')}</Text>
        </View>
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