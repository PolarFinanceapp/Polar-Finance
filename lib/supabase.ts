import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * During EAS Update's static render step the code runs in Node.js,
 * where neither SecureStore nor AsyncStorage are available.
 * A no-op adapter prevents the crash — auth simply won't persist
 * in that environment, which is fine since it's only a build step.
 */
const isSSR = typeof window === 'undefined' && Platform.OS === 'web';

const storage = isSSR
  ? {
    // No-op — safe placeholder for the SSR/Node.js build environment
    getItem: (_key: string): Promise<string | null> => Promise.resolve(null),
    setItem: (_key: string, _value: string): Promise<void> => Promise.resolve(),
    removeItem: (_key: string): Promise<void> => Promise.resolve(),
  }
  : Platform.OS === 'web'
    ? {
      // Web browser — AsyncStorage uses localStorage under the hood
      getItem: (key: string) => AsyncStorage.getItem(key),
      setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
      removeItem: (key: string) => AsyncStorage.removeItem(key),
    }
    : {
      // iOS / Android — use the secure native keychain
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});