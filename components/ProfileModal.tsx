import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert, Image, Modal, ScrollView,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Suitable avatar icons from Ionicons
const AVATAR_ICONS: { name: string; label: string }[] = [
  { name: 'person-circle', label: 'Person' },
  { name: 'happy', label: 'Happy' },
  { name: 'star', label: 'Star' },
  { name: 'heart', label: 'Heart' },
  { name: 'trophy', label: 'Trophy' },
  { name: 'rocket', label: 'Rocket' },
  { name: 'diamond', label: 'Diamond' },
  { name: 'leaf', label: 'Leaf' },
  { name: 'flame', label: 'Flame' },
  { name: 'moon', label: 'Moon' },
  { name: 'sunny', label: 'Sun' },
  { name: 'planet', label: 'Planet' },
  { name: 'musical-notes', label: 'Music' },
  { name: 'football', label: 'Football' },
  { name: 'bicycle', label: 'Cycling' },
  { name: 'car', label: 'Car' },
  { name: 'home', label: 'Home' },
  { name: 'airplane', label: 'Travel' },
  { name: 'briefcase', label: 'Work' },
  { name: 'cafe', label: 'Coffee' },
  { name: 'barbell', label: 'Fitness' },
  { name: 'book', label: 'Reading' },
  { name: 'camera', label: 'Camera' },
  { name: 'game-controller', label: 'Gaming' },
  { name: 'headset', label: 'Music' },
  { name: 'paw', label: 'Pets' },
  { name: 'pizza', label: 'Food' },
  { name: 'rose', label: 'Rose' },
  { name: 'thunderstorm', label: 'Storm' },
  { name: 'skull', label: 'Skull' },
];

type Props = { visible: boolean; onClose: () => void };

export default function ProfileModal({ visible, onClose }: Props) {
  const { theme: c } = useTheme();

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [plan, setPlan] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const pairs = await AsyncStorage.multiGet(['profile_photo', 'profile_avatar', 'polar_plan', 'polar_trial_end']);
      setPhotoUri(pairs[0][1] ?? null);
      setSelectedIcon(pairs[1][1] ?? null);
      setPlan(pairs[2][1] ?? 'free');
      const trialEnd = pairs[3][1];
      if (trialEnd) {
        const diff = Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000);
        setDaysLeft(Math.max(0, diff));
      }
    })();
  }, [visible]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access in Settings.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setSelectedIcon(null);
      await AsyncStorage.multiSet([['profile_photo', uri], ['profile_avatar', '']]);
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access in Settings.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setSelectedIcon(null);
      await AsyncStorage.multiSet([['profile_photo', uri], ['profile_avatar', '']]);
    }
  };

  const removePhoto = async () => {
    setPhotoUri(null);
    setSelectedIcon(null);
    await AsyncStorage.multiSet([['profile_photo', ''], ['profile_avatar', '']]);
  };

  const selectIcon = async (iconName: string) => {
    setSelectedIcon(iconName);
    setPhotoUri(null);
    await AsyncStorage.multiSet([['profile_avatar', iconName], ['profile_photo', '']]);
  };

  const handleDone = () => onClose();

  const planLabel = plan === 'trial' ? `Premium Trial · ${daysLeft}d left`
    : plan === 'pro' ? 'Pro' : plan === 'premium' ? 'Premium' : 'Free';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: c.dark }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>← Close</Text>
          </TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Profile</Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Current avatar preview */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: c.accent + '22', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.accent }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 90, height: 90, borderRadius: 45 }} />
              ) : selectedIcon ? (
                <Ionicons name={selectedIcon as any} size={48} color={c.accent} />
              ) : (
                <Ionicons name="person-circle" size={52} color={c.muted} />
              )}
            </View>
          </View>

          {/* Photo buttons */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Photo</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
              <TouchableOpacity onPress={pickFromGallery} style={{ flex: 1, backgroundColor: c.accent + '18', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.accent + '44' }}>
                <Ionicons name="image" size={24} color={c.accent} />
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pickFromCamera} style={{ flex: 1, backgroundColor: '#00D4AA18', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#00D4AA44' }}>
                <Ionicons name="camera" size={24} color="#00D4AA" />
                <Text style={{ color: '#00D4AA', fontSize: 13, fontWeight: '700' }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={removePhoto} style={{ flex: 1, backgroundColor: '#FF6B6B18', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#FF6B6B44' }}>
                <Ionicons name="trash" size={24} color="#FF6B6B" />
                <Text style={{ color: '#FF6B6B', fontSize: 13, fontWeight: '700' }}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Icon grid */}
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Or choose an icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {AVATAR_ICONS.map(({ name }) => {
                const active = selectedIcon === name && !photoUri;
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => selectIcon(name)}
                    style={{
                      width: 58, height: 58, borderRadius: 16,
                      backgroundColor: active ? c.accent + '33' : c.card,
                      justifyContent: 'center', alignItems: 'center',
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? c.accent : c.border,
                    }}>
                    <Ionicons name={name as any} size={28} color={active ? c.accent : c.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Plan */}
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Your Plan</Text>
            <View style={{ backgroundColor: c.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <Ionicons name="ribbon" size={24} color={c.accent} />
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{planLabel}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}