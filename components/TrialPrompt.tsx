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

          <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>{t('welcomeToPolar')}</Text>
          <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>{t('trialDescription')}</Text>

          <View style={{ width: '100%', backgroundColor: c.card2, borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
            {[
              `📊 ${t('unlimitedTransactions') || 'Unlimited transactions'}`,
              `🧾 ${t('receiptPhoto') || 'AI receipt scanning'}`,
              `📈 ${t('markets') || 'Live market signals'}`,
              `💼 ${t('assets') || 'Net worth tracking'}`,
              `🎯 ${t('savingGoals') || 'Unlimited goals'}`,
              `🎨 ${t('themes') || 'All themes'}`,
            ].map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>✓</Text>
                <Text style={{ color: c.text, fontSize: 13 }}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={startTrial} style={{ width: '100%', backgroundColor: '#FFD700', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '900' }}>{t('startFreeTrial')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={dismissTrialPrompt} style={{ padding: 8 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{t('cancel') || 'Skip'}</Text>
          </TouchableOpacity>

          <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 8 }}>{t('noCreditCard')}</Text>
        </View>
      </View>
    </Modal>
  );
}