import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';

// ── Replace with your actual RevenueCat Google API key ──────────────────────
const REVENUECAT_ANDROID_KEY = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXX';

type RevenueCatContextType = {
  isReady: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isPro: boolean;
  isPremium: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  loading: boolean;
};

const RevenueCatContext = createContext<RevenueCatContextType>({
  isReady: false,
  customerInfo: null,
  currentOffering: null,
  isPro: false,
  isPremium: false,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  loading: false,
});

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [isReady,          setIsReady]          = useState(false);
  const [customerInfo,     setCustomerInfo]     = useState<CustomerInfo | null>(null);
  const [currentOffering,  setCurrentOffering]  = useState<PurchasesOffering | null>(null);
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    // Only initialise on Android — iOS needs a paid Apple Developer account
    if (Platform.OS !== 'android') {
      setIsReady(true);
      return;
    }

    const init = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        Purchases.configure({ apiKey: REVENUECAT_ANDROID_KEY });

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        const offerings = await Purchases.getOfferings();
        if (offerings.current) setCurrentOffering(offerings.current);

        // Listen for subscription changes in real time
        Purchases.addCustomerInfoUpdateListener(updatedInfo => {
          setCustomerInfo(updatedInfo);
        });

        setIsReady(true);
      } catch (e) {
        console.warn('RevenueCat init error:', e);
        setIsReady(true); // still mark ready so app doesn't hang
      }
    };

    init();
  }, []);

  // Pro = has 'pro' OR 'premium' entitlement
  // Premium = has 'premium' entitlement only
  const isPro     = !!customerInfo?.entitlements.active?.['pro'] || !!customerInfo?.entitlements.active?.['premium'];
  const isPremium = !!customerInfo?.entitlements.active?.['premium'];

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    setLoading(true);
    try {
      const result = await Purchases.purchasePackage(pkg);
      setCustomerInfo(result.customerInfo);
      return true;
    } catch (e: any) {
      if (!e.userCancelled) console.warn('Purchase error:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    setLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return true;
    } catch (e) {
      console.warn('Restore error:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RevenueCatContext.Provider value={{
      isReady, customerInfo, currentOffering,
      isPro, isPremium,
      purchasePackage, restorePurchases, loading,
    }}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export const useRevenueCat = () => useContext(RevenueCatContext);