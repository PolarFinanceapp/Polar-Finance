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

// ── Donut chart using SVG path arcs ──────────────────────────────────────────
// Uses react-native's View-based approach with proper arc segments
function PieChart({ categories, total }: { categories: any[]; total: number }) {
  const SIZE = 200;
  const R = SIZE / 2;
  const STROKE = 36; // ring thickness
  const INNER_R = R - STROKE;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 4 }),
    ]).start();
  }, [categories.map(c => c.name).join()]);

  const segs = categories.slice(0, 6);
  const total6 = segs.reduce((s, c) => s + c.amount, 0);
  let cumAngle = -90; // start at top

  const toRad = (d: number) => (d * Math.PI) / 180;
  const cx = R;
  const cy = R;

  // Each segment is rendered as a series of thin wedge Views
  // We use a simple approach: render colored quarter-circles stacked with rotations
  // This is the most reliable approach without SVG

  const SEGMENTS_PER_CAT = 90; // precision steps

  return (
    <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={{ width: SIZE, height: SIZE, position: 'relative', marginBottom: 20 }}>
        {segs.map((seg, si) => {
          const pct = total6 > 0 ? seg.amount / total6 : 0;
          const degrees = pct * 360;
          const startAngle = cumAngle;
          cumAngle += degrees;

          // Render segment using the "two half-rotation" technique
          // Each segment = rotated container + clipped half-square
          const firstHalf = Math.min(degrees, 180);
          const secondHalf = Math.max(0, degrees - 180);
          const segStart = startAngle + 90; // adjust for CSS rotation origin

          return (
            <View key={si} style={{ position: 'absolute', width: SIZE, height: SIZE }}>
              {/* First 0-180° */}
              <View style={{
                position: 'absolute', width: SIZE, height: SIZE,
                borderRadius: R,
                borderWidth: STROKE,
                borderColor: 'transparent',
                borderRightColor: seg.color,
                borderBottomColor: firstHalf > 90 ? seg.color : 'transparent',
                transform: [{ rotate: `${segStart}deg` }],
              }} />
              {/* Second 180-360° if needed */}
              {secondHalf > 0 && (
                <View style={{
                  position: 'absolute', width: SIZE, height: SIZE,
                  borderRadius: R,
                  borderWidth: STROKE,
                  borderColor: 'transparent',
                  borderRightColor: seg.color,
                  borderBottomColor: secondHalf > 90 ? seg.color : 'transparent',
                  transform: [{ rotate: `${segStart + 180}deg` }],
                }} />
              )}
            </View>
          );
        })}

        {/* Inner circle */}
        <View style={{
          position: 'absolute',
          width: SIZE - STROKE * 2,
          height: SIZE - STROKE * 2,
          borderRadius: (SIZE - STROKE * 2) / 2,
          backgroundColor: '#0D0D1A',
          top: STROKE, left: STROKE,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>SPEND</Text>
          <Text style={{ color: segs[0]?.color || '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 2 }}>
            {segs[0] ? `${Math.round((segs[0].amount / total6) * 100)}%` : '—'}
          </Text>
          {segs[0] && (
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 1, textAlign: 'center', paddingHorizontal: 8 }}>
              {segs[0].name}
            </Text>
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 8 }}>
        {segs.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' }}>
              {seg.name} {Math.round((seg.amount / total6) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function StatsScreen() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current, -1 = last month, etc.
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

  // Offset-aware period helpers
  const getPeriodStartOffset = (): Date => {
    const now = new Date();
    if (period === 'weekly') {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const s = new Date(now);
      s.setDate(now.getDate() - day + monthOffset * 7);
      s.setHours(0, 0, 0, 0);
      return s;
    }
    if (period === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    }
    return new Date(now.getFullYear() + monthOffset, 0, 1);
  };

  const getPeriodEndOffset = (): Date => {
    const now = new Date();
    if (period === 'weekly') {
      const s = getPeriodStartOffset();
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return e;
    }
    if (period === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
    }
    return new Date(now.getFullYear() + monthOffset, 11, 31, 23, 59, 59);
  };

  const getPeriodLabelOffset = (): string => {
    const start = getPeriodStartOffset();
    if (period === 'weekly') {
      const end = getPeriodEndOffset();
      return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
    }
    if (period === 'monthly') {
      return start.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    return `${start.getFullYear()}`;
  };

  const isCurrentPeriod = monthOffset === 0;

  const periodStart = getPeriodStartOffset();
  const periodEnd = getPeriodEndOffset();

  const filtered = transactions.filter(tx => {
    const d = parseDate((tx as any).date);
    return d ? d >= periodStart && d <= periodEnd : false;
  });

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
        <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
          {(['weekly', 'monthly', 'yearly'] as const).map(p => (
            <TouchableOpacity key={p} style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: period === p ? c.accent : 'transparent' }}
              onPress={() => { setPeriod(p); setMonthOffset(0); }}>
              <Text style={{ color: period === p ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{t(p)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => o - 1)}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={18} color={c.accent} />
          </TouchableOpacity>
          <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{getPeriodLabelOffset()}</Text>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => Math.min(0, o + 1))}
            disabled={isCurrentPeriod}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center', opacity: isCurrentPeriod ? 0.3 : 1 }}>
            <Ionicons name="chevron-forward" size={18} color={c.accent} />
          </TouchableOpacity>
        </View>

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