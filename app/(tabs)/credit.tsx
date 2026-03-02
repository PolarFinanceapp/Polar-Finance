import { useLocale } from '@/context/LocaleContext';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const services = [
  { icon: '🟢', name: 'ClearScore', sub: 'Free forever · Updates weekly', desc: 'Check your Equifax score for free. No credit card required, never charges you.', color: '#00D4AA', url: 'https://www.clearscore.com', badge: '⭐ Most Popular' },
  { icon: '🔵', name: 'Experian', sub: 'Free basic score · Paid full report', desc: "The UK's largest credit bureau. Get your Experian score free with their app.", color: '#6C63FF', url: 'https://www.experian.co.uk', badge: null },
  { icon: '🟣', name: 'Credit Karma', sub: 'Free forever · TransUnion score', desc: 'Free TransUnion credit score with personalised tips to improve it.', color: '#a89fff', url: 'https://www.creditkarma.co.uk', badge: null },
  { icon: '🟡', name: 'MSE Credit Club', sub: 'Free · Experian score', desc: "MoneySavingExpert's free credit club. Includes full credit report and score.", color: '#FFD700', url: 'https://creditclub.moneysavingexpert.com', badge: null },
];

const tips = [
  { icon: '📅', key: 'tipPayOnTime' },
  { icon: '💳', key: 'tipKeepBelow30' },
  { icon: '🔍', key: 'tipAvoidMultiple' },
  { icon: '📋', key: 'tipElectoralRoll' },
  { icon: '⏳', key: 'tipKeepOldAccounts' },
];

// Fallback tips in English if translation keys don't exist
const tipFallbacks: Record<string, string> = {
  tipPayOnTime: 'Pay all bills on time — payment history is the biggest factor',
  tipKeepBelow30: 'Keep credit card usage below 30% of your total limit',
  tipAvoidMultiple: 'Avoid applying for multiple credit products in a short period',
  tipElectoralRoll: 'Register on the electoral roll at your current address',
  tipKeepOldAccounts: 'Keep old accounts open — longer credit history helps your score',
};

export default function CreditScreen() {
  const { theme: c } = useTheme();
  const { t } = useLocale();

  const getTip = (key: string) => {
    const translated = t(key);
    return translated === key ? tipFallbacks[key] || key : translated;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 6 }}>{t('creditScore')} 💳</Text>
      <Text style={{ color: c.muted, fontSize: 13, marginBottom: 24 }}>{t('checkFreeScore')}</Text>

      <View style={{ backgroundColor: c.card2, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 24 }}>ℹ️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{t('whyNoScore')}</Text>
          <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t('whyNoScoreDesc')}</Text>
        </View>
      </View>

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('freeCreditServices')}</Text>
      {services.map((s, i) => (
        <TouchableOpacity key={i} style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: c.border }} onPress={() => Linking.openURL(s.url)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: s.color + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: s.color + '44' }}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }}>{s.name}</Text>
                {s.badge && (
                  <View style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#00D4AA44' }}>
                    <Text style={{ color: '#00D4AA', fontSize: 10, fontWeight: '700' }}>{s.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{s.sub}</Text>
            </View>
            <Text style={{ color: s.color, fontSize: 22 }}>›</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }}>{s.desc}</Text>
          <View style={{ backgroundColor: s.color + '18', borderRadius: 10, padding: 10, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: s.color, fontSize: 12, fontWeight: '700', flex: 1 }}>{t('checkScoreFree')} {s.name} →</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>{t('tipsToImprove')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 18, marginBottom: 40, borderWidth: 1, borderColor: c.border }}>
        {tips.map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: i < tips.length - 1 ? 1 : 0, borderBottomColor: c.border, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
            <Text style={{ color: c.muted, fontSize: 13, flex: 1, lineHeight: 18 }}>{getTip(tip.key)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}