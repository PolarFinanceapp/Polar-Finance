import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function GlassTabBar({ state, descriptors, navigation }: any) {
  const { theme: c } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Glass blur layer */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13,13,26,0.85)' }]} />
      )}

      {/* Top border glow */}
      <View style={[styles.topBorder, { backgroundColor: c.accent + '40' }]} />

      {/* Tab items */}
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          if (options.href === null) return null;

          const isFocused = state.index === index;
          const label = options.title ?? route.name;

          const iconMap: Record<string, [string, string]> = {
            index: ['home', 'home-outline'],
            stats: ['bar-chart', 'bar-chart-outline'],
            credit: ['card', 'card-outline'],
            more: ['grid', 'grid-outline'],
            settings: ['settings', 'settings-outline'],
          };
          const [activeIcon, inactiveIcon] = iconMap[route.name] ?? ['ellipse', 'ellipse-outline'];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              {/* Active indicator pill */}
              {isFocused && (
                <View style={[styles.activePill, { backgroundColor: c.accent + '25', borderColor: c.accent + '50' }]} />
              )}

              <View style={styles.tabButton}>
                {/* Icon with glow effect when active */}
                <View style={isFocused ? [styles.iconGlow, { shadowColor: c.accent }] : null}>
                  <Ionicons
                    name={isFocused ? activeIcon as any : inactiveIcon as any}
                    size={isFocused ? 23 : 22}
                    color={isFocused ? c.accent : c.muted + 'BB'}
                    onPress={onPress}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 48,
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});

export default function TabLayout() {
  const { theme: c } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // hide default, we use custom
      }}>

      {/* ── Visible tabs ── */}
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="credit" options={{ title: 'Credit' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

      {/* ── Hidden tabs ── */}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="assets" options={{ href: null }} />
      <Tabs.Screen name="add" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="tax" options={{ href: null }} />
      <Tabs.Screen name="budgets" options={{ href: null }} />
    </Tabs>
  );
}