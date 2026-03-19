import React, { createContext, useContext, useState } from 'react';

export type ThemeColors = {
  dark: string;
  card: string;
  card2: string;
  accent: string;
  accent2: string;
  text: string;
  muted: string;
  border: string;
  name: string;
  emoji: string;
  description: string;
};

export const themes: Record<string, ThemeColors> = {
  default: {
    name: 'Nebula', emoji: '🌌', description: 'Deep space purple — the default',
    dark: '#06060C', card: '#0E0E1A', card2: '#141420',
    accent: '#6C63FF', accent2: '#00D4AA', text: '#FFFFFF', muted: '#60607A',
    border: 'rgba(255,255,255,0.08)',
  },
  cyber: {
    name: 'Cyberpunk', emoji: '⚡', description: 'Neon yellow on black',
    dark: '#0A0A0A', card: '#111111', card2: '#1A1A1A',
    accent: '#FFE600', accent2: '#FF2D78', text: '#F0F0F0', muted: '#888888',
    border: 'rgba(255,230,0,0.2)',
  },
  aurora: {
    name: 'Aurora', emoji: '🌿', description: 'Northern lights green',
    dark: '#070F0D', card: '#0D1F1A', card2: '#122820',
    accent: '#00FFB2', accent2: '#00C4FF', text: '#E0FFF5', muted: '#5A9E88',
    border: 'rgba(0,255,178,0.2)',
  },
  mars: {
    name: 'Mars', emoji: '🔴', description: 'Red planet vibes',
    dark: '#0F0500', card: '#1A0A00', card2: '#221000',
    accent: '#FF4500', accent2: '#FF8C00', text: '#FFE8D6', muted: '#9E6040',
    border: 'rgba(255,69,0,0.2)',
  },
  hologram: {
    name: 'Hologram', emoji: '💠', description: 'Ice blue holographic',
    dark: '#050A14', card: '#0A1428', card2: '#0F1E3C',
    accent: '#00C8FF', accent2: '#7B2FFF', text: '#D0EEFF', muted: '#4A7A9E',
    border: 'rgba(0,200,255,0.2)',
  },
  matrix: {
    name: 'Matrix', emoji: '💚', description: 'Classic green on black',
    dark: '#000500', card: '#001000', card2: '#001A00',
    accent: '#00FF41', accent2: '#008F11', text: '#CCFFCC', muted: '#3A7A3A',
    border: 'rgba(0,255,65,0.2)',
  },
  solar: {
    name: 'Solar Flare', emoji: '☀️', description: 'Warm orange energy',
    dark: '#0F0800', card: '#1A1000', card2: '#221800',
    accent: '#FF9500', accent2: '#FFD700', text: '#FFF5D6', muted: '#9E7840',
    border: 'rgba(255,149,0,0.2)',
  },
};

type ThemeContextType = {
  themeKey: string;
  theme: ThemeColors;
  setThemeKey: (key: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeKey: 'default',
  theme: themes.default,
  setThemeKey: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeKey, setThemeKey] = useState('default');
  const theme = themes[themeKey] ?? themes.default;
  return (
    <ThemeContext.Provider value={{ themeKey, theme, setThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);