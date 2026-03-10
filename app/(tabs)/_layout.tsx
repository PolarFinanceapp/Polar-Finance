import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
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

  // Animated scale for the dragging item
  const dragScale = useRef(new Animated.Value(1)).current;

  // Refs for layout measurements
  const tabBarX = useRef(0);
  const tabBarWidth = useRef(0);

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

  const indexFromX = (pageX: number) => {
    const tabW = tabBarWidth.current / tabs.length;
    return Math.max(0, Math.min(tabs.length - 1, Math.floor((pageX - tabBarX.current) / tabW)));
  };

  const startDrag = (index: number) => {
    setDraggingIndex(index);
    setDragOverIndex(index);
    Animated.spring(dragScale, { toValue: 1.35, useNativeDriver: true, speed: 30 }).start();
  };

  const moveDrag = (pageX: number) => {
    const over = indexFromX(pageX);
    setDragOverIndex(over);
  };

  const endDrag = () => {
    Animated.spring(dragScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    setDraggingIndex(prev => {
      if (prev !== null && dragOverIndex !== null && prev !== dragOverIndex) {
        setTabs(current => {
          const next = [...current];
          const [moved] = next.splice(prev, 1);
          next.splice(dragOverIndex!, 0, moved);
          saveOrder(next);
          return next;
        });
      }
      setDragOverIndex(null);
      return null;
    });
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={styles.pill}
        onLayout={e => {
          tabBarWidth.current = e.nativeEvent.layout.width;
        }}
        ref={(ref: any) => {
          if (ref) ref.measure((_fx: number, _fy: number, _w: number, _h: number, px: number) => {
            tabBarX.current = px;
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

        {/* Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tabDef, index) => {
            const route = state.routes.find((r: any) => r.name === tabDef.name);
            if (!route) return null;

            const isFocused = state.routes[state.index]?.name === tabDef.name;
            const isDragging = draggingIndex === index;
            const isDragOver = dragOverIndex === index && draggingIndex !== null && draggingIndex !== index;

            return (
              <Animated.View
                key={tabDef.name}
                style={[
                  styles.tabItem,
                  isDragging && { transform: [{ scale: dragScale }], zIndex: 10 },
                  isDragOver && { opacity: 0.6 },
                ]}
                // Responder handles drag movement & release
                onMoveShouldSetResponder={() => draggingIndex !== null}
                onResponderMove={e => moveDrag(e.nativeEvent.pageX)}
                onResponderRelease={endDrag}
                onResponderTerminate={endDrag}
              >
                <TouchableOpacity
                  // Tap — only fires if not dragging
                  onPress={() => {
                    if (draggingIndex !== null) return;
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(tabDef.name);
                  }}
                  // 500ms hold starts drag
                  onLongPress={() => startDrag(index)}
                  delayLongPress={500}
                  activeOpacity={0.75}
                  style={styles.touchTarget}
                >
                  {/* Active pill */}
                  {isFocused && !isDragging && (
                    <View style={[
                      styles.activePill,
                      { backgroundColor: c.accent + '20', borderColor: c.accent + '40' },
                      { minWidth: tabDef.label.length * 7 + 46 },
                    ]} />
                  )}

                  {/* Drag-over indicator */}
                  {isDragOver && (
                    <View style={[styles.activePill, { backgroundColor: c.muted + '18', borderColor: c.muted + '30', minWidth: 46 }]} />
                  )}

                  <Ionicons
                    name={(isFocused ? tabDef.active : tabDef.inactive) as any}
                    size={isDragging ? 26 : 22}
                    color={isDragging ? c.accent : isFocused ? c.accent : c.muted + 'AA'}
                  />

                  {isFocused && !isDragging && (
                    <Text style={[styles.label, { color: c.accent }]}>{tabDef.label}</Text>
                  )}

                  {isDragging && (
                    <Text style={[styles.label, { color: c.accent }]}>{tabDef.label}</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
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