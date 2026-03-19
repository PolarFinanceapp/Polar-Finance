import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';

export type Bill = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  nextDue: string;
  cardId: string | null;
  icon: string;
  color: string;
  active: boolean;
};

type BillsContextType = {
  bills: Bill[];
  addBill: (b: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: string, b: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  payBill: (id: string) => Bill | null;
};

const BillsContext = createContext<BillsContextType | null>(null);

export function advanceDueDate(dateStr: string, freq: Frequency): string {
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  switch (freq) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'fortnightly': date.setDate(date.getDate() + 14); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const [bills, setBillsState] = useState<Bill[]>([]);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || 'local';
      const key = `polar_bills_${uid}`;
      setStorageKey(key);

      const raw = await AsyncStorage.getItem(key);
      const existing: Bill[] = raw ? JSON.parse(raw) : [];

      // One-time import of onboarding bills — key is deleted after so it never repeats
      const onboardingKey = `jf_onboarding_bills_${uid}`;
      const onboardingRaw = await AsyncStorage.getItem(onboardingKey);
      if (onboardingRaw) {
        try {
          const onboardingBills: Bill[] = JSON.parse(onboardingRaw);
          if (onboardingBills.length > 0) {
            const existingNames = new Set(existing.map(b => b.name.toLowerCase()));
            const toAdd = onboardingBills.filter(b => !existingNames.has(b.name.toLowerCase()));
            const merged = [...existing, ...toAdd];
            await AsyncStorage.setItem(key, JSON.stringify(merged));
            await AsyncStorage.removeItem(onboardingKey);
            setBillsState(merged);
            return;
          }
        } catch { }
        await AsyncStorage.removeItem(onboardingKey);
      }

      setBillsState(existing);
    };
    load();
  }, []);

  const save = async (data: Bill[]) => {
    setBillsState(data);
    if (storageKey) await AsyncStorage.setItem(storageKey, JSON.stringify(data));
  };

  const addBill = async (b: Omit<Bill, 'id'>) => {
    const newBill: Bill = { ...b, id: Date.now().toString() };
    await save([...bills, newBill]);
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    await save(bills.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBill = async (id: string) => {
    await save(bills.filter(b => b.id !== id));
  };

  const payBill = (id: string): Bill | null => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return null;
    const updated = { ...bill, nextDue: advanceDueDate(bill.nextDue, bill.frequency) };
    save(bills.map(b => b.id === id ? updated : b));
    return updated;
  };

  return (
    <BillsContext.Provider value={{ bills, addBill, updateBill, deleteBill, payBill }}>
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error('useBills must be used within BillsProvider');
  return ctx;
}