import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
    hasPermission,
    requestNotificationPermission,
    scheduleBillReminders,
    scheduleDailySpendingSummary,
    schedulePaydayReminders,
    sendUnusualSpendingAlert,
} from '../lib/notifications';

type NotifPrefs = {
  budget:      boolean;
  goals:       boolean;
  tips:        boolean;
  investments: boolean;
  bills:       boolean;
  unusual:     boolean;
  summary:     boolean;
};

type Bill = {
  id: string; name: string; amount: number; nextDue: string; icon: string;
};

type IncomeSource = {
  id: string; label: string; amount: number;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  paydayDay: number; emoji: string;
};

type Props = {
  prefs:         NotifPrefs;
  bills:         Bill[];
  formatAmount:  (n: number) => string;
  userId?:       string;
};

export function useNotifications({ prefs, bills, formatAmount, userId }: Props) {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appState         = useRef(AppState.currentState);

  // ── Initial setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const setup = async () => {
      const granted = await requestNotificationPermission();
      if (!granted) return;

      // Schedule bill reminders
      if (prefs.bills && bills.length > 0) {
        await scheduleBillReminders(bills, formatAmount);
      }

      // Schedule daily spending summary
      await scheduleDailySpendingSummary(prefs.summary);

      // Load income sources and schedule payday reminders
      if (userId) {
        try {
          const raw = await AsyncStorage.getItem(`polar_income_${userId}`);
          if (raw) {
            const sources: IncomeSource[] = JSON.parse(raw);
            await schedulePaydayReminders(sources, formatAmount);
          }
        } catch {}
      }
    };

    setup();
  }, [prefs.bills, prefs.summary, bills.length, userId]);

  // ── Re-schedule when app comes back to foreground ───────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const granted = await hasPermission();
        if (!granted) return;
        if (prefs.bills) await scheduleBillReminders(bills, formatAmount);
        await scheduleDailySpendingSummary(prefs.summary);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [prefs.bills, prefs.summary, bills, formatAmount]);

  // ── Handle notification taps ────────────────────────────────────────────────
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      // You can use expo-router here to navigate based on tag:
      // if (data.tag === 'bill') router.push('/(tabs)');
      console.log('Notification tapped:', data);
    });
    return () => responseListener.current?.remove();
  }, []);

  // ── Unusual spending detector ───────────────────────────────────────────────
  // Call this from wherever you add a transaction
  const checkUnusualSpend = async (
    txnName: string,
    txnAmount: number,
    allAmounts: number[],
  ) => {
    if (!prefs.unusual) return;
    if (allAmounts.length < 5) return; // not enough history

    const avg = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
    const threshold = avg * 2.5; // flag if 2.5x the average

    if (Math.abs(txnAmount) > threshold) {
      await sendUnusualSpendingAlert(txnName, Math.abs(txnAmount), formatAmount);
    }
  };

  return { checkUnusualSpend };
}