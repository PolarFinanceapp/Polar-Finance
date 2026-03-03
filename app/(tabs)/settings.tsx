import { usePlan } from '@/context/PlanContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import Paywall from '../../components/Paywall';
import { CURRENCIES, CurrencyKey, LanguageKey, LANGUAGES, useLocale } from '../../context/LocaleContext';
import { ThemeColors, themes, useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const LAST_UPDATED = '26 February 2026';

export default function SettingsScreen() {
  const { themeKey, theme: c, setThemeKey } = useTheme();
  const { hasFeature, plan, trialDaysLeft } = usePlan();
  const { language, currency, setLanguage, setCurrency, convertPrice, t } = useLocale();
  const canUseThemes = hasFeature('themes');

  const [showPaywall,        setShowPaywall]        = useState(false);
  const [notifs,             setNotifs]             = useState<Record<string, boolean>>({ budget: true, goals: true, tips: true, investments: true, bills: true, unusual: true, summary: true });
  const [openSection,        setOpenSection]        = useState<string | null>(null);
  const [openPrivacy,        setOpenPrivacy]        = useState<number | null>(null);
  const [openTerms,          setOpenTerms]          = useState<number | null>(null);
  const [showThemePicker,    setShowThemePicker]    = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

  const notifSettings = [
    { key: 'budget',      label: t('budgetAlerts') || 'Budget Alerts',      icon: 'warning-outline'       },
    { key: 'goals',       label: t('savingGoals')  || 'Goal Milestones',    icon: 'flag-outline'          },
    { key: 'tips',        label: 'Savings Tips',                            icon: 'bulb-outline'          },
    { key: 'investments', label: t('investments')  || 'Investment Updates', icon: 'trending-up-outline'   },
    { key: 'bills',       label: 'Bill Reminders',                          icon: 'notifications-outline' },
    { key: 'unusual',     label: 'Unusual Spending',                         icon: 'search-outline'        },
    { key: 'summary',     label: 'Monthly Summary',                          icon: 'bar-chart-outline'     },
  ];

  const privacySections = [
    { title: '1. Who We Are',              body: `Polar Finance is a personal finance application.\n\nContact: contact@polarfinance.app` },
    { title: '2. What Data We Collect',    body: `• Account info: email & password (via Supabase)\n• Financial data you manually enter\n• Receipt images: processed by Claude AI — not stored\n• Basic device info for crash reporting` },
    { title: '3. How We Use Your Data',    body: `Your data is used solely to power the app. We never sell your data.` },
    { title: '4. Data Storage & Security', body: `Stored securely via Supabase on AWS with industry-standard encryption. Row Level Security ensures only you can access your data.` },
    { title: '5. Third Party Services',    body: `• Supabase — database & auth\n• Anthropic (Claude AI) — receipt scanning\n• Alpha Vantage — stock data\n• Finnhub — trading signals\n• CoinGecko — crypto prices` },
    { title: '6. Bank Linking',            body: `Not currently available. When introduced it will use Plaid (FCA-regulated).` },
    { title: '7. Your Rights (UK GDPR)',   body: `You have the right to access, correct, delete or port your data. Email contact@polarfinance.app within 30 days.` },
    { title: '8. Data Retention',          body: `Data kept while account is active. On deletion, all data removed within 30 days.` },
    { title: '9. Children',               body: `Polar Finance is not intended for anyone under 18.` },
    { title: '10. Changes',               body: `We may update this policy. Continued use constitutes acceptance.` },
    { title: '11. Contact Us',            body: `Email: contact@polarfinance.app\nICO: ico.org.uk` },
  ];

  const termsSections = [
    { title: '1. Acceptance',             body: 'By using Polar Finance, you agree to these terms.' },
    { title: '2. Not Financial Advice',   body: 'Nothing constitutes financial, investment or legal advice.' },
    { title: '3. Market Data',            body: 'Live data is for informational purposes only. Capital is at risk.' },
    { title: '4. Account Responsibility', body: 'You are responsible for your account credentials.' },
    { title: '5. Acceptable Use',         body: 'Do not misuse the app, reverse engineer it, or use it unlawfully.' },
    { title: '6. Changes',               body: 'We may update these terms. Continued use constitutes acceptance.' },
    { title: '7. Contact',               body: 'contact@polarfinance.app' },
  ];

  const toggleNotif = (key: string, value: boolean) => setNotifs(prev => ({ ...prev, [key]: value }));

  const handleLogout = () => {
    Alert.alert(t('logOut'), 'Are you sure?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logOut'), style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
    ]);
  };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review'
      : 'https://play.google.com/store/apps/details?id=com.polarfinance.app';
    Linking.openURL(url).catch(() => Alert.alert('Coming Soon', 'Available once the app launches on the store.'));
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:contact@polarfinance.app?subject=Polar Finance Feedback').catch(() =>
      Alert.alert('Feedback', 'Send your thoughts to contact@polarfinance.app')
    );
  };

  const planLabel = plan === 'free' ? t('freePlan') : plan === 'trial' ? t('trialPlan') : plan === 'pro' ? t('proPlan') : t('premiumPlan');
  const planEmoji = plan === 'free' ? '🆓' : plan === 'trial' ? '👑' : plan === 'pro' ? '⚡' : '👑';

  // Reusable row component
  const Row = ({ icon, iconColor, iconBg, label, sub, onPress, right, noBorder }: {
    icon: string; iconColor?: string; iconBg?: string; label: string; sub?: string;
    onPress?: () => void; right?: React.ReactNode; noBorder?: boolean;
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: c.border, gap: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg || c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon as any} size={18} color={iconColor || c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        {sub && <Text style={{ color: iconColor && iconColor !== c.accent ? iconColor : c.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={c.muted} />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.dark, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 60, marginBottom: 20 }}>{t('settings')}</Text>

      {/* Your Plan */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('yourPlan')}</Text>
      <TouchableOpacity
        onPress={() => (plan === 'free' || plan === 'trial' || plan === 'expired') ? setShowPaywall(true) : null}
        style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: plan === 'free' || plan === 'expired' ? c.accent + '55' : '#00D4AA44', flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>{planEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{planLabel}{plan === 'trial' && trialDaysLeft > 0 ? ` · ${trialDaysLeft}d left` : ''}</Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>
            {(plan === 'free' || plan === 'trial' || plan === 'expired') ? t('tapToUpgrade') : t('allFeaturesUnlocked')}
          </Text>
        </View>
        {(plan === 'free' || plan === 'trial' || plan === 'expired') && <Ionicons name="chevron-forward" size={18} color={c.accent} />}
      </TouchableOpacity>

      {/* Theme */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('theme')}</Text>
      {canUseThemes ? (
        <TouchableOpacity style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 }} onPress={() => setShowThemePicker(true)}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="color-palette" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{themes[themeKey].emoji} {themes[themeKey].name}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{themes[themeKey].description}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginRight: 6 }}>
            {[c.accent, c.accent2, c.dark].map((col, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col }} />)}
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setShowPaywall(true)} style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.card2, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={18} color={c.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.muted, fontSize: 14, fontWeight: '700' }}>{t('themesLocked')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('upgradeProThemes')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.accent} />
        </TouchableOpacity>
      )}

      {/* General */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('general')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>

        {/* Notifications */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }} onPress={() => toggle('notifs')}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="notifications" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('notifications')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{t('budgetAlerts')}</Text>
          </View>
          <Ionicons name={openSection === 'notifs' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </TouchableOpacity>
        {openSection === 'notifs' && (
          <View style={{ backgroundColor: c.card2 }}>
            {notifSettings.map((n, i) => (
              <View key={n.key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 20, borderBottomWidth: i < notifSettings.length - 1 ? 1 : 0, borderBottomColor: c.border, gap: 12 }}>
                <Ionicons name={n.icon as any} size={16} color={c.muted} />
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{n.label}</Text>
                <Switch value={notifs[n.key]} onValueChange={v => toggleNotif(n.key, v)} trackColor={{ false: c.card, true: c.accent }} thumbColor={notifs[n.key] ? '#fff' : c.muted} />
              </View>
            ))}
          </View>
        )}

        {/* Privacy Policy */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }} onPress={() => toggle('privacy')}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="document-text" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('privacyPolicy')}</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{LAST_UPDATED}</Text>
          </View>
          <Ionicons name={openSection === 'privacy' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </TouchableOpacity>
        {openSection === 'privacy' && (
          <View style={{ backgroundColor: c.card2, padding: 16 }}>
            {privacySections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenPrivacy(openPrivacy === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Ionicons name={openPrivacy === i ? 'chevron-up' : 'chevron-down'} size={14} color={c.muted} />
                </View>
                {openPrivacy === i && <View style={{ padding: 12, paddingTop: 0 }}><Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Terms */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.border, gap: 14 }} onPress={() => toggle('terms')}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accent + '18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="reader" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{t('termsOfService')}</Text>
          </View>
          <Ionicons name={openSection === 'terms' ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </TouchableOpacity>
        {openSection === 'terms' && (
          <View style={{ backgroundColor: c.card2, padding: 16 }}>
            {termsSections.map((s, i) => (
              <TouchableOpacity key={i} style={{ marginBottom: 8, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }} onPress={() => setOpenTerms(openTerms === i ? null : i)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{s.title}</Text>
                  <Ionicons name={openTerms === i ? 'chevron-up' : 'chevron-down'} size={14} color={c.muted} />
                </View>
                {openTerms === i && <View style={{ padding: 12, paddingTop: 0 }}><Text style={{ color: c.muted, fontSize: 12, lineHeight: 20 }}>{s.body}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Currency */}
        <Row icon="cash" label={t('currency')} sub={`${CURRENCIES[currency].flag} ${CURRENCIES[currency].name}`} onPress={() => setShowCurrencyPicker(true)} />

        {/* Privacy & Security */}
        <Row icon="shield-checkmark" label={t('privacySecurity')} sub="Face ID, passcode & permissions" onPress={() => Linking.openSettings()} />

        {/* Backup & Sync */}
        <Row
          icon="cloud" label={t('backupSync')} sub="Auto-synced via Supabase"
          onPress={() => Alert.alert(t('backupSync'), 'Your data is automatically backed up to our secure cloud.', [{ text: 'OK' }])}
          right={
            <View style={{ backgroundColor: '#00D4AA22', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#00D4AA44' }}>
              <Text style={{ color: '#00D4AA', fontSize: 10, fontWeight: '700' }}>✓ Active</Text>
            </View>
          }
        />

        {/* Language */}
        <Row icon="language" label={t('language')} sub={`${LANGUAGES[language].flag} ${LANGUAGES[language].nativeName}`} onPress={() => setShowLanguagePicker(true)} noBorder />
      </View>

      {/* About */}
      <Text style={{ color: c.muted, fontSize: 12, fontWeight: '700', letterSpacing: .8, textTransform: 'uppercase', marginBottom: 12 }}>{t('about')}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
        <Row icon="phone-portrait-outline" label={t('version')} sub="1.0.0 (Beta)" />
        <Row icon="star" label={t('rateApp')} sub={t('leaveReview')} onPress={handleRateApp} />
        <Row icon="chatbubble" label={t('feedback')} sub="contact@polarfinance.app" onPress={handleFeedback} />

        {/* Instagram */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.instagram.com/polarfinance.app?igsh=bGZpY241ZWlkbGVr').catch(() => {})}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#E1306C18', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="logo-instagram" size={18} color="#E1306C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Instagram</Text>
            <Text style={{ color: '#E1306C', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@polarfinance.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </TouchableOpacity>

        {/* TikTok */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.tiktok.com/@polarfinance.app?_r=1&_t=ZN-94NjuWv6IvW').catch(() => {})}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#69C9D018', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="logo-tiktok" size={18} color="#69C9D0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>TikTok</Text>
            <Text style={{ color: '#69C9D0', fontSize: 12, marginTop: 2, fontWeight: '600' }}>@polarfinance.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </TouchableOpacity>

        {/* X (new logo — using a custom SVG-style text since Ionicons doesn't have the new X logo) */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://x.com/polarfinanceapp?s=21&t=6MLXzsUFO0HYhevUrJI7xQ').catch(() => {})}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: c.border, gap: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '900', fontStyle: 'italic' }}>𝕏</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>X</Text>
            <Text style={{ color: c.muted, fontSize: 12, marginTop: 2, fontWeight: '600' }}>@polarfinanceapp</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View style={{ backgroundColor: '#FFD70018', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFD70044', flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Ionicons name="warning" size={18} color="#FFD700" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>{t('financialDisclaimer')}</Text>
          <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t('financialDisclaimerDesc')}</Text>
        </View>
      </View>

      {/* Log Out */}
      <TouchableOpacity style={{ backgroundColor: '#FF6B6B18', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF6B6B44', marginBottom: 24, flexDirection: 'row', justifyContent: 'center', gap: 10 }} onPress={handleLogout}>
        <Ionicons name="log-out" size={18} color="#FF6B6B" />
        <Text style={{ color: '#FF6B6B', fontSize: 15, fontWeight: '800' }}>{t('logOut')}</Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ color: c.muted, fontSize: 12 }}>Polar Finance v1.0.0 (Beta)</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>Made with ❤️ in the UK</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>© 2026 Polar Finance.</Text>
      </View>

      {/* Theme Picker */}
      <Modal visible={showThemePicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>{t('chooseTheme')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(themes) as [string, ThemeColors][]).map(([key, th]) => {
                const isActive = themeKey === key;
                return (
                  <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: isActive ? th.accent + '22' : c.card2, borderWidth: 1, borderColor: isActive ? th.accent : c.border }} onPress={() => { setThemeKey(key); setShowThemePicker(false); }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{th.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{th.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{th.description}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
                      {[th.accent, th.accent2, th.dark].map((col, i) => <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: col }} />)}
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={th.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowThemePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Picker */}
      <Modal visible={showLanguagePicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>🌍 {t('chooseLanguage')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(LANGUAGES) as [LanguageKey, any][]).map(([key, lang]) => (
                <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: language === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: language === key ? c.accent : c.border }} onPress={() => { setLanguage(key); setShowLanguagePicker(false); }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{lang.nativeName}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{lang.name}</Text>
                  </View>
                  {language === key && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowLanguagePicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Picker */}
      <Modal visible={showCurrencyPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '900', marginBottom: 20 }}>💱 {t('chooseCurrency')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(Object.entries(CURRENCIES) as [CurrencyKey, any][]).map(([key, curr]) => (
                <TouchableOpacity key={key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: currency === key ? c.accent + '22' : c.card2, borderWidth: 1, borderColor: currency === key ? c.accent : c.border }} onPress={() => { setCurrency(key); setShowCurrencyPicker(false); }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{curr.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{curr.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{key} · {curr.symbol}</Text>
                  </View>
                  {currency === key && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 }} onPress={() => setShowCurrencyPicker(false)}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </ScrollView>
  );
}