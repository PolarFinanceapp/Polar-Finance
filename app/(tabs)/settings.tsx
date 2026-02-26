import { usePlan } from '@/context/PlanContext';
import React, { useState } from 'react';
import { Alert, Linking, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, themes, useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const LAST_UPDATED = '26 February 2026';

const notifSettings = [
  { key: 'budget',      label: 'Budget Alerts',      sub: 'When you approach or exceed a budget',  icon: '⚠️' },
  { key: 'goals',       label: 'Goal Milestones',    sub: 'Progress updates on saving goals',       icon: '🎯' },
  { key: 'tips',        label: 'Savings Tips',       sub: 'Personalised money-saving suggestions',  icon: '💡' },
  { key: 'investments', label: 'Investment Updates', sub: 'Daily portfolio changes',                icon: '📈' },
  { key: 'bills',       label: 'Bill Reminders',     sub: 'Upcoming bill due dates',                icon: '🔔' },
  { key: 'unusual',     label: 'Unusual Spending',   sub: 'When spending is above your average',    icon: '🔍' },
  { key: 'summary',     label: 'Monthly Summary',    sub: 'End of month financial report',          icon: '📊' },
];

const privacySections = [
  {
    title: '1. Who We Are',
    body: `Polar Finance is a personal finance application developed by James McGee ("we", "us", or "our").\n\nContact: polarfinanceinsta@gmail.com`,
  },
  {
    title: '2. What Data We Collect',
    body: `We collect only what's necessary to provide the service:\n\n• Account information: email address and password (stored securely via Supabase)\n• Financial data you manually enter: transactions, card balances, investments and assets\n• Receipt images: temporarily processed by Claude AI — images are not stored after processing\n• Basic device information for crash reporting`,
  },
  {
    title: '3. How We Use Your Data',
    body: `Your data is used solely to:\n\n• Power the Polar Finance app and display your financial information\n• Process receipt scans using Claude AI (Anthropic) — image data is sent to Anthropic's API and immediately discarded\n• Provide live market data via Alpha Vantage and Finnhub\n• Maintain your account and provide customer support\n\nWe never sell your data to third parties.`,
  },
  {
    title: '4. Data Storage & Security',
    body: `Your data is stored securely using Supabase, hosted on AWS with industry-standard encryption. We use Row Level Security (RLS) to ensure only you can access your data. Passwords are never stored in plain text.`,
  },
  {
    title: '5. Third Party Services',
    body: `Polar Finance uses:\n\n• Supabase — database & authentication\n• Anthropic (Claude AI) — receipt scanning\n• Alpha Vantage — stock market data\n• Finnhub — trading signals\n• CoinGecko — cryptocurrency prices\n• ClearScore, Experian, Credit Karma — external links only, we do not share your data with these services`,
  },
  {
    title: '6. Bank Linking',
    body: `Bank account linking is currently not available in this version. When introduced, it will use Plaid, an FCA-regulated Open Banking provider. We will update this policy before that feature launches.\n\nWe will never store your bank login credentials.`,
  },
  {
    title: '7. Your Rights (UK GDPR)',
    body: `You have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your account and all data\n• Object to processing of your data\n• Data portability\n\nTo exercise any right, email polarfinanceinsta@gmail.com and we will respond within 30 days.`,
  },
  {
    title: '8. Data Retention',
    body: `We retain your data for as long as your account is active. If you delete your account, all personal data and financial records will be permanently deleted within 30 days.`,
  },
  {
    title: '9. Children',
    body: `Polar Finance is not intended for anyone under 18. We do not knowingly collect data from children. If you believe a child has provided data, please contact us immediately.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this policy from time to time. We will notify you of significant changes via the app or email. Continued use after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact Us',
    body: `Email: polarfinanceinsta@gmail.com\nDeveloper: James McGee\nLocation: Newcastle upon Tyne, United Kingdom\n\nYou may also contact the ICO at ico.org.uk if you have concerns about how we handle your data.`,
  },
];

export default function SettingsScreen() {
  const { themeKey, theme: c, setThemeKey } = useTheme();
  const { hasFeature, plan } = usePlan();
  const canUseThemes = hasFeature('customTheme') || hasFeature('themes');

  const [notifs, setNotifs]           = useState<Record<string, boolean>>(Object.fromEntries(notifSettings.map(n => [n.key, true])));
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openPrivacy, setOpenPrivacy] = useState<number | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  const toggleNotif = (key: string, value: boolean) => {
    setNotifs(prev => ({ ...prev, [key]: value }));
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

        {/* Notifications */}
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

        {/* Privacy Policy */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }} onPress={() => toggle('privacy')}>
          <Text style={{ fontSize: 20, width: 28 }}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Privacy Policy</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Last updated {LAST_UPDATED}</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 16 }}>{openSection === 'privacy' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {openSection === 'privacy' && (
          <View style={{ backgroundColor: c.card2, padding: 16 }}>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              Your privacy matters. Polar Finance never sells your data. All financial data is encrypted and only accessible by you.
            </Text>
            {privacySections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenPrivacy(openPrivacy === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{openPrivacy === i ? '▲' : '▼'}</Text>
                </View>
                {openPrivacy === i && (
                  <View style={{ padding: 12, paddingTop: 0 }}>
                    <Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              © 2026 Polar Finance. Not financial advice.
            </Text>
          </View>
        )}

        {/* Terms of Service */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 }} onPress={() => toggle('terms')}>
          <Text style={{ fontSize: 20, width: 28 }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Terms of Service</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>App usage terms and conditions</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 16 }}>{openSection === 'terms' ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {openSection === 'terms' && (
          <View style={{ backgroundColor: c.card2, padding: 16 }}>
            {[
              { title: '1. Acceptance', body: 'By using Polar Finance, you agree to these terms. If you do not agree, please stop using the app.' },
              { title: '2. Not Financial Advice', body: 'Polar Finance provides tools to track and visualise your finances. Nothing in the app constitutes financial, investment or legal advice. Always consult a qualified professional.' },
              { title: '3. Market Data', body: 'Live market data, trading signals and forecasts are provided for informational purposes only. Past performance does not indicate future results. Capital is at risk.' },
              { title: '4. Account Responsibility', body: 'You are responsible for maintaining the security of your account credentials. Do not share your password with anyone.' },
              { title: '5. Acceptable Use', body: 'You agree not to misuse the app, attempt to reverse engineer it, or use it for any unlawful purpose.' },
              { title: '6. Changes', body: 'We may update these terms at any time. Continued use of the app after changes constitutes acceptance.' },
              { title: '7. Contact', body: 'polarfinanceinsta@gmail.com' },
            ].map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenPrivacy(openPrivacy === i + 100 ? null : i + 100)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{openPrivacy === i + 100 ? '▲' : '▼'}</Text>
                </View>
                {openPrivacy === i + 100 && (
                  <View style={{ padding: 12, paddingTop: 0 }}>
                    <Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text>
                  </View>
                )}
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
          { icon: '📋', label: 'Version',      sub: '1.0.0 (Beta)'         },
          { icon: '⭐', label: 'Rate the App', sub: 'Leave a review'        },
          { icon: '💬', label: 'Feedback',     sub: 'Send us your thoughts' },
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

        <TouchableOpacity onPress={openInstagram} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 12 }}>
          <Text style={{ fontSize: 20, width: 28 }}>📸</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Instagram</Text>
            <Text style={{ color: '#E1306C', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@polarfinance.app</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={{ backgroundColor: '#FFD70018', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044' }}>
        <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>⚠️ Financial Disclaimer</Text>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Polar Finance is not a financial advisor. Market data, trading signals and investment information are for informational purposes only. Always do your own research. Capital is at risk.
        </Text>
      </View>

      {/* Log Out */}
      <TouchableOpacity
        style={{ backgroundColor: '#FF6B6B18', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 24 }}
        onPress={handleLogout}>
        <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '800' }}>🚪 Log Out</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ color: c.muted, fontSize: 12 }}>Polar Finance v1.0.0 (Beta)</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>Made with ❤️ in Newcastle</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>© 2026 James McGee. All rights reserved.</Text>
      </View>

    </ScrollView>
  );
}