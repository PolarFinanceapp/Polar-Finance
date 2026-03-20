import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { sendBudgetAlert } from '../lib/notifications';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Budget = {
  id: string; cat: string; icon: string; limit: number; color: string;
};

export type Goal = {
  id: string; icon: string; name: string;
  saved: number; target: number; color: string;
};

export type IncomeSource = {
  id: string; label: string; amount: number;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  paydayDay: number; emoji: string;
};

type ProfileData = {
  budgets: Budget[];
  goals: Goal[];
  income: IncomeSource[];
};

type UserDataContextType = {
  budgets: Budget[];
  setBudgets: (data: Budget[], spendMap?: Record<string, number>) => void;
  goals: Goal[];
  setGoals: (data: Goal[]) => void;
  incomeSources: IncomeSource[];
  setIncomeSources: (data: IncomeSource[]) => void;
  profileLoading: boolean;
};

const UserDataContext = createContext<UserDataContextType>({
  budgets: [], setBudgets: () => { },
  goals: [], setGoals: () => { },
  incomeSources: [], setIncomeSources: () => { },
  profileLoading: true,
});

const cacheKey = (uid: string) => `jf_profile_${uid}`;

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgetsState] = useState<Budget[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [incomeSources, setIncomeState] = useState<IncomeSource[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  const uidRef = useRef<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const budgetsRef = useRef<Budget[]>([]);
  const goalsRef = useRef<Goal[]>([]);
  const incomeRef = useRef<IncomeSource[]>([]);

  // ── Load: Supabase FIRST (source of truth), cache as fallback ─────────────
  const loadData = async (uid: string) => {
    uidRef.current = uid;

    // Always fetch from Supabase first — fixes Expo Go wiping AsyncStorage
    let loadedFromSupabase = false;
    try {
      const { data, error } = await supabase
        .from('user_profile_data')
        .select('budgets, goals, income')
        .eq('user_id', uid)
        .single();

      if (!error && data) {
        const b = data.budgets ?? [];
        const g = data.goals ?? [];
        const i = data.income ?? [];

        setBudgetsState(b); budgetsRef.current = b;
        setGoalsState(g); goalsRef.current = g;
        setIncomeState(i); incomeRef.current = i;

        // Update cache after Supabase load
        await AsyncStorage.setItem(cacheKey(uid), JSON.stringify({ budgets: b, goals: g, income: i }));
        await AsyncStorage.setItem(`polar_income_${uid}`, JSON.stringify(i));
        loadedFromSupabase = true;
      } else if (error?.code === 'PGRST116') {
        // No row yet — create one
        await supabase.from('user_profile_data').insert({
          user_id: uid, budgets: [], goals: [], income: [],
          updated_at: new Date().toISOString(),
        });
        loadedFromSupabase = true;
      }
    } catch (e) {
      console.warn('UserDataContext Supabase load failed, falling back to cache:', e);
    }

    // Only use cache if Supabase failed
    if (!loadedFromSupabase) {
      try {
        const cached = await AsyncStorage.getItem(cacheKey(uid));
        if (cached) {
          const d: ProfileData = JSON.parse(cached);
          if (d.budgets) { setBudgetsState(d.budgets); budgetsRef.current = d.budgets; }
          if (d.goals) { setGoalsState(d.goals); goalsRef.current = d.goals; }
          if (d.income) { setIncomeState(d.income); incomeRef.current = d.income; }
        }
      } catch { }
    }

    setProfileLoading(false);
  };

  // ── Migrate old AsyncStorage keys into Supabase on first login ────────────
  const migrateOldKeys = async (uid: string) => {
    try {
      const [rawBudgets, rawGoals, rawIncome] = await Promise.all([
        AsyncStorage.getItem(`polar_budgets_${uid}`),
        AsyncStorage.getItem(`polar_goals_${uid}`),
        AsyncStorage.getItem(`polar_income_${uid}`),
      ]);

      const b = rawBudgets ? JSON.parse(rawBudgets) : [];
      const g = rawGoals ? JSON.parse(rawGoals) : [];
      const i = rawIncome ? JSON.parse(rawIncome) : [];

      if (b.length || g.length || i.length) {
        setBudgetsState(b); budgetsRef.current = b;
        setGoalsState(g); goalsRef.current = g;
        setIncomeState(i); incomeRef.current = i;

        await supabase.from('user_profile_data').upsert({
          user_id: uid, budgets: b, goals: g, income: i,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await AsyncStorage.setItem(cacheKey(uid), JSON.stringify({ budgets: b, goals: g, income: i }));
      }
    } catch (e) {
      console.warn('Profile migration failed:', e);
    }
  };

  const clearData = () => {
    uidRef.current = null;
    setBudgetsState([]); budgetsRef.current = [];
    setGoalsState([]); goalsRef.current = [];
    setIncomeState([]); incomeRef.current = [];
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await loadData(user.id);
        else setProfileLoading(false);
      } catch {
        setProfileLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setProfileLoading(true);
        await loadData(session.user.id);
      } else {
        clearData();
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Debounced Supabase sync ────────────────────────────────────────────────
  const syncToSupabase = (data: ProfileData) => {
    const uid = uidRef.current;
    if (!uid) return;

    AsyncStorage.setItem(cacheKey(uid), JSON.stringify(data)).catch(() => { });
    AsyncStorage.setItem(`polar_income_${uid}`, JSON.stringify(data.income)).catch(() => { });

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        await supabase.from('user_profile_data').upsert({
          user_id: uid,
          budgets: data.budgets,
          goals: data.goals,
          income: data.income,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('Profile sync failed:', e);
      }
    }, 800);
  };

  // ── Setters ────────────────────────────────────────────────────────────────
  const setBudgets = (data: Budget[], spendMap?: Record<string, number>) => {
    setBudgetsState(data);
    budgetsRef.current = data;
    syncToSupabase({ budgets: data, goals: goalsRef.current, income: incomeRef.current });

    if (spendMap) {
      data.forEach(budget => {
        const spent = spendMap[budget.cat] || 0;
        const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        if (pct >= 80) {
          sendBudgetAlert(budget.cat, spent, budget.limit, (n) => `${n}`).catch(() => { });
        }
      });
    }
  };

  const setGoals = (data: Goal[]) => {
    setGoalsState(data);
    goalsRef.current = data;
    syncToSupabase({ budgets: budgetsRef.current, goals: data, income: incomeRef.current });
  };

  const setIncomeSources = (data: IncomeSource[]) => {
    setIncomeState(data);
    incomeRef.current = data;
    syncToSupabase({ budgets: budgetsRef.current, goals: goalsRef.current, income: data });
  };

  return (
    <UserDataContext.Provider value={{
      budgets, setBudgets,
      goals, setGoals,
      incomeSources, setIncomeSources,
      profileLoading,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  return useContext(UserDataContext);
}