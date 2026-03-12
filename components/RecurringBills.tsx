import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Bill, Frequency, useBills } from '../context/BillsContext';
import { useFinance } from '../context/FinanceContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const BILL_ICONS = ['💡', '💧', '🔥', '📱', '🌐', '🏠', '🚗', '🎬', '💪', '🎵', '📺', '🛒', '🏥', '✈️', '🎮'];
const BILL_COLORS = ['#6C63FF', '#00D4AA', '#FF9F43', '#FF6B6B', '#a89fff', '#FFD700'];

const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'fortnightly', label: 'Fortnightly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

type Props = { visible: boolean; onClose: () => void };

export default function RecurringBills({ visible, onClose }: Props) {
  const { theme: c } = useTheme();
  const { formatAmount, currencySymbol } = useLocale();
  const { bills, addBill, deleteBill, payBill } = useBills();
  const { cards, setCards, transactions, setTransactions } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billFreq, setBillFreq] = useState<Frequency>('monthly');
  const [billDue, setBillDue] = useState('');
  const [billCardId, setBillCardId] = useState<string | null>(null);
  const [billIcon, setBillIcon] = useState('💡');
  const [billColor, setBillColor] = useState('#6C63FF');

  const freqLabel = (f: Frequency) => FREQUENCIES.find(x => x.key === f)?.label || f;

  const totalMonthly = bills.reduce((s, b) => {
    switch (b.frequency) {
      case 'weekly': return s + b.amount * 4.33;
      case 'fortnightly': return s + b.amount * 2.17;
      case 'monthly': return s + b.amount;
      case 'yearly': return s + b.amount / 12;
    }
  }, 0);

  const handleAdd = async () => {
    if (!billName || !billAmount) return;
    const due = billDue || new Date().toLocaleDateString('en-GB');
    await addBill({ name: billName, amount: parseFloat(billAmount), frequency: billFreq, nextDue: due, cardId: billCardId, icon: billIcon, color: billColor, active: true });
    setBillName(''); setBillAmount(''); setBillFreq('monthly'); setBillDue('');
    setBillCardId(null); setBillIcon('💡'); setBillColor('#6C63FF');
    setShowAdd(false);
  };

  const handlePay = (bill: Bill) => {
    if (bill.cardId) {
      setCards(cards.map(card =>
        card.id === bill.cardId
          ? { ...card, balance: card.balance - bill.amount, positive: (card.balance - bill.amount) >= 0 }
          : card
      ));
    }
    setTransactions([{
      id: Date.now().toString(),
      icon: bill.icon,
      name: bill.name,
      cat: 'Subscriptions',
      amount: -Math.abs(bill.amount),
      type: 'expense',
      date: new Date().toLocaleDateString('en-GB'),
    } as any, ...transactions]);
    payBill(bill.id);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#0D0D1A' }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(108,99,255,0.15)' }}>
          <Text style={{ color: '#E8E8F0', fontSize: 22, fontWeight: '900' }}>Recurring Bills</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="close" size={20} color={c.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: c.border, marginTop: 20, marginBottom: 20 }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>MONTHLY OUTGOINGS</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 30, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalMonthly)}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>{bills.length} recurring bill{bills.length !== 1 ? 's' : ''}</Text>
          </View>

          {/* Empty state */}
          {bills.length === 0 && (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Ionicons name="repeat-outline" size={48} color={c.muted} style={{ marginBottom: 12 }} />
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No bills yet</Text>
              <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>Track your recurring bills and pay them with one tap</Text>
            </View>
          )}

          {/* Bills list */}
          {bills.map(bill => {
            const linkedCard = cards.find(card => card.id === bill.cardId);
            return (
              <View key={bill.id} style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: bill.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 22 }}>{bill.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{bill.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                      {freqLabel(bill.frequency)} · Due {bill.nextDue}
                    </Text>
                    {linkedCard && (
                      <Text style={{ color: c.accent, fontSize: 11, marginTop: 2 }}>
                        💳 {linkedCard.bank} ···· {linkedCard.number}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '800' }}>{formatAmount(bill.amount)}</Text>
                    <TouchableOpacity onPress={() => deleteBill(bill.id)}>
                      <Ionicons name="trash-outline" size={16} color={c.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handlePay(bill)}
                  style={{ backgroundColor: '#00D4AA22', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00D4AA44', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#00D4AA" />
                  <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>Mark as Paid</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add bill button */}
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: c.accent + '4D', marginBottom: 40, borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="add-circle-outline" size={18} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 15, fontWeight: '700' }}>Add Recurring Bill</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Add Bill Modal */}
        <Modal visible={showAdd} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <ScrollView style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>Add Recurring Bill</Text>

                {[
                  { label: 'Bill Name', val: billName, set: setBillName, ph: 'e.g. Netflix', kb: 'default' as const },
                  { label: `Amount (${currencySymbol})`, val: billAmount, set: setBillAmount, ph: 'e.g. 9.99', kb: 'decimal-pad' as const },
                  { label: 'Next Due Date (DD/MM/YYYY)', val: billDue, set: setBillDue, ph: new Date().toLocaleDateString('en-GB'), kb: 'default' as const },
                ].map((f, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                    <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
                  </View>
                ))}

                {/* Frequency */}
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Frequency</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity key={f.key} onPress={() => setBillFreq(f.key)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: billFreq === f.key ? c.accent : c.card2, borderWidth: 1, borderColor: billFreq === f.key ? c.accent : c.border }}>
                      <Text style={{ color: billFreq === f.key ? '#fff' : c.muted, fontSize: 13, fontWeight: '600' }}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Link to card */}
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Link to Card (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setBillCardId(null)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: billCardId === null ? c.accent : c.card2, borderWidth: 1, borderColor: billCardId === null ? c.accent : c.border, marginRight: 8 }}>
                    <Text style={{ color: billCardId === null ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>None</Text>
                  </TouchableOpacity>
                  {cards.map(card => (
                    <TouchableOpacity key={card.id} onPress={() => setBillCardId(card.id)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: billCardId === card.id ? c.accent : c.card2, borderWidth: 1, borderColor: billCardId === card.id ? c.accent : c.border, marginRight: 8 }}>
                      <Text style={{ color: billCardId === card.id ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{card.bank} ···· {card.number}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Icon */}
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Pick Icon</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {BILL_ICONS.map(ic => (
                    <TouchableOpacity key={ic} style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: billIcon === ic ? c.accent : 'transparent' }} onPress={() => setBillIcon(ic)}>
                      <Text style={{ fontSize: 20 }}>{ic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Colour */}
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Pick Colour</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  {BILL_COLORS.map(col => (
                    <TouchableOpacity key={col} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, borderWidth: 2.5, borderColor: billColor === col ? '#fff' : 'transparent' }} onPress={() => setBillColor(col)} />
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 40 }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAdd(false)}>
                    <Text style={{ color: c.muted, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!billName || !billAmount) ? 0.4 : 1 }} onPress={handleAdd} disabled={!billName || !billAmount}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add Bill</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}