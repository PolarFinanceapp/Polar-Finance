import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Configure how notifications appear when app is foregrounded ───────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Permission request ────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  // Simulators don't support push but DO support local notifications
  if (!Device.isDevice && Platform.OS !== 'android') {
    // iOS simulator — local notifications work via a workaround
    // Still request so the code path is consistent
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'James Finance',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
    await Notifications.setNotificationChannelAsync('bills', {
      name: 'Bill Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });
    await Notifications.setNotificationChannelAsync('payday', {
      name: 'Payday Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4AA',
    });
    await Notifications.setNotificationChannelAsync('budget', {
      name: 'Budget Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  await AsyncStorage.setItem('notif_permission', status);
  return status === 'granted';
}

export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ── Cancel helpers ────────────────────────────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotificationsByTag(tag: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

// ── 1. Bill due reminders ─────────────────────────────────────────────────────
// Schedules a notification 1 day before each bill's nextDue date

type Bill = {
  id: string; name: string; amount: number;
  nextDue: string; // DD/MM/YYYY
  icon: string;
};

export async function scheduleBillReminders(bills: Bill[], formatAmount: (n: number) => string) {
  await cancelNotificationsByTag('bill');

  for (const bill of bills) {
    const [d, m, y] = bill.nextDue.split('/').map(Number);
    if (!d || !m || !y) continue;

    // Notify at 9am the day before
    const triggerDate = new Date(y, m - 1, d - 1, 9, 0, 0);
    if (triggerDate <= new Date()) continue; // skip past dates

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${bill.icon} Bill Due Tomorrow`,
        body: `${bill.name} — ${formatAmount(bill.amount)} is due tomorrow.`,
        data: { tag: 'bill', billId: bill.id },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'bills' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

// ── 2. Daily spending summary ─────────────────────────────────────────────────
// Fires every day at 8pm with today's spend total

export async function scheduleDailySpendingSummary(enabled: boolean) {
  await cancelNotificationsByTag('summary');
  if (!enabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Daily Spending Summary',
      body: 'Tap to see how much you\'ve spent today.',
      data: { tag: 'summary' },
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'default' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// ── 3. Budget limit alert ─────────────────────────────────────────────────────
// Called immediately when user crosses 80% or 100% of budget

export async function sendBudgetAlert(
  category: string,
  spent: number,
  limit: number,
  formatAmount: (n: number) => string,
) {
  const pct = Math.round((spent / limit) * 100);
  const isOver = spent >= limit;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isOver ? `Budget Exceeded — ${category}` : `Budget Alert — ${category}`,
      body: isOver
        ? `You've spent ${formatAmount(spent)} against a ${formatAmount(limit)} budget.`
        : `You've used ${pct}% of your ${category} budget (${formatAmount(spent)} of ${formatAmount(limit)}).`,
      data: { tag: 'budget', category },
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'budget' }),
    },
    trigger: null, // immediate
  });
}

// ── 4. Payday reminder ────────────────────────────────────────────────────────
// Schedules a notification at 9am on payday each month

type IncomeSource = {
  id: string; label: string; amount: number;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  paydayDay: number; emoji: string;
};

export async function schedulePaydayReminders(
  sources: IncomeSource[],
  formatAmount: (n: number) => string,
) {
  await cancelNotificationsByTag('payday');

  for (const src of sources) {
    if (src.frequency !== 'monthly') continue; // monthly only for now

    const day = Math.min(Math.max(src.paydayDay, 1), 28); // cap at 28 to be safe

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Payday — ${src.label}!`,
        body: `Your ${src.label} payment of ${formatAmount(src.amount)} should arrive today.`,
        data: { tag: 'payday', sourceId: src.id },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'payday' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day,
        hour: 9,
        minute: 0,
      },
    });
  }
}

// ── 5. Unusual spending alert (immediate) ─────────────────────────────────────
// Call this when a single transaction is unusually large

export async function sendUnusualSpendingAlert(
  name: string,
  amount: number,
  formatAmount: (n: number) => string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔍 Unusual Transaction',
      body: `${name} for ${formatAmount(amount)} is larger than usual.`,
      data: { tag: 'unusual' },
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'default' }),
    },
    trigger: null, // immediate
  });
}