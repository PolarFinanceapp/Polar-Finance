import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const DEFAULT_TABS = [
  { name: 'index', label: 'Home', active: 'home', inactive: 'home-outline' },
  { name: 'stats', label: 'Stats', active: 'bar-chart', inactive: 'bar-chart-outline' },
  { name: 'credit', label: 'Credit', active: 'card', inactive: 'card-outline' },
  { name: 'more', label: 'More', active: 'grid', inactive: 'grid-outline' },
  { name: 'settings', label: 'Settings', active: 'settings', inactive: 'settings-outline' },
] as const;

type TabDef = typeof DEFAULT_TABS[number];
const HIDDEN = ['calendar', 'goals', 'assets', 'add', 'explore', 'tax', 'budgets'];
const ORDER_KEY = 'jf_tab_order';

function GlassTabBar({ state, navigation }: any) {
  const { theme: c } = useTheme();

  const [tabs, setTabs] = useState<TabDef[]>([...DEFAULT_TABS]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Floating drag icon position
  const dragX = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // Layout info
  const tabBarLeft = useRef(0);
  const tabBarWidth = useRef(0);
  const TAB_COUNT = tabs.length;

  // Load saved order
  React.useEffect(() => {
    AsyncStorage.getItem(ORDER_KEY).then(raw => {
      if (!raw) return;
      try {
        const order: string[] = JSON.parse(raw);
        const reordered = order
          .map(n => DEFAULT_TABS.find(t => t.name === n))
          .filter(Boolean) as TabDef[];
        if (reordered.length === DEFAULT_TABS.length) setTabs(reordered);
      } catch { }
    });
  }, []);

  const saveOrder = (t: TabDef[]) =>
    AsyncStorage.setItem(ORDER_KEY, JSON.stringify(t.map(x => x.name)));

  const tabWidth = () => tabBarWidth.current / TAB_COUNT;

  const indexFromX = (pageX: number) =>
    Math.max(0, Math.min(TAB_COUNT - 1,
      Math.floor((pageX - tabBarLeft.current) / tabWidth())
    ));

  const centerXForIndex = (i: number) =>
    tabBarLeft.current + i * tabWidth() + tabWidth() / 2;

  // Build PanResponder per tab
  const makePanResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 4 && Math.abs(gs.dy) < 20,

      onPanResponderGrant: () => {
        // Start drag — set floating icon to this tab's center
        const startX = centerXForIndex(index) - tabBarLeft.current;
        dragX.setValue(startX);
        setDraggingIndex(index);
        setHoverIndex(index);
        Animated.spring(dragScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }).start();
      },

      onPanResponderMove: (_e, gs) => {
        // Float the icon with finger
        const startX = centerXForIndex(index) - tabBarLeft.current;
        dragX.setValue(startX + gs.dx);

        // Work out which slot we're hovering over
        const pageX = tabBarLeft.current + startX + gs.dx;
        const over = indexFromX(pageX);
        setHoverIndex(over);
      },

      onPanResponderRelease: (_e, gs) => {
        const startX = centerXForIndex(index) - tabBarLeft.current;
        const pageX = tabBarLeft.current + startX + gs.dx;
        const dropIdx = indexFromX(pageX);

        // Snap icon back
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

        if (dropIdx !== index) {
          setTabs(prev => {
            const next = [...prev];
            const [moved] = next.splice(index, 1);
            next.splice(dropIdx, 0, moved);
            saveOrder(next);
            return next;
          });
        }

        setDraggingIndex(null);
        setHoverIndex(null);
      },

      onPanResponderTerminate: () => {
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
        setDraggingIndex(null);
        setHoverIndex(null);
      },
    });

  // Pre-build pan responders (stable refs)
  const panRefs = useRef(tabs.map((_, i) => makePanResponder(i)));

  // Rebuild pan responders when tabs reorder
  React.useEffect(() => {
    panRefs.current = tabs.map((_, i) => makePanResponder(i));
  }, [tabs.map(t => t.name).join(',')]);

  // Compute visual position for each tab (shuffle when dragging)
  const getVisualOrder = () => {
    if (draggingIndex === null || hoverIndex === null) return tabs.map((_, i) => i);
    const visual = tabs.map((_, i) => i);
    // Remove dragging item and insert at hover position
    const without = visual.filter(i => i !== draggingIndex);
    without.splice(hoverIndex, 0, draggingIndex);
    return without;
  };

  const visualOrder = getVisualOrder();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={styles.pill}
        onLayout={e => {
          tabBarWidth.current = e.nativeEvent.layout.width;
          // measure absolute position
        }}
        ref={(r: any) => r?.measure(
          (_fx: number, _fy: number, _w: number, _h: number, px: number) => {
            tabBarLeft.current = px;
          }
        )}
      >
        {/* Frosted glass */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,35,0.35)' }]} />
        )}

        {/* Top shine */}
        <View style={[styles.topShine, { backgroundColor: c.accent + '28' }]} />

        {/* Static slots — show all non-dragging tabs in shuffled order */}
        <View style={styles.tabRow}>
          {visualOrder.map((tabIdx, slot) => {
            const tabDef = tabs[tabIdx];
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;
            const isDragging = draggingIndex === tabIdx;

            return (
              <Animated.View
                key={tabDef.name}
                {...panRefs.current[tabIdx]?.panHandlers}
                style={[
                  styles.tabItem,
                  isDragging && { opacity: 0 }, // hide in place — shown as floating copy
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (draggingIndex !== null) return;
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(tabDef.name);
                  }}
                  activeOpacity={0.75}
                  style={styles.touchTarget}
                >
                  {isFocused && (
                    <View style={[
                      styles.activePill,
                      { backgroundColor: c.accent + '20', borderColor: c.accent + '40' },
                      { minWidth: tabDef.label.length * 7 + 46 },
                    ]} />
                  )}

                  <Ionicons
                    name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                    size={22}
                    color={isFocused ? c.accent : c.muted + 'AA'}
                  />

                  {isFocused && (
                    <Text style={[styles.label, { color: c.accent }]}>{tabDef.label}</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Floating drag icon — follows finger */}
        {draggingIndex !== null && (() => {
          const tabDef = tabs[draggingIndex];
          const isFocused = state.routes[state.index]?.name === tabDef.name;
          const tw = tabBarWidth.current / TAB_COUNT;

          return (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatingIcon,
                {
                  transform: [
                    { translateX: Animated.subtract(dragX, new Animated.Value(tw / 2)) },
                    { scale: dragScale },
                  ],
                  width: tw,
                  shadowColor: c.accent,
                },
              ]}
            >
              <View style={[styles.floatingPill, { backgroundColor: c.accent + '30', borderColor: c.accent + '60' }]}>
                <Ionicons
                  name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                  size={24}
                  color={c.accent}
                />
                <Text style={[styles.label, { color: c.accent }]}>{tabDef.label}</Text>
              </View>
            </Animated.View>
          );
        })()}
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
    borderColor: 'rgba(255,255,255,0.05)',
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
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  activePill: {
    position: 'absolute',
    height: 46,
    minWidth: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  floatingIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  floatingPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
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