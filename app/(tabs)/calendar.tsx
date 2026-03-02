import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarScreen() {
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount, currencySymbol, t } = useLocale();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<number | null>(null);

  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m); setYear(y); setSelected(null);
  };

  const dayMap: Record<number, { in: number; out: number }> = {};
  transactions.forEach((tx, i) => {
    const day = (i % daysInMonth) + 1;
    if (!dayMap[day]) dayMap[day] = { in: 0, out: 0 };
    if (tx.amount > 0) dayMap[day].in += tx.amount;
    else dayMap[day].out += Math.abs(tx.amount);
  });

  const selectedTxns = selected
    ? transactions.filter((_, i) => (i % daysInMonth) + 1 === selected)
    : [];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>{t('calendar') || 'Calendar'} 🗓️</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
        <TouchableOpacity style={{ backgroundColor: c.card2, borderRadius: 8, padding: 8 }} onPress={() => changeMonth(-1)}>
          <Text style={{ color: c.text, fontSize: 14 }}>◀</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity style={{ backgroundColor: c.card2, borderRadius: 8, padding: 8 }} onPress={() => changeMonth(1)}>
          <Text style={{ color: c.text, fontSize: 14 }}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {DAYS.map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', color: c.muted, fontSize: 12, fontWeight: '600' }}>{d}</Text>)}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array(offset).fill(null).map((_, i) => <View key={`e${i}`} style={{ width: '14.28%' }} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const txn = dayMap[day];
          const sel = selected === day;
          return (
            <TouchableOpacity key={day} onPress={() => setSelected(sel ? null : day)}
              style={{ width: '14.28%', minHeight: 58, padding: 3, alignItems: 'center', borderRadius: 8, marginVertical: 2, backgroundColor: sel ? c.accent + '44' : isToday(day) ? c.accent + '22' : 'transparent', borderWidth: sel || isToday(day) ? 1 : 0, borderColor: sel ? c.accent : isToday(day) ? c.accent + '88' : 'transparent' }}>
              <Text style={{ color: isToday(day) || sel ? '#fff' : c.muted, fontSize: 12, fontWeight: isToday(day) ? '900' : '600', marginBottom: 1 }}>{day}</Text>
              {txn?.in  > 0 && <Text style={{ color: '#00D4AA', fontSize: 7, fontWeight: '700' }}>+{currencySymbol}{txn.in.toFixed(0)}</Text>}
              {txn?.out > 0 && <Text style={{ color: '#FF6B6B', fontSize: 7, fontWeight: '700' }}>-{currencySymbol}{txn.out.toFixed(0)}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 20, marginTop: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#00D4AA' }} />
          <Text style={{ color: c.muted, fontSize: 13 }}>{t('moneyIn')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B6B' }} />
          <Text style={{ color: c.muted, fontSize: 13 }}>{t('moneyOut')}</Text>
        </View>
      </View>

      {selected && (
        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 30, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '800', marginBottom: 12 }}>{MONTHS[month]} {selected}</Text>
          {selectedTxns.length === 0 ? (
            <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>{t('noTransactionsThisDay')}</Text>
          ) : (
            selectedTxns.map((txn, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < selectedTxns.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16 }}>{txn.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{txn.name}</Text>
                  <Text style={{ color: c.muted, fontSize: 11 }}>{txn.cat}</Text>
                </View>
                <Text style={{ color: txn.amount > 0 ? '#00D4AA' : '#FF6B6B', fontSize: 14, fontWeight: '700' }}>
                  {txn.amount > 0 ? '+' : '-'}{formatAmount(Math.abs(txn.amount))}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {transactions.length === 0 && (
        <View style={{ alignItems: 'center', padding: 30, marginBottom: 30 }}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
          <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center' }}>{t('noTransactions')}</Text>
        </View>
      )}
    </ScrollView>
  );
}