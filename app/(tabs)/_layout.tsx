import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const TABS = [
  { name: 'index', label: 'Home', active: 'home', inactive: 'home-outline' },
  { name: 'stats', label: 'Stats', active: 'bar-chart', inactive: 'bar-chart-outline' },
  { name: 'credit', label: 'Credit', active: 'card', inactive: 'card-outline' },
  { name: 'more', label: 'More', active: 'grid', inactive: 'grid-outline' },
  { name: 'settings', label: 'Settings', active: 'settings', inactive: 'settings-outline' },
] as const;

const HIDDEN = ['calendar', 'goals', 'assets', 'add', 'explore', 'tax', 'budgets'];

function GlassTabBar({ state, navigation }: any) {
  const { theme: c } = useTheme();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.pill}>
        {/* Frosted glass blur */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,35,0.93)' }]} />
        )}

        {/* Top shine */}
        <View style={[styles.topShine, { backgroundColor: c.accent + '28' }]} />

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tabDef) => {
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tabDef.name);
              }
            };

            return (
              <TouchableOpacity
                key={tabDef.name}
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.tabItem}
              >
                {isFocused && (
                  <View style={[styles.activePill, { backgroundColor: c.accent + '20', borderColor: c.accent + '40' }]} />
                )}

                <Ionicons
                  name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                  size={22}
                  color={isFocused ? c.accent : c.muted + 'AA'}
                />

                {isFocused && (
                  <Text style={[styles.label, { color: c.accent }]}>
                    {tabDef.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  pill: {
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    borderRadius: 1,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activePill: {
    position: 'absolute',
    width: 54,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="credit" options={{ title: 'Credit' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

      {HIDDEN.map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}