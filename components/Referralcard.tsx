import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const REFERRAL_KEY = 'jf_referral_code';

function generateCode(userId: string): string {
  // Short readable code from user ID
  return 'JF' + userId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default function ReferralCard() {
  const { theme: c } = useTheme();
  const [code, setCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const saved = await AsyncStorage.getItem(REFERRAL_KEY);
      const myCode = saved || generateCode(user.id);
      if (!saved) await AsyncStorage.setItem(REFERRAL_KEY, myCode);
      setCode(myCode);

      // Get referral count from Supabase
      try {
        const { count } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_code', myCode);
        setReferralCount(count || 0);
      } catch { }
    })();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I've been using James Finance to track my money — it's great. Use my code ${code} when you sign up and we both get 1 month of Premium free.\n\nDownload: https://jamesfinance.app`,
        title: 'Try James Finance',
      });
    } catch { }
  };

  if (!code) return null;

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: c.accent + '40', overflow: 'hidden' }}>
      <TouchableOpacity
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.accent + '33' }}>
          <Ionicons name="gift" size={22} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Invite friends, earn Premium</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
            {referralCount > 0 ? `${referralCount} friend${referralCount > 1 ? 's' : ''} joined` : 'You both get 1 month free'}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: c.border }}>
          {/* How it works */}
          <View style={{ flexDirection: 'row', gap: 20, marginVertical: 14, justifyContent: 'center' }}>
            {[
              { icon: 'share-social', label: 'Share code' },
              { icon: 'person-add', label: 'Friend joins' },
              { icon: 'ribbon', label: 'Both get Premium' },
            ].map((step, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.accent + '30' }}>
                  <Ionicons name={step.icon as any} size={18} color={c.accent} />
                </View>
                <Text style={{ color: c.muted, fontSize: 10, textAlign: 'center', maxWidth: 60 }}>{step.label}</Text>
              </View>
            ))}
          </View>

          {/* Code display */}
          <View style={{ backgroundColor: c.card2, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.muted, fontSize: 11, fontWeight: '600', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Your code</Text>
            <Text style={{ color: c.accent, fontSize: 26, fontWeight: '900', letterSpacing: 4 }}>{code}</Text>
          </View>

          {/* Share button */}
          <TouchableOpacity
            onPress={handleShare}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Share my code</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}