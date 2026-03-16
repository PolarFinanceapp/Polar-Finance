import { useLocale } from '@/context/LocaleContext';
import { Plan, usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = { visible: boolean; onClose: () => void; required?: boolean };

const FAKE_CARD = '4242';
const FAKE_EXPIRY = '12/27';

// ── Detect what biometric is available ────────────────────────────────────────
async function getBiometricType(): Promise<'faceid' | 'fingerprint' | 'none'> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return 'none';
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return 'none';
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceid';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return 'none';
  } catch {
    return 'none';
  }
}

// ── Fake payment sheet ────────────────────────────────────────────────────────
type PaymentSheetProps = {
  visible: boolean;
  planName: string;
  planColor: string;
  price: string;
  isTrialPremium: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

function FakePaymentSheet({ visible, planName, planColor, price, isTrialPremium, onSuccess, onCancel }: PaymentSheetProps) {
  const isIOS = Platform.OS === 'ios';
  const [stage, setStage] = useState<'sheet' | 'biometric' | 'processing' | 'success'>('sheet');
  const [biometricType, setBiometricType] = useState<'faceid' | 'fingerprint' | 'none'>('none');
  const slideAnim = useRef(new Animated.Value(500)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  useEffect(() => {
    if (visible) {
      setStage('sheet');
      successScale.setValue(0);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [visible]);

  // Pulse animation for biometric icon
  useEffect(() => {
    if (stage === 'biometric') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [stage]);

  const triggerBiometric = async () => {
    setStage('biometric');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isTrialPremium
          ? `Start free trial — ${planName}`
          : `Subscribe to ${planName}`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setStage('processing');
        setTimeout(() => {
          setStage('success');
          Animated.spring(successScale, {
            toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10,
          }).start();
          setTimeout(() => {
            onSuccess();
            setStage('sheet');
            successScale.setValue(0);
          }, 1800);
        }, 800);
      } else {
        // User cancelled or failed
        setStage('sheet');
      }
    } catch {
      // No biometric available — skip straight to processing
      setStage('processing');
      setTimeout(() => {
        setStage('success');
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
        setTimeout(() => {
          onSuccess();
          setStage('sheet');
          successScale.setValue(0);
        }, 1800);
      }, 1000);
    }
  };

  const handlePay = () => {
    if (biometricType !== 'none') {
      triggerBiometric();
    } else {
      // No biometric — simulate processing directly
      setStage('processing');
      setTimeout(() => {
        setStage('success');
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
        setTimeout(() => {
          onSuccess();
          setStage('sheet');
          successScale.setValue(0);
        }, 1800);
      }, 1200);
    }
  };

  const biometricIcon = biometricType === 'faceid' ? 'scan' : 'finger-print';
  const biometricLabel = biometricType === 'faceid' ? 'Face ID' : 'Touch ID';
  const biometricPrompt = biometricType === 'faceid'
    ? 'Look at your iPhone to confirm'
    : 'Place your finger on the sensor';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={stage === 'sheet' ? onCancel : undefined}
          activeOpacity={1}
        />

        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* ── Biometric prompt ── */}
          {stage === 'biometric' && (
            <View style={{
              backgroundColor: isIOS ? '#1C1C1E' : '#FAFAFA',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 40, alignItems: 'center', gap: 16,
            }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: isIOS ? '#2C2C2E' : '#E8F5E9',
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 2, borderColor: isIOS ? '#48484A' : '#A5D6A7',
                }}>
                  <Ionicons name={biometricIcon as any} size={38} color={isIOS ? '#fff' : '#2E7D32'} />
                </View>
              </Animated.View>
              <Text style={{ color: isIOS ? '#fff' : '#000', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                {biometricLabel}
              </Text>
              <Text style={{ color: isIOS ? '#8E8E93' : '#666', fontSize: 14, textAlign: 'center' }}>
                {biometricPrompt}
              </Text>
              <TouchableOpacity
                onPress={() => setStage('sheet')}
                style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: isIOS ? '#2C2C2E' : '#F5F5F5' }}>
                <Text style={{ color: isIOS ? '#8E8E93' : '#666', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Processing ── */}
          {stage === 'processing' && (
            <View style={{
              backgroundColor: isIOS ? '#1C1C1E' : '#FAFAFA',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 40, alignItems: 'center', gap: 16,
            }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: isIOS ? '#2C2C2E' : '#F5F5F5',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="time-outline" size={30} color={isIOS ? '#fff' : '#333'} />
              </View>
              <Text style={{ color: isIOS ? '#fff' : '#000', fontSize: 17, fontWeight: '600' }}>Processing...</Text>
            </View>
          )}

          {/* ── Success ── */}
          {stage === 'success' && (
            <View style={{
              backgroundColor: isIOS ? '#1C1C1E' : '#FAFAFA',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 40, alignItems: 'center', gap: 16,
            }}>
              <Animated.View style={{ transform: [{ scale: successScale }] }}>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: '#00D4AA22',
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 2, borderColor: '#00D4AA',
                }}>
                  <Ionicons name="checkmark" size={40} color="#00D4AA" />
                </View>
              </Animated.View>
              <Text style={{ color: isIOS ? '#fff' : '#000', fontSize: 20, fontWeight: '700' }}>
                {isTrialPremium ? 'Trial started!' : 'Subscribed!'}
              </Text>
              <Text style={{ color: isIOS ? '#8E8E93' : '#666', fontSize: 14, textAlign: 'center' }}>
                {isTrialPremium
                  ? `Your 3-day free trial has started`
                  : `${planName} is now active`}
              </Text>
            </View>
          )}

          {/* ── Main sheet ── */}
          {stage === 'sheet' && (
            isIOS ? (
              // ── APPLE PAY ────────────────────────────────────────────────────
              <View style={{ backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#3A3A3C' }} />
                </View>
                <View style={{ padding: 22 }}>
                  {/* Merchant */}
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: planColor + '22', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: planColor + '44' }}>
                      <Ionicons name="bar-chart" size={26} color={planColor} />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>James Finance</Text>
                    <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>{planName}</Text>
                  </View>

                  {/* Order summary */}
                  <View style={{ backgroundColor: '#2C2C2E', borderRadius: 14, padding: 16, marginBottom: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#8E8E93', fontSize: 14 }}>{planName} subscription</Text>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{price}/mo</Text>
                    </View>
                    {isTrialPremium && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#8E8E93', fontSize: 14 }}>3-day free trial</Text>
                        <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700' }}>FREE</Text>
                      </View>
                    )}
                    <View style={{ height: 1, backgroundColor: '#3A3A3C' }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Due today</Text>
                      <Text style={{ color: isTrialPremium ? '#00D4AA' : '#fff', fontSize: 15, fontWeight: '700' }}>
                        {isTrialPremium ? 'FREE' : price}
                      </Text>
                    </View>
                    {isTrialPremium && (
                      <Text style={{ color: '#636366', fontSize: 11, textAlign: 'center' }}>
                        Then {price}/month after 3-day trial
                      </Text>
                    )}
                  </View>

                  {/* Card */}
                  <View style={{ backgroundColor: '#2C2C2E', borderRadius: 14, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 38, height: 26, borderRadius: 5, backgroundColor: '#0057FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 }}>VISA</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Visa ···· {FAKE_CARD}</Text>
                      <Text style={{ color: '#8E8E93', fontSize: 11 }}>Expires {FAKE_EXPIRY}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#636366" />
                  </View>

                  {/* Apple Pay button */}
                  <TouchableOpacity
                    onPress={handlePay}
                    style={{ backgroundColor: '#fff', borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="logo-apple" size={22} color="#000" />
                    <Text style={{ color: '#000', fontSize: 17, fontWeight: '600' }}>
                      Pay{isTrialPremium ? ' · Free Trial' : ''}
                    </Text>
                    {biometricType === 'faceid' && (
                      <Ionicons name="scan" size={18} color="#555" />
                    )}
                    {biometricType === 'fingerprint' && (
                      <Ionicons name="finger-print" size={18} color="#555" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onCancel} style={{ alignItems: 'center', padding: 12 }}>
                    <Text style={{ color: '#636366', fontSize: 15 }}>Cancel</Text>
                  </TouchableOpacity>

                  <Text style={{ color: '#48484A', fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 }}>
                    {isTrialPremium
                      ? `Free for 3 days, then ${price}/month. Cancel in Settings before trial ends.`
                      : `${price}/month. Cancel anytime in Settings.`}
                  </Text>
                </View>
              </View>
            ) : (
              // ── GOOGLE PAY ────────────────────────────────────────────────────
              <View style={{ backgroundColor: '#FAFAFA', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' }} />
                </View>
                <View style={{ padding: 22 }}>
                  {/* Merchant */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: planColor + '22', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="bar-chart" size={22} color={planColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>James Finance</Text>
                      <Text style={{ color: '#666', fontSize: 13 }}>{planName} · {price}/month</Text>
                    </View>
                  </View>

                  {/* Order */}
                  <View style={{ backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 14, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#333', fontSize: 14 }}>{planName}</Text>
                      <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>{price}/mo</Text>
                    </View>
                    {isTrialPremium && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#333', fontSize: 14 }}>Trial discount</Text>
                        <Text style={{ color: '#1B873F', fontSize: 14, fontWeight: '600' }}>-{price}</Text>
                      </View>
                    )}
                    <View style={{ height: 1, backgroundColor: '#E0E0E0' }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#000', fontSize: 15, fontWeight: '700' }}>Total due today</Text>
                      <Text style={{ color: isTrialPremium ? '#1B873F' : '#000', fontSize: 15, fontWeight: '700' }}>
                        {isTrialPremium ? '£0.00' : price}
                      </Text>
                    </View>
                    {isTrialPremium && (
                      <Text style={{ color: '#888', fontSize: 11, textAlign: 'center' }}>
                        Then {price}/month after 3-day trial
                      </Text>
                    )}
                  </View>

                  {/* Card */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <View style={{ width: 38, height: 26, borderRadius: 5, backgroundColor: '#0057FF', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: '900' }}>VISA</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#000', fontSize: 14, fontWeight: '600' }}>···· {FAKE_CARD}</Text>
                      <Text style={{ color: '#666', fontSize: 11 }}>{FAKE_EXPIRY}</Text>
                    </View>
                    <Text style={{ color: '#1A73E8', fontSize: 13, fontWeight: '600' }}>Change</Text>
                  </View>

                  {/* Google Pay button */}
                  <TouchableOpacity
                    onPress={handlePay}
                    style={{ backgroundColor: '#000', borderRadius: 28, padding: 16, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Pay with </Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#4285F4' }}>G</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#EA4335' }}>o</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FBBC04' }}>o</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#4285F4' }}>g</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#34A853' }}>l</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#EA4335' }}>e</Text>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}> Pay</Text>
                    {biometricType === 'fingerprint' && (
                      <Ionicons name="finger-print" size={18} color="#aaa" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onCancel} style={{ alignItems: 'center', padding: 10 }}>
                    <Text style={{ color: '#666', fontSize: 14 }}>Cancel</Text>
                  </TouchableOpacity>

                  <Text style={{ color: '#999', fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 }}>
                    {isTrialPremium
                      ? `Free for 3 days, then ${price}/month. Cancel anytime.`
                      : `${price}/month. Cancel anytime in Settings.`}
                  </Text>
                </View>
              </View>
            )
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Paywall ──────────────────────────────────────────────────────────────
export default function Paywall({ visible, onClose, required = false }: Props) {
  const { theme: c } = useTheme();
  const { plan, upgradeTo, startTrial, resetPlan } = usePlan();
  const { convertPrice } = useLocale();

  const [selected, setSelected] = useState<Plan | null>(null);
  const [paymentSheet, setPaymentSheet] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showPromo, setShowPromo] = useState(false);

  const PROMO_CODES: Record<string, Plan> = {
    'JF-PRO': 'pro',
    'JF-PREMIUM': 'premium',
    'TESTPRO': 'pro',
    'TESTPREMIUM': 'premium',
  };

  const PLANS: {
    key: Plan; name: string; icon: string; color: string;
    badge: string | null; gbpPrice: number; trialDays?: number; features: string[];
  }[] = [
      {
        key: 'pro', name: 'Pro', icon: 'flash', color: '#6C63FF', badge: null, gbpPrice: 3.99,
        features: [
          'Unlimited transactions',
          'Receipt scanning (AI)',
          'Advanced charts & stats',
          'Card tracking',
          'All themes · No ads',
        ],
      },
      {
        key: 'premium', name: 'Premium', icon: 'trophy', color: '#FFD700',
        badge: 'Best Value', gbpPrice: 7.99, trialDays: 3,
        features: [
          'Everything in Pro',
          'Live market signals & forecasts',
          'Investment & asset tracking',
          'Unlimited saving goals',
          'Tax helper & export',
        ],
      },
    ];

  const selectedPlan = PLANS.find(p => p.key === selected);
  const isTrialPremium = selected === 'premium' && !!selectedPlan?.trialDays;

  const handleSubscribe = () => {
    if (!selected) return;
    setPaymentSheet(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentSheet(false);
    if (isTrialPremium) {
      await startTrial();
    } else {
      await upgradeTo(selected!);
    }
    onClose();
  };

  const handlePromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) { setPromoError('Enter a promo code.'); return; }
    const matched = PROMO_CODES[code];
    if (matched) {
      await upgradeTo(matched);
      setPromoCode(''); setPromoError(''); setShowPromo(false);
      Alert.alert('Code Applied', `${matched.charAt(0).toUpperCase() + matched.slice(1)} unlocked.`, [{ text: 'OK', onPress: onClose }]);
    } else {
      setPromoError('Invalid promo code. Try JF-PRO or JF-PREMIUM.');
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.dark }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>
                {required ? 'Choose Your Plan' : 'Upgrade James Finance'}
              </Text>
              <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>
                {required ? 'Your trial has ended' : 'Unlock the full experience'}
              </Text>
            </View>
            {!required && (
              <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={20} color={c.muted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

            {required && (
              <View style={{ backgroundColor: '#FF6B6B22', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FF6B6B44', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="time-outline" size={20} color="#FF6B6B" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '700' }}>Trial Ended</Text>
                  <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Subscribe to keep all features</Text>
                </View>
              </View>
            )}

            {(plan === 'pro' || plan === 'premium') && (
              <View style={{ backgroundColor: '#00D4AA22', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#00D4AA44', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="checkmark-circle" size={20} color="#00D4AA" />
                <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700', flex: 1 }}>
                  {plan === 'pro' ? 'Pro' : 'Premium'} active
                </Text>
                <TouchableOpacity onPress={() => resetPlan()} style={{ backgroundColor: '#FF6B6B22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                  <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '700' }}>Reset</Text>
                </TouchableOpacity>
              </View>
            )}

            {PLANS.map(p => {
              const isSel = selected === p.key;
              const isCur = plan === p.key;
              return (
                <TouchableOpacity key={p.key} disabled={isCur} onPress={() => setSelected(p.key)}
                  style={{ backgroundColor: c.card, borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 2, borderColor: isSel ? p.color : isCur ? '#00D4AA44' : c.border, opacity: isCur ? 0.5 : 1 }}>
                  {p.badge && (
                    <View style={{ position: 'absolute', top: -10, right: 16, backgroundColor: p.color, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ color: '#000', fontSize: 11, fontWeight: '800' }}>{p.badge}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: p.color + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: p.color + '44' }}>
                      <Ionicons name={p.icon as any} size={26} color={p.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={{ color: p.color, fontSize: 15, fontWeight: '800' }}>{convertPrice(p.gbpPrice)}/mo</Text>
                        {p.trialDays && (
                          <View style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#00D4AA44' }}>
                            <Text style={{ color: '#00D4AA', fontSize: 10, fontWeight: '800' }}>{p.trialDays} DAYS FREE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {isSel && (
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                  {p.features.map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                      <Ionicons name="checkmark-circle" size={14} color={p.color} />
                      <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
                    </View>
                  ))}
                  {p.trialDays && isSel && (
                    <View style={{ backgroundColor: '#00D4AA11', borderRadius: 10, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#00D4AA33' }}>
                      <Text style={{ color: '#00D4AA', fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                        Free for {p.trialDays} days, then {convertPrice(p.gbpPrice)}/month
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4, marginBottom: 16 }}>
              Subscriptions renew automatically. Cancel anytime in Settings.
            </Text>
          </ScrollView>

          {/* Footer */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, backgroundColor: c.dark, borderTopWidth: 1, borderTopColor: c.border }}>
            <TouchableOpacity
              disabled={!selected}
              onPress={handleSubscribe}
              style={{ backgroundColor: selected ? (selectedPlan?.color || c.accent) : c.card2, borderRadius: 18, padding: 18, alignItems: 'center', opacity: selected ? 1 : 0.5, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {selected && (
                <Ionicons
                  name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google-playstore'}
                  size={20} color="#fff"
                />
              )}
              <Text style={{ color: selected ? '#fff' : c.muted, fontSize: 17, fontWeight: '900' }}>
                {selected
                  ? isTrialPremium
                    ? `Start Free Trial · ${Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}`
                    : `Subscribe · ${Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}`
                  : 'Select a plan above'}
              </Text>
            </TouchableOpacity>

            {!showPromo ? (
              <TouchableOpacity onPress={() => setShowPromo(true)} style={{ alignItems: 'center', marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="ticket-outline" size={16} color={c.accent} />
                  <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>Have a promo code?</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 14, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.accent + '44' }}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>Enter promo code</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: promoError ? '#FF6B6B' : c.border, letterSpacing: 1 }}
                    placeholder="e.g. JF-PREMIUM"
                    placeholderTextColor={c.muted}
                    value={promoCode}
                    onChangeText={v => { setPromoCode(v.toUpperCase()); setPromoError(''); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                  />
                  <TouchableOpacity onPress={handlePromo} disabled={!promoCode.trim()}
                    style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', opacity: promoCode.trim() ? 1 : 0.4 }}>
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Apply</Text>
                  </TouchableOpacity>
                </View>
                {!!promoError && <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600', marginTop: 8 }}>{promoError}</Text>}
              </View>
            )}

            {(plan === 'pro' || plan === 'premium') && (
              <TouchableOpacity onPress={() => resetPlan()} style={{ alignItems: 'center', marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="refresh" size={14} color="#FF6B6B" />
                  <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '600' }}>Reset plan (testing)</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <FakePaymentSheet
        visible={paymentSheet}
        planName={selectedPlan?.name || ''}
        planColor={selectedPlan?.color || '#6C63FF'}
        price={selectedPlan ? convertPrice(selectedPlan.gbpPrice) : ''}
        isTrialPremium={isTrialPremium}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setPaymentSheet(false)}
      />
    </>
  );
}