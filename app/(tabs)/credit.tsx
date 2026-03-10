import { useLocale } from '@/context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StarBackground from '../../components/StarBackground';
import { useTheme } from '../../context/ThemeContext';

const services = [
  {
    ionicon: 'checkmark-circle' as const,
    name: 'ClearScore',
    sub: 'Free forever · Updates weekly',
    desc: 'Check your Equifax score for free. No credit card required, never charges you.',
    color: '#00D4AA',
    url: 'https://www.clearscore.com',
    badge: 'Most Popular',
  },
  {
    ionicon: 'analytics' as const,
    name: 'Experian',
    sub: 'Free basic score · Paid full report',
    desc: "The UK's largest credit bureau. Get your Experian score free with their app.",
    color: '#6C63FF',
    url: 'https://www.experian.co.uk',
    badge: null,
  },
  {
    ionicon: 'stats-chart' as const,
    name: 'Credit Karma',
    sub: 'Free forever · TransUnion score',
    desc: 'Free TransUnion credit score with personalised tips to improve it.',
    color: '#a89fff',
    url: 'https://www.creditkarma.co.uk',
    badge: null,
  },
  {
    ionicon: 'shield-checkmark' as const,
    name: 'MSE Credit Club',
    sub: 'Free · Experian score',
    desc: "MoneySavingExpert's free credit club. Includes full credit report and score.",
    color: '#FFD700',
    url: 'https://creditclub.moneysavingexpert.com',
    badge: null,
  },
];

const tips = [
  { ionicon: 'calendar' as const, text: 'Pay all bills on time — payment history is the biggest factor' },
  { ionicon: 'card' as const, text: 'Keep credit card usage below 30% of your total limit' },
  { ionicon: 'search' as const, text: 'Avoid applying for multiple credit products in a short period' },
  { ionicon: 'document-text' as const, text: 'Register on the electoral roll at your current address' },
  { ionicon: 'time' as const, text: 'Keep old accounts open — longer credit history helps your score' },
];

// ── Glass card component ───────────────────────────────────────────────────────
function GlassCard({ children, style, color }: { children: React.ReactNode; style?: any; color?: string }) {
  return (
    <View style={[styles.glassWrapper, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
      )}
      {/* Subtle coloured tint overlay */}
      {color && <View style={[StyleSheet.absoluteFill, { backgroundColor: color + '08', borderRadius: 20 }]} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});

export default function CreditScreen() {
  const { theme: c } = useTheme();
  const { t } = useLocale();

  return (
    <View style={{ flex: 1, backgroundColor: c.dark }}>
      <StarBackground />
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 6, letterSpacing: -0.5 }}>
          {t('creditScore')}
        </Text>
        <Text style={{ color: c.muted, fontSize: 13, marginBottom: 24 }}>{t('checkFreeScore')}</Text>

        {/* Info banner */}
        <GlassCard style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.accent + '22', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="information-circle" size={22} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{t('whyNoScore')}</Text>
              <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t('whyNoScoreDesc')}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Section label */}
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
          {t('freeCreditServices')}
        </Text>

        {/* Service cards */}
        {services.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => Linking.openURL(s.url)}
            activeOpacity={0.8}
            style={{ marginBottom: 12 }}
          >
            <GlassCard color={s.color}>
              <View style={{ padding: 18 }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  {/* Icon */}
                  <View style={{
                    width: 50, height: 50, borderRadius: 15,
                    backgroundColor: s.color + '20',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1, borderColor: s.color + '40',
                  }}>
                    <Ionicons name={s.ionicon} size={24} color={s.color} />
                  </View>

                  {/* Name + badge */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{s.name}</Text>
                      {s.badge && (
                        <View style={{ backgroundColor: '#00D4AA20', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#00D4AA40' }}>
                          <Text style={{ color: '#00D4AA', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>★ {s.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: c.muted, fontSize: 11 }}>{s.sub}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={s.color + 'AA'} />
                </View>

                {/* Description */}
                <Text style={{ color: c.muted, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>{s.desc}</Text>

                {/* CTA strip */}
                <View style={{
                  backgroundColor: s.color + '15',
                  borderRadius: 12, padding: 11,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderWidth: 1, borderColor: s.color + '25',
                }}>
                  <Ionicons name="open-outline" size={14} color={s.color} />
                  <Text style={{ color: s.color, fontSize: 12, fontWeight: '700', flex: 1 }}>
                    Check your score free on {s.name}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Tips section */}
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14, marginTop: 8 }}>
          {t('tipsToImprove')}
        </Text>

        <GlassCard>
          <View style={{ padding: 6 }}>
            {tips.map((tip, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  paddingVertical: 13,
                  paddingHorizontal: 12,
                  borderBottomWidth: i < tips.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: c.accent + '18',
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 1, borderColor: c.accent + '30',
                }}>
                  <Ionicons name={tip.ionicon} size={17} color={c.accent} />
                </View>
                <Text style={{ color: c.muted, fontSize: 13, flex: 1, lineHeight: 19 }}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

      </ScrollView>
    </View>
  );
}