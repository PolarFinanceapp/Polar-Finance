import { usePlan } from '@/context/PlanContext';
import React, { useState } from 'react';
import { Alert, Linking, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, themes, useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const notifSettings = [
  { key: 'budget',      label: 'Budget Alerts',      sub: 'When you approach or exceed a budget',  icon: '⚠️' },
  { key: 'goals',       label: 'Goal Milestones',    sub: 'Progress updates on saving goals',       icon: '🎯' },
  { key: 'tips',        label: 'Savings Tips',       sub: 'Personalised money-saving suggestions',  icon: '💡' },
  { key: 'investments', label: 'Investment Updates', sub: 'Daily portfolio changes',                icon: '📈' },
  { key: 'bills',       label: 'Bill Reminders',     sub: 'Upcoming bill due dates',                icon: '🔔' },
  { key: 'credit',      label: 'Credit Score',       sub: 'Monthly credit score changes',           icon: '💳' },
  { key: 'unusual',     label: 'Unusual Spending',   sub: 'When spending is above your average',    icon: '🔍' },
  { key: 'summary',     label: 'Monthly Summary',    sub: 'End of month financial report',          icon: '📊' },
];

const privacySections = [
  { title: '1. Who We Are',              body: `FinTrack is a personal finance management application. We are committed to protecting your personal data.\n\nContact: privacy@polarfinance.app` },
  { title: '2. What Data We Collect',    body: `• Account information (name, email)\n• Financial data you manually enter\n• Device information\n• Anonymised usage analytics\n• Crash reports\n\nWe do NOT collect banking credentials.` },
  { title: '3. How We Use Your Data',    body: `Your data is used to:\n• Provide and improve Polar Finance\n• Personalise your experience\n• Send notifications you opted into\n• Analyse performance\n\nWe never sell your data to third parties.` },
  { title: '4. Data Storage & Security', body: `Data is stored using AES-256 encryption in transit and at rest. Our infrastructure is based in the UK and EU. Only you can access your financial information.` },
  { title: '5. Your Rights',             body: `Under UK GDPR you have the right to:\n• Access your data\n• Correct inaccurate data\n• Request deletion\n• Data portability\n• Withdraw consent\n\nContact: privacy@polarfinance.app` },
  { title: '6. Children\'s Privacy',     body: `Polar Finance is not intended for children under 13. If you believe a child has provided data, contact us immediately.` },
  { title: '7. Contact Us',              body: `Email: privacy@polarfinance.app\nAddress: Polar Finance Ltd, London, UK\n\nYou may also contact the ICO at ico.org.uk.` },
];

export default function SettingsScreen() {
  const { themeKey, theme: c, setThemeKey } = useTheme();
  const { hasFeature, plan } = usePlan();
  const canUseThemes = hasFeature('customTheme') || hasFeature('themes');

  const [notifs, setNotifs] = useState<Record<string, boolean>>(Object.fromEntries(notifSettings.map(n => [n.key, true])));
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openPrivacy, setOpenPrivacy] = useState<number | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  const toggleNotif = (key: string, value: boolean) => {
    setNotifs(prev => ({ ...prev, [key]: value }));
    // Show confirmation
    const setting = notifSettings.find(n => n.key === key);
    if (setting) {
      Alert.alert(
        value ? '🔔 Notifications On' : '🔕 Notifications Off',
        `${setting.label} notifications ${value ? 'enabled' : 'disabled'}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  };

  const openInstagram = () => {
    Linking.openURL('https://www.instagram.com/polarfinance.app').catch(() => {
      Alert.alert('Could not open Instagram');
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>Settings ⚙️</Text>

      {/* Theme Selector */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Theme</Text>
      {canUseThemes ? (
        <TouchableOpacity
          style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
          onPress={() => setShowThemePicker(true)}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>{themes[themeKey].emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{themes[themeKey].name}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{themes[themeKey].description}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginRight: 10 }}>
            {[c.accent, c.accent2, c.dark].map((col, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col }} />)}
          </View>
          <Text style={{ color: c.muted, fontSize: 16 }}>▼</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 24 }}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.muted, fontSize: 14, fontWeight: '700' }}>Themes locked</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Upgrade to Premium to unlock all themes</Text>
          </View>
        </View>
      )}

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Choose Theme</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(themes) as [string, ThemeColors][]).map(([key, t]) => {
                const isActive = themeKey === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isActive ? t.accent + '22' : c.card2, borderWidth: 1, borderColor: isActive ? t.accent : c.border }}
                    onPress={() => { setThemeKey(key); setShowThemePicker(false); }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{t.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{t.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t.description}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
                      {[t.accent, t.accent2, t.dark].map((col, i) => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: col }} />)}
                    </View>
                    {isActive && <Text style={{ color: t.accent, fontWeight: '700' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowThemePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* General Settings */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>General</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>

        {/* Notifications Dropdown */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }} onPress={() => toggle('notifs')}>
          <Text style={{ fontSize: 20, width: 28 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Notifications</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Budget alerts, reminders & tips</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 16 }}>{openSection === 'notifs' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {openSection === 'notifs' && (
          <View style={{ backgroundColor: c.card2 }}>
            {notifSettings.map((n, i) => (
              <View key={n.key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 20, borderBottomWidth: i < notifSettings.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 10 }}>
                <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{n.label}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{n.sub}</Text>
                </View>
                <Switch
                  value={notifs[n.key]}
                  onValueChange={v => toggleNotif(n.key, v)}
                  trackColor={{ false: c.card, true: c.accent }}
                  thumbColor={notifs[n.key] ? '#fff' : c.muted}
                />
              </View>
            ))}
          </View>
        )}

        {/* Privacy Policy Dropdown */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }} onPress={() => toggle('privacy')}>
          <Text style={{ fontSize: 20, width: 28 }}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Privacy Policy</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Last updated 19 Feb 2026</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 16 }}>{openSection === 'privacy' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {openSection === 'privacy' && (
          <View style={{ backgroundColor: c.card2, padding: 16 }}>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>At Polar Finance, your privacy is our priority. We never sell your data. All financial data is encrypted.</Text>
            {privacySections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenPrivacy(openPrivacy === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{openPrivacy === i ? '▲' : '▼'}</Text>
                </View>
                {openPrivacy === i && <View style={{ padding: 12, paddingTop: 0 }}><Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {[
          { icon: '💱', label: 'Currency',           sub: 'GBP — British Pound' },
          { icon: '🔒', label: 'Privacy & Security', sub: 'Face ID, passcode' },
          { icon: '☁️', label: 'Backup & Sync',      sub: 'iCloud sync enabled' },
          { icon: '🌍', label: 'Language',           sub: 'English (UK)' },
        ].map((item, i, arr) => (
          <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 12 }}>
            <Text style={{ fontSize: 20, width: 28 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* About */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>About</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
        {[
          { icon: '📋', label: 'Version',      sub: '1.0.0 (Beta)', onPress: undefined },
          { icon: '⭐', label: 'Rate the App', sub: 'Leave a review', onPress: undefined },
          { icon: '💬', label: 'Feedback',     sub: 'Send us your thoughts', onPress: undefined },
        ].map((item, i, arr) => (
          <TouchableOpacity key={i} onPress={item.onPress} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 12 }}>
            <Text style={{ fontSize: 20, width: 28 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Instagram */}
        <TouchableOpacity onPress={openInstagram} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>📸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Instagram</Text>
            <Text style={{ color: '#E1306C', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@polarfinance.app</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out */}
      <TouchableOpacity
        style={{ backgroundColor: '#FF6B6B18', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 40 }}
        onPress={handleLogout}>
        <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '800' }}>🚪 Log Out</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ color: c.muted, fontSize: 12 }}>Polar Finance v1.0.0 (Beta)</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>Made with ❤️ in London</Text>
      </View>

    </ScrollView>
  );
}