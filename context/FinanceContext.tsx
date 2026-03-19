import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

export type Card = {
  id: string; bank: string; type: string;
  balance: number; number: string; color: string; positive: boolean;
};

export type Investment = {
  id: string; icon: string; name: string;
  sub: string; value: number; change: number; up: boolean;
};

export type Transaction = {
  id: string; icon: string; name: string;
  cat: string; amount: number; type: string; date?: string;
};

export type CustomAsset = {
  id: string; icon: string; name: string;
  sub: string; value: number; change: number | null; category: string;
};

const CARD_COLORS = ['#1a1a4e', '#1a2a1a', '#2a1a00', '#1a001a', '#0a1428', '#000500'];

export const CAT_ICONS: Record<string, string> = {
  Housing: 'home', Groceries: 'cart', Transport: 'car', Entertainment: 'film',
  Health: 'medkit', Clothing: 'shirt', Utilities: 'flash', Subscriptions: 'phone-portrait',
  Food: 'restaurant', Income: 'briefcase', Savings: 'wallet', Shopping: 'bag', Other: 'gift',
  FOOD_AND_DRINK: 'restaurant', SHOPS: 'cart', TRANSPORTATION: 'car',
  PAYMENT: 'card', TRANSFER: 'swap-horizontal', RECREATION: 'film',
  HEALTHCARE: 'medkit', HOME: 'home',
};

const cacheKey = (uid: string) => `jf_finance_${uid}`;

type FinanceData = {
  cards: Card[];
  investments: Investment[];
  transactions: Transaction[];
  assets: CustomAsset[];
};

type FinanceContextType = {
  cards: Card[];
  setCards: (c: Card[]) => void;
  investments: Investment[];
  setInvestments: (i: Investment[]) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  customAssets: CustomAsset[];
  setCustomAssets: (a: CustomAsset[]) => void;
  bankLinked: boolean;
  setBankLinked: (b: boolean) => void;
  loadPlaidData: (userId: string) => Promise<void>;
  loading: boolean;
  syncing: boolean;
};

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [cards, setCardsState] = useState<Card[]>([]);
  const [investments, setInvestmentsState] = useState<Investment[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [customAssets, setCustomAssetsState] = useState<CustomAsset[]>([]);
  const [bankLinked, setBankLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest state in refs so syncToSupabase always has fresh values
  const cardsRef = useRef<Card[]>([]);
  const investmentsRef = useRef<Investment[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const assetsRef = useRef<CustomAsset[]>([]);

  // ── One-time migration from old polar_* AsyncStorage keys ────────────────
  const migrateOldData = async (uid: string) => {
    try {
      const migrated = await AsyncStorage.getItem(`jf_migrated_${uid}`);
      if (migrated) return;

      const [c, i, t, a] = await Promise.all([
        AsyncStorage.getItem(`polar_cards_${uid}`),
        AsyncStorage.getItem(`polar_investments_${uid}`),
        AsyncStorage.getItem(`polar_transactions_${uid}`),
        AsyncStorage.getItem(`polar_assets_${uid}`),
      ]);

      if (c || i || t || a) {
        await supabase.from('user_finance_data').upsert({
          user_id: uid,
          cards: c ? JSON.parse(c) : [],
          investments: i ? JSON.parse(i) : [],
          transactions: t ? JSON.parse(t) : [],
          assets: a ? JSON.parse(a) : [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await AsyncStorage.multiRemove([
          `polar_cards_${uid}`, `polar_investments_${uid}`,
          `polar_transactions_${uid}`, `polar_assets_${uid}`,
        ]);
      }

      await AsyncStorage.setItem(`jf_migrated_${uid}`, 'true');
    } catch (e) {
      console.warn('Migration failed:', e);
    }
  };

  // ── Import onboarding data (one-time, on first load) ─────────────────────
  const importOnboardingData = async (uid: string, currentCards: Card[], currentTxns: Transaction[]) => {
    try {
      const imported = await AsyncStorage.getItem(`jf_onboarding_imported_${uid}`);
      if (imported) return { cards: currentCards, transactions: currentTxns };

      let cards = [...currentCards];
      let transactions = [...currentTxns];

      // Import card
      const rawCard = await AsyncStorage.getItem(`jf_onboarding_card_${uid}`);
      if (rawCard) {
        const onboardingCards: Card[] = JSON.parse(rawCard);
        // Only add if no cards exist yet
        if (cards.length === 0) cards = onboardingCards;
      }

      // Import transactions (subscriptions + manual)
      const rawTxns = await AsyncStorage.getItem('jf_onboarding_subs');
      if (rawTxns) {
        const onboardingTxns: Transaction[] = JSON.parse(rawTxns);
        const existingIds = new Set(transactions.map(t => t.id));
        const newTxns = onboardingTxns.filter(t => !existingIds.has(t.id));
        transactions = [...newTxns, ...transactions];
      }

      await AsyncStorage.setItem(`jf_onboarding_imported_${uid}`, 'true');
      return { cards, transactions };
    } catch (e) {
      console.warn('Onboarding import failed:', e);
      return { cards: currentCards, transactions: currentTxns };
    }
  };

  // ── Load: cache first, then Supabase ──────────────────────────────────────
  const loadData = async (uid: string) => {
    userIdRef.current = uid;
    await migrateOldData(uid);

    // Show cached data instantly
    try {
      const cached = await AsyncStorage.getItem(cacheKey(uid));
      if (cached) {
        const d: FinanceData = JSON.parse(cached);
        if (d.cards) { setCardsState(d.cards); cardsRef.current = d.cards; }
        if (d.investments) { setInvestmentsState(d.investments); investmentsRef.current = d.investments; }
        if (d.transactions) { setTransactionsState(d.transactions); transactionsRef.current = d.transactions; }
        if (d.assets) { setCustomAssetsState(d.assets); assetsRef.current = d.assets; }
      }
    } catch { }

    // Then fetch from Supabase — source of truth
    try {
      const { data, error } = await supabase
        .from('user_finance_data')
        .select('cards, investments, transactions, assets')
        .eq('user_id', uid)
        .single();

      if (!error && data) {
        let c = data.cards ?? [];
        const i = data.investments ?? [];
        let t = data.transactions ?? [];
        const a = data.assets ?? [];

        // Merge onboarding data on first load
        const merged = await importOnboardingData(uid, c, t);
        c = merged.cards;
        t = merged.transactions;

        setCardsState(c); cardsRef.current = c;
        setInvestmentsState(i); investmentsRef.current = i;
        setTransactionsState(t); transactionsRef.current = t;
        setCustomAssetsState(a); assetsRef.current = a;

        // Sync merged data back to Supabase if anything was imported
        await AsyncStorage.setItem(cacheKey(uid), JSON.stringify({ cards: c, investments: i, transactions: t, assets: a }));
        syncToSupabase({ cards: c, investments: i, transactions: t, assets: a });
      } else {
        // No Supabase row yet — import onboarding data into fresh state
        const merged = await importOnboardingData(uid, cardsRef.current, transactionsRef.current);
        if (merged.cards !== cardsRef.current || merged.transactions !== transactionsRef.current) {
          setCardsState(merged.cards); cardsRef.current = merged.cards;
          setTransactionsState(merged.transactions); transactionsRef.current = merged.transactions;
          syncToSupabase({ cards: merged.cards, investments: investmentsRef.current, transactions: merged.transactions, assets: assetsRef.current });
        }
      }
    } catch (e) {
      console.warn('Supabase load failed, using cache:', e);
    }

    setLoading(false);
  };

  const clearData = () => {
    userIdRef.current = null;
    cardsRef.current = [];
    investmentsRef.current = [];
    transactionsRef.current = [];
    assetsRef.current = [];
    setCardsState([]);
    setInvestmentsState([]);
    setTransactionsState([]);
    setCustomAssetsState([]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await loadData(user.id);
        else setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setLoading(true);
        await loadData(session.user.id);
      } else {
        clearData();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Debounced Supabase sync ────────────────────────────────────────────────
  const syncToSupabase = (data: FinanceData) => {
    const uid = userIdRef.current;
    if (!uid) return;

    // Write to cache immediately
    AsyncStorage.setItem(cacheKey(uid), JSON.stringify(data)).catch(() => { });

    // Batch rapid changes into one Supabase write
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncing(true);
      try {
        const { error } = await supabase
          .from('user_finance_data')
          .upsert(
            {
              user_id: uid,
              cards: data.cards,
              investments: data.investments,
              transactions: data.transactions,
              assets: data.assets,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) console.warn('Supabase sync error:', error.message);
      } catch (e) {
        console.warn('Supabase sync failed:', e);
      } finally {
        setSyncing(false);
      }
    }, 800);
  };

  // ── Setters ────────────────────────────────────────────────────────────────
  const setCards = (data: Card[]) => {
    setCardsState(data);
    cardsRef.current = data;
    syncToSupabase({ cards: data, investments: investmentsRef.current, transactions: transactionsRef.current, assets: assetsRef.current });
  };

  const setInvestments = (data: Investment[]) => {
    setInvestmentsState(data);
    investmentsRef.current = data;
    syncToSupabase({ cards: cardsRef.current, investments: data, transactions: transactionsRef.current, assets: assetsRef.current });
  };

  const setTransactions = (data: Transaction[]) => {
    setTransactionsState(data);
    transactionsRef.current = data;
    syncToSupabase({ cards: cardsRef.current, investments: investmentsRef.current, transactions: data, assets: assetsRef.current });
  };

  const setCustomAssets = (data: CustomAsset[]) => {
    setCustomAssetsState(data);
    assetsRef.current = data;
    syncToSupabase({ cards: cardsRef.current, investments: investmentsRef.current, transactions: transactionsRef.current, assets: data });
  };

  // ── Plaid loader ───────────────────────────────────────────────────────────
  const loadPlaidData = async (uid: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId: uid }),
        }
      );
      const data = await res.json();

      if (data.accounts) {
        const newCards: Card[] = data.accounts.map((acc: any, i: number) => ({
          id: acc.account_id,
          bank: acc.name,
          type: acc.subtype,
          balance: acc.balances.current ?? 0,
          number: acc.mask || '0000',
          color: CARD_COLORS[i % CARD_COLORS.length],
          positive: (acc.balances.current ?? 0) >= 0,
        }));
        setCards(newCards);
      }

      if (data.transactions) {
        const newTxns: Transaction[] = data.transactions.slice(0, 50).map((txn: any) => ({
          id: txn.transaction_id,
          icon: CAT_ICONS[txn.personal_finance_category?.primary] || 'card',
          name: txn.merchant_name || txn.name,
          cat: txn.personal_finance_category?.primary || 'Other',
          amount: -txn.amount,
          type: txn.amount > 0 ? 'expense' : 'income',
          date: txn.date || new Date().toLocaleDateString('en-GB'),
        }));
        setTransactions(newTxns);
      }
    } catch (err) {
      console.error('Failed to load Plaid data:', err);
    }
  };

  return (
    <FinanceContext.Provider value={{
      cards, setCards,
      investments, setInvestments,
      transactions, setTransactions,
      customAssets, setCustomAssets,
      bankLinked, setBankLinked,
      loadPlaidData, loading, syncing,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}