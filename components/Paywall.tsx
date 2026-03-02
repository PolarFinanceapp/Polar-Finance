import { useLocale } from '@/context/LocaleContext';
import { Plan, usePlan } from '@/context/PlanContext';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = { visible: boolean; onClose: () => void; required?: boolean };

const PROMO_CODES: Record<string, Plan> = {
  'POLAR-PRO': 'pro', 'POLAR-PREMIUM': 'premium', 'TESTPRO': 'pro', 'TESTPREMIUM': 'premium',
};

export default function Paywall({ visible, onClose, required = false }: Props) {
  const { theme: c } = useTheme();
  const { plan, upgradeTo, resetPlan } = usePlan();
  const { convertPrice, t } = useLocale();

  const PLANS: { key: Plan; name: string; emoji: string; color: string; badge: string | null; gbpPrice: number; features: string[] }[] = [
    {
      key: 'pro', name: t('proPlan'), emoji: '⚡', color: '#6C63FF', badge: null, gbpPrice: 3.99,
      features: [
        t('unlimitedTransactions') || 'Unlimited transactions',
        t('receiptPhoto') || 'Receipt scanning (AI)',
        t('advancedCharts') || 'Advanced charts & stats',
        t('calendarView') || 'Calendar view',
        t('cards') || 'Card tracking',
        t('themes') || 'All themes',
      ],
    },
    {
      key: 'premium', name: t('premiumPlan'), emoji: '👑', color: '#FFD700', badge: '⭐', gbpPrice: 7.99,
      features: [
        `${t('all') || 'Everything'} in ${t('proPlan')}, +`,
        t('savingGoals') || 'Unlimited saving goals',
        t('investments') || 'Investment tracking',
        t('assets') || 'Asset & net worth graph',
        t('markets') || 'Live market signals',
        t('customTheme') || 'Custom themes',
      ],
    },
  ];

  const [selected, setSelected] = useState<Plan | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const handlePurchase = () => {
    if (!selected) return;
    Alert.alert('🧪 Test Mode', `Use a promo code to unlock.`, [{ text: 'OK' }]);
  };

  const handlePromo = async () => {
    const code = promoCode.trim().toUpperCase();
    const matched = PROMO_CODES[code];
    if (matched) {
      await upgradeTo(matched);
      setPromoCode(''); setPromoError(''); setShowPromo(false);
      Alert.alert('🎉', `${matched.charAt(0).toUpperCase() + matched.slice(1)} ${t('done')}!`, [{ text: 'OK', onPress: onClose }]);
    } else {
      setPromoError(t('invalidPromoCode'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: c.dark }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: '900' }}>{required ? t('chooseAPlan') || 'Choose Your Plan' : t('upgradePolar')}</Text>
            <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{required ? t('trialExpired') : t('unlockFullExperience')}</Text>
          </View>
          {!required && (
            <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: c.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {required && (
            <View style={{ backgroundColor: '#FF6B6B22', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FF6B6B44', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>⏰</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '700' }}>{t('trialExpired')}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('chooseAPlan')}</Text>
              </View>
            </View>
          )}

          {(plan === 'pro' || plan === 'premium') && (
            <View style={{ backgroundColor: '#00D4AA22', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#00D4AA44', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700', flex: 1 }}>{plan === 'pro' ? t('proPlan') : t('premiumPlan')}</Text>
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
                {p.badge && <View style={{ position: 'absolute', top: -10, right: 16, backgroundColor: p.color, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{p.badge}</Text></View>}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: p.color + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: p.color + '44' }}>
                    <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{p.name}</Text>
                    <Text style={{ color: p.color, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{convertPrice(p.gbpPrice)}{t('perMonth')}</Text>
                  </View>
                  {isSel && <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: p.color, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✓</Text></View>}
                  {isCur && <View style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: '#00D4AA', fontSize: 11, fontWeight: '700' }}>Current</Text></View>}
                </View>
                {p.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                    <Text style={{ color: p.color, fontSize: 13, fontWeight: '700' }}>✓</Text>
                    <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            );
          })}

          <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 8, marginBottom: 16 }}>{t('subscriptionTerms')}</Text>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, backgroundColor: c.dark, borderTopWidth: 1, borderTopColor: c.border }}>
          <TouchableOpacity disabled={!selected} onPress={handlePurchase}
            style={{ backgroundColor: selected ? (PLANS.find(p => p.key === selected)?.color || c.accent) : c.card2, borderRadius: 18, padding: 18, alignItems: 'center', opacity: selected ? 1 : 0.5 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>
              {selected ? `${t('subscribeTo')} ${PLANS.find(p => p.key === selected)?.name}` : t('selectPlanAbove')}
            </Text>
          </TouchableOpacity>

          {!showPromo ? (
            <TouchableOpacity onPress={() => setShowPromo(true)} style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>🎟️ {t('havePromoCode')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ marginTop: 14, backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.accent + '44' }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>{t('enterPromoCode')}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={{ flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: c.border, letterSpacing: 1 }}
                  placeholder="e.g. POLAR-PRO" placeholderTextColor={c.muted} value={promoCode}
                  onChangeText={tx => { setPromoCode(tx); setPromoError(''); }} autoCapitalize="characters" autoCorrect={false} />
                <TouchableOpacity onPress={handlePromo} disabled={!promoCode.trim()}
                  style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', opacity: promoCode.trim() ? 1 : 0.4 }}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{t('apply')}</Text>
                </TouchableOpacity>
              </View>
              {promoError ? <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600', marginTop: 8 }}>{promoError}</Text> : null}
            </View>
          )}

          {(plan === 'pro' || plan === 'premium') && (
            <TouchableOpacity onPress={() => resetPlan()} style={{ alignItems: 'center', marginTop: 12 }}>
              <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '600' }}>🔄 Reset (testing)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}