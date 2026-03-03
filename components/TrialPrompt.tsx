import { useLocale } from '@/context/LocaleContext';
import { usePlan } from '@/context/PlanContext';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TrialPrompt() {
  const { theme: c } = useTheme();
  const { showTrialPrompt, startTrial, dismissTrialPrompt } = usePlan();
  const { t } = useLocale();

  return (
    <Modal visible={showTrialPrompt} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 28, padding: 28, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>

          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044' }}>
            <Text style={{ fontSize: 40 }}>👑</Text>
          </View>

          <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            {t('welcomeToPolar')}
          </Text>
          <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            {t('trialDescription')}
          </Text>

          <View style={{ width: '100%', backgroundColor: c.card2, borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
            {[
             '📊 Unlimited Transactions',
             '🧾 Receipt Photo Scanning',
             '📈 Live Market Signals',
             '💼 Net Worth Tracking',
             '🎯 Unlimited Saving Goals',
             '🎨 All Themes Unlocked',
            ].map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>✓</Text>
                <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Start trial — requires card (no "no credit card" text) */}
          <TouchableOpacity
            onPress={startTrial}
            style={{ width: '100%', backgroundColor: '#FFD700', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '900' }}>
              {t('startFreeTrial')}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 12 }}>
            A payment method is required. You won't be charged until the trial ends. Cancel anytime before 3 days to avoid being billed.
          </Text>

          <TouchableOpacity onPress={dismissTrialPrompt} style={{ padding: 8 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>
              {t('cancel') || 'Maybe later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}