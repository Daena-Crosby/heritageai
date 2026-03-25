export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  sidebar: string;
  orange: string;
  orangeBtn: string;
  orangeGlow: string;
  text: string;
  textSub: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  error: string;
  activeNav: string;
}

export const darkColors: ThemeColors = {
  bg: '#0B0F1A',
  surface: '#141B2D',
  surfaceAlt: '#1A2235',
  sidebar: '#0F1522',
  orange: '#F5A623',
  orangeBtn: '#C8801A',
  orangeGlow: 'rgba(245,166,35,0.12)',
  text: '#FFFFFF',
  textSub: '#7B8BA5',
  textMuted: '#3D4E6A',
  border: '#1E2942',
  borderLight: '#263354',
  success: '#48BB78',
  error: '#FC8181',
  activeNav: '#1C2A44',
};

export const lightColors: ThemeColors = {
  bg: '#F5F0E8',
  surface: '#FFFFFF',
  surfaceAlt: '#F9F4EC',
  sidebar: '#EDE6D9',
  orange: '#E8970E',
  orangeBtn: '#C8801A',
  orangeGlow: 'rgba(232,151,14,0.1)',
  text: '#1A1A2E',
  textSub: '#4A5568',
  textMuted: '#9CA3AF',
  border: '#E2D5C3',
  borderLight: '#EDE8DE',
  success: '#2E8B57',
  error: '#DC143C',
  activeNav: '#F5E6CE',
};

// Kept for backwards-compat during migration — new code should use useTheme()
export const C = darkColors;
