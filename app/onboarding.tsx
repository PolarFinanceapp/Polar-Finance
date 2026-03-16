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
  { key: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { key: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { key: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { key: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { key: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  { key: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { key: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { key: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { key: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { key: 'NZD', symbol: '$', name: 'New Zealand Dollar', flag: '🇳🇿' },
];

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
  { name: 'Apple TV+', icon: 'tv', color: '#555' },
  { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000' },
  { name: 'Sky', icon: 'cloud', color: '#0078D7' },
  { name: 'Gym', icon: 'barbell', color: '#FF6B6B' },
  { name: 'iCloud', icon: 'cloud-upload', color: '#007AFF' },
  { name: 'Microsoft 365', icon: 'grid', color: '#D83B01' },
  { name: 'Adobe CC', icon: 'color-palette', color: '#FF0000' },
  { name: 'Deliveroo+', icon: 'bicycle', color: '#00CCBC' },
  { name: 'NOW TV', icon: 'play', color: '#00B140' },
  { name: 'BT Sport', icon: 'football', color: '#003087' },
  { name: 'Headspace', icon: 'leaf', color: '#FF6D00' },
  { name: 'Other', icon: 'add-circle', color: '#7B7B9E' },
];

const ACCENT = '#6C63FF';
// 7 slides: Welcome, Name, Currency, Income, Subscriptions, Goal, Trial
const TOTAL = 7;

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [cur, setCur] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setCur(i);
    Animated.spring(progressAnim, { toValue: i / (TOTAL - 1), useNativeDriver: false, speed: 20 }).start();
  };

  const next = () => { if (cur < TOTAL - 1) goTo(cur + 1); else finish(); };
  const back = () => { if (cur > 0) goTo(cur - 1); };

  const toggleSub = (subName: string) => {
    setSelectedSubs(prev =>
      prev.includes(subName) ? prev.filter(s => s !== subName) : [...prev, subName]
    );
  };

  const finish = async () => {
    const curr = CURRENCIES.find(c => c.key === currency)!;

    // Get user ID for keyed storage
    let uid = 'local';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) uid = user.id;
    } catch { }

    // Save basic onboarding keys
    await AsyncStorage.multiSet([
      ['onboarding_complete', 'true'],
      ['jf_currency', currency],
      ['app_currency', currency],
      ['jf_currency_symbol', curr.symbol],
      ['jf_monthly_income', income || '0'],
      ['jf_main_goal', goal],
      ['jf_user_name', name],
    ]);

    // Save income to polar_income format so More page shows it immediately
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

    // Save selected subscriptions as transactions so they appear in the app
    if (selectedSubs.length > 0) {
      const subTransactions = selectedSubs
        .filter(s => s !== 'Other')
        .map(subName => {
          const sub = COMMON_SUBS.find(s => s.name === subName)!;
          return {
            id: Date.now().toString() + Math.random(),
            icon: sub.icon,
            name: subName,
            cat: 'Subscriptions',
            amount: -9.99, // placeholder amount
            type: 'expense',
            date: new Date().toLocaleDateString('en-GB'),
            recurring: true,
            note: 'Added during setup',
          };
        });
      // Store separately so the app can import them
      await AsyncStorage.setItem('jf_onboarding_subs', JSON.stringify(subTransactions));
    }

    router.replace('/(tabs)' as any);
  };

  const activateTrial = async () => {
    setTrialLoading(true);
    try {
      // Store trial activation — PlanContext reads this
      const trialEnd = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
      await AsyncStorage.multiSet([
        ['jf_plan', 'trial'],
        ['jf_trial_end', trialEnd.toString()],
      ]);
    } catch { }
    setTrialLoading(false);
    finish();
  };

  const selectedCurr = CURRENCIES.find(c => c.key === currency)!;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['5%', '100%'],
  });

  const isLastSlide = cur === TOTAL - 1;
  const isGoalSlide = cur === TOTAL - 2; // slide 6 = goal
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

      {/* Skip — hide on trial slide */}
      {cur < TOTAL - 1 && (
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
            {CURRENCIES.map(c => (
              <TouchableOpacity key={c.key} onPress={() => setCurrency(c.key)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === c.key ? ACCENT + '22' : '#13132A', borderWidth: 1, borderColor: currency === c.key ? ACCENT : 'rgba(108,99,255,0.15)', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
                  <Text style={{ color: '#7B7B9E', fontSize: 12, marginTop: 1 }}>{c.key} · {c.symbol}</Text>
                </View>
                {currency === c.key && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
              </TouchableOpacity>
            ))}
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
            Used to show your savings rate and budget health. Saved to your profile automatically.
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
            Select any you pay for — we'll add them to your tracker.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {COMMON_SUBS.map(sub => {
                const sel = selectedSubs.includes(sub.name);
                return (
                  <TouchableOpacity key={sub.name} onPress={() => toggleSub(sub.name)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 50, backgroundColor: sel ? sub.color + '28' : '#13132A', borderWidth: 1.5, borderColor: sel ? sub.color : 'rgba(108,99,255,0.15)' }}>
                    <Ionicons name={sub.icon as any} size={15} color={sel ? sub.color : '#7B7B9E'} />
                    <Text style={{ color: sel ? sub.color : '#7B7B9E', fontSize: 13, fontWeight: '700' }}>{sub.name}</Text>
                    {sel && <Ionicons name="checkmark" size={13} color={sub.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSubs.length > 0 && (
              <View style={{ backgroundColor: '#13132A', borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}>
                <Text style={{ color: '#7B7B9E', fontSize: 12, textAlign: 'center' }}>
                  {selectedSubs.length} subscription{selectedSubs.length !== 1 ? 's' : ''} selected — we'll add these to your spending tracker
                </Text>
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

        {/* ── Slide 7: Free Trial ── */}
        <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          {/* Badge */}
          <View style={{ alignSelf: 'center', backgroundColor: '#FFD70022', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: '#FFD70055', marginBottom: 24 }}>
            <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>LIMITED OFFER</Text>
          </View>

          <Text style={{ color: '#E8E8F0', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 38, marginBottom: 12 }}>
            Try James Finance{'\n'}Premium free
          </Text>
          <Text style={{ color: '#7B7B9E', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
            Get 3 days of Premium — completely free.{'\n'}No card required.
          </Text>

          {/* Feature list */}
          <View style={{ backgroundColor: '#13132A', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)', gap: 14 }}>
            {[
              { icon: 'trending-up', color: '#00D4AA', text: 'Live market signals & analyst forecasts' },
              { icon: 'briefcase', color: '#a89fff', text: 'Track investments, assets & net worth' },
              { icon: 'color-palette', color: '#FF9F43', text: 'Custom themes & no ads' },
              { icon: 'flag', color: '#6C63FF', text: 'Unlimited saving goals' },
              { icon: 'bar-chart', color: '#FFD700', text: 'Advanced spending insights' },
            ].map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: f.color + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: f.color + '33' }}>
                  <Ionicons name={f.icon as any} size={18} color={f.color} />
                </View>
                <Text style={{ color: '#C0C0D8', fontSize: 14, flex: 1 }}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA buttons */}
          <TouchableOpacity
            style={{ backgroundColor: '#FFD700', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12, opacity: trialLoading ? 0.7 : 1 }}
            onPress={activateTrial}
            disabled={trialLoading}>
            <Text style={{ color: '#0D0D1A', fontSize: 17, fontWeight: '900' }}>
              Start 3-Day Free Trial
            </Text>
            <Text style={{ color: '#0D0D1A88', fontSize: 12, marginTop: 3 }}>No card needed · Cancel anytime</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 14 }}
            onPress={finish}>
            <Text style={{ color: '#7B7B9E', fontSize: 14, fontWeight: '600' }}>No thanks, start on Free</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom controls — hide on trial slide */}
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