import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import StarBackground from '../components/StarBackground';

const { width } = Dimensions.get('window');

const slides = [
  { emoji: '💷', title: 'Welcome to\nJames Finance', sub: 'Your all-in-one personal finance app. Track spending, grow wealth, and take control of your money.', accent: '#6C63FF' },
  { emoji: '💳', title: 'Track Every\nTransaction', sub: 'Add transactions manually and see exactly where your money goes with beautiful charts.', accent: '#00D4AA' },
  { emoji: '📈', title: 'Live Market\nSignals', sub: 'Get real-time trading signals for stocks, commodities and crypto. Stay ahead of the market.', accent: '#FFD700' },
  { emoji: '💼', title: 'Know Your\nNet Worth', sub: 'Track cards, investments, property and vehicles in one place. Watch your wealth grow over time.', accent: '#FF9F43' },
  { emoji: '🚀', title: "You're Ready\nto Go!", sub: 'Start by adding your first transaction. Your financial future starts now.', accent: '#6C63FF' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [cur, setCur] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (i: number) => { scrollRef.current?.scrollTo({ x: i * width, animated: true }); setCur(i); };
  const next = () => { if (cur < slides.length - 1) goTo(cur + 1); else finish(); };
  const finish = async () => { await AsyncStorage.setItem('onboarding_complete', 'true'); router.replace('/(tabs)' as any); };

  const slide = slides[cur];

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
      <StarBackground />

      {cur < slides.length - 1 && (
        <TouchableOpacity onPress={finish} style={{ position: 'absolute', top: 56, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#7B7B9E', fontSize: 13, fontWeight: '600' }}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView ref={scrollRef} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        {slides.map((s, i) => (
          <View key={i} style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
            <View style={{ width: 160, height: 160, borderRadius: 40, backgroundColor: s.accent + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: s.accent + '33' }}>
              <Text style={{ fontSize: 72 }}>{s.emoji}</Text>
            </View>
            <Text style={{ color: '#E8E8F0', fontSize: 34, fontWeight: '900', textAlign: 'center', lineHeight: 40, marginBottom: 16 }}>{s.title}</Text>
            <Text style={{ color: '#7B7B9E', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>{s.sub}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingBottom: 52 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{ width: cur === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: cur === i ? slide.accent : '#2a2a4a' }} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={{ backgroundColor: slide.accent, borderRadius: 18, padding: 18, alignItems: 'center' }} onPress={next}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>{cur === slides.length - 1 ? "Let's Go! 🚀" : 'Next →'}</Text>
        </TouchableOpacity>
        {cur === slides.length - 1 && (
          <Text style={{ color: '#7B7B9E', fontSize: 12, textAlign: 'center', marginTop: 16 }}>Already have an account? Your data will sync automatically.</Text>
        )}
      </View>
    </View>
  );
}