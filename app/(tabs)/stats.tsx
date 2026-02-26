import { useFinance } from '@/context/FinanceContext';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const CATEGORY_COLORS: Record<string, string> = {
  'Housing':'#6C63FF','Groceries':'#00D4AA','Transport':'#FF6B6B',
  'Entertainment':'#FFD700','Health':'#FF9F43','Clothing':'#a89fff',
  'Utilities':'#00BFFF','Subscriptions':'#FF69B4','Food':'#FFA07A',
  'Income':'#00D4AA','Savings':'#32CD32','Shopping':'#FF6347','Other':'#9370DB',
  'FOOD_AND_DRINK':'#FFA07A','SHOPS':'#00D4AA','TRANSPORTATION':'#FF6B6B',
  'PAYMENT':'#6C63FF','TRANSFER':'#FFD700','RECREATION':'#FF9F43',
  'HEALTHCARE':'#FF69B4','HOME':'#6C63FF',
};

const CAT_ICON: Record<string, string> = {
  'Housing':'🏠','Groceries':'🛒','Transport':'🚗','Entertainment':'🎬',
  'Health':'💊','Clothing':'👗','Utilities':'⚡','Subscriptions':'📱',
  'Food':'🍕','Income':'💼','Savings':'💰','Shopping':'📦','Other':'🎁',
  'FOOD_AND_DRINK':'🍕','SHOPS':'🛒','TRANSPORTATION':'🚗','PAYMENT':'💳',
  'TRANSFER':'💸','RECREATION':'🎬','HEALTHCARE':'💊','HOME':'🏠',
};

export default function StatsScreen() {
  const [period, setPeriod] = useState<'weekly'|'monthly'|'yearly'>('monthly');
  const { theme: c } = useTheme();
  const { transactions } = useFinance();

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSaved   = totalIncome - totalExpense;
  const budgetPct    = totalIncome > 0 ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100) : 0;
  const over         = totalExpense > totalIncome;

  const catMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.cat] = (catMap[t.cat] || 0) + Math.abs(t.amount);
  });

  const categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({
      name, amount: Math.round(amount * 100) / 100,
      pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      color: CATEGORY_COLORS[name] || '#6C63FF',
      icon: CAT_ICON[name] || '💳',
    }));

  const empty = transactions.length === 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>Stats 📊</Text>

      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: c.border }}>
        {(['weekly','monthly','yearly'] as const).map(p => (
          <TouchableOpacity key={p} style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: period === p ? c.accent : 'transparent' }} onPress={() => setPeriod(p)}>
            <Text style={{ color: period === p ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {empty ? (
        <View style={{ alignItems: 'center', padding: 60 }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>📊</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No data yet</Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Link your bank or add transactions on the home screen to see your stats</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Income', val: totalIncome,  color: '#00D4AA', border: 'rgba(0,212,170,0.3)'   },
              { label: 'Spent',  val: totalExpense, color: '#FF6B6B', border: 'rgba(255,107,107,0.3)' },
              { label: 'Saved',  val: totalSaved,   color: c.accent,  border: c.border                },
            ].map((item, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: item.border, alignItems: 'center' }}>
                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 14, fontWeight: '800' }}>£{item.val.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>Spend vs Income</Text>
              <Text style={{ color: over ? '#FF6B6B' : '#00D4AA', fontSize: 11, fontWeight: '600' }}>
                {over ? '⚠️ Over income' : `${budgetPct}% spent`}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 12, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${budgetPct}%`, borderRadius: 50, backgroundColor: over ? '#FF6B6B' : c.accent }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>£0</Text>
              <Text style={{ color: c.muted, fontSize: 11 }}>Income: £{totalIncome.toFixed(2)}</Text>
            </View>
          </View>

          {categories.length > 0 && (
            <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Spending by Category</Text>
              {categories.map((cat, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 20, width: 32 }}>{cat.icon}</Text>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 13 }}>£{cat.amount}</Text>
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

          {categories.length > 0 && (
            <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 30, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Category Share</Text>
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