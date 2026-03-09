import { useFinance } from '@/context/FinanceContext';
import { useLocale } from '@/context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type Budget = {
  id: string;
  cat: string;
  icon: string;
  limit: number;
  color: string;
};

const BUDGET_CATEGORIES = [
  { name: 'Housing', icon: '🏠', color: '#6C63FF' },
  { name: 'Groceries', icon: '🛒', color: '#00D4AA' },
  { name: 'Transport', icon: '🚗', color: '#FF6B6B' },
  { name: 'Entertainment', icon: '🎬', color: '#FFD700' },
  { name: 'Health', icon: '💊', color: '#FF9F43' },
  { name: 'Clothing', icon: '👗', color: '#a89fff' },
  { name: 'Utilities', icon: '⚡', color: '#00BFFF' },
  { name: 'Subscriptions', icon: '📱', color: '#FF69B4' },
  { name: 'Food', icon: '🍕', color: '#FFA07A' },
  { name: 'Shopping', icon: '📦', color: '#FF6347' },
  { name: 'Other', icon: '🎁', color: '#9370DB' },
];

// Get start of current month
function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Parse DD/MM/YYYY or ISO
function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const p = s.split('/');
  if (p.length === 3) {
    const [d, m, y] = p.map(Number);
    if (d && m && y) return new Date(y, m - 1, d);
  }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
}

export default function BudgetsScreen() {
  const { theme: c } = useTheme();
  const { transactions } = useFinance();
  const { formatAmount, currencySymbol, t } = useLocale();
  const router = useRouter();


  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [storageKey, setStorageKey] = useState('polar_budgets_local');
  const [showAdd, setShowAdd] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  // Form state
  const [fCat, setFCat] = useState('');
  const [fLimit, setFLimit] = useState('');

  // Load budgets
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const key = `polar_budgets_${user?.id ?? 'local'}`;
      setStorageKey(key);
      const raw = await AsyncStorage.getItem(key);
      if (raw) setBudgets(JSON.parse(raw));
    })();
  }, []);

  const saveBudgets = async (data: Budget[]) => {
    setBudgets(data);
    await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  };

  const openAdd = () => { setFCat(''); setFLimit(''); setEditBudget(null); setShowAdd(true); };

  const openEdit = (b: Budget) => {
    setEditBudget(b); setFCat(b.cat); setFLimit(b.limit.toString()); setShowAdd(true);
  };

  const handleSave = async () => {
    if (!fCat || !fLimit) return;
    const catMeta = BUDGET_CATEGORIES.find(c => c.name === fCat)!;
    const entry: Budget = {
      id: editBudget?.id ?? Date.now().toString(),
      cat: fCat,
      icon: catMeta.icon,
      color: catMeta.color,
      limit: parseFloat(fLimit),
    };
    const updated = editBudget
      ? budgets.map(b => b.id === editBudget.id ? entry : b)
      : [...budgets, entry];
    await saveBudgets(updated);
    setShowAdd(false);
  };

  const deleteBudget = async (id: string) => {
    await saveBudgets(budgets.filter(b => b.id !== id));
  };

  // Calculate spending per category this month
  const start = monthStart();
  const spendMap: Record<string, number> = {};
  transactions
    .filter(tx => tx.type === 'expense')
    .filter(tx => { const d = parseDate((tx as any).date); return d ? d >= start : false; })
    .forEach(tx => { spendMap[tx.cat] = (spendMap[tx.cat] || 0) + Math.abs(tx.amount); });

  // Summary
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendMap[b.cat] || 0), 0);
  const totalLeft = totalBudgeted - totalSpent;
  const overallPct = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;

  // Categories not yet budgeted
  const usedCats = new Set(budgets.map(b => b.cat));
  const available = BUDGET_CATEGORIES.filter(c => !usedCats.has(c.name));

  // ── Back button component ──────────────────────────────────────────────────
  const BackBtn = () => (
    <TouchableOpacity onPress={() => router.back()}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 56, marginBottom: 4, alignSelf: 'flex-start' }}>
      <Ionicons name="chevron-back" size={20} color={c.accent} />
      <Text style={{ color: c.accent, fontSize: 15, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <BackBtn />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>Budgets 💰</Text>
        <TouchableOpacity
          onPress={openAdd}
          disabled={available.length === 0}
          style={{ backgroundColor: c.accent + '22', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: c.accent + '55', opacity: available.length === 0 ? 0.4 : 1 }}>
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>＋ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card */}
      {budgets.length > 0 && (
        <View style={{ backgroundColor: c.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: c.border, marginBottom: 24 }}>
          <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>THIS MONTH</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>Budgeted</Text>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalBudgeted)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>Spent</Text>
              <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '900', marginTop: 4 }}>{formatAmount(totalSpent)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 11 }}>Left</Text>
              <Text style={{ color: totalLeft < 0 ? '#FF6B6B' : '#00D4AA', fontSize: 18, fontWeight: '900', marginTop: 4 }}>
                {totalLeft < 0 ? '-' : ''}{formatAmount(Math.abs(totalLeft))}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 10, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${overallPct}%`, borderRadius: 50, backgroundColor: overallPct >= 100 ? '#FF6B6B' : overallPct >= 80 ? '#FF9F43' : c.accent }} />
          </View>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 6, textAlign: 'right' }}>{Math.round(overallPct)}% of total budget used</Text>
        </View>
      )}

      {/* Empty state */}
      {budgets.length === 0 && (
        <View style={{ alignItems: 'center', padding: 50 }}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>💰</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>No budgets yet</Text>
          <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
            Set monthly spending limits per category and track how close you are.
          </Text>
          <TouchableOpacity onPress={openAdd}
            style={{ backgroundColor: c.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>＋ Add First Budget</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Budget cards */}
      {budgets.map(budget => {
        const spent = spendMap[budget.cat] || 0;
        const left = budget.limit - spent;
        const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
        const isOver = spent > budget.limit;
        const isWarning = pct >= 80 && !isOver;
        const barColor = isOver ? '#FF6B6B' : isWarning ? '#FF9F43' : budget.color;

        return (
          <View key={budget.id} style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: isOver ? '#FF6B6B44' : isWarning ? '#FF9F4344' : c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: budget.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 22 }}>{budget.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{budget.cat}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                  {formatAmount(spent)} of {formatAmount(budget.limit)}
                  {isOver && <Text style={{ color: '#FF6B6B' }}> · Over budget!</Text>}
                  {isWarning && <Text style={{ color: '#FF9F43' }}> · Almost there</Text>}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => openEdit(budget)}
                  style={{ backgroundColor: c.card2, borderRadius: 8, padding: 7, borderWidth: 1, borderColor: c.border }}>
                  <Ionicons name="create-outline" size={15} color={c.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteBudget(budget.id)}
                  style={{ backgroundColor: '#FF6B6B18', borderRadius: 8, padding: 7, borderWidth: 1, borderColor: '#FF6B6B33' }}>
                  <Ionicons name="trash-outline" size={15} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 8, overflow: 'hidden', marginBottom: 8 }}>
              <View style={{ height: '100%', width: `${pct}%`, borderRadius: 50, backgroundColor: barColor }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: barColor, fontSize: 11, fontWeight: '700' }}>{Math.round(pct)}% used</Text>
              <Text style={{ color: left < 0 ? '#FF6B6B' : c.muted, fontSize: 11 }}>
                {left < 0 ? `${formatAmount(Math.abs(left))} over` : `${formatAmount(left)} left`}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />

      {/* Add / Edit Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' }}>
              {editBudget ? '✏️ Edit Budget' : '💰 New Budget'}
            </Text>

            {/* Category picker */}
            {!editBudget && (
              <>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>{t('category')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {available.map(cat => (
                    <TouchableOpacity key={cat.name} onPress={() => setFCat(cat.name)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, backgroundColor: fCat === cat.name ? cat.color + '33' : c.card2, borderWidth: 1, borderColor: fCat === cat.name ? cat.color : c.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      <Text style={{ color: fCat === cat.name ? cat.color : c.muted, fontSize: 12, fontWeight: '600' }}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {editBudget && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card2, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ fontSize: 22 }}>{editBudget.icon}</Text>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{editBudget.cat}</Text>
              </View>
            )}

            {/* Limit input */}
            <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Monthly Limit ({currencySymbol})</Text>
            <TextInput
              style={{ backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 20, fontWeight: '800', borderWidth: 1, borderColor: c.border, marginBottom: 24 }}
              placeholder="e.g. 300"
              placeholderTextColor={c.muted}
              keyboardType="decimal-pad"
              value={fLimit}
              onChangeText={setFLimit}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: c.card2, borderRadius: 14, padding: 16, alignItems: 'center' }} onPress={() => setShowAdd(false)}>
                <Text style={{ color: c.muted, fontWeight: '700' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: (!fCat || !fLimit) ? 0.4 : 1 }}
                onPress={handleSave} disabled={!fCat || !fLimit}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}