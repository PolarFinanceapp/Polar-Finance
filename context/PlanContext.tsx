import React, { createContext, useContext, useState } from 'react';

export type Plan = 'free' | 'pro' | 'premium' | 'lifetime' | 'family';

export type PlanContextType = {
  plan: Plan;
  setPlan: (p: Plan) => void;
  hasFeature: (feature: keyof typeof planFeatures['free']) => boolean;
};

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
    familyView:            false,
    adFree:                false,
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
    familyView:            false,
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
    familyView:            false,
    adFree:                true,
  },
  lifetime: {
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
    familyView:            false,
    adFree:                true,
  },
  family: {
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
    familyView:            true,
    adFree:                true,
  },
};

const PlanContext = createContext<PlanContextType>({
  plan: 'free',
  setPlan: () => {},
  hasFeature: () => false,
});

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [plan, setPlan] = useState<Plan>('free');
  const hasFeature = (feature: keyof typeof planFeatures['free']) =>
    planFeatures[plan][feature];
  return (
    <PlanContext.Provider value={{ plan, setPlan, hasFeature }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => useContext(PlanContext);