import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import StarBackground from '../components/StarBackground';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

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

// Map currency key to Ionicon name for flag-like display
const CURRENCY_ICONS: Record<string, { icon: string; color: string }> = {
  GBP: { icon: 'cash', color: '#00D4AA' },
  USD: { icon: 'cash', color: '#00D4AA' },
  EUR: { icon: 'cash', color: '#6C63FF' },
  CAD: { icon: 'cash', color: '#FF6B6B' },
  AUD: { icon: 'cash', color: '#FF9F43' },
  JPY: { icon: 'cash', color: '#FF6B6B' },
  INR: { icon: 'cash', color: '#FFD700' },
  CHF: { icon: 'cash', color: '#00BFFF' },
  SEK: { icon: 'cash', color: '#a89fff' },
  NZD: { icon: 'cash', color: '#00D4AA' },
};

const GOALS = [
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

const ACCENT = '#6C63FF';
const TOTAL = 7;

type SubEntry = { name: string; price: string };

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [cur, setCur] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  // Subscriptions: map of name -> price string
  const [subPrices, setSubPrices] = useState<Record<string, string>>({});
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setCur(i);
    Animated.spring(progressAnim, { toValue: i / (TOTAL - 1), useNativeDriver: false, speed: 20 }).start();
  };

  const next = () => { if (cur < TOTAL - 1) goTo(cur + 1); else finish(); };
  const back = () => { if (cur > 0) goTo(cur - 1); };

  const toggleSub = (subName: string) => {
    setSubPrices(prev => {
      if (prev[subName] !== undefined) {
        const next = { ...prev };
        delete next[subName];
        if (activeSub === subName) setActiveSub(null);
        return next;
      }
      setActiveSub(subName);
      return { ...prev, [subName]: '' };
    });
  };

  const selectedSubs = Object.keys(subPrices);

  const finish = async () => {
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
      ['jf_main_goal', goal],
      ['jf_user_name', name],
    ]);

    // Save income to polar_income format (what More page reads)
    if (income && parseFloat(income) > 0) {
      const incomeEntry = [{
        id: Date.now().toString(),
        label: 'Main Income',
        amount: parseFloat(income),
        frequency: 'monthly',
        paydayDay: 25,
        emoji: 'briefcase',
      }];
      await AsyncStorage.setItem(`polar_income_${uid}`, JSON.stringify(incomeEntry));
    }

    // Save subscriptions as recurring transactions
    if (selectedSubs.length > 0) {
      const subTxns = selectedSubs
        .filter(s => s !== 'Other')
        .map(subName => {
          const sub = COMMON_SUBS.find(s => s.name === subName)!;
          const price = parseFloat(subPrices[subName] || '0') || 9.99;
          return {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            icon: sub.icon,
            name: subName,
            cat: 'Subscriptions',
            amount: -Math.abs(price),
            type: 'expense',
            date: new Date().toLocaleDateString('en-GB'),
            recurring: true,
            note: 'Added during setup',
          };
        });
      await AsyncStorage.setItem('jf_onboarding_subs', JSON.stringify(subTxns));
    }

    // Explicitly set free plan so PlanContext doesn't fall into wrong state
    await AsyncStorage.multiSet([
      ['user_plan', 'free'],
      ['trial_prompt_seen', 'true'],
    ]);

    router.replace('/(tabs)' as any);
  };

  const activateTrial = async () => {
    // Use the correct keys PlanContext reads: trial_start + user_plan
    await AsyncStorage.multiSet([
      ['user_plan', 'trial'],
      ['trial_start', new Date().toISOString()],
      ['trial_prompt_seen', 'true'],
    ]);
    finish();
  };

  const selectedCurr = CURRENCIES.find(c => c.key === currency)!;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['5%', '100%'],
  });

  const isLastSlide = cur === TOTAL - 1;
  const isGoalSlide = cur === TOTAL - 2;
  const canContinue = !isGoalSlide || !!goal;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0D0D1A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StarBackground />

      {/* Progress bar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 10 }}>
        <Animated.View style={{ height: 3, backgroundColor: ACCENT, width: progressWidth, borderRadius: 3 }} />
      </View>

      {/* Back button */}
      {cur > 0 && !isLastSlide && (
        <TouchableOpacity onPress={back} style={{ position: 'absolute', top: 52, left: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 10 }}>
          <Ionicons name="chevron-back" size={18} color="#7B7B9E" />
        </TouchableOpacity>
      )}

      {/* Skip */}
      {!isLastSlide && (
        <TouchableOpacity onPress={finish} style={{ position: 'absolute', top: 52, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}>

        {/* ── Slide 1: Welcome ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 140, height: 140, borderRadius: 36, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 36, borderWidth: 1, borderColor: ACCENT + '33' }}>
            <Ionicons name="bar-chart" size={68} color={ACCENT} />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>
            Welcome to{'\n'}James Finance
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 16, textAlign: 'center', lineHeight: 26, maxWidth: 300 }}>
            Your all-in-one personal finance app.{'\n'}Let's get you set up in under a minute.
          </Text>
        </View>

        {/* ── Slide 2: Name ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00D4AA18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#00D4AA33' }}>
            <Ionicons name="person" size={36} color="#00D4AA" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
            What should{'\n'}we call you?
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>
            This is how we'll greet you every day.
          </Text>
          <TextInput
            style={{ backgroundColor: '#13132A', borderRadius: 16, padding: 18, color: '#E8E8F0', fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: name ? '#00D4AA55' : 'rgba(108,99,255,0.2)', marginBottom: 12 }}
            placeholder="Your first name"
            placeholderTextColor="#3a3a5e"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={next}
          />
          <TouchableOpacity onPress={next} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* ── Slide 3: Currency ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 28, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FFD70018', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#FFD70033' }}>
            <Ionicons name="cash" size={36} color="#FFD700" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>Your currency</Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 20, lineHeight: 22 }}>
            All amounts will show in your chosen currency.
          </Text>
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

        {/* ── Slide 4: Monthly Income ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#FF9F4318', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#FF9F4333' }}>
            <Ionicons name="briefcase" size={36} color="#FF9F43" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
            Monthly income?
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 32, lineHeight: 22 }}>
            Saved to your profile so your budgets and insights are accurate.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#13132A', borderRadius: 16, borderWidth: 1, borderColor: income ? '#FF9F4355' : 'rgba(108,99,255,0.2)', marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 18, paddingVertical: 18, borderRightWidth: 1, borderRightColor: 'rgba(108,99,255,0.15)' }}>
              <Text style={{ color: '#7B7B9E', fontSize: 20, fontWeight: '800' }}>{selectedCurr.symbol}</Text>
            </View>
            <TextInput
              style={{ flex: 1, padding: 18, color: '#E8E8F0', fontSize: 26, fontWeight: '900' }}
              placeholder="0"
              placeholderTextColor="#3a3a5e"
              value={income}
              onChangeText={setIncome}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={next}
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
          <TouchableOpacity onPress={() => { setIncome(''); next(); }} style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Prefer not to say</Text>
          </TouchableOpacity>
        </View>

        {/* ── Slide 5: Subscriptions ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 24, paddingTop: 96 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#a89fff18', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#a89fff33' }}>
            <Ionicons name="repeat" size={36} color="#a89fff" />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>
            Your subscriptions
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, marginBottom: 20, lineHeight: 21 }}>
            Tap to select, then enter the monthly cost.
          </Text>
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

            {/* Price inputs for selected subs */}
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
                        placeholder="0.00"
                        placeholderTextColor="#3a3a5e"
                        keyboardType="decimal-pad"
                        value={subPrices[subName]}
                        onChangeText={val => setSubPrices(prev => ({ ...prev, [subName]: val }))}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Slide 6: Main Goal ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: ACCENT + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 1, borderColor: ACCENT + '33' }}>
            <Ionicons name="flag" size={36} color={ACCENT} />
          </View>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', marginBottom: 8 }}>
            What's your{'\n'}main goal?
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, marginBottom: 28, lineHeight: 22 }}>
            We'll personalise your home screen around this.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {GOALS.map(g => (
              <TouchableOpacity key={g.key} onPress={() => setGoal(g.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 50, backgroundColor: goal === g.key ? ACCENT : '#13132A', borderWidth: 1, borderColor: goal === g.key ? ACCENT : 'rgba(108,99,255,0.2)' }}>
                <Ionicons name={g.icon as any} size={15} color={goal === g.key ? '#fff' : '#7B7B9E'} />
                <Text style={{ color: goal === g.key ? '#fff' : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ color: '#7B7B9E', fontSize: 12, marginTop: 20, textAlign: 'center' }}>
            Tap a goal to select it, then continue
          </Text>
        </View>

        {/* ── Slide 7: Choose Your Plan ── */}
        <View style={{ width, flex: 1, paddingHorizontal: 22, paddingTop: 80 }}>
          <Text style={{ color: '#E8E8F0', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>
            Choose your plan
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Start free or unlock everything with a 3-day Premium trial. No card needed.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            {/* Free */}
            <TouchableOpacity
              onPress={finish}
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
              {['Up to 10 transactions', '1 saving goal', 'Basic budgets & calendar'].map((f, i) => (
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
            <TouchableOpacity
              onPress={async () => {
                await AsyncStorage.multiSet([
                  ['user_plan', 'pro'],
                  ['trial_prompt_seen', 'true'],
                ]);
                finish();
              }}
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
              {['Unlimited transactions', 'Card & investment tracking', 'Up to 5 saving goals', 'Custom themes — no ads'].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Ionicons name="checkmark-circle" size={13} color="#6C63FF" />
                  <Text style={{ color: '#C0C0D8', fontSize: 12 }}>{f}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: '#6C63FF', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Start with Pro</Text>
              </View>
            </TouchableOpacity>

            {/* Premium — highlighted, with free trial */}
            <View style={{ backgroundColor: '#13132A', borderRadius: 18, padding: 16, borderWidth: 2, borderColor: '#FFD700AA', marginBottom: 8 }}>
              <View style={{ position: 'absolute', top: -11, right: 16, backgroundColor: '#FFD700', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: '#0D0D1A', fontSize: 10, fontWeight: '900' }}>3 DAYS FREE</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 15, fontWeight: '800' }}>Premium</Text>
                  <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' }}>£7.99 / month · 3 days free</Text>
                </View>
              </View>
              {['Everything in Pro', 'Live market signals & forecasts', 'Asset & property tracking', 'Unlimited goals · Tax helper · AI receipts'].map((f, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Ionicons name="checkmark-circle" size={13} color="#FFD700" />
                  <Text style={{ color: '#C0C0D8', fontSize: 12 }}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={{ backgroundColor: '#FFD700', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 }}
                onPress={activateTrial}>
                <Text style={{ color: '#0D0D1A', fontSize: 14, fontWeight: '900' }}>Start 3-Day Free Trial</Text>
                <Text style={{ color: '#0D0D1A88', fontSize: 11, marginTop: 2 }}>No card needed · Cancel anytime</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#7B7B9E44', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              Subscriptions managed in Settings
            </Text>

          </ScrollView>
        </View>

      </ScrollView>

      {/* Bottom controls — hidden on trial slide */}
      {!isLastSlide && (
        <View style={{ paddingHorizontal: 28, paddingBottom: 52 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <View key={i} style={{ width: cur === i ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: cur === i ? ACCENT : '#2a2a4a' }} />
            ))}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: ACCENT, borderRadius: 18, padding: 18, alignItems: 'center', opacity: canContinue ? 1 : 0.45 }}
            onPress={next}
            disabled={!canContinue}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}