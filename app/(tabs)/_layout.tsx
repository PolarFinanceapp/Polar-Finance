import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
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
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}>
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
      <Tabs.Screen name="stats"    options={{ title: 'Stats',    tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text> }} />
      <Tabs.Screen name="credit"   options={{ title: 'Credit',   tabBarIcon: () => <Text style={{ fontSize: 22 }}>💳</Text> }} />
      <Tabs.Screen name="more"     options={{ title: 'More',     tabBarIcon: () => <Text style={{ fontSize: 22 }}>☰</Text> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text> }} />
      <Tabs.Screen name="calendar" options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="goals"    options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="assets"   options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="add"      options={{ href: null, tabBarItemStyle: { display: 'none' } }} />
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