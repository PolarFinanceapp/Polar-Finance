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
  { name: 'credit', label: 'Credit', active: 'card', inactive: 'card-outline' },
  { name: 'more', label: 'More', active: 'grid', inactive: 'grid-outline' },
  { name: 'settings', label: 'Settings', active: 'settings', inactive: 'settings-outline' },
] as const;

type TabDef = typeof DEFAULT_TABS[number];
const HIDDEN = ['calendar', 'goals', 'assets', 'add', 'explore', 'tax', 'budgets'];
const ORDER_KEY = 'jf_tab_order';
const N = DEFAULT_TABS.length;

function GlassTabBar({ state, navigation }: any) {
  const { theme: c } = useTheme();

  const [tabs, setTabs] = useState<TabDef[]>([...DEFAULT_TABS]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Animated X for the floating drag icon (relative to pill left)
  const floatX = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // Animated X offsets for each slot (for smooth shuffle)
  const slotOffsets = useRef(Array.from({ length: N }, () => new Animated.Value(0))).current;

  // Layout
  const pillLeft = useRef(0);
  const pillWidth = useRef(0);

  // Load saved order
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

  const tabW = () => pillWidth.current / N;

  // Clamp float X so the floating pill stays fully inside
  const FLOAT_HALF = 38; // half-width of the floating pill
  const clampFloat = (x: number) =>
    Math.max(FLOAT_HALF, Math.min(pillWidth.current - FLOAT_HALF, x));

  const idxFromX = (relX: number) =>
    Math.max(0, Math.min(N - 1, Math.floor(relX / tabW())));

  // Animate other slots to shuffle smoothly
  const animateSlots = (from: number, to: number) => {
    slotOffsets.forEach((anim, i) => {
      let target = 0;
      if (from < to) {
        // dragging right — slots between from+1..to shift left
        if (i > from && i <= to) target = -tabW();
      } else if (from > to) {
        // dragging left — slots between to..from-1 shift right
        if (i >= to && i < from) target = tabW();
      }
      Animated.spring(anim, {
        toValue: target,
        useNativeDriver: true,
        speed: 18,
        bounciness: 4,
      }).start();
    });
  };

  // Reset all slot offsets
  const resetSlots = () => {
    slotOffsets.forEach(a =>
      Animated.spring(a, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 4 }).start()
    );
  };

  // Build pan responders
  const panRefs = useRef<ReturnType<typeof PanResponder.create>[]>([]);

  const buildPanResponders = (currentTabs: TabDef[]) => {
    panRefs.current = currentTabs.map((_, index) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_e, gs) =>
          Math.abs(gs.dx) > 6 && Math.abs(gs.dy) < 16,

        onPanResponderGrant: () => {
          const startRelX = index * tabW() + tabW() / 2;
          floatX.setValue(startRelX);
          setDraggingIdx(index);
          setHoverIdx(index);
          Animated.spring(dragScale, { toValue: 1.15, useNativeDriver: true, speed: 30 }).start();
        },

        onPanResponderMove: (_e, gs) => {
          const startRelX = index * tabW() + tabW() / 2;
          const rawX = startRelX + gs.dx;
          const clamped = clampFloat(rawX);
          floatX.setValue(clamped);

          const over = idxFromX(clamped - tabW() / 2 + tabW() / 2);
          setHoverIdx(prev => {
            if (prev !== over) {
              animateSlots(index, over);
            }
            return over;
          });
        },

        onPanResponderRelease: (_e, gs) => {
          const startRelX = index * tabW() + tabW() / 2;
          const rawX = startRelX + gs.dx;
          const clamped = clampFloat(rawX);
          const dropIdx = idxFromX(clamped);

          Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
          resetSlots();

          if (dropIdx !== index) {
            setTabs(prev => {
              const next = [...prev];
              const [moved] = next.splice(index, 1);
              next.splice(dropIdx, 0, moved);
              saveOrder(next);
              return next;
            });
          }

          setDraggingIdx(null);
          setHoverIdx(null);
        },

        onPanResponderTerminate: () => {
          Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
          resetSlots();
          setDraggingIdx(null);
          setHoverIdx(null);
        },
      })
    );
  };

  // Rebuild when tabs change
  useEffect(() => {
    buildPanResponders(tabs);
  }, [tabs.map(t => t.name).join(','), pillWidth.current]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={styles.pill}
        onLayout={e => {
          pillWidth.current = e.nativeEvent.layout.width;
          buildPanResponders(tabs);
        }}
        ref={(r: any) => {
          if (r) r.measure((_fx: number, _fy: number, _w: number, _h: number, px: number) => {
            pillLeft.current = px;
          });
        }}
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
        <View style={styles.tabRow}>
          {tabs.map((tabDef, index) => {
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;
            const isDragging = draggingIdx === index;

            return (
              <Animated.View
                key={tabDef.name}
                {...(panRefs.current[index]?.panHandlers ?? {})}
                style={[
                  styles.tabItem,
                  {
                    transform: [{ translateX: slotOffsets[index] }],
                    opacity: isDragging ? 0 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (draggingIdx !== null) return;
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

        {/* Floating drag ghost — absolutely positioned, clipped to pill */}
        {draggingIdx !== null && (() => {
          const tabDef = tabs[draggingIdx];
          const isFocused = state.routes[state.index]?.name === tabDef.name;
          const tw = tabW();

          return (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floatWrapper,
                {
                  transform: [
                    {
                      translateX: Animated.subtract(
                        floatX,
                        new Animated.Value(tw / 2)
                      ),
                    },
                    { scale: dragScale },
                  ],
                  width: tw,
                  shadowColor: c.accent,
                },
              ]}
            >
              <View style={[
                styles.floatPill,
                { backgroundColor: c.accent + '28', borderColor: c.accent + '55' },
              ]}>
                <Ionicons
                  name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                  size={20}
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
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',          // clips the floating ghost to pill bounds
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
    paddingVertical: 7,
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
      <Tabs.Screen name="credit" options={{ title: 'Credit' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

      {HIDDEN.map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}