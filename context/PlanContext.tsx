import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'trial' | 'pro' | 'premium' | 'expired';

export const planFeatures = {
  trial: {
    unlimitedTransactions: true,
    yearlyBudget:          true,
    unlimitedGoals:        true,
    receiptPhoto:          true,
    advancedCharts:        true,
    calendarView:          true,
    themes:                true,
    customTheme:           true,
    investmentTracking:    true,
    assetGraph:            true,
    doubleEntry:           true,
    cardTracking:          true,
    advancedFiltering:     true,
    adFree:                true,
  },
  pro: {
    unlimitedTransactions: true,
    yearlyBudget:          true,
    unlimitedGoals:        false,
    receiptPhoto:          true,
    advancedCharts:        true,
    calendarView:          true,
    themes:                true,
    customTheme:           false,
    investmentTracking:    false,
    assetGraph:            false,
    doubleEntry:           false,
    cardTracking:          true,
    advancedFiltering:     true,
    adFree:                true,
  },
  premium: {
    unlimitedTransactions: true,
    yearlyBudget:          true,
    unlimitedGoals:        true,
    receiptPhoto:          true,
    advancedCharts:        true,
    calendarView:          true,
    themes:                true,
    customTheme:           true,
    investmentTracking:    true,
    assetGraph:            true,
    doubleEntry:           true,
    cardTracking:          true,
    advancedFiltering:     true,
    adFree:                true,
  },
  expired: {
    unlimitedTransactions: false,
    yearlyBudget:          false,
    unlimitedGoals:        false,
    receiptPhoto:          false,
    advancedCharts:        false,
    calendarView:          false,
    themes:                false,
    customTheme:           false,
    investmentTracking:    false,
    assetGraph:            false,
    doubleEntry:           false,
    cardTracking:          false,
    advancedFiltering:     false,
    adFree:                false,
  },
};

export type FeatureKey = keyof typeof planFeatures['trial'];

export type PlanContextType = {
  plan: Plan;
  hasFeature: (feature: FeatureKey) => boolean;
  upgradeTo: (plan: Plan) => Promise<void>;
  resetPlan: () => Promise<void>;
  /** Days left in trial (0 if expired or not on trial) */
  trialDaysLeft: number;
  /** Whether user needs to see the paywall (expired trial, no plan) */
  needsPaywall: boolean;
  /** Whether trial prompt should show (first time user) */
  showTrialPrompt: boolean;
  /** Dismiss the trial prompt */
  dismissTrialPrompt: () => Promise<void>;
  /** Start the 3-day trial */
  startTrial: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType>({
  plan: 'expired',
  hasFeature: () => false,
  upgradeTo: async () => {},
  resetPlan: async () => {},
  trialDaysLeft: 0,
  needsPaywall: false,
  showTrialPrompt: false,
  dismissTrialPrompt: async () => {},
  startTrial: async () => {},
});

const TRIAL_DAYS = 3;

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [plan, setPlan] = useState<Plan>('expired');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [savedPlan, trialStart, promptSeen] = await Promise.all([
          AsyncStorage.getItem('user_plan'),
          AsyncStorage.getItem('trial_start'),
          AsyncStorage.getItem('trial_prompt_seen'),
        ]);

        // If they have a paid plan, use it
        if (savedPlan === 'pro' || savedPlan === 'premium') {
          setPlan(savedPlan as Plan);
          setLoaded(true);
          return;
        }

        // If trial was started, check if it's still active
        if (trialStart) {
          const start = new Date(trialStart).getTime();
          const now = Date.now();
          const elapsed = now - start;
          const daysLeft = Math.max(0, Math.ceil((TRIAL_DAYS * 86400000 - elapsed) / 86400000));

          if (daysLeft > 0) {
            setPlan('trial');
            setTrialDaysLeft(daysLeft);
          } else {
            setPlan('expired');
            setTrialDaysLeft(0);
            await AsyncStorage.setItem('user_plan', 'expired');
          }
        } else {
          // No trial started and no plan — show trial prompt
          if (!promptSeen) {
            setShowTrialPrompt(true);
          }
          setPlan('expired');
        }
      } catch (e) {
        console.warn('PlanContext load error:', e);
        setPlan('expired');
      }
      setLoaded(true);
    };
    load();
  }, []);

  const hasFeature = (feature: FeatureKey) => planFeatures[plan]?.[feature] ?? false;

  const needsPaywall = plan === 'expired';

  const startTrial = async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('trial_start', now);
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
    setPlan('expired');
    setTrialDaysLeft(0);
    await AsyncStorage.multiRemove(['user_plan', 'trial_start', 'trial_prompt_seen']);
    setShowTrialPrompt(true);
  };

  return (
    <PlanContext.Provider value={{
      plan, hasFeature, upgradeTo, resetPlan,
      trialDaysLeft, needsPaywall, showTrialPrompt,
      dismissTrialPrompt, startTrial,
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);