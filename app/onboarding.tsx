import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Image, Keyboard, KeyboardAvoidingView, Modal,
  Platform, ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import StarBackground from '../components/StarBackground';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const ACCENT = '#6C63FF';
const TOTAL = 11;

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

const CURRENCY_ICONS: Record<string, { color: string }> = {
  GBP: { color: '#00D4AA' }, USD: { color: '#00D4AA' }, EUR: { color: '#6C63FF' },
  CAD: { color: '#FF6B6B' }, AUD: { color: '#FF9F43' }, JPY: { color: '#FF6B6B' },
  INR: { color: '#FFD700' }, CHF: { color: '#00BFFF' }, SEK: { color: '#a89fff' },
  NZD: { color: '#00D4AA' },
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

const TXN_CATS = [
  { key: 'Groceries', icon: 'cart' },
  { key: 'Food', icon: 'restaurant' },
  { key: 'Transport', icon: 'car' },
  { key: 'Entertainment', icon: 'film' },
  { key: 'Shopping', icon: 'bag' },
  { key: 'Health', icon: 'medkit' },
  { key: 'Housing', icon: 'home' },
  { key: 'Utilities', icon: 'flash' },
  { key: 'Subscriptions', icon: 'phone-portrait' },
  { key: 'Income', icon: 'briefcase' },
  { key: 'Other', icon: 'gift' },
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

const CARD_COLORS = ['#1a1a4e', '#1a2a1a', '#2a1a00', '#1a001a', '#0a1428', '#000500'];

type OnboardingTxn = {
  id: string; name: string; cat: string;
  amount: string; type: 'income' | 'expense'; icon: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [cur, setCur] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Core
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [income, setIncome] = useState('');
  const [subPrices, setSubPrices] = useState<Record<string, string>>({});

  // Card
  const [cardBank, setCardBank] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [cardType, setCardType] = useState('Debit');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0]);

  // Transactions
  const [txns, setTxns] = useState<OnboardingTxn[]>([]);
  const [txnName, setTxnName] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCat, setTxnCat] = useState('Groceries');
  const [txnType, setTxnType] = useState<'income' | 'expense'>('expense');

  // Saving goal
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  // Budget
  const [budgetCat, setBudgetCat] = useState('Groceries');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Main goal & plan
  const [mainGoal, setMainGoal] = useState('');
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  // Pre-fill name from signup
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const fullName = user?.user_metadata?.full_name as string | undefined;
        if (fullName?.trim()) setName(fullName.trim().split(' ')[0]);
      } catch { }
    })();
  }, []);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setCur(i);
    Animated.spring(progressAnim, { toValue: i / (TOTAL - 1), useNativeDriver: false, speed: 20 }).start();
  };
  const next = () => { Keyboard.dismiss(); if (cur < TOTAL - 1) goTo(cur + 1); };
  const back = () => { if (cur > 0) goTo(cur - 1); };

  const toggleSub = (subName: string) => {
    setSubPrices(prev => {
      if (prev[subName] !== undefined) { const n = { ...prev }; delete n[subName]; return n; }
      return { ...prev, [subName]: '' };
    });
  };
  const selectedSubs = Object.keys(subPrices);

  const addTxn = () => {
    if (!txnName || !txnAmount) return;
    const cat = TXN_CATS.find(c => c.key === txnCat)!;
    setTxns(prev => [...prev, {
      id: Date.now().toString(), name: txnName, cat: txnCat,
      amount: txnAmount, type: txnType, icon: cat.icon,
    }]);
    setTxnName(''); setTxnAmount('');
  };
  const removeTxn = (id: string) => setTxns(prev => prev.filter(t => t.id !== id));

  const saveAndNavigate = async (plan: 'free' | 'trial' | 'pro') => {
    const curr = CURRENCIES.find(c => c.key === currency)!;
    let uid = 'local';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) uid = user.id;
    } catch { }

    await AsyncStorage.multiSet([
      ['onboarding_complete', 'true'],
      ['jf_currency', currency],
      ['app_currency', currency],
      ['jf_currency_symbol', curr.symbol],
      ['jf_monthly_income', income || '0'],
      ['jf_main_goal', mainGoal],
      ['jf_user_name', name],
    ]);

    try { await supabase.auth.updateUser({ data: { full_name: name } }); } catch { }

    // Income source
    if (income && parseFloat(income) > 0) {
      await AsyncStorage.setItem(`polar_income_${uid}`, JSON.stringify([{
        id: Date.now().toString(), label: 'Main Income',
        amount: parseFloat(income), frequency: 'monthly', paydayDay: 25, emoji: 'briefcase',
      }]));
    }

    // Subscriptions as transactions + bills
    const filtered = selectedSubs.filter(s => s !== 'Other');
    const subTxns = filtered.map(subName => {
      const sub = COMMON_SUBS.find(s => s.name === subName)!;
      const price = parseFloat(subPrices[subName] || '0') || 9.99;
      return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        icon: sub.icon, name: subName, cat: 'Subscriptions',
        amount: -Math.abs(price), type: 'expense',
        date: new Date().toLocaleDateString('en-GB'), recurring: true,
      };
    });

    // Manual transactions
    const manualTxns = txns.map(t => ({
      id: t.id, icon: t.icon, name: t.name, cat: t.cat,
      amount: t.type === 'expense' ? -Math.abs(parseFloat(t.amount)) : Math.abs(parseFloat(t.amount)),
      type: t.type, date: new Date().toLocaleDateString('en-GB'),
    }));

    const allTxns = [...subTxns, ...manualTxns];
    if (allTxns.length > 0) await AsyncStorage.setItem('jf_onboarding_subs', JSON.stringify(allTxns));

    // Bills (capped at 3 for free)
    const billLimit = plan === 'free' ? 3 : filtered.length;
    const bills = filtered.slice(0, billLimit).map(subName => {
      const sub = COMMON_SUBS.find(s => s.name === subName)!;
      const price = parseFloat(subPrices[subName] || '0') || 9.99;
      return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: subName, amount: price, frequency: 'monthly',
        nextDue: new Date().toLocaleDateString('en-GB'),
        cardId: null, icon: sub.icon, color: sub.color, active: true,
      };
    });
    if (bills.length > 0) await AsyncStorage.setItem(`jf_onboarding_bills_${uid}`, JSON.stringify(bills));

    // Card
    if (cardBank && cardBalance) {
      const bal = parseFloat(cardBalance) || 0;
      await AsyncStorage.setItem(`jf_onboarding_card_${uid}`, JSON.stringify([{
        id: Date.now().toString(), bank: cardBank, type: cardType,
        balance: bal, number: '0000', color: cardColor, positive: bal >= 0,
      }]));
    }

    // Saving goal
    if (goalName && goalTarget) {
      await AsyncStorage.setItem(`jf_onboarding_goal_${uid}`, JSON.stringify([{
        id: Date.now().toString(), name: goalName,
        target: parseFloat(goalTarget) || 0, saved: 0,
        color: ACCENT, icon: 'wallet',
      }]));
    }

    // Budget
    if (budgetLimit) {
      const cat = BUDGET_CATS.find(c => c.key === budgetCat)!;
      await AsyncStorage.setItem(`jf_onboarding_budget_${uid}`, JSON.stringify([{
        id: Date.now().toString(), cat: budgetCat,
        limit: parseFloat(budgetLimit) || 0, icon: cat.icon, color: cat.color,
      }]));
    }

    // Plan
    if (plan === 'trial') {
      await AsyncStorage.multiSet([
        ['user_plan', 'trial'], ['trial_start', new Date().toISOString()], ['trial_prompt_seen', 'true'],
      ]);
    } else if (plan === 'pro') {
      await AsyncStorage.multiSet([['user_plan', 'pro'], ['trial_prompt_seen', 'true']]);
    } else {
      await AsyncStorage.multiSet([['user_plan', 'free'], ['trial_prompt_seen', 'true']]);
    }

    router.replace('/(tabs)' as any);
  };

  const selectedCurr = CURRENCIES.find(c => c.key === currency)!;
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '100%'] });
  const isLastSlide = cur === TOTAL - 1;

  // Slides 4,5,6,7,8 are optional (subs, card, txns, goal, budget)
  const optionalSlides = [4, 5, 6, 7, 8];

  const canContinue = (() => {
    switch (cur) {
      case 1: return name.trim().length >= 2;
      case 2: return !!currency;
      case 3: return !!income && parseFloat(income) > 0;
      case 9: return !!mainGoal;
      default: return true;
    }
  })();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D0D1A' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StarBackground />

      {/* Progress bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 10 }}>
        <Animated.View style={{ height: 3, backgroundColor: ACCENT, width: progressWidth, borderRadius: 3 }} />
      </View>

      {/* Back */}
      {cur > 0 && !isLastSlide && (
        <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 52, left: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 10 }}>
          <Ionicons name="chevron-back" size={18} color="#7B7B9E" />
        </TouchableOpacity>
      )}

      {/* Skip for optional slides */}
      {optionalSlides.includes(cur) && !isLastSlide && (
        <TouchableOpacity onPress={next} style={{ position: 'absolute', top: 52, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView ref={scrollRef} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>

        {/* ── 0: Welcome ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 140, height: 140, borderRadius: 36, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 36, borderWidth: 1, borderColor: ACCENT + '33' }}>
            <Ionicons name="bar-chart" size={68} color={ACCENT} />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>
            Welcome to{'\n'}James Finance
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 16, textAlign: 'center', lineHeight: 26, maxWidth: 300 }}>
            Your all-in-one personal finance app.{'\n'}Let's get you set up properly.
          </Text>
        </View>

        {/* ── 1: Name ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#00D4AA33' }}>
            <Ionicons name="person" size={36} color="#00D4AA" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>What should{'\n'}we call you?</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>This is how we'll greet you every day.</Text>
          <TextInput
            style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 18, color: '#E8E8F0', fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: name ? '#00D4AA55' : 'rgba(108,99,255,0.2)', marginBottom: 12 }}
            placeholder="Your first name" placeholderTextColor="#3a3a5e"
            value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" onSubmitEditing={next}
          />
          {name.length >= 2 && (
            <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '600', marginTop: 4 }}>Hi {name.split(' ')[0]}, great to have you!</Text>
          )}
        </View>

        {/* ── 2: Currency ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 28, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FFD70018', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FFD70033' }}>
            <Ionicons name="cash" size={36} color="#FFD700" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Your currency</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 20, lineHeight: 22 }}>All amounts will show in your chosen currency.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {CURRENCIES.map(c => {
              const meta = CURRENCY_ICONS[c.key];
              return (
                <TouchableOpacity key={c.key} onPress={() => setCurrency(c.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === c.key ? ACCENT + '22' : '#13132A', borderWidth: 1, borderColor: currency === c.key ? ACCENT : 'rgba(108,99,255,0.15)', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: meta.color + '22', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: meta.color, fontSize: 13, fontWeight: '900' }}>{c.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
                    <Text style={{ color: '#7B7B9E', fontSize: 12, marginTop: 1 }}>{c.key} · {c.symbol}</Text>
                  </View>
                  {currency === c.key && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 3: Monthly Income ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF9F4318', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#FF9F4333' }}>
            <Ionicons name="briefcase" size={36} color="#FF9F43" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Monthly income?</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>Used to calculate your budgets and left-to-spend balance.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: income ? '#FF9F4355' : 'rgba(108,99,255,0.2)', marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 18, paddingVertical: 18, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
              <Text style={{ color: '#7B7B9E', fontSize: 20, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
            </View>
            <TextInput
              style={{ flex: 1, padding: 18, color: '#E8E8F0', fontSize: 26, fontWeight: '900' }}
              placeholder="0" placeholderTextColor="#3a3a5e"
              value={income} onChangeText={setIncome} keyboardType="decimal-pad" returnKeyType="next" onSubmitEditing={next}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {['1000', '1500', '2000', '2500', '3000', '4000'].map(v => (
              <TouchableOpacity key={v} onPress={() => setIncome(v)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: income === v ? '#FF9F4322' : '#13132A', borderWidth: 1, borderColor: income === v ? '#FF9F43' : 'rgba(108,99,255,0.15)' }}>
                <Text style={{ color: income === v ? '#FF9F43' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4: Subscriptions ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 24, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#a89fff18', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#a89fff33' }}>
            <Ionicons name="repeat" size={36} color="#a89fff" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Your subscriptions</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>Select active subscriptions and enter the cost. Added as recurring bills.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {COMMON_SUBS.map(sub => {
                const sel = subPrices[sub.name] !== undefined;
                return (
                  <TouchableOpacity key={sub.name} onPress={() => toggleSub(sub.name)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 50, backgroundColor: sel ? sub.color + '28' : '#13132A', borderWidth: 1.5, borderColor: sel ? sub.color : 'rgba(108,99,255,0.15)' }}>
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
                      <TextInput
                        style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '800', minWidth: 60, textAlign: 'right' }}
                        placeholder="0.00" placeholderTextColor="#3a3a5e" keyboardType="decimal-pad"
                        value={subPrices[subName]} onChangeText={val => setSubPrices(prev => ({ ...prev, [subName]: val }))}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── 5: Add a Card ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 24, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#00D4AA33' }}>
            <Ionicons name="card" size={36} color="#00D4AA" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Add a card</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>Add your main bank account to track your balance.</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Card preview */}
            <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 22, marginBottom: 20, minHeight: 110 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{cardType}</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>{cardBank || 'Bank Name'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: '900', marginTop: 8 }}>
                {cardBalance ? `${selectedCurr.symbol}${parseFloat(cardBalance).toLocaleString()}` : `${selectedCurr.symbol}0.00`}
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              <TextInput
                style={{ backgroundColor: '#13132A', borderRadius: 14, padding: 16, color: '#E8E8F0', fontSize: 15, borderWidth: 1, borderColor: cardBank ? '#00D4AA55' : 'rgba(108,99,255,0.2)' }}
                placeholder="Bank name (e.g. Barclays)" placeholderTextColor="#3a3a5e"
                value={cardBank} onChangeText={setCardBank}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 14, borderWidth: 1, borderColor: cardBalance ? '#00D4AA55' : 'rgba(108,99,255,0.2)', overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
                  <Text style={{ color: '#7B7B9E', fontSize: 16, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
                </View>
                <TextInput
                  style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 16, fontWeight: '700' }}
                  placeholder="Current balance" placeholderTextColor="#3a3a5e"
                  value={cardBalance} onChangeText={setCardBalance} keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Debit', 'Credit', 'Savings'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setCardType(t)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: cardType === t ? '#00D4AA22' : '#13132A', borderWidth: 1, borderColor: cardType === t ? '#00D4AA' : 'rgba(108,99,255,0.2)', alignItems: 'center' }}>
                    <Text style={{ color: cardType === t ? '#00D4AA' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View>
                <Text style={{ color: '#7B7B9E', fontSize: 12, fontWeight: '600', marginBottom: 10 }}>Card Colour</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {CARD_COLORS.map(col => (
                    <TouchableOpacity key={col} onPress={() => setCardColor(col)}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col, borderWidth: 3, borderColor: cardColor === col ? '#fff' : 'transparent' }} />
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* ── 6: Recent Transactions ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 24, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF6B6B18', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FF6B6B33' }}>
            <Ionicons name="receipt" size={36} color="#FF6B6B" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Recent transactions</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>
            Add some recent spending or income. Free plan allows 20 transactions per week.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', marginBottom: 16, gap: 10 }}>
              {/* Type toggle */}
              <View style={{ flexDirection: 'row', backgroundColor: '#0D0D1A', borderRadius: 12, padding: 3 }}>
                {(['expense', 'income'] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setTxnType(t)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: txnType === t ? (t === 'expense' ? '#FF6B6B' : '#00D4AA') : 'transparent', alignItems: 'center' }}>
                    <Text style={{ color: txnType === t ? '#fff' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>
                      {t === 'expense' ? '− Expense' : '+ Income'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{ backgroundColor: '#0D0D1A', borderRadius: 12, padding: 14, color: '#E8E8F0', fontSize: 15, borderWidth: 1, borderColor: 'rgba(108,99,255,0.15)' }}
                placeholder="Transaction name (e.g. Tesco)" placeholderTextColor="#3a3a5e"
                value={txnName} onChangeText={setTxnName}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D1A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(108,99,255,0.15)', overflow: 'hidden' }}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
                  <Text style={{ color: '#7B7B9E', fontSize: 16, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
                </View>
                <TextInput
                  style={{ flex: 1, padding: 14, color: '#E8E8F0', fontSize: 16, fontWeight: '700' }}
                  placeholder="Amount" placeholderTextColor="#3a3a5e"
                  value={txnAmount} onChangeText={setTxnAmount} keyboardType="decimal-pad"
                />
              </View>
              {/* Category */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {TXN_CATS.map(c => (
                    <TouchableOpacity key={c.key} onPress={() => setTxnCat(c.key)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, backgroundColor: txnCat === c.key ? ACCENT + '22' : '#0D0D1A', borderWidth: 1, borderColor: txnCat === c.key ? ACCENT : 'rgba(108,99,255,0.15)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={c.icon as any} size={13} color={txnCat === c.key ? ACCENT : '#7B7B9E'} />
                      <Text style={{ color: txnCat === c.key ? ACCENT : '#7B7B9E', fontSize: 12, fontWeight: '600' }}>{c.key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity onPress={addTxn} disabled={!txnName || !txnAmount}
                style={{ backgroundColor: ACCENT, borderRadius: 12, padding: 14, alignItems: 'center', opacity: (!txnName || !txnAmount) ? 0.4 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
            {txns.map(t => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(108,99,255,0.15)', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.type === 'expense' ? '#FF6B6B22' : '#00D4AA22', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={t.icon as any} size={18} color={t.type === 'expense' ? '#FF6B6B' : '#00D4AA'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700' }}>{t.name}</Text>
                  <Text style={{ color: '#7B7B9E', fontSize: 12 }}>{t.cat}</Text>
                </View>
                <Text style={{ color: t.type === 'expense' ? '#FF6B6B' : '#00D4AA', fontSize: 15, fontWeight: '800' }}>
                  {t.type === 'expense' ? '-' : '+'}{selectedCurr.symbol}{t.amount}
                </Text>
                <TouchableOpacity onPress={() => removeTxn(t.id)}>
                  <Ionicons name="close-circle" size={20} color="#7B7B9E" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 7: Saving Goal ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#00D4AA33' }}>
            <Ionicons name="wallet" size={36} color="#00D4AA" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Set a saving goal</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>What are you saving towards? Track your progress every day.</Text>
          <TextInput
            style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 16, color: '#E8E8F0', fontSize: 16, borderWidth: 1, borderColor: goalName ? '#00D4AA55' : 'rgba(108,99,255,0.2)', marginBottom: 12 }}
            placeholder="Goal name (e.g. Holiday, New Car)" placeholderTextColor="#3a3a5e"
            value={goalName} onChangeText={setGoalName}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: goalTarget ? '#00D4AA55' : 'rgba(108,99,255,0.2)', overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
              <Text style={{ color: '#7B7B9E', fontSize: 18, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
            </View>
            <TextInput
              style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 22, fontWeight: '900' }}
              placeholder="Target amount" placeholderTextColor="#3a3a5e"
              value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {['500', '1000', '2000', '5000', '10000'].map(v => (
              <TouchableOpacity key={v} onPress={() => setGoalTarget(v)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: goalTarget === v ? '#00D4AA22' : '#13132A', borderWidth: 1, borderColor: goalTarget === v ? '#00D4AA' : 'rgba(108,99,255,0.15)' }}>
                <Text style={{ color: goalTarget === v ? '#00D4AA' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 8: Budget ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF9F4318', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#FF9F4333' }}>
            <Ionicons name="pie-chart" size={36} color="#FF9F43" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>Set a monthly budget</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>Pick a category and set a limit. We'll alert you when you're close.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {BUDGET_CATS.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setBudgetCat(c.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50, backgroundColor: budgetCat === c.key ? c.color + '28' : '#13132A', borderWidth: 1.5, borderColor: budgetCat === c.key ? c.color : 'rgba(108,99,255,0.15)' }}>
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
            <TextInput
              style={{ flex: 1, padding: 16, color: '#E8E8F0', fontSize: 22, fontWeight: '900' }}
              placeholder="Monthly limit" placeholderTextColor="#3a3a5e"
              value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {['100', '200', '300', '500', '800'].map(v => (
              <TouchableOpacity key={v} onPress={() => setBudgetLimit(v)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: budgetLimit === v ? '#FF9F4322' : '#13132A', borderWidth: 1, borderColor: budgetLimit === v ? '#FF9F43' : 'rgba(108,99,255,0.15)' }}>
                <Text style={{ color: budgetLimit === v ? '#FF9F43' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{selectedCurr.symbol}{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 9: Main Goal ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: ACCENT + '33' }}>
            <Ionicons name="flag" size={36} color={ACCENT} />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>What's your{'\n'}main goal?</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 28, lineHeight: 22 }}>We'll personalise your home screen around this.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MAIN_GOALS.map(g => (
              <TouchableOpacity key={g.key} onPress={() => setMainGoal(g.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 50, backgroundColor: mainGoal === g.key ? ACCENT : '#13132A', borderWidth: 1, borderColor: mainGoal === g.key ? ACCENT : 'rgba(108,99,255,0.2)' }}>
                <Ionicons name={g.icon as any} size={15} color={mainGoal === g.key ? '#fff' : '#7B7B9E'} />
                <Text style={{ color: mainGoal === g.key ? '#fff' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: '#7B7B9E', fontSize: 12, marginTop: 20, textAlign: 'center' }}>Tap a goal to select it, then continue</Text>
        </View>

        {/* Plan slide placeholder — rendered outside horizontal ScrollView below */}
        <View style={{ width, flex: 1 }} />

      </ScrollView>

      {/* ── Plan slide — rendered outside horizontal ScrollView to fix touch issues ── */}
      {isLastSlide && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0D0D1A' }}>
          <StarBackground />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 80, paddingBottom: 60 }}>
            <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>Choose your plan</Text>
            <Text style={{ color: '#7B7B9E', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Start free or unlock everything with a 3-day trial.
            </Text>

            {/* Free */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTrialPrompt(true)}
              style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#ffffff11', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={20} color="#7B7B9E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>Free</Text>
                  <Text style={{ color: '#7B7B9E', fontSize: 12 }}>Always free</Text>
                </View>
              </View>
              {['20 transactions per week', '1 saving goal & 1 budget', 'Basic spending stats & net worth', 'Up to 3 recurring bills'].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Ionicons name="checkmark" size={13} color="#7B7B9E" />
                  <Text style={{ color: '#7B7B9E', fontSize: 12 }}>{f}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '700' }}>Continue on Free</Text>
              </View>
            </TouchableOpacity>

            {/* Pro */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => saveAndNavigate('pro')}
              style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#6C63FF66', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#6C63FF22', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="flash" size={20} color="#6C63FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>Pro</Text>
                  <Text style={{ color: '#6C63FF', fontSize: 12, fontWeight: '700' }}>£3.99 / month</Text>
                </View>
              </View>
              {['Unlimited transactions & bills', 'Up to 5 goals & budgets', 'Calendar, search & filters', 'Custom themes · No ads', 'Card tracking & bank linking'].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Ionicons name="checkmark-circle" size={13} color="#6C63FF" />
                  <Text style={{ color: '#C0C0D8', fontSize: 12 }}>{f}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: '#6C63FF', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Start with Pro</Text>
              </View>
            </TouchableOpacity>

            {/* Premium */}
            <View style={{ marginBottom: 8, position: 'relative' }}>
              <View style={{ position: 'absolute', top: -11, right: 16, zIndex: 10, backgroundColor: '#FFD700', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#0D0D1A', fontSize: 10, fontWeight: '900' }}>3-DAY TRIAL</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={() => saveAndNavigate('trial')}
                style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: '#FFD700AA' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <Image source={require('../assets/images/jf-logo.png')} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>Premium</Text>
                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' }}>£7.99 / month · 3-day free trial</Text>
                  </View>
                </View>
                {['Everything in Pro', 'Unlimited goals & budgets', 'Live market signals & forecasts', 'Investment & asset tracking', 'Tax helper'].map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <Ionicons name="checkmark-circle" size={13} color="#FFD700" />
                    <Text style={{ color: '#C0C0D8', fontSize: 12 }}>{f}</Text>
                  </View>
                ))}
                <View style={{ backgroundColor: '#FFD700', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ color: '#0D0D1A', fontSize: 14, fontWeight: '900' }}>Start 3-Day Free Trial</Text>
                  <Text style={{ color: '#0D0D1A88', fontSize: 11, marginTop: 2 }}>Card required · Cancel anytime</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#7B7B9E44', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Subscriptions managed in Settings
            </Text>
          </ScrollView>

          {/* Back button */}
          <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 52, left: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 10 }}>
            <Ionicons name="chevron-back" size={18} color="#7B7B9E" />
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ height: 3, backgroundColor: ACCENT, width: '100%', borderRadius: 3 }} />
          </View>
        </View>
      )}

      {/* Bottom controls */}
      {!isLastSlide && (
        <View style={{ paddingHorizontal: 28, paddingBottom: 52 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View key={i} style={{ width: cur === i ? 20 : 5, height: 5, borderRadius: 3, backgroundColor: cur === i ? ACCENT : '#2a2a4a' }} />
            ))}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: canContinue ? ACCENT : '#2a2a4a', borderRadius: 18, padding: 18, alignItems: 'center' }}
            onPress={next} disabled={!canContinue}>
            <Text style={{ color: canContinue ? '#fff' : '#7B7B9E', fontSize: 17, fontWeight: '900' }}>Continue</Text>
          </TouchableOpacity>
          {!canContinue && (
            <Text style={{ color: '#7B7B9E', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
              {cur === 1 ? 'Enter your name to continue'
                : cur === 3 ? 'Enter your monthly income to continue'
                  : cur === 9 ? 'Pick a goal to continue' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Trial prompt */}
      <Modal visible={showTrialPrompt} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
          <View style={{ backgroundColor: '#13132A', borderRadius: 24, padding: 28, width: '100%', borderWidth: 1.5, borderColor: '#FFD700AA' }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                <Image source={require('../assets/images/jf-logo.png')} style={{ width: 52, height: 52, resizeMode: 'contain' }} />
              </View>
              <Text style={{ color: '#E8E8F0', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>Before you go free…</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
                Try Premium free for 3 days. Live market signals, unlimited goals, asset tracking and more.
              </Text>
            </View>
            <View style={{ backgroundColor: '#0D0D1A', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' }}>
              {['Live market signals & forecasts', 'Investment & asset tracking', 'Unlimited goals & tax helper'].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                  <Ionicons name="checkmark-circle" size={14} color="#FFD700" />
                  <Text style={{ color: '#C0C0D8', fontSize: 13 }}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.85}
              style={{ backgroundColor: '#FFD700', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 }}
              onPress={() => { setShowTrialPrompt(false); saveAndNavigate('trial'); }}>
              <Text style={{ color: '#0D0D1A', fontSize: 15, fontWeight: '900' }}>Start 3-Day Free Trial</Text>
              <Text style={{ color: '#0D0D1A88', fontSize: 11, marginTop: 2 }}>Card required · Cancel anytime</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={{ padding: 14, alignItems: 'center' }}
              onPress={() => { setShowTrialPrompt(false); saveAndNavigate('free'); }}>
              <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>No thanks, continue on Free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}