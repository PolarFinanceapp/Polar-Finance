import { usePlan } from '@/context/PlanContext';
import React, { useState } from 'react';
import { Alert, Linking, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { CURRENCIES, CurrencyKey, LanguageKey, LANGUAGES, useLocale } from '../../context/LocaleContext';
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
  { title: '1. Who We Are',            body: `Polar Finance is a personal finance application ("we", "us", or "our").\n\nContact: polarfinanceinsta@gmail.com` },
  { title: '2. What Data We Collect',  body: `We collect only what's necessary:\n\n• Account information: email and password (stored securely via Supabase)\n• Financial data you manually enter\n• Receipt images: temporarily processed by Claude AI — not stored\n• Basic device information for crash reporting` },
  { title: '3. How We Use Your Data',  body: `Your data is used solely to:\n\n• Power the Polar Finance app\n• Process receipt scans via Claude AI (immediately discarded)\n• Provide live market data\n• Maintain your account\n\nWe never sell your data.` },
  { title: '4. Data Storage & Security', body: `Stored securely via Supabase on AWS with industry-standard encryption. Row Level Security ensures only you can access your data.` },
  { title: '5. Third Party Services',  body: `• Supabase — database & auth\n• Anthropic (Claude AI) — receipt scanning\n• Alpha Vantage — stock data\n• Finnhub — trading signals\n• CoinGecko — crypto prices\n• ClearScore, Experian, Credit Karma — external links only` },
  { title: '6. Bank Linking',          body: `Bank linking is not currently available. When introduced it will use Plaid (FCA-regulated). We will never store your bank login credentials.` },
  { title: '7. Your Rights (UK GDPR)', body: `You have the right to access, correct, delete, or port your data. Email polarfinanceinsta@gmail.com and we will respond within 30 days.` },
  { title: '8. Data Retention',        body: `Data is kept while your account is active. On deletion, all data is permanently removed within 30 days.` },
  { title: '9. Children',              body: `Polar Finance is not intended for anyone under 18.` },
  { title: '10. Changes',              body: `We may update this policy. Continued use after changes constitutes acceptance.` },
  { title: '11. Contact Us',           body: `Email: polarfinanceinsta@gmail.com\n\nYou may also contact the ICO at ico.org.uk.` },
];

const termsSections = [
  { title: '1. Acceptance',            body: 'By using Polar Finance, you agree to these terms.' },
  { title: '2. Not Financial Advice',  body: 'Nothing in the app constitutes financial, investment or legal advice. Always consult a qualified professional.' },
  { title: '3. Market Data',           body: 'Live market data and signals are for informational purposes only. Past performance does not indicate future results. Capital is at risk.' },
  { title: '4. Account Responsibility',body: 'You are responsible for your account credentials. Do not share your password.' },
  { title: '5. Acceptable Use',        body: 'You agree not to misuse the app, reverse engineer it, or use it for any unlawful purpose.' },
  { title: '6. Changes',               body: 'We may update these terms at any time. Continued use constitutes acceptance.' },
  { title: '7. Contact',               body: 'polarfinanceinsta@gmail.com' },
];

export default function SettingsScreen() {
  const { themeKey, theme: c, setThemeKey } = useTheme();
  const { hasFeature, plan } = usePlan();
  const { language, currency, setLanguage, setCurrency } = useLocale();
  const canUseThemes = hasFeature('customTheme') || hasFeature('themes');

  const [notifs, setNotifs]             = useState<Record<string, boolean>>(Object.fromEntries(notifSettings.map(n => [n.key, true])));
  const [openSection, setOpenSection]   = useState<string | null>(null);
  const [openPrivacy, setOpenPrivacy]   = useState<number | null>(null);
  const [openTerms, setOpenTerms]       = useState<number | null>(null);
  const [showThemePicker, setShowThemePicker]       = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  const toggleNotif = (key: string, value: boolean) => {
    setNotifs(prev => ({ ...prev, [key]: value }));
    const setting = notifSettings.find(n => n.key === key);
    if (setting) Alert.alert(value ? '🔔 On' : '🔕 Off', `${setting.label} ${value ? 'enabled' : 'disabled'}.`, [{ text: 'OK' }]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  };

  const openInstagram = () => Linking.openURL('https://www.instagram.com/polarfinance.app').catch(() => Alert.alert('Could not open Instagram'));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>Settings ⚙️</Text>

      {/* Theme */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>Theme</Text>
      {canUseThemes ? (
        <TouchableOpacity style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }} onPress={() => setShowThemePicker(true)}>
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

      {/* General */}
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
                <Switch value={notifs[n.key]} onValueChange={v => toggleNotif(n.key, v)} trackColor={{ false: c.card, true: c.accent }} thumbColor={notifs[n.key] ? '#fff' : c.muted} />
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
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>Your privacy matters. Polar Finance never sells your data.</Text>
            {privacySections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenPrivacy(openPrivacy === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{openPrivacy === i ? '▲' : '▼'}</Text>
                </View>
                {openPrivacy === i && <View style={{ padding: 12, paddingTop: 0 }}><Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text></View>}
              </TouchableOpacity>
            ))}
            <Text style={{ color: c.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>© 2026 Polar Finance. Not financial advice.</Text>
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
            {termsSections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenTerms(openTerms === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{openTerms === i ? '▲' : '▼'}</Text>
                </View>
                {openTerms === i && <View style={{ padding: 12, paddingTop: 0 }}><Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Currency, Privacy & Security, Backup, Language */}
        {[
          { icon: '💱', label: 'Currency',           sub: `${CURRENCIES[currency].flag} ${CURRENCIES[currency].name}`, onPress: () => setShowCurrencyPicker(true) },
          { icon: '🔒', label: 'Privacy & Security', sub: 'Face ID, passcode',    onPress: undefined },
          { icon: '☁️', label: 'Backup & Sync',      sub: 'iCloud sync enabled',  onPress: undefined },
          { icon: '🌍', label: 'Language',           sub: `${LANGUAGES[language].flag} ${LANGUAGES[language].nativeName}`, onPress: () => setShowLanguagePicker(true) },
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
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>Polar Finance is not a financial advisor. Market data and signals are for informational purposes only. Always do your own research. Capital is at risk.</Text>
      </View>

      {/* Log Out */}
      <TouchableOpacity style={{ backgroundColor: '#FF6B6B18', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 24 }} onPress={handleLogout}>
        <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '800' }}>🚪 Log Out</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ color: c.muted, fontSize: 12 }}>Polar Finance v1.0.0 (Beta)</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>Made with ❤️ in the UK</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>© 2026 Polar Finance. All rights reserved.</Text>
      </View>

      {/* Theme Picker Modal */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>Choose Theme</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(themes) as [string, ThemeColors][]).map(([key, t]) => {
                const isActive = themeKey === key;
                return (
                  <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isActive ? t.accent + '22' : c.card2, borderWidth: 1, borderColor: isActive ? t.accent : c.border }} onPress={() => { setThemeKey(key); setShowThemePicker(false); }}>
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

      {/* Language Picker Modal */}
      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🌍 Choose Language</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(LANGUAGES) as [LanguageKey, any][]).map(([key, lang]) => (
                <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: language === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: language === key ? c.accent : c.border }} onPress={() => { setLanguage(key); setShowLanguagePicker(false); }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{lang.nativeName}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{lang.name}</Text>
                  </View>
                  {language === key && <Text style={{ color: c.accent, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowLanguagePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal visible={showCurrencyPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>💱 Choose Currency</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(CURRENCIES) as [CurrencyKey, any][]).map(([key, curr]) => (
                <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: currency === key ? c.accent : c.border }} onPress={() => { setCurrency(key); setShowCurrencyPicker(false); }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{curr.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{curr.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{key} · {curr.symbol}</Text>
                  </View>
                  {currency === key && <Text style={{ color: c.accent, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowCurrencyPicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}