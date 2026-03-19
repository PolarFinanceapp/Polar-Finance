import { Session } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import PolarLogo from '../components/PolarLogo';
import { BillsProvider, useBills } from '../context/BillsContext';
import { FinanceProvider } from '../context/FinanceContext';
import { LocaleProvider, useLocale } from '../context/LocaleContext';
import { PlanProvider } from '../context/PlanContext';
import { ThemeProvider } from '../context/ThemeContext';
import { UserDataProvider } from '../context/UserDataContext';
import { requestNotificationPermission, scheduleBillReminders, scheduleDailySpendingSummary } from '../lib/notifications';
import { supabase } from '../lib/supabase';

function AppWithNotifications({ session }: { session: Session | null }) {
  const { bills } = useBills();
  const { formatAmount } = useLocale();

  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!session) return;

    const setup = async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleBillReminders(
        bills.map(b => ({ id: b.id, name: b.name, amount: b.amount, nextDue: b.nextDue, icon: b.icon })),
        formatAmount,
      );
      await scheduleDailySpendingSummary(true);
    };

    setup();

    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      console.log('Notification tapped:', data?.tag);
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [session, bills.length]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (session && !inTabsGroup && !inOnboarding) {
      router.replace('/(tabs)' as any);
    } else if (!session && !inLogin && !inOnboarding) {
      // Only redirect to login if not already there and not in onboarding
      // This prevents token refresh flickers from wiping onboarding state
      router.replace('/login' as any);
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D1A', justifyContent: 'center', alignItems: 'center' }}>
        <PolarLogo size={180} />
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LocaleProvider>
        <PlanProvider>
          <FinanceProvider>
            <UserDataProvider>
              <BillsProvider>
                <AppWithNotifications session={session} />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                </Stack>
              </BillsProvider>
            </UserDataProvider>
          </FinanceProvider>
        </PlanProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}