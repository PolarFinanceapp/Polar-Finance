import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#6C63FF', Groceries: '#00D4AA', Transport: '#FF6B6B',
  Entertainment: '#FFD700', Health: '#FF9F43', Clothing: '#a89fff',
  Utilities: '#00BFFF', Subscriptions: '#FF69B4', Food: '#FFA07A',
  Income: '#00D4AA', Savings: '#32CD32', Shopping: '#FF6347', Other: '#9370DB',
};

const CAT_ICON: Record<string, string> = {
  Housing: 'home', Groceries: 'cart', Transport: 'car', Entertainment: 'film',
  Health: 'medkit', Clothing: 'shirt', Utilities: 'flash', Subscriptions: 'phone-portrait',
  Food: 'restaurant', Income: 'briefcase', Savings: 'wallet', Shopping: 'bag', Other: 'gift',
};

type Period = 'weekly' | 'monthly' | 'yearly';

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const p = s.split('/');
  if (p.length === 3) { const [d, m, y] = p.map(Number); if (d && m && y) return new Date(y, m - 1, d); }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
}

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const s = new Date(now); s.setDate(now.getDate() - day); s.setHours(0, 0, 0, 0); return s;
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

function getPeriodLabel(period: Period): string {
  const now = new Date();
  if (period === 'weekly') { const s = getPeriodStart('weekly'); return `${s.getDate()} ${s.toLocaleString('default', { month: 'short' })} – Today`; }
  if (period === 'monthly') return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  return `${now.getFullYear()}`;
}

// ── Simple SVG-style pie chart using absolute positioned Views ─────────────────
function PieChart({ categories, total }: { categories: any[]; total: number }) {
  const SIZE = 180;
  const R = SIZE / 2;
  const INNER_R = 58;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Build arc segments using transform rotations
  let cumulative = 0;
  const segments = categories.slice(0, 6).map((cat) => {
    const pct = total > 0 ? cat.amount / total : 0;
    const start = cumulative;
    cumulative += pct;
    return { ...cat, pct, start };
  });

  return (
    <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
      <View style={{ width: SIZE, height: SIZE, borderRadius: R, overflow: 'hidden', marginBottom: 16 }}>
        {segments.map((seg, i) => {
          const deg = seg.pct * 360;
          const startDeg = seg.start * 360;
          return (
            <View key={i} style={{
              position: 'absolute', width: SIZE, height: SIZE,
              transform: [{ rotate: `${startDeg}deg` }],
            }}>
              <View style={{
                position: 'absolute', width: R, height: SIZE,
                left: R, overflow: 'hidden',
                transform: [{ rotate: `${Math.min(deg, 180)}deg` }],
                transformOrigin: 'left center',
              }}>
                <View style={{ width: R, height: SIZE, backgroundColor: seg.color }} />
              </View>
              {deg > 180 && (
                <View style={{
                  position: 'absolute', width: R, height: SIZE,
                  left: R, overflow: 'hidden',
                  transform: [{ rotate: '180deg' }],
                  transformOrigin: 'left center',
                }}>
                  <View style={{ width: R, height: SIZE, backgroundColor: seg.color }} />
                </View>
              )}
            </View>
          );
        })}
        {/* Inner circle cutout */}
        <View style={{
          position: 'absolute',
          width: INNER_R * 2, height: INNER_R * 2,
          borderRadius: INNER_R,
          backgroundColor: '#0D0D1A',
          top: R - INNER_R, left: R - INNER_R,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', opacity: 0.5 }}>SPEND</Text>
          <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '900' }}>
            {total > 0 ? `${Math.round((categories[0]?.pct || 0))}%` : '—'}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {segments.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ color: '#7B7B9E', fontSize: 11, fontWeight: '600' }}>
              {seg.name} {Math.round(seg.pct * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [chartMode, setChartMode] = useState<'bar' | 'pie'>('bar');
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount, convertPrice, t } = useLocale();
  const { hasFeature } = usePlan();
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  // Animate chart toggle
  const slideAnim = useRef(new Animated.Value(0)).current;

  const toggleChart = (mode: 'bar' | 'pie') => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setChartMode(mode);
  };

  // ── Back button ────────────────────────────────────────────────────────────
  const BackBtn = () => (
    <TouchableOpacity onPress={() => router.push('/(tabs)/more' as any)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 56, marginBottom: 4, alignSelf: 'flex-start' }}>
      <Ionicons name="chevron-back" size={20} color={c.accent} />
      <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );

  if (!hasFeature('advancedCharts')) {
    return (
      <View style={{ flex: 1, backgroundColor: c.dark }}>
        <StarBackground />
        <BackBtn />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="bar-chart" size={60} color={c.accent} style={{ marginBottom: 16 }} />
          <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8 }}>{t('stats')}</Text>
          <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{t('linkBankOrAdd')}</Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{t('upgrade')} — {t('from')} {convertPrice(3.99)}{t('perMonth')}</Text>
          </TouchableOpacity>
          <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
        </View>
      </View>
    );
  }

  const periodStart = getPeriodStart(period);
  const filtered = transactions.filter(tx => { const d = parseDate((tx as any).date); return d ? d >= periodStart : false; });

  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalSaved = totalIncome - totalExpense;
  const isOverspent = totalSaved < 0;
  const budgetPct = totalIncome > 0 ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100) : totalExpense > 0 ? 100 : 0;
  const over = totalExpense > totalIncome && totalIncome > 0;

  const catMap: Record<string, number> = {};
  filtered.filter(tx => tx.type === 'expense').forEach(tx => { catMap[tx.cat] = (catMap[tx.cat] || 0) + Math.abs(tx.amount); });
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, amount]) => ({
    name, amount: Math.round(amount * 100) / 100,
    pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    color: CATEGORY_COLORS[name] || '#6C63FF',
    icon: CAT_ICON[name] || 'card',
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <BackBtn />
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 8, marginBottom: 20 }}>{t('stats')}</Text>

        {/* Period toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 8, borderWidth: 1, borderColor: c.border }}>
          {(['weekly', 'monthly', 'yearly'] as const).map(p => (
            <TouchableOpacity key={p} style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: period === p ? c.accent : 'transparent' }}
              onPress={() => setPeriod(p)}>
              <Text style={{ color: period === p ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{t(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ color: c.muted, fontSize: 12, textAlign: 'center', marginBottom: 20 }}>{getPeriodLabel(period)}</Text>

        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 60 }}>
            <Ionicons name="bar-chart-outline" size={50} color={c.muted} style={{ marginBottom: 16 }} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{t('noDataYet')}</Text>
            <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Add some transactions to see your stats</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: t('income'), val: totalIncome, color: '#00D4AA', border: 'rgba(0,212,170,0.3)' },
                { label: t('spent'), val: totalExpense, color: '#FF6B6B', border: 'rgba(255,107,107,0.3)' },
                {
                  label: isOverspent ? 'Overspent' : t('saved'), val: Math.abs(totalSaved),
                  color: isOverspent ? '#FF6B6B' : '#00D4AA',
                  border: isOverspent ? 'rgba(255,107,107,0.3)' : 'rgba(0,212,170,0.3)'
                },
              ].map((item, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: item.border, alignItems: 'center' }}>
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{item.label}</Text>
                  <Text style={{ color: item.color, fontSize: 14, fontWeight: '800' }}>{formatAmount(item.val)}</Text>
                </View>
              ))}
            </View>

            {/* Spend vs Income */}
            <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t('spendVsIncome')}</Text>
                <Text style={{ color: over ? '#FF6B6B' : '#00D4AA', fontSize: 11, fontWeight: '600' }}>
                  {totalIncome === 0 ? (totalExpense > 0 ? 'No income' : '—') : over ? 'Over budget' : `${budgetPct}% spent`}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 12, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${budgetPct}%`, borderRadius: 50, backgroundColor: over || totalIncome === 0 ? '#FF6B6B' : c.accent }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: c.muted, fontSize: 11 }}>Spent: <Text style={{ color: '#FF6B6B', fontWeight: '700' }}>{formatAmount(totalExpense)}</Text></Text>
                <Text style={{ color: c.muted, fontSize: 11 }}>Income: <Text style={{ color: '#00D4AA', fontWeight: '700' }}>{formatAmount(totalIncome)}</Text></Text>
              </View>
            </View>

            {/* Spending by Category — with bar/pie toggle */}
            {categories.length > 0 && (
              <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>

                {/* Header with toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t('spendingByCategory')}</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: c.border }}>
                    <TouchableOpacity
                      onPress={() => toggleChart('bar')}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: chartMode === 'bar' ? c.accent : 'transparent' }}>
                      <Ionicons name="bar-chart" size={14} color={chartMode === 'bar' ? '#fff' : c.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleChart('pie')}
                      style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: chartMode === 'pie' ? c.accent : 'transparent' }}>
                      <Ionicons name="pie-chart" size={14} color={chartMode === 'pie' ? '#fff' : c.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Chart content with fade transition */}
                <Animated.View style={{ opacity: Animated.subtract(1, slideAnim) }}>
                  {chartMode === 'bar' ? (
                    // Bar chart view
                    <>
                      {categories.map((cat, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: cat.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                          </View>
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
                    </>
                  ) : (
                    // Pie chart view
                    <PieChart categories={categories} total={totalExpense} />
                  )}
                </Animated.View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}