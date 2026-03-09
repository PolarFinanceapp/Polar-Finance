import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import StarBackground from '../../components/StarBackground';
import { useBills } from '../../context/BillsContext';
import { useTheme } from '../../context/ThemeContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const { theme: c } = useTheme();
  const router = useRouter();
  const { transactions } = useFinance();
  const { bills } = useBills();
  const { formatAmount, t } = useLocale();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y); setSelected(null);
  };

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const parseDay = (s: string): number | null => {
    if (!s) return null;
    const p = s.split('/');
    if (p.length === 3) { const d = parseInt(p[0], 10), m2 = parseInt(p[1], 10) - 1, y2 = parseInt(p[2], 10); if (m2 === month && y2 === year) return d; }
    const iso = new Date(s);
    if (!isNaN(iso.getTime()) && iso.getMonth() === month && iso.getFullYear() === year) return iso.getDate();
    return null;
  };

  const dayMap: Record<number, { in: number; out: number }> = {};
  transactions.forEach(tx => {
    const day = parseDay((tx as any).date || '');
    if (!day) return;
    if (!dayMap[day]) dayMap[day] = { in: 0, out: 0 };
    if (tx.amount > 0) dayMap[day].in += tx.amount;
    else dayMap[day].out += Math.abs(tx.amount);
  });

  const selectedTxns = selected ? transactions.filter(tx => parseDay((tx as any).date || '') === selected) : [];
  const selectedBills = selected ? bills.filter(b => parseDay(b.nextDue) === selected) : [];
  const selectedIn = selectedTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const selectedOut = selectedTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // ── Back button component ──────────────────────────────────────────────────
  const BackBtn = () => (
    <TouchableOpacity onPress={() => router.back()}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 56, marginBottom: 4, alignSelf: 'flex-start' }}>
      <Ionicons name="chevron-back" size={20} color={c.accent} />
      <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        <BackBtn />
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 8, marginBottom: 20 }}>{t('calendar')}</Text>

        {/* Month nav */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }} onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={18} color={c.text} />
          </TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }} onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={18} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {DAYS.map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', color: c.muted, fontSize: 11, fontWeight: '700' }}>{d}</Text>)}
        </View>

        {/* Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {Array(offset).fill(null).map((_, i) => <View key={`e${i}`} style={{ width: '14.28%' }} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const txn = dayMap[day];
            const sel = selected === day;
            return (
              <TouchableOpacity key={day} onPress={() => setSelected(sel ? null : day)}
                style={{ width: '14.28%', minHeight: 62, padding: 2, alignItems: 'center', borderRadius: 10, marginVertical: 2, backgroundColor: sel ? c.accent + '44' : isToday(day) ? c.accent + '22' : 'transparent', borderWidth: sel || isToday(day) ? 1.5 : 0, borderColor: sel ? c.accent : c.accent + '88' }}>
                <Text style={{ color: sel ? '#fff' : isToday(day) ? c.accent : c.text, fontSize: 13, fontWeight: isToday(day) ? '900' : '600', marginBottom: 3, marginTop: 4 }}>{day}</Text>
                {txn && (txn.in > 0 || txn.out > 0) && (
                  <View style={{ alignItems: 'center', gap: 1 }}>
                    {txn.in > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#00D4AA' }} />}
                    {txn.out > 0 && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF6B6B' }} />}
                  </View>
                )}
                {bills.some(b => parseDay(b.nextDue) === day) && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD700' }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
          {[['#00D4AA', t('moneyIn')], ['#FF6B6B', t('moneyOut')], ['#FFD700', 'Bill Due']].map(([col, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col }} />
              <Text style={{ color: c.muted, fontSize: 13 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Selected day */}
        {selected && (
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 30, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{MONTHS[month]} {selected}</Text>
              {selectedTxns.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>+{formatAmount(selectedIn)}</Text>
                  <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>-{formatAmount(selectedOut)}</Text>
                </View>
              )}
            </View>
            {selectedBills.map(bill => (
              <View key={bill.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bill.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16 }}>{bill.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{bill.name}</Text>
                  <Text style={{ color: c.muted, fontSize: 11 }}>{bill.frequency} · Bill due</Text>
                </View>
                <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '700' }}>{formatAmount(bill.amount)}</Text>
              </View>
            ))}
            {selectedTxns.length === 0 && selectedBills.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                <Ionicons name="receipt-outline" size={32} color={c.muted} />
                <Text style={{ color: c.muted, fontSize: 13 }}>{t('noTransactionsThisDay')}</Text>
              </View>
            ) : selectedTxns.map((txn, i) => (
              <View key={txn.id || i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < selectedTxns.length - 1 ? 1 : 0, borderBottomColor: c.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 16 }}>{txn.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{txn.name}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{txn.cat}</Text>
                </View>
                <Text style={{ color: txn.amount > 0 ? '#00D4AA' : '#FF6B6B', fontSize: 14, fontWeight: '700' }}>
                  {txn.amount > 0 ? '+' : '-'}{formatAmount(Math.abs(txn.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {transactions.length === 0 && (
          <View style={{ alignItems: 'center', padding: 30, marginBottom: 30 }}>
            <Ionicons name="calendar-outline" size={48} color={c.muted} style={{ marginBottom: 10 }} />
            <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center' }}>{t('noTransactions')}</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}