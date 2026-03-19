import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import StarBackground from '../components/StarBackground';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const ACCENT = '#6C63FF';

const SLIDES = [
  {
    icon: 'bar-chart',
    color: '#6C63FF',
    title: 'Welcome to\nJames Finance',
    sub: 'Your all-in-one personal finance app. Track spending, set goals and grow your wealth.',
  },
  {
    icon: 'receipt',
    color: '#00D4AA',
    title: 'Track Every\nTransaction',
    sub: 'Log income and expenses in seconds. See exactly where your money goes each month.',
  },
  {
    icon: 'wallet',
    color: '#FF9F43',
    title: 'Set Goals &\nBudgets',
    sub: 'Create saving goals and monthly budgets. We\'ll alert you when you\'re getting close.',
  },
  {
    icon: 'repeat',
    color: '#a89fff',
    title: 'Manage Your\nBills',
    sub: 'Track recurring subscriptions and bills in one place. Never miss a payment again.',
  },
  {
    icon: 'trending-up',
    color: '#FFD700',
    title: 'Grow Your\nNet Worth',
    sub: 'Track cards, investments and assets. Watch your net worth grow over time.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [cur, setCur] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    try {
      await supabase.auth.updateUser({ data: { onboarding_complete: 'true' } });
    } catch { }
    router.replace('/(tabs)' as any);
  };

  const next = () => {
    if (cur < SLIDES.length - 1) setCur(c => c + 1);
    else finish();
  };

  const slide = SLIDES[cur];
  const isLast = cur === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
      <StarBackground />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity onPress={finish}
          style={{ position: 'absolute', top: 52, right: 24, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 120, height: 120, borderRadius: 36, backgroundColor: slide.color + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: slide.color + '44' }}>
          <Ionicons name={slide.icon as any} size={58} color={slide.color} />
        </View>
        <Text style={{ color: '#E8E8F0', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 42, marginBottom: 20 }}>
          {slide.title}
        </Text>
        <Text style={{ color: '#7B7B9E', fontSize: 16, textAlign: 'center', lineHeight: 26, maxWidth: 300 }}>
          {slide.sub}
        </Text>
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 52 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{ width: i === cur ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === cur ? ACCENT : '#2a2a4a' }} />
          ))}
        </View>

        <TouchableOpacity onPress={next}
          style={{ backgroundColor: isLast ? slide.color : ACCENT, borderRadius: 18, padding: 18, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>
            {isLast ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}