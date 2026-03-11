import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  { name: 'more', label: 'More', active: 'grid', inactive: 'grid-outline' },
  { name: 'settings', label: 'Settings', active: 'settings', inactive: 'settings-outline' },
] as const;

type TabDef = { name: string; label: string; active: string; inactive: string };
const HIDDEN = ['calendar', 'goals', 'assets', 'add', 'explore', 'tax', 'budgets'];
const ORDER_KEY = 'jf_tab_order';
const N = DEFAULT_TABS.length;

function GlassTabBar({ state, navigation }: any) {
  const { theme: c } = useTheme();

  // ── Tab order (stable array of tab objects) ───────────────────────────────
  const [tabs, setTabs] = useState<TabDef[]>([...DEFAULT_TABS]);

  // ── Drag state in refs (never triggers re-renders mid-drag) ───────────────
  const dragging = useRef<number | null>(null);  // index being dragged
  const currentHover = useRef<number | null>(null);  // index hovering over
  const [dragActive, setDragActive] = useState(false);
  const [ghostTab, setGhostTab] = useState<TabDef | null>(null);

  // ── Animated values (stable, never recreated) ─────────────────────────────
  const floatX = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  // One translateX per slot position (0..N-1), always length N
  const slotX = useRef(Array.from({ length: N }, () => new Animated.Value(0))).current;

  // ── Layout refs ───────────────────────────────────────────────────────────
  const pillLeft = useRef(0);
  const pillW = useRef(0);
  const tabW = () => pillW.current / N;

  // ── Load saved order ──────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ORDER_KEY).then(raw => {
      if (!raw) return;
      try {
        const order: string[] = JSON.parse(raw);
        const reordered = order
          .map(n => DEFAULT_TABS.find(t => t.name === n))
          .filter(Boolean) as TabDef[];
        if (reordered.length === N) setTabs(reordered);
      } catch { }
    });
  }, []);

  const saveOrder = (t: TabDef[]) =>
    AsyncStorage.setItem(ORDER_KEY, JSON.stringify(t.map(x => x.name)));

  // ── Shuffle helper: animate slots based on drag from→hover ───────────────
  const updateSlots = (from: number, to: number) => {
    for (let i = 0; i < N; i++) {
      let target = 0;
      if (from < to) {
        if (i > from && i <= to) target = -tabW();
      } else if (from > to) {
        if (i < from && i >= to) target = tabW();
      }
      Animated.spring(slotX[i], {
        toValue: target,
        useNativeDriver: true,
        speed: 22,
        bounciness: 3,
      }).start();
    }
  };

  const resetSlots = () => {
    slotX.forEach(a =>
      Animated.spring(a, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 3 }).start()
    );
  };

  // ── Single PanResponder for the whole pill ────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < 18,

      onPanResponderGrant: (e) => {
        // Work out which tab was grabbed from the touch X
        const relX = e.nativeEvent.pageX - pillLeft.current;
        const idx = Math.max(0, Math.min(N - 1, Math.floor(relX / tabW())));
        dragging.current = idx;
        currentHover.current = idx;

        // Set float start position
        const startX = idx * tabW() + tabW() / 2;
        floatX.setValue(startX);

        setGhostTab(null); // will set below via setState batch
        setDragActive(true);

        // Tiny timeout so React can batch the state before animation starts
        setTimeout(() => {
          // Read tabs from closure — use a ref snapshot
          setGhostTab(tabsRef.current[idx]);
        }, 0);

        Animated.spring(dragScale, { toValue: 1.12, useNativeDriver: true, speed: 35 }).start();
      },

      onPanResponderMove: (e) => {
        if (dragging.current === null) return;

        const relX = e.nativeEvent.pageX - pillLeft.current;
        const half = tabW() / 2;
        const clamped = Math.max(half + 2, Math.min(pillW.current - half - 2, relX));
        floatX.setValue(clamped);

        const over = Math.max(0, Math.min(N - 1, Math.floor(clamped / tabW())));
        if (over !== currentHover.current) {
          updateSlots(dragging.current, over);
          currentHover.current = over;
        }
      },

      onPanResponderRelease: () => {
        const from = dragging.current;
        const to = currentHover.current;

        // Reset scale
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 35 }).start();

        // Instantly zero all slot offsets BEFORE updating tabs order
        // so the new render starts clean with no offsets applied
        slotX.forEach(a => a.setValue(0));

        setDragActive(false);
        setGhostTab(null);
        dragging.current = null;
        currentHover.current = null;

        if (from !== null && to !== null && from !== to) {
          setTabs(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            saveOrder(next);
            return next;
          });
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 35 }).start();
        slotX.forEach(a => a.setValue(0));
        setDragActive(false);
        setGhostTab(null);
        dragging.current = null;
        currentHover.current = null;
      },
    })
  ).current;

  // Keep a ref to tabs so panResponder callbacks can read latest value
  const tabsRef = useRef(tabs);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={styles.pill}
        onLayout={e => { pillW.current = e.nativeEvent.layout.width; }}
        ref={(r: any) => {
          if (r) r.measure(
            (_fx: number, _fy: number, _w: number, _h: number, px: number) => {
              pillLeft.current = px;
            }
          );
        }}
        {...panResponder.panHandlers}
      >
        {/* Frosted glass */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,35,0.35)' }]} />
        )}

        {/* Top shine */}
        <View style={[styles.topShine, { backgroundColor: c.accent + '28' }]} />

        {/* Tab slots */}
        <View style={styles.tabRow} pointerEvents={dragActive ? 'none' : 'auto'}>
          {tabs.map((tabDef, index) => {
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;
            const isDragging = dragActive && dragging.current === index;

            return (
              <Animated.View
                key={tabDef.name}
                style={[
                  styles.tabItem,
                  {
                    transform: [{ translateX: slotX[index] }],
                    opacity: isDragging ? 0 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (dragActive) return;
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
                      { minWidth: tabDef.label.length * 7 + 40 },
                    ]} />
                  )}

                  <Ionicons
                    name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                    size={20}
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

        {/* Floating ghost — absolutely positioned, clipped by pill overflow:hidden */}
        {dragActive && ghostTab && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatWrapper,
              {
                width: tabW(),
                transform: [
                  { translateX: Animated.subtract(floatX, new Animated.Value(tabW() / 2)) },
                  { scale: dragScale },
                ],
                shadowColor: c.accent,
              },
            ]}
          >
            <View style={[styles.floatPill, { backgroundColor: c.accent + '28', borderColor: c.accent + '55' }]}>
              <Ionicons
                name={(state.routes[state.index]?.name === ghostTab.name ? ghostTab.active : ghostTab.inactive) as any}
                size={20}
                color={c.accent}
              />
              <Text style={[styles.label, { color: c.accent }]}>{ghostTab.label}</Text>
            </View>
          </Animated.View>
        )}
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
    height: 64,
    borderRadius: 32,
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
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  activePill: {
    position: 'absolute',
    height: 44,
    minWidth: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  floatWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  floatPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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

      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

      <Tabs.Screen name="credit" options={{ href: null }} />
      {HIDDEN.map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}