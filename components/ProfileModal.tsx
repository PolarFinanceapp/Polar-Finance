import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const AVATAR_ICONS = [
  'person-circle', 'happy', 'star', 'heart', 'trophy', 'rocket',
  'diamond', 'leaf', 'flame', 'moon', 'sunny', 'planet',
  'musical-notes', 'football', 'bicycle', 'car', 'home', 'airplane',
  'briefcase', 'cafe', 'barbell', 'book', 'camera', 'game-controller',
  'paw', 'pizza', 'rose', 'headset', 'thunderstorm', 'skull',
];



type Props = { visible: boolean; onClose: () => void };

export default function ProfileModal({ visible, onClose }: Props) {
  const { theme: c } = useTheme();
  const { plan, trialDaysLeft, upgradeTo } = usePlan();

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState('?');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadProfile();
  }, [visible]);

  const loadProfile = async () => {
    try {
      // Force fresh session to get latest metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUid(user.id);
        setUserEmail(user.email || '');

        const storedName = await AsyncStorage.getItem('jf_user_name');
        const name = user.user_metadata?.full_name || storedName || user.email?.split('@')[0] || '';
        setUserName(name);
        setUserInitial((name.charAt(0) || '?').toUpperCase());

        // Photo: check AsyncStorage cache first (more reliable than metadata for large base64)
        const cached = await AsyncStorage.getItem(`jf_profile_pic_${user.id}`);
        if (cached) {
          setPhotoUri(cached);
          setSelectedIcon(null);
          return;
        }

        const metaPic = user.user_metadata?.profile_picture_uri as string | undefined;
        if (metaPic) {
          setPhotoUri(metaPic);
          await AsyncStorage.setItem(`jf_profile_pic_${user.id}`, metaPic);
          setSelectedIcon(null);
          return;
        }
      }

      const avatar = await AsyncStorage.getItem('profile_avatar');
      if (avatar) setSelectedIcon(avatar);
      setPhotoUri(null);
    } catch {
      setPhotoUri(null);
    }
  };

  const savePhotoToSupabase = async (dataUri: string) => {
    setPhotoUri(dataUri);
    setSelectedIcon(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AsyncStorage.setItem(`jf_profile_pic_${user.id}`, dataUri);
        await supabase.auth.updateUser({ data: { profile_picture_uri: dataUri } });
      }
    } catch { }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access in Settings.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await savePhotoToSupabase(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access in Settings.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await savePhotoToSupabase(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const removePhoto = async () => {
    setPhotoUri(null); setSelectedIcon(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AsyncStorage.removeItem(`jf_profile_pic_${user.id}`);
        await supabase.auth.updateUser({ data: { profile_picture_uri: null } });
      }
    } catch { }
    await AsyncStorage.multiRemove(['profile_photo', 'profile_avatar']);
  };

  const selectIcon = async (iconName: string) => {
    setSelectedIcon(iconName); setPhotoUri(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await AsyncStorage.removeItem(`jf_profile_pic_${user.id}`);
        await supabase.auth.updateUser({ data: { profile_picture_uri: null } });
      }
    } catch { }
    await AsyncStorage.setItem('profile_avatar', iconName);
  };


  const planLabel = plan === 'trial' ? `Premium Trial · ${trialDaysLeft}d left`
    : plan === 'pro' ? 'Pro Plan' : plan === 'premium' ? 'Premium Plan' : 'Free Plan';
  const planColor = plan === 'premium' ? '#FFD700' : plan === 'pro' ? '#6C63FF'
    : plan === 'trial' ? '#FF9F43' : c.muted;
  const planIcon: any = plan === 'premium' ? 'trophy' : plan === 'pro' ? 'flash'
    : plan === 'trial' ? 'time' : 'person';
  const isFree = plan === 'free' || plan === 'expired';
  const showUpgrade = isFree || plan === 'trial';

  const PROMO_CODES: Record<string, string> = {
    'JAMES-PRO': 'pro', 'JAMES-PREMIUM': 'premium',
    'JF-PRO': 'pro', 'JF-PREMIUM': 'premium',
    'TESTPRO': 'pro', 'TESTPREMIUM': 'premium',
  };

  const handlePromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) { setPromoError('Enter a code.'); return; }
    const matched = PROMO_CODES[code];
    if (matched) {
      await upgradeTo(matched as any);
      setPromoSuccess(`${matched.charAt(0).toUpperCase() + matched.slice(1)} unlocked!`);
      setPromoError(''); setPromoCode('');
    } else {
      setPromoError('Invalid code. Try JAMES-PRO or JAMES-PREMIUM.');
      setPromoSuccess('');
    }
  };

  const hasPhoto = photoUri && (
    photoUri.startsWith('data:image') || photoUri.startsWith('http') || photoUri.startsWith('file')
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, backgroundColor: c.dark }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={c.muted} />
          </TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Profile</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Avatar */}
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: c.accent + '66', overflow: 'hidden' }}>
              {hasPhoto ? (
                <Image source={{ uri: photoUri! }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : selectedIcon ? (
                <Ionicons name={selectedIcon as any} size={50} color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 42, fontWeight: '900' }}>{userInitial}</Text>
              )}
            </View>
            {!!userName && <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginTop: 14 }}>{userName}</Text>}
            {!!userEmail && <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{userEmail}</Text>}
          </View>

          <View style={{ paddingHorizontal: 20 }}>

            {/* Plan */}
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Your Plan</Text>
            <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: planColor + '44', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: planColor + '22', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={planIcon} size={22} color={planColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: planColor, fontSize: 16, fontWeight: '800' }}>{planLabel}</Text>
                <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
                  {isFree ? 'Upgrade to unlock all features'
                    : plan === 'trial' ? 'Enjoying your free trial'
                      : 'Thank you for supporting James Finance'}
                </Text>
              </View>
            </View>



            {/* Upgrade */}
            {showUpgrade && (
              <>
                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Upgrade</Text>
                <View style={{ backgroundColor: c.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#6C63FF44', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#6C63FF22', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="flash" size={22} color="#6C63FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Pro</Text>
                      <Text style={{ color: '#6C63FF', fontSize: 13, fontWeight: '700' }}>£3.99 / month</Text>
                    </View>
                  </View>
                  {['Card & investment tracking', 'Up to 5 saving goals', 'Unlimited transactions', 'Custom themes', 'No ads'].map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#6C63FF" />
                      <Text style={{ color: c.muted, fontSize: 13 }}>{f}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={{ backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Upgrade to Pro</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: c.card, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: '#FFD70055', marginBottom: 28 }}>
                  <View style={{ position: 'absolute', top: -11, right: 18, backgroundColor: '#FFD700', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ color: '#0D0D1A', fontSize: 10, fontWeight: '900' }}>BEST VALUE</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFD70022', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="trophy" size={22} color="#FFD700" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Premium</Text>
                      <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '700' }}>£7.99 / month</Text>
                    </View>
                  </View>
                  {['Everything in Pro', 'Live market signals & forecasts', 'Asset & property tracking', 'Unlimited saving goals', 'Tax helper & export'].map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#FFD700" />
                      <Text style={{ color: c.muted, fontSize: 13 }}>{f}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={{ backgroundColor: '#FFD700', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: '#0D0D1A', fontSize: 14, fontWeight: '900' }}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Promo Code</Text>
                {!showPromo ? (
                  <TouchableOpacity onPress={() => setShowPromo(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 28 }}>
                    <Ionicons name="ticket-outline" size={18} color={c.accent} />
                    <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>Have a promo code?</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.accent + '44', marginBottom: 28 }}>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                      <TextInput
                        style={{ flex: 1, backgroundColor: c.card2, borderRadius: 12, padding: 14, color: c.text, fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: promoError ? '#FF6B6B' : c.border, letterSpacing: 1 }}
                        placeholder="e.g. JAMES-PRO" placeholderTextColor={c.muted}
                        value={promoCode} onChangeText={v => { setPromoCode(v.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
                        autoCapitalize="characters" autoCorrect={false}
                      />
                      <TouchableOpacity onPress={handlePromo} disabled={!promoCode.trim()} style={{ backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center', opacity: promoCode.trim() ? 1 : 0.4 }}>
                        <Text style={{ color: '#fff', fontWeight: '800' }}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                    {!!promoError && <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>{promoError}</Text>}
                    {!!promoSuccess && <Text style={{ color: '#00D4AA', fontSize: 12, fontWeight: '700' }}>{promoSuccess}</Text>}
                  </View>
                )}
              </>
            )}

            {/* Photo */}
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Profile Photo</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              <TouchableOpacity onPress={pickFromGallery} style={{ flex: 1, backgroundColor: c.accent + '18', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.accent + '44' }}>
                <Ionicons name="image" size={22} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickFromCamera} style={{ flex: 1, backgroundColor: '#00D4AA18', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#00D4AA44' }}>
                <Ionicons name="camera" size={22} color="#00D4AA" />
                <Text style={{ color: '#00D4AA', fontSize: 12, fontWeight: '700' }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={removePhoto} style={{ flex: 1, backgroundColor: '#FF6B6B18', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                <Ionicons name="trash" size={22} color="#FF6B6B" />
                <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '700' }}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Icon grid */}
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Choose an Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {AVATAR_ICONS.map(name => {
                const active = selectedIcon === name && !hasPhoto;
                return (
                  <TouchableOpacity key={name} onPress={() => selectIcon(name)}
                    style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: active ? c.accent + '33' : c.card, justifyContent: 'center', alignItems: 'center', borderWidth: active ? 2 : 1, borderColor: active ? c.accent : c.border }}>
                    <Ionicons name={name as any} size={26} color={active ? c.accent : c.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}