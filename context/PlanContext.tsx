import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'free' | 'trial' | 'pro' | 'premium' | 'expired';

export const planFeatures = {
  free: {
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
  trialDaysLeft: number;
  needsPaywall: boolean;
  showTrialPrompt: boolean;
  dismissTrialPrompt: () => Promise<void>;
  startTrial: () => Promise<void>;
  maxTransactions: number;
  maxGoals: number;
};

const PlanContext = createContext<PlanContextType>({
  plan: 'free',
  hasFeature: () => false,
  upgradeTo: async () => {},
  resetPlan: async () => {},
  trialDaysLeft: 0,
  needsPaywall: false,
  showTrialPrompt: false,
  dismissTrialPrompt: async () => {},
  startTrial: async () => {},
  maxTransactions: 10,
  maxGoals: 1,
});

const TRIAL_DAYS = 3;

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [plan, setPlan]                     = useState<Plan>('free');
  const [trialDaysLeft, setTrialDaysLeft]   = useState(0);
  const [showTrialPrompt, setShowTrialPrompt] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [savedPlan, trialStart, promptSeen] = await Promise.all([
          AsyncStorage.getItem('user_plan'),
          AsyncStorage.getItem('trial_start'),
          AsyncStorage.getItem('trial_prompt_seen'),
        ]);

        // Paid plan — use it immediately
        if (savedPlan === 'pro' || savedPlan === 'premium') {
          setPlan(savedPlan as Plan);
          return;
        }

        // Trial started — check if still active
        if (trialStart) {
          const start    = new Date(trialStart).getTime();
          const daysLeft = Math.max(
            0,
            Math.ceil((TRIAL_DAYS * 86400000 - (Date.now() - start)) / 86400000)
          );
          if (daysLeft > 0) {
            setPlan('trial');
            setTrialDaysLeft(daysLeft);
          } else {
            // Trial expired
            setPlan('expired');
            setTrialDaysLeft(0);
            await AsyncStorage.setItem('user_plan', 'expired');
          }
          return;
        }

        // Brand new user — show trial prompt once
        if (!promptSeen) setShowTrialPrompt(true);
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

  // Free: 1 goal, can add (canAddGoal = goals.length < 1, so first goal is allowed)
  // Pro: up to 5 goals
  // Premium/Trial: unlimited
  const maxTransactions = plan === 'free' ? 10 : Infinity;
  const maxGoals        = plan === 'free' ? 1
                        : plan === 'pro'  ? 5
                        : Infinity;

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
    // User stays on free plan
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
      maxTransactions, maxGoals,
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);