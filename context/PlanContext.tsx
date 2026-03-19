import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'free' | 'trial' | 'pro' | 'premium' | 'expired';

// ── Feature flags per plan ────────────────────────────────────────────────────
// Free:    20 transactions, 1 goal, 1 budget, basic stats, net worth, bills (3)
// Pro:     Unlimited txns, 5 goals, 5 budgets, calendar, unlimited bills,
//          search/filters, themes, ad-free, manual card/investment, bank linking
// Premium: Everything in Pro + unlimited goals/budgets, live market data,
//          asset tracking, tax helper
export const planFeatures = {
  free: {
    unlimitedTransactions: false,
    yearlyBudget: false,
    unlimitedGoals: false,
    receiptPhoto: false,
    advancedCharts: false,
    calendarView: false,
    themes: false,
    customTheme: false,
    investmentTracking: false,
    assetGraph: false,
    doubleEntry: false,
    cardTracking: false,
    bankLinking: false,
    advancedFiltering: false,
    adFree: false,
    taxHelper: false,
    liveMarkets: false,
    unlimitedBills: false,
  },
  trial: {
    unlimitedTransactions: true,
    yearlyBudget: true,
    unlimitedGoals: true,
    receiptPhoto: true,
    advancedCharts: true,
    calendarView: true,
    themes: true,
    customTheme: true,
    investmentTracking: true,
    assetGraph: true,
    doubleEntry: true,
    cardTracking: true,
    bankLinking: true,
    advancedFiltering: true,
    adFree: true,
    taxHelper: true,
    liveMarkets: true,
    unlimitedBills: true,
  },
  pro: {
    unlimitedTransactions: true,
    yearlyBudget: true,
    unlimitedGoals: false,
    receiptPhoto: false,
    advancedCharts: true,
    calendarView: true,
    themes: true,
    customTheme: true,
    investmentTracking: false,
    assetGraph: false,
    doubleEntry: false,
    cardTracking: true,
    bankLinking: true,
    advancedFiltering: true,
    adFree: true,
    taxHelper: false,
    liveMarkets: false,
    unlimitedBills: true,
  },
  premium: {
    unlimitedTransactions: true,
    yearlyBudget: true,
    unlimitedGoals: true,
    receiptPhoto: true,
    advancedCharts: true,
    calendarView: true,
    themes: true,
    customTheme: true,
    investmentTracking: true,
    assetGraph: true,
    doubleEntry: true,
    cardTracking: true,
    bankLinking: true,
    advancedFiltering: true,
    adFree: true,
    taxHelper: true,
    liveMarkets: true,
    unlimitedBills: true,
  },
  expired: {
    unlimitedTransactions: false,
    yearlyBudget: false,
    unlimitedGoals: false,
    receiptPhoto: false,
    advancedCharts: false,
    calendarView: false,
    themes: false,
    customTheme: false,
    investmentTracking: false,
    assetGraph: false,
    doubleEntry: false,
    cardTracking: false,
    bankLinking: false,
    advancedFiltering: false,
    adFree: false,
    taxHelper: false,
    liveMarkets: false,
    unlimitedBills: false,
  },
};

export type FeatureKey = keyof typeof planFeatures['trial'];

export type PlanContextType = {
  plan: Plan;
  hasFeature: (feature: FeatureKey) => boolean;
  upgradeTo: (plan: Plan) => Promise<void>;
  resetPlan: () => Promise<void>;
  trialDaysLeft: number;
  needsPaywall: boolean;
  showTrialPrompt: boolean;
  dismissTrialPrompt: () => Promise<void>;
  startTrial: () => Promise<void>;
  maxTransactions: number;
  maxGoals: number;
  maxBudgets: number;
  maxBills: number;
  maxWeeklyTransactions: number;
};

const PlanContext = createContext<PlanContextType>({
  plan: 'free',
  hasFeature: () => false,
  upgradeTo: async () => { },
  resetPlan: async () => { },
  trialDaysLeft: 0,
  needsPaywall: false,
  showTrialPrompt: false,
  dismissTrialPrompt: async () => { },
  startTrial: async () => { },
  maxTransactions: 20,
  maxGoals: 1,
  maxBudgets: 1,
  maxBills: 3,
  maxWeeklyTransactions: 20,
});

const TRIAL_DAYS = 3;

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [plan, setPlan] = useState<Plan>('free');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [savedPlan, trialStart, promptSeen] = await Promise.all([
          AsyncStorage.getItem('user_plan'),
          AsyncStorage.getItem('trial_start'),
          AsyncStorage.getItem('trial_prompt_seen'),
        ]);

        if (savedPlan === 'pro' || savedPlan === 'premium') {
          setPlan(savedPlan as Plan);
          return;
        }

        if (trialStart) {
          const start = new Date(trialStart).getTime();
          const daysLeft = Math.max(
            0,
            Math.ceil((TRIAL_DAYS * 86400000 - (Date.now() - start)) / 86400000)
          );
          if (daysLeft > 0) {
            setPlan('trial');
            setTrialDaysLeft(daysLeft);
          } else {
            setPlan('expired');
            setTrialDaysLeft(0);
            await AsyncStorage.setItem('user_plan', 'expired');
          }
          return;
        }

        if (savedPlan === 'free') {
          setPlan('free');
          return;
        }

        const onboardingDone = await AsyncStorage.getItem('onboarding_complete');
        if (onboardingDone && !promptSeen) setShowTrialPrompt(true);
        setPlan('free');
      } catch (e) {
        console.warn('PlanContext load error:', e);
        setPlan('free');
      }
    };
    load();
  }, []);

  const hasFeature = (feature: FeatureKey): boolean =>
    planFeatures[plan]?.[feature] ?? false;

  const needsPaywall = plan === 'expired';

  // Free: 20 transactions, 1 goal, 1 budget, 3 bills
  // Pro: unlimited transactions, 5 goals, 5 budgets, unlimited bills
  // Premium/Trial: unlimited everything
  // Free: 20 transactions per week. Pro/Premium/Trial: unlimited
  const maxTransactions = Infinity; // kept for compatibility
  const maxWeeklyTransactions = plan === 'free' ? 20 : Infinity;
  const maxGoals = plan === 'free' ? 1 : plan === 'pro' ? 5 : Infinity;
  const maxBudgets = plan === 'free' ? 1 : plan === 'pro' ? 5 : Infinity;
  const maxBills = plan === 'free' ? 3 : Infinity;

  const startTrial = async () => {
    await AsyncStorage.setItem('trial_start', new Date().toISOString());
    await AsyncStorage.setItem('user_plan', 'trial');
    await AsyncStorage.setItem('trial_prompt_seen', 'true');
    setPlan('trial');
    setTrialDaysLeft(TRIAL_DAYS);
    setShowTrialPrompt(false);
  };

  const dismissTrialPrompt = async () => {
    await AsyncStorage.setItem('trial_prompt_seen', 'true');
    setShowTrialPrompt(false);
  };

  const upgradeTo = async (newPlan: Plan) => {
    setPlan(newPlan);
    await AsyncStorage.setItem('user_plan', newPlan);
  };

  const resetPlan = async () => {
    setPlan('free');
    setTrialDaysLeft(0);
    await AsyncStorage.multiRemove(['user_plan', 'trial_start', 'trial_prompt_seen']);
    setShowTrialPrompt(true);
  };

  return (
    <PlanContext.Provider value={{
      plan, hasFeature, upgradeTo, resetPlan,
      trialDaysLeft, needsPaywall, showTrialPrompt,
      dismissTrialPrompt, startTrial,
      maxTransactions, maxGoals, maxBudgets, maxBills, maxWeeklyTransactions,
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);