import { useLocale } from '@/context/LocaleContext';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Plan, planFeatures, usePlan } from '../context/PlanContext';
import { supabase } from '../lib/supabase';

const AVATAR_ICONS = ['🐻‍❄️','🦁','🐯','🦊','🐺','🦅','🐬','🦋','🐲','🌟','💎','🔥','⚡','🎯','🚀','🌈','🍀','👑'];

const planMeta: Record<Plan, { color: string; emoji: string }> = {
  free:    { color: '#7B7B9E', emoji: '🆓' },
  trial:   { color: '#FFD700', emoji: '👑' },
  pro:     { color: '#00D4AA', emoji: '⚡' },
  premium: { color: '#6C63FF', emoji: '👑' },
};

type Props = { visible: boolean; onClose: () => void };

export default function ProfileModal({ visible, onClose }: Props) {
  const { plan, trialDaysLeft, resetPlan } = usePlan();
  const { t, convertPrice } = useLocale();
  const meta = planMeta[plan] || planMeta.free;

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pickingAvatar, setPickingAvatar] = useState(false);

  useEffect(() => {
    if (!visible) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      setUserEmail(user.email || '');
    });
  }, [visible]);

  const displayAvatar = avatar || userName.charAt(0).toUpperCase();
  const isEmoji = avatar.length > 0;
  const planLabel = plan === 'free' ? t('freePlan') : plan === 'trial' ? t('trialPlan') : plan === 'pro' ? t('proPlan') : t('premiumPlan');

  const featureLabels: { key: keyof typeof planFeatures['free']; label: string }[] = [
    { key: 'adFree', label: 'Ad-free' },
    { key: 'unlimitedTransactions', label: t('unlimitedTransactions') || 'Unlimited transactions' },
    { key: 'receiptPhoto', label: 'Receipt scanning' },
    { key: 'advancedCharts', label: t('advancedCharts') || 'Advanced charts' },
    { key: 'calendarView', label: t('calendarView') || 'Calendar view' },
    { key: 'themes', label: t('themes') || 'All themes' },
    { key: 'cardTracking', label: t('cards') || 'Card tracking' },
    { key: 'advancedFiltering', label: 'Advanced filtering' },
    { key: 'investmentTracking', label: t('investments') || 'Investment tracking' },
    { key: 'assetGraph', label: 'Asset graph' },
    { key: 'customTheme', label: 'Custom themes' },
    { key: 'doubleEntry', label: 'Double-entry bookkeeping' },
  ];

  const handleClose = () => {
    setPickingAvatar(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: '#13132A' }}>

        {/* Header with close button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(108,99,255,0.15)' }}>
          <TouchableOpacity onPress={handleClose} style={{ paddingVertical: 4, paddingRight: 12 }}>
            <Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '600' }}>← {t('close')}</Text>
          </TouchableOpacity>
          <View style={{ width: 40, height: 4, backgroundColor: '#7B7B9E', borderRadius: 2 }} />
          <TouchableOpacity onPress={handleClose} style={{ paddingVertical: 4, paddingLeft: 12 }}>
            <Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, marginBottom: 16 }}>
            <TouchableOpacity style={{ width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, backgroundColor: meta.color + '33', borderColor: meta.color, position: 'relative' }} onPress={() => setPickingAvatar(!pickingAvatar)}>
              <Text style={isEmoji ? { fontSize: 28 } : { color: '#fff', fontSize: 26, fontWeight: '800' }}>{displayAvatar}</Text>
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: '#1A1A35', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)' }}>
                <Text style={{ fontSize: 10 }}>✏️</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#E8E8F0', fontSize: 20, fontWeight: '800' }}>{userName || '...'}</Text>
              <Text style={{ color: '#7B7B9E', fontSize: 13, marginBottom: 6 }}>{userEmail || '...'}</Text>
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50, borderWidth: 1, backgroundColor: meta.color + '22', borderColor: meta.color }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: meta.color }}>
                  {meta.emoji} {planLabel}{plan === 'trial' && trialDaysLeft > 0 ? ` · ${trialDaysLeft}d` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Avatar Picker */}
          {pickingAvatar && (
            <View style={{ backgroundColor: '#1A1A35', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#13132A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: !avatar ? '#6C63FF' : 'rgba(108,99,255,0.15)' }} onPress={() => { setAvatar(''); setPickingAvatar(false); }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '800' }}>{userName.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
                {AVATAR_ICONS.map(ic => (
                  <TouchableOpacity key={ic} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#13132A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: avatar === ic ? '#6C63FF' : 'rgba(108,99,255,0.15)' }} onPress={() => { setAvatar(ic); setPickingAvatar(false); }}>
                    <Text style={{ fontSize: 22 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Current Plan */}
          <Text style={{ color: '#7B7B9E', fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>{t('yourPlan')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A35', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: meta.color + '44', marginBottom: 20 }}>
            <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '800' }}>{planLabel}</Text>
              <Text style={{ color: meta.color, fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                {plan === 'free' ? t('freePlan') : plan === 'trial' ? `${trialDaysLeft}d left` : plan === 'pro' ? `${convertPrice(3.99)}${t('perMonth')}` : `${convertPrice(7.99)}${t('perMonth')}`}
              </Text>
            </View>
            {plan !== 'free' && (
              <TouchableOpacity onPress={() => resetPlan()} style={{ backgroundColor: '#FF6B6B22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '700' }}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features */}
          <Text style={{ color: '#7B7B9E', fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
          <View style={{ backgroundColor: '#1A1A35', borderRadius: 16, padding: 12, marginBottom: 16 }}>
            {featureLabels.map(f => {
              const has = planFeatures[plan]?.[f.key] ?? false;
              return (
                <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', width: 18, color: has ? '#00D4AA' : '#FF6B6B' }}>{has ? '✓' : '✕'}</Text>
                  <Text style={{ color: has ? '#E8E8F0' : '#7B7B9E', fontSize: 13, flex: 1 }}>{f.label}</Text>
                  {!has && <Text style={{ fontSize: 12 }}>🔒</Text>}
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={{ backgroundColor: '#1A1A35', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 40 }} onPress={handleClose}>
            <Text style={{ color: '#7B7B9E', fontWeight: '600' }}>{t('close')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}