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
  'Housing': '🏠', 'Groceries': '🛒', 'Transport': '🚗', 'Entertainment': '🎬',
  'Health': '💊', 'Clothing': '👗', 'Utilities': '⚡', 'Subscriptions': '📱',
  'Food': '🍕', 'Income': '💼', 'Savings': '💰', 'Shopping': '📦', 'Other': '🎁',
  'FOOD_AND_DRINK': '🍕', 'SHOPS': '🛒', 'TRANSPORTATION': '🚗', 'PAYMENT': '💳',
  'TRANSFER': '💸', 'RECREATION': '🎬', 'HEALTHCARE': '💊', 'HOME': '🏠',
};

const keys = (uid: string) => ({
  cards: `polar_cards_${uid}`,
  investments: `polar_investments_${uid}`,
  transactions: `polar_transactions_${uid}`,
  assets: `polar_assets_${uid}`,
});

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
};

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [cards, setCardsState] = useState<Card[]>([]);
  const [investments, setInvestmentsState] = useState<Investment[]>([]);
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [customAssets, setCustomAssetsState] = useState<CustomAsset[]>([]);
  const [bankLinked, setBankLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ── Use a ref so setters always have the latest userId immediately ──────────
  // This fixes the race condition where userId state is null when setters are
  // called before the async init() completes
  const userIdRef = useRef<string | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Set both state and ref immediately
        setUserId(user.id);
        userIdRef.current = user.id;

        const k = keys(user.id);
        const [cardsRaw, invRaw, txnRaw, assetsRaw] = await Promise.all([
          AsyncStorage.getItem(k.cards),
          AsyncStorage.getItem(k.investments),
          AsyncStorage.getItem(k.transactions),
          AsyncStorage.getItem(k.assets),
        ]);

        if (cardsRaw) setCardsState(JSON.parse(cardsRaw));
        if (invRaw) setInvestmentsState(JSON.parse(invRaw));
        if (txnRaw) setTransactionsState(JSON.parse(txnRaw));
        if (assetsRaw) setCustomAssetsState(JSON.parse(assetsRaw));
      } catch (e) {
        console.warn('FinanceContext load error:', e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Re-load data when user signs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        userIdRef.current = session.user.id;

        const k = keys(session.user.id);
        const [cardsRaw, invRaw, txnRaw, assetsRaw] = await Promise.all([
          AsyncStorage.getItem(k.cards),
          AsyncStorage.getItem(k.investments),
          AsyncStorage.getItem(k.transactions),
          AsyncStorage.getItem(k.assets),
        ]);

        if (cardsRaw) setCardsState(JSON.parse(cardsRaw));
        if (invRaw) setInvestmentsState(JSON.parse(invRaw));
        if (txnRaw) setTransactionsState(JSON.parse(txnRaw));
        if (assetsRaw) setCustomAssetsState(JSON.parse(assetsRaw));
      } else {
        // User signed out — clear everything
        setUserId(null);
        userIdRef.current = null;
        setCardsState([]);
        setInvestmentsState([]);
        setTransactionsState([]);
        setCustomAssetsState([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const save = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('FinanceContext save error:', e);
    }
  };

  // ── Setters — use ref so they always have correct userId ───────────────────
  const setCards = (data: Card[]) => {
    setCardsState(data);
    const uid = userIdRef.current;
    if (uid) save(keys(uid).cards, data);
  };

  const setInvestments = (data: Investment[]) => {
    setInvestmentsState(data);
    const uid = userIdRef.current;
    if (uid) save(keys(uid).investments, data);
  };

  const setTransactions = (data: Transaction[]) => {
    setTransactionsState(data);
    const uid = userIdRef.current;
    if (uid) save(keys(uid).transactions, data);
  };

  const setCustomAssets = (data: CustomAsset[]) => {
    setCustomAssetsState(data);
    const uid = userIdRef.current;
    if (uid) save(keys(uid).assets, data);
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
          icon: CAT_ICONS[txn.personal_finance_category?.primary] || '💳',
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
      loadPlaidData, loading,
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