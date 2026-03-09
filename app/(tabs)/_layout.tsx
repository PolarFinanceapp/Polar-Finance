import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { PlanProvider } from '../../context/PlanContext';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function ThemedTabs() {
  const { theme: c } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}>

      {/* ── Visible tabs ── */}
      <Tabs.Screen name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="stats"
        options={{ title: 'Stats', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="credit"
        options={{ title: 'Credit', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="more"
        options={{ title: 'More', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} /> }} />

      {/* ── Hidden tabs ── */}
      <Tabs.Screen name="calendar" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="goals" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="assets" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="add" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="explore" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="tax" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="budgets" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <PlanProvider>
        <ThemedTabs />
      </PlanProvider>
    </ThemeProvider>
  );
}