import { useFinance } from '@/context/FinanceContext';
import { usePlan } from '@/context/PlanContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const menuItems = [
  { icon: '📈', label: 'Markets',    sub: 'Live signals, forecasts & trending picks', route: '/(tabs)/explore', lock: true,  feature: 'investmentTracking' },
  { icon: '🗓️', label: 'Calendar',  sub: 'View monthly transactions',                route: '/(tabs)/calendar', lock: false },
  { icon: '🎯', label: 'Goals',      sub: 'Track your saving goals',                  route: '/(tabs)/goals',    lock: false },
  { icon: '💼', label: 'Assets',     sub: 'Cards, investments & property',            route: '/(tabs)/assets',   lock: true,  feature: 'investmentTracking' },
  { icon: '👨‍👩‍👧‍👦', label: 'Family', sub: 'Family overview & shared goals',           route: '/(tabs)/family',   lock: true,  feature: 'familyView' },
];

export default function MoreScreen() {
  const { theme: c } = useTheme();
  const { hasFeature } = usePlan();
  const { transactions } = useFinance();
  const router = useRouter();

  const totalSaved = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0)
                   - transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 8 }}>More</Text>
      <Text style={{ color: c.muted, fontSize: 14, marginBottom: 28 }}>All your Polar Finance features in one place</Text>

      {/* Main Menu */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Features</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: 24 }}>
        {menuItems.map((item, i) => {
          const locked = item.lock && !hasFeature(item.feature as any);
          return (
            <TouchableOpacity
              key={i}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < menuItems.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 14, opacity: locked ? 0.6 : 1 }}
              onPress={() => router.push(item.route as any)}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
              </View>
              {locked
                ? <Text style={{ color: c.muted, fontSize: 13 }}>🔒</Text>
                : <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
              }
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Stats — real data */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Quick Stats</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>📅</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginTop: 8 }}>{transactions.length}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Transactions</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>💰</Text>
          <Text style={{ color: totalSaved >= 0 ? '#00D4AA' : '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 8 }}>£{Math.abs(totalSaved).toFixed(0)}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{totalSaved >= 0 ? 'Saved' : 'Deficit'}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>📊</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginTop: 8 }}>
            {transactions.filter(t => t.type === 'expense').length}
          </Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Expenses</Text>
        </View>
      </View>

      {/* Upgrade Banner */}
      {!hasFeature('customTheme') && (
        <View style={{ backgroundColor: c.accent + '18', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.accent + '44', marginBottom: 40 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>👑 Upgrade to Premium</Text>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>Unlock Markets, Assets, Family overview, custom themes, live trading signals and more.</Text>
          <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>View Plans — from £3.99/mo</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}