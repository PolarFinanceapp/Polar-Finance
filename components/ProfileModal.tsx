import { useLocale } from '@/context/LocaleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Plan, planFeatures, usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const AVATAR_ICONS = [
  '🐻‍❄️','🦁','🐯','🦊','🐺','🦅','🐬','🦋',
  '🐲','🌟','💎','🔥','⚡','🎯','🚀','🌈','🍀','👑',
];

const planMeta: Record<Plan, { color: string; emoji: string }> = {
  free:    { color: '#7B7B9E', emoji: '🆓' },
  trial:   { color: '#FFD700', emoji: '👑' },
  pro:     { color: '#00D4AA', emoji: '⚡' },
  premium: { color: '#6C63FF', emoji: '👑' },
  expired: { color: '#FF6B6B', emoji: '⏰' },
};

type Props = { visible: boolean; onClose: () => void };

export default function ProfileModal({ visible, onClose }: Props) {
  const { plan, trialDaysLeft, resetPlan } = usePlan();
  const { t, convertPrice } = useLocale();
  const { theme: c } = useTheme();
  const meta = planMeta[plan] || planMeta.free;

  const [userName,      setUserName]      = useState('');
  const [userEmail,     setUserEmail]      = useState('');
  const [photoUri,      setPhotoUri]       = useState<string | null>(null);
  const [avatar,        setAvatar]         = useState('');
  const [pickingAvatar, setPickingAvatar]  = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Load user info
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      setUserEmail(user.email || '');
    });
    // Load saved photo / emoji
    AsyncStorage.multiGet(['profile_photo', 'profile_avatar']).then(pairs => {
      const photo  = pairs[0][1];
      const emoji  = pairs[1][1];
      if (photo) { setPhotoUri(photo); setAvatar(''); }
      else if (emoji) { setAvatar(emoji); setPhotoUri(null); }
    });
  }, [visible]);

  const handleClose = () => {
    setPickingAvatar(false);
    onClose();
  };

  const savePhoto = async (uri: string) => {
    setPhotoUri(uri);
    setAvatar('');
    await AsyncStorage.setItem('profile_photo', uri);
    await AsyncStorage.removeItem('profile_avatar');
    setPickingAvatar(false);
  };

  const saveAvatar = async (emoji: string) => {
    setAvatar(emoji);
    setPhotoUri(null);
    await AsyncStorage.setItem('profile_avatar', emoji);
    await AsyncStorage.removeItem('profile_photo');
    setPickingAvatar(false);
  };

  const removePhoto = async () => {
    setPhotoUri(null);
    setAvatar('');
    await AsyncStorage.multiRemove(['profile_photo', 'profile_avatar']);
    setPickingAvatar(false);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a profile picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const planLabel =
    plan === 'free'    ? t('freePlan')
    : plan === 'trial'   ? t('trialPlan')
    : plan === 'pro'     ? t('proPlan')
    : plan === 'expired' ? 'Expired'
    : t('premiumPlan');

  const featureLabels: { key: keyof typeof planFeatures['free']; label: string }[] = [
    { key: 'adFree',                label: 'Ad-free' },
    { key: 'unlimitedTransactions', label: 'Unlimited Transactions' },
    { key: 'receiptPhoto',          label: 'Receipt Scanning' },
    { key: 'advancedCharts',        label: 'Advanced Charts' },
    { key: 'calendarView',          label: 'Calendar View' },
    { key: 'themes',                label: 'All Themes' },
    { key: 'cardTracking',          label: 'Card Tracking' },
    { key: 'advancedFiltering',     label: 'Advanced Filtering' },
    { key: 'investmentTracking',    label: 'Investment Tracking' },
    { key: 'assetGraph',            label: 'Asset Graph' },
    { key: 'customTheme',           label: 'Custom Themes' },
    { key: 'doubleEntry',           label: 'Double-Entry Bookkeeping' },
  ];

  // What to show in the avatar circle
  const showPhoto  = !!photoUri;
  const showEmoji  = !photoUri && !!avatar;
  const showLetter = !photoUri && !avatar;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: '#13132A' }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(108,99,255,0.15)' }}>
          <TouchableOpacity onPress={handleClose} style={{ paddingVertical: 4, paddingRight: 12 }}>
            <Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '600' }}>← {t('close')}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#E8E8F0', fontSize: 16, fontWeight: '700' }}>Profile</Text>
          <TouchableOpacity onPress={handleClose} style={{ paddingVertical: 4, paddingLeft: 12 }}>
            <Text style={{ color: '#6C63FF', fontSize: 16, fontWeight: '600' }}>{t('done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setPickingAvatar(!pickingAvatar)}
              style={{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 2, backgroundColor: meta.color + '33', borderColor: meta.color, overflow: 'hidden', position: 'relative' }}>
              {showPhoto  && <Image source={{ uri: photoUri! }} style={{ width: 72, height: 72, borderRadius: 36 }} />}
              {showEmoji  && <Text style={{ fontSize: 32 }}>{avatar}</Text>}
              {showLetter && <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{userName.charAt(0).toUpperCase()}</Text>}
              {/* Edit badge */}
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6C63FF', borderRadius: 12, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#13132A' }}>
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

          {/* Avatar / Photo Picker */}
          {pickingAvatar && (
            <View style={{ backgroundColor: '#1A1A35', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' }}>

              {/* Photo options */}
              <Text style={{ color: '#7B7B9E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Photo</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={pickFromGallery}
                  style={{ flex: 1, backgroundColor: '#6C63FF22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#6C63FF55' }}>
                  <Text style={{ fontSize: 26, marginBottom: 4 }}>🖼️</Text>
                  <Text style={{ color: '#6C63FF', fontSize: 12, fontWeight: '700' }}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={takePhoto}
                  style={{ flex: 1, backgroundColor: '#00D4AA22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#00D4AA55' }}>
                  <Text style={{ fontSize: 26, marginBottom: 4 }}>📷</Text>
                  <Text style={{ color: '#00D4AA', fontSize: 12, fontWeight: '700' }}>Camera</Text>
                </TouchableOpacity>
                {(photoUri || avatar) && (
                  <TouchableOpacity
                    onPress={removePhoto}
                    style={{ flex: 1, backgroundColor: '#FF6B6B22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B55' }}>
                    <Text style={{ fontSize: 26, marginBottom: 4 }}>🗑️</Text>
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Emoji picker */}
              <Text style={{ color: '#7B7B9E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Or Choose Emoji</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {/* Initial letter */}
                <TouchableOpacity
                  onPress={removePhoto}
                  style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: '#13132A', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: showLetter ? '#6C63FF' : 'rgba(108,99,255,0.15)' }}>
                  <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '800' }}>{userName.charAt(0).toUpperCase()}</Text>
                </TouchableOpacity>
                {AVATAR_ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    onPress={() => saveAvatar(ic)}
                    style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: '#13132A', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: avatar === ic ? '#6C63FF' : 'rgba(108,99,255,0.15)' }}>
                    <Text style={{ fontSize: 24 }}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Current Plan */}
          <Text style={{ color: '#7B7B9E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 }}>{t('yourPlan')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A35', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: meta.color + '44', marginBottom: 20 }}>
            <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '800' }}>{planLabel}</Text>
              <Text style={{ color: meta.color, fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                {plan === 'free'    ? 'Free forever'
                : plan === 'trial'  ? `${trialDaysLeft} days left`
                : plan === 'pro'    ? `${convertPrice(3.99)}${t('perMonth')}`
                : plan === 'expired'? 'Trial ended — choose a plan'
                : `${convertPrice(7.99)}${t('perMonth')}`}
              </Text>
            </View>
            {plan !== 'free' && plan !== 'expired' && (
              <TouchableOpacity
                onPress={resetPlan}
                style={{ backgroundColor: '#FF6B6B22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '700' }}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features */}
          <Text style={{ color: '#7B7B9E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>{t('features')}</Text>
          <View style={{ backgroundColor: '#1A1A35', borderRadius: 16, padding: 12, marginBottom: 24 }}>
            {featureLabels.map((f, idx) => {
              const has = planFeatures[plan]?.[f.key] ?? false;
              return (
                <View
                  key={f.key}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: idx < featureLabels.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', width: 18, color: has ? '#00D4AA' : '#FF6B6B' }}>{has ? '✓' : '✕'}</Text>
                  <Text style={{ color: has ? '#E8E8F0' : '#7B7B9E', fontSize: 13, flex: 1 }}>{f.label}</Text>
                  {!has && <Text style={{ fontSize: 12 }}>🔒</Text>}
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleClose}
            style={{ backgroundColor: '#1A1A35', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#7B7B9E', fontWeight: '600' }}>{t('close')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </Modal>
  );
}