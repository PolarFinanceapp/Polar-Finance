import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const tabBarRef = useRef<View>(null);
  const tabWidthRef = useRef(0);
  const tabBarXRef = useRef(0);
  const dragStartIndex = useRef<number | null>(null);

  // Load saved order on mount
  React.useEffect(() => {
    AsyncStorage.getItem(ORDER_KEY).then(raw => {
      if (!raw) return;
      try {
        const order: string[] = JSON.parse(raw);
        const reordered = order
          .map(name => DEFAULT_TABS.find(t => t.name === name))
          .filter(Boolean) as TabDef[];
        if (reordered.length === DEFAULT_TABS.length) setTabs(reordered);
      } catch { }
    });
  }, []);

  const saveOrder = (newTabs: TabDef[]) => {
    AsyncStorage.setItem(ORDER_KEY, JSON.stringify(newTabs.map(t => t.name)));
  };

  const getIndexFromX = (x: number): number => {
    const idx = Math.floor((x - tabBarXRef.current) / tabWidthRef.current);
    return Math.max(0, Math.min(tabs.length - 1, idx));
  };

  const onTabBarLayout = (e: any) => {
    const { width, x } = e.nativeEvent.layout;
    tabWidthRef.current = width / tabs.length;
    tabBarRef.current?.measure((_fx, _fy, _w, _h, px) => {
      tabBarXRef.current = px;
    });
  };

  const handlePressIn = (index: number) => {
    dragStartIndex.current = index;
  };

  const handleLongPress = (index: number) => {
    setDraggingIndex(index);
  };

  const handleMove = (e: any, index: number) => {
    if (draggingIndex === null) return;
    const x = e.nativeEvent.pageX;
    const over = getIndexFromX(x);
    if (over !== dragOverIndex) setDragOverIndex(over);
  };

  const handleRelease = () => {
    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      const newTabs = [...tabs];
      const [moved] = newTabs.splice(draggingIndex, 1);
      newTabs.splice(dragOverIndex, 0, moved);
      setTabs(newTabs);
      saveOrder(newTabs);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStartIndex.current = null;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.pill} ref={tabBarRef} onLayout={onTabBarLayout}>
        {/* Frosted glass */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,35,0.35)' }]} />
        )}

        {/* Top shine */}
        <View style={[styles.topShine, { backgroundColor: c.accent + '28' }]} />

        {/* Drag hint when dragging */}
        {draggingIndex !== null && (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 33, borderWidth: 1.5, borderColor: c.accent + '60', borderStyle: 'dashed' }]} pointerEvents="none" />
        )}

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          {tabs.map((tabDef, index) => {
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;
            const isDragging = draggingIndex === index;
            const isDragTarget = dragOverIndex === index && draggingIndex !== null && draggingIndex !== index;

            const onPress = () => {
              if (draggingIndex !== null) return;
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
              <View
                key={tabDef.name}
                onMoveShouldSetResponder={() => draggingIndex !== null}
                onResponderMove={(e: any) => handleMove(e, index)}
                onResponderRelease={handleRelease}
                style={[
                  styles.tabItem,
                  isDragging && { opacity: 0.5, transform: [{ scale: 0.9 }] },
                  isDragTarget && { transform: [{ scale: 1.05 }] },
                ]}
              >
                <TouchableOpacity
                  onPress={onPress}
                  onPressIn={() => handlePressIn(index)}
                  onLongPress={() => handleLongPress(index)}
                  delayLongPress={300}
                  activeOpacity={0.7}
                  style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}
                >
                  {/* Active/drag-target pill — sized to fit content */}
                  {(isFocused || isDragTarget) && (
                    <View style={[
                      styles.activePill,
                      isFocused
                        ? { backgroundColor: c.accent + '20', borderColor: c.accent + '40' }
                        : { backgroundColor: c.muted + '15', borderColor: c.muted + '30' },
                      // Make pill wider when showing label
                      isFocused && { paddingHorizontal: 14, minWidth: tabDef.label.length * 8 + 44 },
                    ]} />
                  )}

                  <Ionicons
                    name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                    size={22}
                    color={isFocused ? c.accent : isDragging ? c.accent : c.muted + 'AA'}
                  />

                  {isFocused && (
                    <Text style={[styles.label, { color: c.accent }]}>
                      {tabDef.label}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Drag hint text */}
      {draggingIndex !== null && (
        <View style={styles.dragHint}>
          <Text style={{ color: c.muted, fontSize: 11 }}>Drag to reorder</Text>
        </View>
      )}
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
    gap: 3,
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
  dragHint: {
    alignItems: 'center',
    marginTop: 6,
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