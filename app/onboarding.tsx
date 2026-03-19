import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import StarBackground from '../components/StarBackground';
import { supabase } from '../lib/supabase';

const ACCENT = '#6C63FF';
const TOTAL = 8;

const CURRENCIES = [
  { key: 'GBP', symbol: '£', name: 'British Pound' },
  { key: 'USD', symbol: '$', name: 'US Dollar' },
  { key: 'EUR', symbol: '€', name: 'Euro' },
  { key: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { key: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { key: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { key: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { key: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { key: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { key: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

const CURRENCY_COLORS: Record<string, string> = {
  GBP: '#00D4AA', USD: '#00D4AA', EUR: '#6C63FF', CAD: '#FF6B6B',
  AUD: '#FF9F43', JPY: '#FF6B6B', INR: '#FFD700', CHF: '#00BFFF',
  SEK: '#a89fff', NZD: '#00D4AA',
};

const MAIN_GOALS = [
  { key: 'save', label: 'Save More', icon: 'wallet' },
  { key: 'debt', label: 'Pay Off Debt', icon: 'card' },
  { key: 'invest', label: 'Start Investing', icon: 'trending-up' },
  { key: 'budget', label: 'Stick to a Budget', icon: 'pie-chart' },
  { key: 'house', label: 'Buy a House', icon: 'home' },
  { key: 'emergency', label: 'Emergency Fund', icon: 'shield-checkmark' },
];

const COMMON_SUBS = [
  { name: 'Netflix', icon: 'play-circle', color: '#E50914' },
  { name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { name: 'Amazon Prime', icon: 'cart', color: '#FF9900' },
  { name: 'Disney+', icon: 'star', color: '#113CCF' },
  { name: 'Apple TV+', icon: 'tv', color: '#888' },
  { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000' },
  { name: 'Sky', icon: 'cloud', color: '#0078D7' },
  { name: 'Gym', icon: 'barbell', color: '#FF6B6B' },
  { name: 'iCloud', icon: 'cloud-upload', color: '#007AFF' },
  { name: 'Microsoft 365', icon: 'grid', color: '#D83B01' },
  { name: 'Adobe CC', icon: 'color-palette', color: '#FF0000' },
  { name: 'NOW TV', icon: 'play', color: '#00B140' },
  { name: 'Headspace', icon: 'leaf', color: '#FF6D00' },
  { name: 'Deliveroo+', icon: 'bicycle', color: '#00CCBC' },
  { name: 'BT Sport', icon: 'football', color: '#003087' },
  { name: 'Other', icon: 'add-circle', color: '#7B7B9E' },
];

const BUDGET_CATS = [
  { key: 'Groceries', icon: 'cart', color: '#00D4AA' },
  { key: 'Food', icon: 'restaurant', color: '#FF9F43' },
  { key: 'Transport', icon: 'car', color: '#6C63FF' },
  { key: 'Entertainment', icon: 'film', color: '#FF6B6B' },
  { key: 'Shopping', icon: 'bag', color: '#a89fff' },
  { key: 'Health', icon: 'medkit', color: '#00D4AA' },
  { key: 'Housing', icon: 'home', color: '#FFD700' },
  { key: 'Utilities', icon: 'flash', color: '#FF9F43' },
  { key: 'Other', icon: 'gift', color: '#7B7B9E' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [cur, setCur] = useState(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [income, setIncome] = useState('');
  const [subPrices, setSubPrices] = useState<Record<string, string>>({});
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [budgetCat, setBudgetCat] = useState('Groceries');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [showSubsPopup, setShowSubsPopup] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const fullName = user?.user_metadata?.full_name as string | undefined;
        if (fullName?.trim()) setName(fullName.trim().split(' ')[0]);
      } catch { }
    })();
  }, []);

  const selectedCurr = CURRENCIES.find(c => c.key === currency)!;
  const selectedSubs = Object.keys(subPrices);
  const isLastSlide = cur === TOTAL - 1;
  const optionalSlides = [4, 5, 6];

  const toggleSub = (n: string) => {
    setSubPrices(prev => {
      const next = { ...prev };
      if (next[n] !== undefined) delete next[n];
      else next[n] = '';
      return next;
    });
  };

  const canContinue = (() => {
    if (cur === 1) return name.trim().length >= 2;
    if (cur === 2) return !!currency;
    if (cur === 3) return !!income && parseFloat(income) > 0;
    if (cur === 7) return !!mainGoal;
    return true;
  })();

  const finish = async () => {
    try {
      const curr = CURRENCIES.find(c => c.key === currency)!;
      let uid = 'local';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) uid = user.id;
      } catch { }

      // Set onboarding_complete FIRST so _layout.tsx doesn't redirect back
      await AsyncStorage.setItem('onboarding_complete', 'true');

      // Save all settings to AsyncStorage
      await AsyncStorage.multiSet([
        ['onboarding_complete', 'true'],
        ['jf_currency', currency],
        ['app_currency', currency],
        ['jf_currency_symbol', curr.symbol],
        ['jf_monthly_income', income || '0'],
        ['jf_main_goal', mainGoal],
        ['jf_user_name', name],
        ['user_plan', 'free'],
        ['trial_prompt_seen', 'true'],
      ]);

      // Save to Supabase metadata so onboarding doesn't repeat on re-login
      try {
        await supabase.auth.updateUser({ data: {
          full_name: name,
          onboarding_complete: 'true',
        }});
      } catch { }

      // ── Build all data arrays ─────────────────────────────────────────────
      const filtered = selectedSubs.filter(s => s !== 'Other');

      const bills = filtered.map(subName => {
        const sub = COMMON_SUBS.find(s => s.name === subName)!;
        const price = parseFloat(subPrices[subName] || '0') || 9.99;
        return {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: subName, amount: price, frequency: 'monthly',
          nextDue: new Date().toLocaleDateString('en-GB'),
          cardId: null, icon: sub.icon, color: sub.color, active: true,
        };
      });

      const transactions = filtered.map(subName => {
        const sub = COMMON_SUBS.find(s => s.name === subName)!;
        const price = parseFloat(subPrices[subName] || '0') || 9.99;
        return {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          icon: sub.icon, name: subName, cat: 'Subscriptions',
          amount: -Math.abs(price), type: 'expense',
          date: new Date().toLocaleDateString('en-GB'), recurring: true,
        };
      });

      const goals = goalName && goalTarget ? [{
        id: Date.now().toString(), icon: 'wallet', name: goalName,
        target: parseFloat(goalTarget) || 0, saved: 0, color: ACCENT,
      }] : [];

      const budgets = budgetLimit ? [{
        id: Date.now().toString(),
        cat: budgetCat,
        limit: parseFloat(budgetLimit) || 0,
        icon: BUDGET_CATS.find(c => c.key === budgetCat)!.icon,
        color: BUDGET_CATS.find(c => c.key === budgetCat)!.color,
      }] : [];

      const incomeSources = income && parseFloat(income) > 0 ? [{
        id: Date.now().toString(), label: 'Main Income',
        amount: parseFloat(income), frequency: 'monthly', paydayDay: 25, emoji: 'briefcase',
      }] : [];

      // ── Write directly to Supabase (bypass context import timing issues) ──
      if (uid !== 'local') {
        try {
          // Finance data (cards + transactions)
          await supabase.from('user_finance_data').upsert({
            user_id: uid,
            cards: [],
            investments: [],
            transactions,
            assets: [],
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (e) { console.warn('Finance upsert failed:', e); }

        try {
          // Profile data (goals + budgets + income)
          await supabase.from('user_profile_data').upsert({
            user_id: uid,
            budgets,
            goals,
            income: incomeSources,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (e) { console.warn('Profile upsert failed:', e); }

        // Bills go to AsyncStorage (BillsContext reads from there)
        if (bills.length > 0) {
          try {
            await AsyncStorage.setItem(`polar_bills_${uid}`, JSON.stringify(bills));
          } catch { }
        }

        // Also cache locally so contexts show data immediately
        try {
          await AsyncStorage.setItem(`jf_finance_${uid}`, JSON.stringify({
            cards: [], investments: [], transactions, assets: [],
          }));
          await AsyncStorage.setItem(`jf_profile_${uid}`, JSON.stringify({
            budgets, goals, income: incomeSources,
          }));
          if (incomeSources.length > 0) {
            await AsyncStorage.setItem(`polar_income_${uid}`, JSON.stringify(incomeSources));
          }
          // Write to TransactionContext storage key too
          if (transactions.length > 0) {
            await AsyncStorage.setItem('polar_transactions', JSON.stringify(transactions));
          }
          // Write budgets/goals to legacy keys
          if (budgets.length > 0) {
            await AsyncStorage.setItem(`polar_budgets_${uid}`, JSON.stringify(budgets));
          }
          if (goals.length > 0) {
            await AsyncStorage.setItem(`polar_goals_${uid}`, JSON.stringify(goals));
          }
        } catch { }
      }
    } catch (e) {
      console.warn('Onboarding save error:', e);
    }
  };

  const next = () => {
    Keyboard.dismiss();
    if (isLastSlide) {
      setShowSubsPopup(true);
    } else {
      setCur(c => c + 1);
    }
  };

  const completeOnboarding = async () => {
    setShowSubsPopup(false);
    await finish();
    router.replace('/(tabs)' as any);
  };

  const back = () => setCur(c => Math.max(c - 1, 0));
  const progressPct = Math.round((cur / (TOTAL - 1)) * 100);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
        <StarBackground />

        {/* Progress */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 20 }}>
          <View style={{ height: 3, backgroundColor: ACCENT, width: `${progressPct}%` as any, borderRadius: 3 }} />
        </View>

        {/* Back */}
        {cur > 0 && (
          <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 52, left: 24, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 10 }}>
            <Ionicons name="chevron-back" size={18} color="#7B7B9E" />
          </TouchableOpacity>
        )}

        {/* Skip */}
        {optionalSlides.includes(cur) && (
          <TouchableOpacity onPress={() => setCur(c => c + 1)} style={{ position: 'absolute', top: 52, right: 24, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>

          {/* 0: Welcome */}
          {cur === 0 && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
              <View style={{ width: 140, height: 140, borderRadius: 36, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 36, borderWidth: 1, borderColor: ACCENT + '33' }}>
                <Ionicons name="bar-chart" size={68} color={ACCENT} />
              </View>
              <Text style={{ color: '#E8E8F0', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>Welcome to{'\n'}James Finance</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 16, textAlign: 'center', lineHeight: 26, maxWidth: 300 }}>Your all-in-one personal finance app.{'\n'}Let's get you set up properly.</Text>
            </View>
          )}

          {/* 1: Name */}
          {cur === 1 && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#00D4AA33' }}>
                  <Ionicons name="person" size={36} color="#00D4AA" />
                </View>
                <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>What should{'\n'}we call you?</Text>
                <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>This is how we'll greet you every day.</Text>
                <TextInput style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 18, color: '#E8E8F0', fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: name ? '#00D4AA55' : 'rgba(108,99,255,0.2)', marginBottom: 12 }} placeholder="Your first name" placeholderTextColor="#3a3a5e" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" onSubmitEditing={next} />
                {name.length >= 2 && <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '600' }}>Hi {name.split(' ')[0]}, great to have you!</Text>}
              </View>
            </KeyboardAvoidingView>
          )}

          {/* 2: Currency */}
          {cur === 2 && (
            <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 96 }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FFD70018', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FFD70033' }}>
                <Ionicons name="cash" size={36} color="#FFD700" />
              </View>
              <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Your currency</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 20 }}>All amounts will show in your chosen currency.</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c.key} onPress={() => setCurrency(c.key)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === c.key ? ACCENT + '22' : '#13132A', borderWidth: 1, borderColor: currency === c.key ? ACCENT : 'rgba(108,99,255,0.15)', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: CURRENCY_COLORS[c.key] + '22', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: CURRENCY_COLORS[c.key], fontSize: 13, fontWeight: '900' }}>{c.symbol}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
                      <Text style={{ color: '#7B7B9E', fontSize: 12 }}>{c.key} · {c.symbol}</Text>
                    </View>
                    {currency === c.key && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 3: Income */}
          {cur === 3 && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF9F4318', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#FF9F4333' }}>
                  <Ionicons name="briefcase" size={36} color="#FF9F43" />
                </View>
                <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Monthly income?</Text>
                <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>Used to calculate your budgets and left-to-spend.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: income ? '#FF9F4355' : 'rgba(108,99,255,0.2)', marginBottom: 16, overflow: 'hidden' }}>
                  <View style={{ paddingHorizontal: 18, paddingVertical: 18, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
                    <Text style={{ color: '#7B7B9E', fontSize: 20, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
                  </View>
                  <TextInput style={{ flex: 1, padding: 18, color: '#E8E8F0', fontSize: 26, fontWeight: '900' }} placeholder="0" placeholderTextColor="#3a3a5e" value={income} onChangeText={setIncome} keyboardType="decimal-pad" returnKeyType="next" onSubmitEditing={next} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['1000', '1500', '2000', '2500', '3000', '4000'].map(v => (
                    <TouchableOpacity key={v} onPress={() => setIncome(v)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: income === v ? '#FF9F4322' : '#13132A', borderWidth: 1, borderColor: income === v ? '#FF9F43' : 'rgba(108,99,255,0.15)' }}>
                      <Text style={{ color: income === v ? '#FF9F43' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* 4: Subscriptions */}
          {cur === 4 && (
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 96 }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#a89fff18', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#a89fff33' }}>
                <Ionicons name="repeat" size={36} color="#a89fff" />
              </View>
              <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Your subscriptions</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>Tap to select. These will be added as recurring bills.</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {COMMON_SUBS.map(sub => {
                    const sel = subPrices[sub.name] !== undefined;
                    return (
                      <TouchableOpacity key={sub.name} onPress={() => toggleSub(sub.name)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 50, backgroundColor: sel ? sub.color + '28' : '#13132A', borderWidth: 1.5, borderColor: sel ? sub.color : 'rgba(108,99,255,0.15)' }}>
                        <Ionicons name={sub.icon as any} size={15} color={sel ? sub.color : '#7B7B9E'} />
                        <Text style={{ color: sel ? sub.color : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{sub.name}</Text>
                        {sel && <Ionicons name="checkmark" size={13} color={sub.color} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {selectedSubs.filter(s => s !== 'Other').length > 0 && (
                  <View style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', gap: 10 }}>
                    <Text style={{ color: '#7B7B9E', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Monthly Cost</Text>
                    {selectedSubs.filter(s => s !== 'Other').map(subName => {
                      const sub = COMMON_SUBS.find(s => s.name === subName)!;
                      return (
                        <View key={subName} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0D0D1A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: subPrices[subName] ? sub.color + '55' : 'rgba(108,99,255,0.1)' }}>
                          <Ionicons name={sub.icon as any} size={16} color={sub.color} />
                          <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '600', flex: 1 }}>{subName}</Text>
                          <Text style={{ color: '#7B7B9E', fontSize: 16, fontWeight: '700' }}>{selectedCurr.symbol}</Text>
                          <TextInput style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '800', minWidth: 60, textAlign: 'right' }} placeholder="0.00" placeholderTextColor="#3a3a5e" keyboardType="decimal-pad" value={subPrices[subName]} onChangeText={val => setSubPrices(prev => ({ ...prev, [subName]: val }))} />
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* 5: Saving Goal */}
          {cur === 5 && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#00D4AA33' }}>
                  <Ionicons name="wallet" size={36} color="#00D4AA" />
                </View>
                <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Set a saving goal</Text>
                <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>What are you saving towards?</Text>
                <TextInput style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 16, color: '#E8E8F0', fontSize: 16, borderWidth: 1, borderColor: goalName ? '#00D4AA55' : 'rgba(108,99,255,0.2)', marginBottom: 12 }} placeholder="Goal name (e.g. Holiday, New Car)" placeholderTextColor="#3a3a5e" value={goalName} onChangeText={setGoalName} />
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: goalTarget ? '#00D4AA55' : 'rgba(108,99,255,0.2)', overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
                    <Text style={{ color: '#7B7B9E', fontSize: 18, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
                  </View>
                  <TextInput style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 22, fontWeight: '900' }} placeholder="Target amount" placeholderTextColor="#3a3a5e" value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['500', '1000', '2000', '5000', '10000'].map(v => (
                    <TouchableOpacity key={v} onPress={() => setGoalTarget(v)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: goalTarget === v ? '#00D4AA22' : '#13132A', borderWidth: 1, borderColor: goalTarget === v ? '#00D4AA' : 'rgba(108,99,255,0.15)' }}>
                      <Text style={{ color: goalTarget === v ? '#00D4AA' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* 6: Budget */}
          {cur === 6 && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF9F4318', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#FF9F4333' }}>
                  <Ionicons name="pie-chart" size={36} color="#FF9F43" />
                </View>
                <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Set a monthly budget</Text>
                <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>Pick a category and set a limit.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {BUDGET_CATS.map(c => (
                      <TouchableOpacity key={c.key} onPress={() => setBudgetCat(c.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50, backgroundColor: budgetCat === c.key ? c.color + '28' : '#13132A', borderWidth: 1.5, borderColor: budgetCat === c.key ? c.color : 'rgba(108,99,255,0.15)' }}>
                        <Ionicons name={c.icon as any} size={14} color={budgetCat === c.key ? c.color : '#7B7B9E'} />
                        <Text style={{ color: budgetCat === c.key ? c.color : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{c.key}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: budgetLimit ? '#FF9F4355' : 'rgba(108,99,255,0.2)', overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
                    <Text style={{ color: '#7B7B9E', fontSize: 18, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
                  </View>
                  <TextInput style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 22, fontWeight: '900' }} placeholder="Monthly limit" placeholderTextColor="#3a3a5e" value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="decimal-pad" />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['100', '200', '300', '500', '800'].map(v => (
                    <TouchableOpacity key={v} onPress={() => setBudgetLimit(v)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: budgetLimit === v ? '#FF9F4322' : '#13132A', borderWidth: 1, borderColor: budgetLimit === v ? '#FF9F43' : 'rgba(108,99,255,0.15)' }}>
                      <Text style={{ color: budgetLimit === v ? '#FF9F43' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </KeyboardAvoidingView>
          )}

          {/* 7: Main Goal */}
          {cur === 7 && (
            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
              <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: ACCENT + '33' }}>
                <Ionicons name="flag" size={36} color={ACCENT} />
              </View>
              <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>What's your{'\n'}main goal?</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 28, lineHeight: 22 }}>We'll personalise your home screen around this.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {MAIN_GOALS.map(g => (
                  <TouchableOpacity key={g.key} onPress={() => setMainGoal(g.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 50, backgroundColor: mainGoal === g.key ? ACCENT : '#13132A', borderWidth: 1, borderColor: mainGoal === g.key ? ACCENT : 'rgba(108,99,255,0.2)' }}>
                    <Ionicons name={g.icon as any} size={15} color={mainGoal === g.key ? '#fff' : '#7B7B9E'} />
                    <Text style={{ color: mainGoal === g.key ? '#fff' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: '#7B7B9E', fontSize: 12, marginTop: 20, textAlign: 'center' }}>Tap a goal, then tap Get Started</Text>
            </View>
          )}

        </View>

        {/* Bottom controls */}
        <View style={{ paddingHorizontal: 28, paddingBottom: 52 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View key={i} style={{ width: cur === i ? 20 : 5, height: 5, borderRadius: 3, backgroundColor: cur === i ? ACCENT : '#2a2a4a' }} />
            ))}
          </View>
          <TouchableOpacity style={{ backgroundColor: canContinue ? ACCENT : '#2a2a4a', borderRadius: 18, padding: 18, alignItems: 'center' }} onPress={next} disabled={!canContinue}>
            <Text style={{ color: canContinue ? '#fff' : '#7B7B9E', fontSize: 17, fontWeight: '900' }}>{isLastSlide ? 'Get Started' : 'Continue'}</Text>
          </TouchableOpacity>
          {!canContinue && (
            <Text style={{ color: '#7B7B9E', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
              {cur === 1 ? 'Enter your name to continue' : cur === 3 ? 'Enter your monthly income to continue' : cur === 7 ? 'Pick a goal to get started' : ''}
            </Text>
          )}
        </View>

        {/* Subscriptions popup */}
        <Modal visible={showSubsPopup} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#13132A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' }}>
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
              <Text style={{ color: '#E8E8F0', fontSize: 22, fontWeight: '900', marginBottom: 6 }}>Any subscriptions?</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>Tap any you pay for — we'll track them as recurring bills.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {COMMON_SUBS.filter(s => s.name !== 'Other').map(sub => {
                  const sel = subPrices[sub.name] !== undefined;
                  return (
                    <TouchableOpacity key={sub.name} onPress={() => toggleSub(sub.name)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 50, backgroundColor: sel ? sub.color + '28' : '#0D0D1A', borderWidth: 1.5, borderColor: sel ? sub.color : 'rgba(108,99,255,0.15)' }}>
                      <Ionicons name={sub.icon as any} size={15} color={sel ? sub.color : '#7B7B9E'} />
                      <Text style={{ color: sel ? sub.color : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{sub.name}</Text>
                      {sel && <Ionicons name="checkmark" size={13} color={sub.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={completeOnboarding} style={{ backgroundColor: ACCENT, borderRadius: 16, padding: 18, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
                  {selectedSubs.filter(s => s !== 'Other').length > 0
                    ? `Add ${selectedSubs.filter(s => s !== 'Other').length} subscription${selectedSubs.filter(s => s !== 'Other').length > 1 ? 's' : ''} & Continue`
                    : 'Skip for now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}