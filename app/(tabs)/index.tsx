import { CAT_ICONS, useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProfileModal from '../../components/ProfileModal';
import ReceiptScanner from '../../components/ReceiptScanner';
import { useTheme } from '../../context/ThemeContext';

const ALL_TABS = [
  { icon: '📊', label: 'Stats',    route: '/(tabs)/stats'    },
  { icon: '🗓️', label: 'Calendar', route: '/(tabs)/calendar' },
  { icon: '🎯', label: 'Goals',    route: '/(tabs)/goals'    },
  { icon: '💼', label: 'Assets',   route: '/(tabs)/assets'   },
  { icon: '👨‍👩‍👧‍👦', label: 'Family',  route: '/(tabs)/family'   },
  { icon: '💳', label: 'Credit',   route: '/(tabs)/credit'   },
  { icon: '⚙️', label: 'Settings', route: '/(tabs)/settings' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

type Tab = typeof ALL_TABS[0];

const CARD_COLORS = ['#1a1a4e','#1a2a1a','#2a1a00','#1a001a','#0a1428','#000500'];

export default function HomeScreen() {
  const { hasFeature }  = usePlan();
  const { theme: c }    = useTheme();
  const router          = useRouter();
  const greeting        = getGreeting();
  const showCardsOk     = hasFeature('cardTracking');
  const showInvest      = hasFeature('investmentTracking');

  const { cards, setCards, investments, setInvestments, transactions, setTransactions } = useFinance();
  const { formatAmount, currencySymbol, t } = useLocale();

  // User info
  const [userName, setUserName]   = useState('');
  const [userInitial, setUserInitial] = useState('?');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const firstName = name.split(' ')[0];
      setUserName(firstName);
      setUserInitial(firstName.charAt(0).toUpperCase());
    });
  }, []);

  // Cards
  const [showAddCard, setShowAddCard]   = useState(false);
  const [newBank, setNewBank]           = useState('');
  const [newCardType, setNewCardType]   = useState('Debit · Visa');
  const [newBalance, setNewBalance]     = useState('');
  const [newNumber, setNewNumber]       = useState('');
  const [newCardColor, setNewCardColor] = useState('#1a1a4e');

  // Investments
  const [showAddInv, setShowAddInv]       = useState(false);
  const [newInvName, setNewInvName]       = useState('');
  const [newInvSub, setNewInvSub]         = useState('');
  const [newInvValue, setNewInvValue]     = useState('');
  const [newInvChange, setNewInvChange]   = useState('');
  const [newInvUp, setNewInvUp]           = useState(true);
  const [newInvIcon, setNewInvIcon]       = useState('📈');

  // Transactions
  const [showAddTxn, setShowAddTxn]   = useState(false);
  const [newTxnName, setNewTxnName]   = useState('');
  const [newTxnCat, setNewTxnCat]     = useState('Groceries');
  const [newTxnAmt, setNewTxnAmt]     = useState('');
  const [newTxnType, setNewTxnType]   = useState<'income'|'expense'>('expense');

  // Scanner
  const [showScanner, setShowScanner] = useState(false);

  // UI state
  const [showCards, setShowCards]         = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [selectedTabs, setSelectedTabs]   = useState<Tab[]>([ALL_TABS[0], ALL_TABS[1], ALL_TABS[2]]);
  const [showSearch, setShowSearch]       = useState(false);
  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState<'all'|'income'|'expense'>('all');

  const toggleTab = (tab: Tab) => {
    setSelectedTabs(prev => {
      const exists = prev.find(t => t.label === tab.label);
      if (exists) return prev.filter(t => t.label !== tab.label);
      if (prev.length >= 3) return prev;
      return [...prev, tab];
    });
  };

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance      = totalIncome - totalExpense;
  const totalInvest  = showInvest ? investments.reduce((s, i) => s + i.value, 0) : 0;
  const totalCards   = showCardsOk ? cards.reduce((s, card) => s + card.balance, 0) : 0;
  const netWorth     = balance + totalInvest + totalCards;
  const txnLimit     = hasFeature('unlimitedTransactions') ? transactions.length : 8;

  const filtered = transactions.filter(t => {
    const mS = t.name.toLowerCase().includes(search.toLowerCase()) || t.cat.toLowerCase().includes(search.toLowerCase());
    const mF = filter === 'all' || t.type === filter;
    return mS && mF;
  });

  const addCard = () => {
    if (!newBank || !newBalance) return;
    const bal = parseFloat(newBalance);
    setCards([...cards, { id: Date.now().toString(), bank: newBank, type: newCardType, balance: bal, number: newNumber || '0000', color: newCardColor, positive: bal >= 0 }]);
    setNewBank(''); setNewBalance(''); setNewNumber(''); setNewCardType('Debit · Visa'); setNewCardColor('#1a1a4e');
    setShowAddCard(false);
  };

  const addInvestment = () => {
    if (!newInvName || !newInvValue) return;
    setInvestments([...investments, { id: Date.now().toString(), icon: newInvIcon, name: newInvName, sub: newInvSub, value: parseFloat(newInvValue), change: parseFloat(newInvChange) || 0, up: newInvUp }]);
    setNewInvName(''); setNewInvSub(''); setNewInvValue(''); setNewInvChange(''); setNewInvIcon('📈');
    setShowAddInv(false);
  };

  const addTransaction = () => {
    if (!newTxnName || !newTxnAmt) return;
    const amt = parseFloat(newTxnAmt);
    setTransactions([{ id: Date.now().toString(), icon: CAT_ICONS[newTxnCat] || '💳', name: newTxnName, cat: newTxnCat, amount: newTxnType === 'expense' ? -amt : amt, type: newTxnType }, ...transactions]);
    setNewTxnName(''); setNewTxnAmt(''); setNewTxnCat('Groceries'); setNewTxnType('expense');
    setShowAddTxn(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>🐻‍❄️</Text>
          </View>
          <View>
            <Text style={{ color: c.muted, fontSize: 12 }}>{greeting} 👋</Text>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{userName || '...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowProfile(true)}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{userInitial}</Text>
        </TouchableOpacity>
      </View>

      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />

      {/* Balance Card */}
      <TouchableOpacity
        style={{ backgroundColor: c.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: c.border, marginBottom: 16 }}
        onPress={() => showCardsOk && setShowCards(!showCards)}
        activeOpacity={showCardsOk ? 0.85 : 1}>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
          NET WORTH  {showCardsOk ? (showCards ? '▲' : '▼') : ''}
        </Text>
        <Text style={{ color: c.text, fontSize: 36, fontWeight: '900', marginVertical: 6 }}>{formatAmount(netWorth)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>↑ Income</Text>
            <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalIncome)}</Text>
          </View>
          <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 11 }}>↓ {t('expenses')}</Text>
            <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalExpense)}</Text>
          </View>
          {showCardsOk && <>
            <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>📈 Invested</Text>
              <Text style={{ color: '#a89fff', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{formatAmount(totalInvest)}</Text>
            </View>
          </>}
        </View>
        {showCardsOk
          ? <Text style={{ color: c.accent, fontSize: 11, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>Tap to {showCards ? 'hide' : 'view'} cards & investments</Text>
          : <TouchableOpacity onPress={() => setShowProfile(true)}><Text style={{ color: c.muted, fontSize: 11, marginTop: 10, textAlign: 'center' }}>🔒 Upgrade to Pro to see cards & investments</Text></TouchableOpacity>
        }
      </TouchableOpacity>

      {/* Cards & Investments */}
      {showCards && showCardsOk && (
        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>💳 Cards</Text>
            <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddCard(true)}>
              <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>＋ Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {cards.length === 0 && (
              <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20, width: 220 }}>
                <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>No cards yet — add one manually</Text>
              </View>
            )}
            {cards.map(card => (
              <TouchableOpacity key={card.id} onLongPress={() => setCards(cards.filter(c => c.id !== card.id))} style={{ width: 220, borderRadius: 18, padding: 16, marginRight: 12, height: 120, justifyContent: 'space-between', backgroundColor: card.color }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{card.bank}</Text>
                  <View style={{ width: 24, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{card.type}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: card.positive ? '#fff' : '#FF6B6B' }}>
                  {card.positive ? '' : '-'}£{Math.abs(card.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1 }}>•••• •••• •••• {card.number}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowAddCard(true)} style={{ width: 100, borderRadius: 18, height: 120, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.accent + '55', borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 24, color: c.accent }}>＋</Text>
              <Text style={{ color: c.accent, fontSize: 11, marginTop: 4, fontWeight: '600' }}>Add Card</Text>
            </TouchableOpacity>
          </ScrollView>

          {showInvest ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>📈 Investments</Text>
                <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddInv(true)}>
                  <Text style={{ color: c.accent, fontSize: 11, fontWeight: '700' }}>＋ Add</Text>
                </TouchableOpacity>
              </View>
              {investments.length === 0 && (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>No investments yet — tap ＋ Add to get started</Text>
                </View>
              )}
              {investments.map(inv => (
                <TouchableOpacity key={inv.id} onLongPress={() => setInvestments(investments.filter(i => i.id !== inv.id))} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 20 }}>{inv.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{inv.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{inv.sub}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>£{inv.value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: inv.up ? '#00D4AA' : '#FF6B6B' }}>{inv.up ? '▲' : '▼'} {inv.change}%</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAddInv(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>＋ Add Investment</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setShowProfile(true)} style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.muted, fontSize: 13 }}>🔒 Upgrade to Premium to track investments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 }}>
        {selectedTabs.map((action: Tab) => (
          <TouchableOpacity key={action.label} style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, flex: 1, borderWidth: 1, borderColor: c.border }} onPress={() => router.push(action.route as any)}>
            <Text style={{ fontSize: 22 }}>{action.icon}</Text>
            <Text style={{ color: c.muted, fontSize: 10, marginTop: 6, fontWeight: '600' }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={{ alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.accent + '55', justifyContent: 'center' }} onPress={() => setShowTabPicker(true)}>
          <Text style={{ fontSize: 22 }}>✏️</Text>
          <Text style={{ color: c.accent, fontSize: 10, marginTop: 6, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TouchableOpacity style={{ backgroundColor: c.card, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: showSearch ? c.accent : c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => setShowSearch(!showSearch)}>
        <Text style={{ fontSize: 18 }}>🔍</Text>
        <Text style={{ color: showSearch ? c.accent : c.muted, fontSize: 14, fontWeight: '600' }}>Search Transactions</Text>
      </TouchableOpacity>

      {showSearch && (
        <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.accent + '4D' }}>
          <TextInput style={{ color: c.text, fontSize: 15, paddingVertical: 4, marginBottom: 10 }} placeholder="Search..." placeholderTextColor={c.muted} value={search} onChangeText={setSearch} autoFocus />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['all','income','expense'] as const).map(f => (
              <TouchableOpacity key={f} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: filter === f ? c.accent : c.card2, borderWidth: 1, borderColor: filter === f ? c.accent : c.border }} onPress={() => setFilter(f)}>
                <Text style={{ color: filter === f ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!hasFeature('adFree') && (
        <View style={{ backgroundColor: c.card2, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ color: c.muted, fontSize: 12 }}>📢 Advertisement — Upgrade to remove ads</Text>
        </View>
      )}

      {/* Transactions */}
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Recent Transactions</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={{ backgroundColor: c.card2, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: c.border }} onPress={() => setShowScanner(true)}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>🧾 Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: c.accent + '55' }} onPress={() => setShowAddTxn(true)}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>＋ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center' }}>No transactions yet{'\n'}Tap ＋ Add or 🧾 Scan a receipt</Text>
          </View>
        )}

        {(showSearch ? filtered : filtered.slice(0, txnLimit)).map((txn) => (
          <TouchableOpacity key={txn.id} onLongPress={() => setTransactions(transactions.filter(t => t.id !== txn.id))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: c.border }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18 }}>{txn.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{txn.name}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{txn.cat}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: txn.amount > 0 ? '#00D4AA' : '#FF6B6B' }}>
              {txn.amount > 0 ? '+' : ''}£{Math.abs(txn.amount).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>Long press any item to delete</Text>
      </View>

      {/* Tab Picker Modal */}
      <Modal visible={showTabPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 6 }}>Customise Quick Actions</Text>
            <Text style={{ color: c.muted, fontSize: 13, marginBottom: 20 }}>Choose up to 3 shortcuts ({selectedTabs.length}/3)</Text>
            {ALL_TABS.map((tab: Tab) => {
              const isSel = !!selectedTabs.find(t => t.label === tab.label);
              const isDis = !isSel && selectedTabs.length >= 3;
              return (
                <TouchableOpacity key={tab.label} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isSel ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: isSel ? c.accent : c.border, opacity: isDis ? 0.4 : 1 }} onPress={() => !isDis && toggleTab(tab)} disabled={isDis}>
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{tab.icon}</Text>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{tab.label}</Text>
                  {isSel && <Text style={{ color: c.accent, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 }} onPress={() => setShowTabPicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Card Modal */}
      <Modal visible={showAddCard} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Add Card</Text>
            {[
              { label: 'Bank Name',     val: newBank,     set: setNewBank,     ph: 'e.g. Barclays',    kb: 'default' as const     },
              { label: 'Card Type',     val: newCardType, set: setNewCardType, ph: 'e.g. Debit · Visa', kb: 'default' as const     },
              { label: 'Balance (£)',   val: newBalance,  set: setNewBalance,  ph: 'e.g. 1500.00',     kb: 'decimal-pad' as const },
              { label: 'Last 4 digits', val: newNumber,   set: setNewNumber,   ph: 'e.g. 1234',        kb: 'number-pad' as const  },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
              </View>
            ))}
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Card Colour</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {CARD_COLORS.map(col => (
                <TouchableOpacity key={col} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, borderWidth: 2, borderColor: newCardColor === col ? '#fff' : 'transparent' }} onPress={() => setNewCardColor(col)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddCard(false)}>
                <Text style={{ color: c.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newBank || !newBalance) ? 0.4 : 1 }} onPress={addCard}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Investment Modal */}
      <Modal visible={showAddInv} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Add Investment</Text>
            {[
              { label: 'Name',              val: newInvName,   set: setNewInvName,   ph: 'e.g. Apple Inc.',       kb: 'default' as const     },
              { label: 'Details',           val: newInvSub,    set: setNewInvSub,    ph: 'e.g. AAPL · 10 shares', kb: 'default' as const     },
              { label: 'Current Value (£)', val: newInvValue,  set: setNewInvValue,  ph: 'e.g. 1500.00',          kb: 'decimal-pad' as const },
              { label: 'Change %',          val: newInvChange, set: setNewInvChange, ph: 'e.g. 2.5',              kb: 'decimal-pad' as const },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: newInvUp ? '#00D4AA22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: newInvUp ? '#00D4AA' : c.border }} onPress={() => setNewInvUp(true)}>
                <Text style={{ color: newInvUp ? '#00D4AA' : c.muted, fontWeight: '700' }}>▲ Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: !newInvUp ? '#FF6B6B22' : c.card2, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: !newInvUp ? '#FF6B6B' : c.border }} onPress={() => setNewInvUp(false)}>
                <Text style={{ color: !newInvUp ? '#FF6B6B' : c.muted, fontWeight: '700' }}>▼ Down</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddInv(false)}>
                <Text style={{ color: c.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newInvName || !newInvValue) ? 0.4 : 1 }} onPress={addInvestment}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal visible={showAddTxn} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Add Transaction</Text>
            <View style={{ flexDirection: 'row', backgroundColor: c.card2, borderRadius: 50, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: newTxnType === 'expense' ? '#FF6B6B' : 'transparent' }} onPress={() => setNewTxnType('expense')}>
                <Text style={{ color: newTxnType === 'expense' ? '#fff' : c.muted, fontWeight: '700' }}>↓ Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 8, borderRadius: 50, alignItems: 'center', backgroundColor: newTxnType === 'income' ? '#00D4AA' : 'transparent' }} onPress={() => setNewTxnType('income')}>
                <Text style={{ color: newTxnType === 'income' ? '#fff' : c.muted, fontWeight: '700' }}>↑ Income</Text>
              </TouchableOpacity>
            </View>
            {[
              { label: 'Name',       val: newTxnName, set: setNewTxnName, ph: 'e.g. Tesco',  kb: 'default' as const     },
              { label: 'Amount (£)', val: newTxnAmt,  set: setNewTxnAmt,  ph: 'e.g. 42.80', kb: 'decimal-pad' as const },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{f.label}</Text>
                <TextInput style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border }} placeholder={f.ph} placeholderTextColor={c.muted} value={f.val} onChangeText={f.set} keyboardType={f.kb} />
              </View>
            ))}
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {Object.keys(CAT_ICONS).slice(0, 13).map(cat => (
                <TouchableOpacity key={cat} style={{ backgroundColor: newTxnCat === cat ? c.accent : c.card2, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: newTxnCat === cat ? c.accent : c.border }} onPress={() => setNewTxnCat(cat)}>
                  <Text style={{ color: newTxnCat === cat ? '#fff' : c.muted, fontSize: 12, fontWeight: '600' }}>{CAT_ICONS[cat]} {cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAddTxn(false)}>
                <Text style={{ color: c.muted, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!newTxnName || !newTxnAmt) ? 0.4 : 1 }} onPress={addTransaction}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Scanner */}
      <ReceiptScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onAdd={(txns) => {
          const mapped = txns.map((t) => ({
            id: Date.now().toString() + Math.random(),
            icon: t.icon || CAT_ICONS[t.cat] || '💳',
            name: t.name,
            cat: t.cat,
            amount: -t.amount,
            type: 'expense' as const,
          }));
          setTransactions([...mapped, ...transactions]);
        }}
      />

    </ScrollView>
  );
}