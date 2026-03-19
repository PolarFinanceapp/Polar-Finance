import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Text, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'bar-chart' as const,
    gradient: ['#6C63FF', '#4A44CC'] as const,
    glow: '#6C63FF',
    badge: 'WELCOME',
    title: 'James Finance',
    sub: 'The personal finance app built for people who take their money seriously.',
    features: null,
  },
  {
    icon: 'receipt' as const,
    gradient: ['#00D4AA', '#00A882'] as const,
    glow: '#00D4AA',
    badge: 'SPENDING',
    title: 'Every penny,\naccounted for',
    sub: 'Log transactions in seconds. Categorise spending automatically and see the full picture.',
    features: ['Income & expense tracking', 'Smart categories', 'Monthly summaries'],
  },
  {
    icon: 'wallet' as const,
    gradient: ['#FF9F43', '#E8842A'] as const,
    glow: '#FF9F43',
    badge: 'GOALS',
    title: 'Save with\npurpose',
    sub: 'Set saving goals and budgets that actually work. Real alerts before you overspend.',
    features: ['Saving goals & progress', 'Monthly budgets', 'Spending alerts'],
  },
  {
    icon: 'repeat' as const,
    gradient: ['#a89fff', '#7B6FE8'] as const,
    glow: '#a89fff',
    badge: 'BILLS',
    title: 'Never miss\na payment',
    sub: 'Track every subscription and recurring bill in one place. Know exactly what\'s due.',
    features: ['Recurring bill tracking', 'Due date reminders', 'Monthly cost overview'],
  },
  {
    icon: 'trending-up' as const,
    gradient: ['#FFD700', '#E8C000'] as const,
    glow: '#FFD700',
    badge: 'NET WORTH',
    title: 'Watch your\nwealth grow',
    sub: 'Cards, investments, assets — your full financial picture in one beautiful dashboard.',
    features: ['Net worth tracker', 'Investment portfolio', 'Asset management'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [cur, setCur] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orb float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    scaleAnim.setValue(0.8);
    glowAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [cur]);

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    try { await supabase.auth.updateUser({ data: { onboarding_complete: 'true' } }); } catch { }
    router.replace('/(tabs)' as any);
  };

  const next = () => {
    if (cur < SLIDES.length - 1) setCur(c => c + 1);
    else finish();
  };

  const slide = SLIDES[cur];
  const isLast = cur === SLIDES.length - 1;
  const isFirst = cur === 0;

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  return (
    <View style={{ flex: 1, backgroundColor: '#08081A' }}>

      {/* Ambient orbs */}
      <Animated.View style={{
        position: 'absolute', top: -80, left: -60,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: slide.glow + '18',
        transform: [{ translateY: orb1Y }],
      }} />
      <Animated.View style={{
        position: 'absolute', bottom: 100, right: -80,
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: slide.glow + '12',
        transform: [{ translateY: orb2Y }],
      }} />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity onPress={finish}
          style={{ position: 'absolute', top: 54, right: 24, zIndex: 30, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 50, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Icon card with glass effect */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 44 }}>
          <View style={{
            width: 130, height: 130, borderRadius: 38,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            justifyContent: 'center', alignItems: 'center',
            shadowColor: slide.glow, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 8 },
          }}>
            {/* Inner gradient */}
            <LinearGradient
              colors={[slide.gradient[0] + '33', slide.gradient[1] + '11']}
              style={{ position: 'absolute', inset: 0, borderRadius: 37 } as any}
            />
            <Ionicons name={slide.icon} size={56} color={slide.gradient[0]} />
          </View>
        </Animated.View>

        {/* Badge */}
        <View style={{
          backgroundColor: slide.glow + '20', borderRadius: 50,
          paddingHorizontal: 14, paddingVertical: 5, marginBottom: 20,
          borderWidth: 1, borderColor: slide.glow + '40',
        }}>
          <Text style={{ color: slide.glow, fontSize: 10, fontWeight: '800', letterSpacing: 2 }}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={{
          color: '#F0F0FF', fontSize: isFirst ? 38 : 34, fontWeight: '900',
          textAlign: 'center', lineHeight: isFirst ? 46 : 42, marginBottom: 18,
          letterSpacing: -0.5,
        }}>
          {slide.title}
        </Text>

        {/* Subtitle */}
        <Text style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 15,
          textAlign: 'center', lineHeight: 25, maxWidth: 300, marginBottom: slide.features ? 32 : 0,
        }}>
          {slide.sub}
        </Text>

        {/* Glass feature card */}
        {slide.features && (
          <View style={{
            width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 22, padding: 20,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
          }}>
            {slide.features.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < slide.features!.length - 1 ? 14 : 0 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: slide.glow + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: slide.glow + '33' }}>
                  <Ionicons name="checkmark" size={14} color={slide.glow} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' }}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 56 }}>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 28 }}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => setCur(i)}>
              <View style={{
                width: i === cur ? 24 : 7, height: 7, borderRadius: 4,
                backgroundColor: i === cur ? slide.glow : 'rgba(255,255,255,0.15)',
              }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity onPress={next} activeOpacity={0.85}>
          <LinearGradient
            colors={slide.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 18, padding: 18, alignItems: 'center',
              shadowColor: slide.glow, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
            }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 }}>
              {isLast ? "Let's Go" : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}