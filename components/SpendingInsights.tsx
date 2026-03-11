import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, Text, View } from 'react-native';
import { useFinance } from '../context/FinanceContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // full width minus padding

type Insight = {
  icon: string;
  iconColor: string;
  title: string;
  sub: string;
  positive: boolean;
};

function getInsights(transactions: any[], formatAmount: (n: number) => string): Insight[] {
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const thisYear = now.getFullYear();
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const isThisMonth = (t: any) => {
    const d = t.date ? new Date(t.date.split('/').reverse().join('-')) : new Date();
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  };
  const isLastMonth = (t: any) => {
    const d = t.date ? new Date(t.date.split('/').reverse().join('-')) : new Date();
    return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
  };

  const thisExp = transactions.filter(t => t.type === 'expense' && isThisMonth(t));
  const lastExp = transactions.filter(t => t.type === 'expense' && isLastMonth(t));
  const thisInc = transactions.filter(t => t.type === 'income' && isThisMonth(t));

  const thisTotal = thisExp.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastTotal = lastExp.reduce((s, t) => s + Math.abs(t.amount), 0);
  const thisIncTotal = thisInc.reduce((s, t) => s + Math.abs(t.amount), 0);

  const insights: Insight[] = [];

  // Month-over-month
  if (lastTotal > 0) {
    const diff = thisTotal - lastTotal;
    const pct = Math.round(Math.abs(diff / lastTotal) * 100);
    const up = diff > 0;
    insights.push({
      icon: up ? 'trending-up' : 'trending-down',
      iconColor: up ? '#FF6B6B' : '#00D4AA',
      title: up ? `Spending up ${pct}% this month` : `Spending down ${pct}% this month`,
      sub: `${formatAmount(thisTotal)} vs ${formatAmount(lastTotal)} last month`,
      positive: !up,
    });
  }

  // Top category
  const catMap: Record<string, number> = {};
  thisExp.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + Math.abs(t.amount); });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({
      icon: 'pie-chart',
      iconColor: '#FFD700',
      title: `Most spent on ${topCat[0]}`,
      sub: `${formatAmount(topCat[1])} this month`,
      positive: false,
    });
  }

  // Savings rate
  if (thisIncTotal > 0) {
    const rate = Math.round(((thisIncTotal - thisTotal) / thisIncTotal) * 100);
    const good = rate >= 20;
    insights.push({
      icon: good ? 'checkmark-circle' : 'alert-circle',
      iconColor: good ? '#00D4AA' : '#FF9F43',
      title: `Savings rate: ${Math.max(0, rate)}%`,
      sub: good ? 'Above the 20% target — great work' : 'Aim to save 20% of income',
      positive: good,
    });
  }

  // Transaction count
  if (thisExp.length > 0) {
    insights.push({
      icon: 'receipt',
      iconColor: '#6C63FF',
      title: `${thisExp.length} transactions this month`,
      sub: `Average ${formatAmount(thisTotal / thisExp.length)} per transaction`,
      positive: true,
    });
  }

  return insights;
}

export default function SpendingInsights() {
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount } = useLocale();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setInsights(getInsights(transactions, formatAmount));
  }, [transactions]);

  if (insights.length === 0) return null;

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveIdx(Math.max(0, Math.min(insights.length - 1, idx)));
  };

  return (
    <View style={{ marginBottom: 14 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="bulb-outline" size={13} color={c.accent} />
          <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            Spending Insights
          </Text>
        </View>
        {insights.length > 1 && (
          <Text style={{ color: c.muted, fontSize: 11 }}>{activeIdx + 1}/{insights.length}</Text>
        )}
      </View>

      {/* Swipeable cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
      >
        {insights.map((insight, i) => (
          <View
            key={i}
            style={{
              width: CARD_WIDTH,
              backgroundColor: c.card,
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: c.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginRight: i < insights.length - 1 ? 0 : 0,
            }}
          >
            <View style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: insight.iconColor + '18',
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 1, borderColor: insight.iconColor + '33',
            }}>
              <Ionicons name={insight.icon as any} size={22} color={insight.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 3 }}>{insight.title}</Text>
              <Text style={{ color: c.muted, fontSize: 12, lineHeight: 17 }}>{insight.sub}</Text>
            </View>
            {insights.length > 1 && (
              <Ionicons name="chevron-forward" size={16} color={c.muted + '66'} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {insights.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
          {insights.map((_, i) => (
            <View key={i} style={{
              width: i === activeIdx ? 16 : 5,
              height: 5, borderRadius: 3,
              backgroundColor: i === activeIdx ? c.accent : c.muted + '44',
            }} />
          ))}
        </View>
      )}
    </View>
  );
}