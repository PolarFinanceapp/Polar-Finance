import { supabase } from '@/lib/supabase';
import { createContext, ReactNode, useContext, useState } from 'react';

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
  cat: string; amount: number; type: string;
};

const CARD_COLORS = ['#1a1a4e','#1a2a1a','#2a1a00','#1a001a','#0a1428','#000500'];

export const CAT_ICONS: Record<string, string> = {
  'Housing':'🏠','Groceries':'🛒','Transport':'🚗','Entertainment':'🎬',
  'Health':'💊','Clothing':'👗','Utilities':'⚡','Subscriptions':'📱',
  'Food':'🍕','Income':'💼','Savings':'💰','Shopping':'📦','Other':'🎁',
  'FOOD_AND_DRINK':'🍕','SHOPS':'🛒','TRANSPORTATION':'🚗','PAYMENT':'💳',
  'TRANSFER':'💸','RECREATION':'🎬','HEALTHCARE':'💊','HOME':'🏠',
};

type FinanceContextType = {
  cards: Card[];
  setCards: (c: Card[]) => void;
  investments: Investment[];
  setInvestments: (i: Investment[]) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  bankLinked: boolean;
  setBankLinked: (b: boolean) => void;
  loadPlaidData: (userId: string) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [cards, setCards]               = useState<Card[]>([]);
  const [investments, setInvestments]   = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankLinked, setBankLinked]     = useState(false);

  const loadPlaidData = async (userId: string) => {
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
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      console.log('Plaid data:', JSON.stringify(data).slice(0, 300));

      if (data.accounts) {
        setCards(data.accounts.map((acc: any, i: number) => ({
          id: acc.account_id,
          bank: acc.name,
          type: acc.subtype,
          balance: acc.balances.current ?? 0,
          number: acc.mask || '0000',
          color: CARD_COLORS[i % CARD_COLORS.length],
          positive: (acc.balances.current ?? 0) >= 0,
        })));
      }

      if (data.transactions) {
        setTransactions(data.transactions.slice(0, 50).map((txn: any) => ({
          id: txn.transaction_id,
          icon: CAT_ICONS[txn.personal_finance_category?.primary] || '💳',
          name: txn.merchant_name || txn.name,
          cat: txn.personal_finance_category?.primary || 'Other',
          amount: -txn.amount,
          type: txn.amount > 0 ? 'expense' : 'income',
        })));
      }
    } catch (err) {
      console.error('Failed to load Plaid data:', err);
    }
  };

  return (
    <FinanceContext.Provider value={{ cards, setCards, investments, setInvestments, transactions, setTransactions, bankLinked, setBankLinked, loadPlaidData }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}