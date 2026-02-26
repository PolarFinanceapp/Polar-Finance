import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

const categories = [
  { icon: '🏠', name: 'Housing' },
  { icon: '🛒', name: 'Groceries' },
  { icon: '🚗', name: 'Transport' },
  { icon: '🎬', name: 'Entertainment' },
  { icon: '💊', name: 'Health' },
  { icon: '👗', name: 'Clothing' },
  { icon: '⚡', name: 'Utilities' },
  { icon: '📱', name: 'Subscriptions' },
  { icon: '🍕', name: 'Food' },
  { icon: '💼', name: 'Income' },
  { icon: '💰', name: 'Savings' },
  { icon: '🎁', name: 'Other' },
];

export default function AddScreen() {
  const { theme: c }              = useTheme();
  const { addTransaction, transactions } = useTransactions();
  const [type, setType]           = useState<'expense' | 'income'>('expense');
  const [amount, setAmount]       = useState('');
  const [name, setName]           = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [note, setNote]           = useState('');
  const [recurring, setRecurring] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const selectedCatIcon = categories.find(c => c.name === selectedCat)?.icon ?? '💳';
  const isValid = amount && name && selectedCat;
  const recentAdded = transactions.slice(0, 10);

  const handleSubmit = async () => {
    if (!isValid) return;
    await addTransaction({
      icon: selectedCatIcon,
      name,
      cat: selectedCat,
      amount: type === 'expense' ? -parseFloat(amount) : parseFloat(amount),
      type,
      note,
      recurring,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAmount('');
      setName('');
      setSelectedCat('');
      setNote('');
      setRecurring(false);
    }, 1800);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 24 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>Add Transaction</Text>
        {recentAdded.length > 0 && (
          <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowRecent(true)}>
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>Recent ({recentAdded.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Type Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 50, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: type === 'expense' ? '#FF6B6B' : 'transparent' }} onPress={() => setType('expense')}>
          <Text style={{ color: type === 'expense' ? '#fff' : c.muted, fontSize: 14, fontWeight: '700' }}>↓ Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center', backgroundColor: type === 'income' ? '#00D4AA' : 'transparent' }} onPress={() => setType('income')}>
          <Text style={{ color: type === 'income' ? '#fff' : c.muted, fontSize: 14, fontWeight: '700' }}>↑ Income</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: type === 'income' ? 'rgba(0,212,170,0.4)' : 'rgba(255,107,107,0.4)' }}>
        <Text style={{ color: type === 'income' ? '#00D4AA' : '#FF6B6B', fontSize: 32, fontWeight: '900', marginRight: 8 }}>£</Text>
        <TextInput style={{ flex: 1, color: c.text, fontSize: 36, fontWeight: '900' }} placeholder="0.00" placeholderTextColor={c.muted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      </View>

      {/* Description */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Description</Text>
        <TextInput style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder="e.g. Tesco, Salary, Netflix..." placeholderTextColor={c.muted} value={name} onChangeText={setName} />
      </View>

      {/* Category */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={{ backgroundColor: selectedCat === cat.name ? c.accent : c.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: selectedCat === cat.name ? c.accent : c.border }}
              onPress={() => setSelectedCat(cat.name)}>
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
              <Text style={{ color: selectedCat === cat.name ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Note */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Note (optional)</Text>
        <TextInput style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, height: 80, textAlignVertical: 'top' }} placeholder="Add a note..." placeholderTextColor={c.muted} multiline value={note} onChangeText={setNote} />
      </View>

      {/* Recurring Toggle */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: c.border, gap: 12 }} onPress={() => setRecurring(!recurring)}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>🔁 Recurring Transaction</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Mark as a monthly recurring payment</Text>
        </View>
        <View style={{ width: 46, height: 26, borderRadius: 50, backgroundColor: recurring ? c.accent : c.card2, borderWidth: 1, borderColor: recurring ? c.accent : c.border, position: 'relative' }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: recurring ? '#fff' : c.muted, position: 'absolute', top: 2, left: recurring ? 22 : 2 }} />
        </View>
      </TouchableOpacity>

      {/* Submit */}
      {submitted ? (
        <View style={{ backgroundColor: '#00D4AA', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>✓ Transaction Saved!</Text>
        </View>
      ) : (
        <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 10, opacity: isValid ? 1 : 0.4 }} onPress={handleSubmit} disabled={!isValid}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{type === 'expense' ? '➕ Add Expense' : '➕ Add Income'}</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      {/* Recent Modal */}
      <Modal visible={showRecent} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%', borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>Recently Added</Text>
              <TouchableOpacity onPress={() => setShowRecent(false)}>
                <Text style={{ color: c.muted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {recentAdded.map(txn => (
                <View key={txn.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{txn.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{txn.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{txn.cat} · {txn.date}</Text>
                    {txn.note ? <Text style={{ color: c.accent, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>"{txn.note}"</Text> : null}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: txn.amount > 0 ? '#00D4AA' : '#FF6B6B' }}>
                    {txn.amount > 0 ? '+' : ''}£{Math.abs(txn.amount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 16 }} onPress={() => setShowRecent(false)}>
              <Text style={{ color: c.muted, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}