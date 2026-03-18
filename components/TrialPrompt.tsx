import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TrialPrompt() {
  const { theme: c } = useTheme();
  const { showTrialPrompt, startTrial, dismissTrialPrompt } = usePlan();

  return (
    <Modal visible={showTrialPrompt} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: c.card, borderRadius: 28, padding: 28, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>

          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044' }}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
          </View>

          <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>
            Welcome to James Finance
          </Text>
          <Text style={{ color: c.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            Enjoy full Premium access free for 3 days.{'\n'}No payment required.
          </Text>

          <View style={{ width: '100%', backgroundColor: c.card2, borderRadius: 16, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: c.border }}>
            {[
              { icon: 'receipt', text: 'Unlimited Transactions' },
              { icon: 'scan', text: 'Receipt Photo Scanning' },
              { icon: 'trending-up', text: 'Live Market Signals' },
              { icon: 'briefcase', text: 'Net Worth Tracking' },
              { icon: 'flag', text: 'Unlimited Saving Goals' },
              { icon: 'color-palette', text: 'All Themes Unlocked' },
            ].map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                <Ionicons name="checkmark-circle" size={16} color="#00D4AA" />
                <Text style={{ color: c.text, fontSize: 13 }}>{f.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={startTrial}
            style={{ width: '100%', backgroundColor: '#FFD700', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '900' }}>
              Start 3-Day Free Trial
            </Text>
          </TouchableOpacity>

          <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 12 }}>
            No card needed. Cancel anytime.
          </Text>

          <TouchableOpacity onPress={dismissTrialPrompt} style={{ padding: 8 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}