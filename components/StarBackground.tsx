import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');

// ── Tuneable constants ────────────────────────────────────────────────────────
const STATIC_COUNT = 40;  // always-visible flickering stars
const SHOOTING_COUNT = 4;   // simultaneous shooting stars

// Seeded random so positions are stable between renders
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Single flickering star ────────────────────────────────────────────────────
function FlickerStar({ x, y, size, delay, color }: {
  x: number; y: number; size: number; delay: number; color: string;
}) {
  const opacity = useRef(new Animated.Value(seededRandom(delay) * 0.6 + 0.1)).current;

  useEffect(() => {
    const flicker = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.random() * 0.8 + 0.1,
          duration: 600 + Math.random() * 1400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: Math.random() * 0.3,
          duration: 400 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]).start(flicker);
    };
    const t = setTimeout(flicker, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

// ── Single shooting star ──────────────────────────────────────────────────────
function ShootingStar({ delay, color }: { delay: number; color: string }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const startX = useRef(0);
  const startY = useRef(0);

  const animate = () => {
    // pick a random starting point near the top of the screen
    startX.current = Math.random() * W;
    startY.current = Math.random() * H * 0.4;
    translateX.setValue(0);
    translateY.setValue(0);
    opacity.setValue(0);

    const dist = 120 + Math.random() * 160;
    const angle = (35 + Math.random() * 20) * (Math.PI / 180); // 35-55 degrees downward

    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: dist * Math.cos(angle),
          duration: 550 + Math.random() * 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: dist * Math.sin(angle),
          duration: 550 + Math.random() * 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 550 + Math.random() * 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // wait a random pause before firing again
      setTimeout(animate, 1500 + Math.random() * 5000);
    });
  };

  useEffect(() => {
    const t = setTimeout(animate, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX.current,
        top: startY.current,
        width: 80,
        height: 1.5,
        borderRadius: 1,
        backgroundColor: color,
        opacity,
        transform: [
          { translateX },
          { translateY },
          { rotate: '40deg' },
        ],
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StarBackground() {
  const { theme: c } = useTheme();

  // Use the theme accent as the star colour — looks native to every theme
  const starColor = c.accent;

  const staticStars = Array.from({ length: STATIC_COUNT }, (_, i) => ({
    x: seededRandom(i * 3) * W,
    y: seededRandom(i * 3 + 1) * H,
    size: seededRandom(i * 3 + 2) * 2.5 + 0.8,
    delay: i * 120,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {staticStars.map((s, i) => (
        <FlickerStar
          key={i}
          x={s.x}
          y={s.y}
          size={s.size}
          delay={s.delay}
          color={starColor}
        />
      ))}
      {Array.from({ length: SHOOTING_COUNT }, (_, i) => (
        <ShootingStar
          key={`shoot-${i}`}
          delay={i * 2200}
          color={starColor}
        />
      ))}
    </View>
  );
}