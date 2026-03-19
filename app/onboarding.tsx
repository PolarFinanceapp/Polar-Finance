import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, PanResponder,
  Text, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const SLIDER_TRACK = width - 56;
const KNOB = 64;
const MAX_DRAG = SLIDER_TRACK - KNOB - 8;

const SLIDES = [
  {
    icon: 'bar-chart' as const,
    gradient: ['#6C63FF', '#4A44CC'] as [string, string],
    glow: '#6C63FF',
    badge: 'WELCOME',
    title: 'James Finance',
    sub: 'The personal finance app built for people who take their money seriously.',
    features: null,
    confirm: false,
  },
  {
    icon: 'receipt' as const,
    gradient: ['#00D4AA', '#00A882'] as [string, string],
    glow: '#00D4AA',
    badge: 'SPENDING',
    title: 'Every penny,\naccounted for',
    sub: 'Log transactions in seconds. Categorise spending automatically and see the full picture.',
    features: ['Income & expense tracking', 'Smart categories', 'Monthly summaries'],
    confirm: false,
  },
  {
    icon: 'wallet' as const,
    gradient: ['#FF9F43', '#E8842A'] as [string, string],
    glow: '#FF9F43',
    badge: 'GOALS',
    title: 'Save with\npurpose',
    sub: "Set saving goals and budgets that actually work. Real alerts before you overspend.",
    features: ['Saving goals & progress', 'Monthly budgets', 'Spending alerts'],
    confirm: false,
  },
  {
    icon: 'repeat' as const,
    gradient: ['#a89fff', '#7B6FE8'] as [string, string],
    glow: '#a89fff',
    badge: 'BILLS',
    title: 'Never miss\na payment',
    sub: "Track every subscription and recurring bill in one place. Know exactly what's due.",
    features: ['Recurring bill tracking', 'Due date reminders', 'Monthly cost overview'],
    confirm: false,
  },
  {
    icon: 'trending-up' as const,
    gradient: ['#FFD700', '#E8C000'] as [string, string],
    glow: '#FFD700',
    badge: 'NET WORTH',
    title: 'Watch your\nwealth grow',
    sub: 'Cards, investments, assets — your full financial picture in one beautiful dashboard.',
    features: ['Net worth tracker', 'Investment portfolio', 'Asset management'],
    confirm: false,
  },
  {
    icon: 'checkmark-circle' as const,
    gradient: ['#00D4AA', '#6C63FF'] as [string, string],
    glow: '#00D4AA',
    badge: "YOU'RE READY",
    title: 'Take control\nof your money',
    sub: 'Everything you need is waiting inside. Slide to begin.',
    features: ['Free to get started', 'Upgrade anytime', 'Your data, always secure'],
    confirm: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [cur, setCur] = useState(0);

  // Per-slide animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  // Slider
  const dragX = useRef(new Animated.Value(0)).current;
  const [sliderTriggered, setSliderTriggered] = useState(false);

  const dragXNum = useRef(0);
  useEffect(() => {
    const id = dragX.addListener(({ value }) => { dragXNum.current = value; });
    return () => dragX.removeListener(id);
  }, []);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      const x = Math.max(0, Math.min(gs.dx, MAX_DRAG));
      dragX.setValue(x);
    },
    onPanResponderRelease: () => {
      if (dragXNum.current >= MAX_DRAG * 0.82) {
        Animated.timing(dragX, { toValue: MAX_DRAG, duration: 120, useNativeDriver: true }).start(async () => {
          setSliderTriggered(true);
          await AsyncStorage.setItem('onboarding_complete', 'true');
          try { await supabase.auth.updateUser({ data: { onboarding_complete: 'true' } }); } catch { }
          router.replace('/(tabs)' as any);
        });
      } else {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
      }
    },
  })).current;

  // Orb float
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(orb1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(orb1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(orb2, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(orb2, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // Slide transition
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    scaleAnim.setValue(0.82);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [cur]);

  const slide = SLIDES[cur];
  const isLast = cur === SLIDES.length - 1;
  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  const sliderProgress = dragX.interpolate({ inputRange: [0, MAX_DRAG], outputRange: [0, 1], extrapolate: 'clamp' });
  const sliderTextOpacity = dragX.interpolate({ inputRange: [0, MAX_DRAG * 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  const checkOpacity = dragX.interpolate({ inputRange: [MAX_DRAG * 0.7, MAX_DRAG], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1, backgroundColor: '#08081A' }}>

      {/* Ambient orbs */}
      <Animated.View style={{ position: 'absolute', top: -80, left: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: slide.glow + '18', transform: [{ translateY: orb1Y }] }} />
      <Animated.View style={{ position: 'absolute', bottom: 100, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: slide.glow + '12', transform: [{ translateY: orb2Y }] }} />

      {/* Back button */}
      {cur > 0 && (
        <TouchableOpacity onPress={() => setCur(c => c - 1)}
          style={{ position: 'absolute', top: 54, left: 24, zIndex: 30, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity onPress={async () => {
          await AsyncStorage.setItem('onboarding_complete', 'true');
          try { await supabase.auth.updateUser({ data: { onboarding_complete: 'true' } }); } catch { }
          router.replace('/(tabs)' as any);
        }}
          style={{ position: 'absolute', top: 54, right: 24, zIndex: 30, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 50, paddingHorizontal: 18, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Icon */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 40, alignItems: 'center', justifyContent: 'center' }}>
          {slide.confirm && <View style={{ position: 'absolute', width: 196, height: 196, borderRadius: 98, borderWidth: 1, borderColor: slide.glow + '25' }} />}
          {slide.confirm && <View style={{ position: 'absolute', width: 228, height: 228, borderRadius: 114, borderWidth: 1, borderColor: slide.glow + '12' }} />}
          <View style={{
            width: slide.confirm ? 156 : 128, height: slide.confirm ? 156 : 128,
            borderRadius: slide.confirm ? 78 : 36,
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderWidth: 1, borderColor: slide.confirm ? slide.glow + '55' : 'rgba(255,255,255,0.1)',
            justifyContent: 'center', alignItems: 'center',
            shadowColor: slide.glow, shadowOpacity: slide.confirm ? 0.65 : 0.45, shadowRadius: slide.confirm ? 50 : 28, shadowOffset: { width: 0, height: 10 },
          }}>
            <LinearGradient colors={[slide.gradient[0] + '44', slide.gradient[1] + '18']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: slide.confirm ? 77 : 35 }} />
            <Ionicons name={slide.icon} size={slide.confirm ? 70 : 54} color={slide.gradient[0]} />
          </View>
        </Animated.View>

        {/* Badge */}
        <View style={{ backgroundColor: slide.glow + '20', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 18, borderWidth: 1, borderColor: slide.glow + '40' }}>
          <Text style={{ color: slide.glow, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 }}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={{ color: '#F0F0FF', fontSize: cur === 0 ? 38 : 34, fontWeight: '900', textAlign: 'center', lineHeight: cur === 0 ? 46 : 42, marginBottom: 16, letterSpacing: -0.5 }}>
          {slide.title}
        </Text>

        {/* Sub */}
        <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 15, textAlign: 'center', lineHeight: 25, maxWidth: 300, marginBottom: slide.features ? 28 : 0 }}>
          {slide.sub}
        </Text>

        {/* Glass feature card */}
        {slide.features && (
          <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {slide.features.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < slide.features!.length - 1 ? 14 : 0 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: slide.glow + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: slide.glow + '33' }}>
                  <Ionicons name="checkmark" size={14} color={slide.glow} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: '500' }}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 54 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 }}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => !SLIDES[i].confirm && setCur(i)}>
              <View style={{ width: i === cur ? 24 : 7, height: 7, borderRadius: 4, backgroundColor: i === cur ? slide.glow : 'rgba(255,255,255,0.15)' }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue button OR swipe slider */}
        {!isLast ? (
          <TouchableOpacity onPress={() => setCur(c => c + 1)} activeOpacity={0.85}>
            <LinearGradient colors={slide.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: slide.glow, shadowOpacity: 0.38, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.2 }}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Swipe to enter slider
          <View style={{ height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: slide.glow + '44', overflow: 'hidden', justifyContent: 'center' }}>
            {/* Gradient fill behind knob */}
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dragX.interpolate({ inputRange: [0, MAX_DRAG], outputRange: [KNOB + 8, SLIDER_TRACK], extrapolate: 'clamp' }) }}>
              <LinearGradient colors={[slide.gradient[0] + '55', slide.gradient[1] + '22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>

            {/* Label */}
            <Animated.Text style={{ position: 'absolute', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, opacity: sliderTextOpacity }}>
              Slide to enter →
            </Animated.Text>

            {/* Knob */}
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                position: 'absolute', left: 4,
                width: KNOB, height: KNOB, borderRadius: KNOB / 2,
                justifyContent: 'center', alignItems: 'center',
                shadowColor: slide.glow, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                transform: [{ translateX: dragX }],
              }}>
              <LinearGradient colors={slide.gradient} style={{ width: KNOB, height: KNOB, borderRadius: KNOB / 2, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View style={{ position: 'absolute', opacity: checkOpacity }}>
                  <Ionicons name="checkmark" size={26} color="#fff" />
                </Animated.View>
                <Animated.View style={{ opacity: sliderTextOpacity }}>
                  <Ionicons name="arrow-forward" size={24} color="#fff" />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}