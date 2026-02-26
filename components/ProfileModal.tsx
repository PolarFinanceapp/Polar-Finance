import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Plan, planFeatures, usePlan } from '../context/PlanContext';

const plans: { key: Plan; label: string; price: string; color: string; emoji: string }[] = [
  { key: 'free',     label: 'Free',             price: '£0',        color: '#7B7B9E', emoji: '🆓' },
  { key: 'pro',      label: 'Pro',              price: '£3.99/mo',  color: '#00D4AA', emoji: '⚡' },
  { key: 'premium',  label: 'Premium',          price: '£7.99/mo',  color: '#6C63FF', emoji: '👑' },
  { key: 'lifetime', label: 'Lifetime',         price: '£99.99',    color: '#FFD700', emoji: '♾️' },
  { key: 'family',   label: 'Lifetime Family',  price: '£129.99',   color: '#FF9F43', emoji: '👨‍👩‍👧‍👦' },
];

const featureLabels: { key: keyof typeof planFeatures['free']; label: string }[] = [
  { key: 'adFree',                label: 'Ad-free' },
  { key: 'unlimitedTransactions', label: 'Unlimited transactions' },
  { key: 'yearlyBudget',          label: 'Yearly budget view' },
  { key: 'unlimitedGoals',        label: 'Unlimited saving goals' },
  { key: 'receiptPhoto',          label: 'Receipt photo save' },
  { key: 'advancedCharts',        label: 'Advanced charts' },
  { key: 'calendarView',          label: 'Calendar view' },
  { key: 'themes',                label: 'All preset themes' },
  { key: 'customTheme',           label: 'Custom theme builder' },
  { key: 'cardTracking',          label: 'Card balance tracking' },
  { key: 'investmentTracking',    label: 'Investment tracking' },
  { key: 'assetGraph',            label: 'Asset growth graph' },
  { key: 'doubleEntry',           label: 'Double-entry bookkeeping' },
  { key: 'advancedFiltering',     label: 'Advanced filtering' },
  { key: 'familyView',            label: 'Family overview' },
];

type Props = { visible: boolean; onClose: () => void };

export default function ProfileModal({ visible, onClose }: Props) {
  const { plan, setPlan } = usePlan();
  const current = plans.find(p => p.key === plan)!;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: current.color + '33', borderColor: current.color }]}>
              <Text style={styles.avatarText}>J</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>James</Text>
              <Text style={styles.profileEmail}>james@example.com</Text>
              <View style={[styles.planBadge, { backgroundColor: current.color + '22', borderColor: current.color }]}>
                <Text style={[styles.planBadgeText, { color: current.color }]}>{current.emoji} {current.label}</Text>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Plan Switcher — dev only */}
            <Text style={styles.sectionTitle}>🔧 Switch Plan (Demo)</Text>
            <View style={styles.planGrid}>
              {plans.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.planBtn, plan === p.key && { borderColor: p.color, backgroundColor: p.color + '18' }]}
                  onPress={() => setPlan(p.key)}>
                  <Text style={styles.planEmoji}>{p.emoji}</Text>
                  <Text style={[styles.planLabel, plan === p.key && { color: p.color }]}>{p.label}</Text>
                  <Text style={styles.planPrice}>{p.price}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feature Checklist */}
            <Text style={styles.sectionTitle}>Your Features</Text>
            <View style={styles.featureList}>
              {featureLabels.map(f => {
                const has = planFeatures[plan][f.key];
                return (
                  <View key={f.key} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: has ? '#00D4AA' : '#FF6B6B' }]}>
                      {has ? '✓' : '✕'}
                    </Text>
                    <Text style={[styles.featureLabel, !has && styles.featureLocked]}>{f.label}</Text>
                    {!has && <Text style={styles.lockIcon}>🔒</Text>}
                  </View>
                );
              })}
            </View>

            {/* Upgrade CTA */}
            {plan === 'free' && (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => setPlan('pro')}>
                <Text style={styles.upgradeBtnText}>⚡ Upgrade to Pro — £3.99/mo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#13132A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' },
  handle: { width: 40, height: 4, backgroundColor: '#7B7B9E', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#E8E8F0', fontSize: 20, fontWeight: '800' },
  profileEmail: { color: '#7B7B9E', fontSize: 13, marginBottom: 6 },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  planBadgeText: { fontSize: 12, fontWeight: '700' },

  sectionTitle: { color: '#7B7B9E', fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },

  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  planBtn: { width: '47%', backgroundColor: '#1A1A35', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: 'rgba(108,99,255,0.2)', alignItems: 'center' },
  planEmoji: { fontSize: 22, marginBottom: 4 },
  planLabel: { color: '#E8E8F0', fontSize: 13, fontWeight: '700' },
  planPrice: { color: '#7B7B9E', fontSize: 11, marginTop: 2 },

  featureList: { backgroundColor: '#1A1A35', borderRadius: 16, padding: 12, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 10 },
  featureCheck: { fontSize: 14, fontWeight: '700', width: 18 },
  featureLabel: { color: '#E8E8F0', fontSize: 13, flex: 1 },
  featureLocked: { color: '#7B7B9E' },
  lockIcon: { fontSize: 12 },

  upgradeBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  upgradeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  closeBtn: { backgroundColor: '#1A1A35', borderRadius: 14, padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#7B7B9E', fontWeight: '600' },
});