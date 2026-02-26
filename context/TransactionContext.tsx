import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Transaction = {
  id: string;
  icon: string;
  name: string;
  cat: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note: string;
  recurring: boolean;
};

type TransactionContextType = {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
};

const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  addTransaction: async () => {},
  deleteTransaction: async () => {},
  loading: true,
});

const STORAGE_KEY = 'polar_transactions';

export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setTransactions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load transactions', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save whenever transactions change
  const save = async (data: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id' | 'date'>) => {
    const newTxn: Transaction = {
      ...t,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
    };
    const updated = [newTxn, ...transactions];
    setTransactions(updated);
    await save(updated);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await save(updated);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionContext);