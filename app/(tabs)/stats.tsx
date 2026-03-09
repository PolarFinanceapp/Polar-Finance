import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { useTheme } from '../../context/ThemeContext';

const CATEGORY_COLORS: Record<string, string> = {
  'Housing': '#6C63FF', 'Groceries': '#00D4AA', 'Transport': '#FF6B6B',
  'Entertainment': '#FFD700', 'Health': '#FF9F43', 'Clothing': '#a89fff',
  'Utilities': '#00BFFF', 'Subscriptions': '#FF69B4', 'Food': '#FFA07A',
  'Income': '#00D4AA', 'Savings': '#32CD32', 'Shopping': '#FF6347', 'Other': '#9370DB',
  'FOOD_AND_DRINK': '#FFA07A', 'SHOPS': '#00D4AA', 'TRANSPORTATION': '#FF6B6B',
  'PAYMENT': '#6C63FF', 'TRANSFER': '#FFD700', 'RECREATION': '#FF9F43',
  'HEALTHCARE': '#FF69B4', 'HOME': '#6C63FF',
};

const CAT_ICON: Record<string, string> = {
  'Housing': '🏠', 'Groceries': '🛒', 'Transport': '🚗', 'Entertainment': '🎬',
  'Health': '💊', 'Clothing': '👗', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Food': '🍕', 'Income': '💼', 'Savings': '💰', 'Shopping': '📦', 'Other': '🎁',
  'FOOD_AND_DRINK': '🍕', 'SHOPS': '🛒', 'TRANSPORTATION': '🚗', 'PAYMENT': '💳',
  'TRANSFER': '💸', 'RECREATION': '🎬', 'HEALTHCARE': '💊', 'HOME': '🏠',
};

type Period = 'weekly' | 'monthly' | 'yearly';

// Parse DD/MM/YYYY or ISO date string → Date
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  const iso = new Date(dateStr);
  return isNaN(iso.getTime()) ? null : iso;
}

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function getPeriodLabel(period: Period): string {
  const now = new Date();
  if (period === 'weekly') {
    const start = getPeriodStart('weekly');
    return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} – Today`;
  }
  if (period === 'monthly') {
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  return `${now.getFullYear()}`;
}

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('monthly');
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount, convertPrice, t } = useLocale();
  const { hasFeature } = usePlan();
  const [showPaywall, setShowPaywall] = useState(false);

  if (!hasFeature('advancedCharts')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>📊</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>{t('stats')}</Text>
        <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{t('linkBankOrAdd')}</Text>
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
          {[t('weekly') + ' / ' + t('monthly') + ' / ' + t('yearly'), t('spendingByCategory'), t('spendVsIncome'), t('categoryShare')].map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#00D4AA', fontWeight: '700', fontSize: 14 }}>✓</Text>
              <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>⚡ {t('upgrade')} — {t('from')} {convertPrice(3.99)}{t('perMonth')}</Text>
        </TouchableOpacity>
        <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    );
  }

  // ── Filter transactions by selected period ────────────────────────────────
  const periodStart = getPeriodStart(period);
  const filtered = transactions.filter(tx => {
    const d = parseDate((tx as any).date);
    return d ? d >= periodStart : false;
  });

  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalSaved = totalIncome - totalExpense;
  const isOverspent = totalSaved < 0;

  const budgetPct = totalIncome > 0
    ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100)
    : totalExpense > 0 ? 100 : 0;
  const over = totalExpense > totalIncome && totalIncome > 0;

  const catMap: Record<string, number> = {};
  filtered.filter(tx => tx.type === 'expense').forEach(tx => {
    catMap[tx.cat] = (catMap[tx.cat] || 0) + Math.abs(tx.amount);
  });

  const categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      color: CATEGORY_COLORS[name] || '#6C63FF',
      icon: CAT_ICON[name] || '💳',
    }));

  const empty = filtered.length === 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>{t('stats')}</Text>

      {/* Period toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
        {(['weekly', 'monthly', 'yearly'] as const).map(p => (
          <TouchableOpacity key={p}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: period === p ? c.accent : 'transparent' }}
            onPress={() => setPeriod(p)}>
            <Text style={{ color: period === p ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{t(p)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period label */}
      <Text style={{ color: c.muted, fontSize: 12, textAlign: 'center', marginBottom: 20 }}>{getPeriodLabel(period)}</Text>

      {empty ? (
        <View style={{ alignItems: 'center', padding: 60 }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>📊</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{t('noDataYet')}</Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>
            No transactions recorded {period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'this year'}.
          </Text>
        </View>
      ) : (
        <>
          {/* Summary cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[
              { label: t('income'), val: totalIncome, color: '#00D4AA', border: 'rgba(0,212,170,0.3)', prefix: '' },
              { label: t('spent'), val: totalExpense, color: '#FF6B6B', border: 'rgba(255,107,107,0.3)', prefix: '' },
              {
                label: isOverspent ? (t('overspent') || 'Overspent') : t('saved'),
                val: Math.abs(totalSaved),
                color: isOverspent ? '#FF6B6B' : '#00D4AA',
                border: isOverspent ? 'rgba(255,107,107,0.3)' : 'rgba(0,212,170,0.3)',
                prefix: isOverspent ? '-' : '',
              },
            ].map((item, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: item.border, alignItems: 'center' }}>
                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 14, fontWeight: '800' }}>{item.prefix}{formatAmount(item.val)}</Text>
              </View>
            ))}
          </View>

          {/* Spend vs Income */}
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t('spendVsIncome')}</Text>
              <Text style={{ color: over ? '#FF6B6B' : '#00D4AA', fontSize: 11, fontWeight: '600' }}>
                {totalIncome === 0
                  ? totalExpense > 0 ? '⚠️ No income recorded' : '—'
                  : over ? `⚠️ ${t('overIncome')}` : `${budgetPct}% ${t('spentPercent')}`}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 12, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${budgetPct}%`, borderRadius: 50, backgroundColor: over || totalIncome === 0 ? '#FF6B6B' : c.accent }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>
                {t('spent')}: <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>{formatAmount(totalExpense)}</Text>
              </Text>
              <Text style={{ color: c.muted, fontSize: 11 }}>
                {t('income')}: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>{formatAmount(totalIncome)}</Text>
              </Text>
            </View>
            {totalIncome === 0 && totalExpense > 0 && (
              <View style={{ backgroundColor: '#FFD70018', borderRadius: 10, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#FFD70044' }}>
                <Text style={{ color: '#FFD700', fontSize: 12, textAlign: 'center' }}>
                  💡 Add income transactions to see your spend vs income ratio
                </Text>
              </View>
            )}
          </View>

          {/* Spending by category */}
          {categories.length > 0 && (
            <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>{t('spendingByCategory')}</Text>
              {categories.map((cat, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 20, width: 32 }}>{cat.icon}</Text>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 13 }}>{formatAmount(cat.amount)}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${cat.pct}%`, borderRadius: 50, backgroundColor: cat.color }} />
                    </View>
                  </View>
                  <Text style={{ color: cat.color, fontSize: 13, fontWeight: '700', width: 36, textAlign: 'right' }}>{cat.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* Category share */}
          {categories.length > 0 && (
            <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 30, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>{t('categoryShare')}</Text>
              {categories.map((cat, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
                  <Text style={{ color: c.text, fontSize: 13, flex: 1 }}>{cat.icon} {cat.name}</Text>
                  <Text style={{ color: cat.color, fontSize: 13, fontWeight: '700' }}>{cat.pct}%</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}