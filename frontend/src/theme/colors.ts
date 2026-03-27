export interface ThemeColors {
  // Background layers
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  sidebar: string;

  // Primary colors (signature orange gradient)
  primary: string;              // Gradient start - soft orange (#ffb59a)
  primaryContainer: string;     // Gradient end - vibrant orange (#ff6b2c)
  onPrimary: string;            // Text on primary
  onPrimaryContainer: string;   // Text on primary container
  orange: string;
  orangeBtn: string;
  orangeGlow: string;

  // Text colors
  text: string;
  textSub: string;
  textMuted: string;
  onSurface: string;
  onSurfaceVariant: string;

  // Border/outline colors
  border: string;
  borderLight: string;
  outline: string;
  outlineVariant: string;

  // Semantic colors
  success: string;
  error: string;
  warning: string;
  activeNav: string;

  // Glassmorphism
  glass: string;
  glassBorder: string;
}

// Heritage Chic Dark Theme - Warm dark browns inspired by "The Curated Sunlight"
export const darkColors: ThemeColors = {
  // Background layers
  bg: '#0A0603',                    // Deep warm brown - gallery floor
  surface: '#1A120C',               // Primary surface - warm dark brown
  surfaceAlt: '#2A1D14',            // Elevated surface - lighter warm brown
  surfaceContainerLowest: '#080402', // Deepest - below bg
  surfaceContainerLow: '#150C07',   // Nested low - deeper than surface
  surfaceContainer: '#1A120C',      // Default container
  surfaceContainerHigh: '#251A12',  // High elevation
  surfaceContainerHighest: '#3A2A1F', // Highest elevation - pulled forward
  sidebar: '#150C07',               // Sidebar - deep warm brown

  // Primary colors (signature orange gradient)
  primary: '#FFB59A',               // Gradient start - soft peach orange
  primaryContainer: '#FF6B2C',      // Gradient end - vibrant orange
  onPrimary: '#1A120C',             // Dark text on primary
  onPrimaryContainer: '#FFFFFF',    // White text on primary container
  orange: '#FF6B2C',                // Primary orange - vibrant red-orange
  orangeBtn: '#E55A1F',             // Orange hover/pressed state
  orangeGlow: 'rgba(255,107,44,0.15)', // Orange glow overlay

  // Text colors
  text: '#F5E6D3',                  // Primary text - warm cream
  textSub: '#C9B499',               // Secondary text - muted tan
  textMuted: '#8B7355',             // Tertiary text - warm gray
  onSurface: '#F5E6D3',             // On surface - same as text
  onSurfaceVariant: '#C9B499',      // On surface variant - same as textSub

  // Border/outline colors
  border: '#3A2A1F',                // Primary border - subtle warm brown
  borderLight: '#2A1D14',           // Light border - very subtle
  outline: '#5C4A38',               // Standard outline
  outlineVariant: '#3A2A1F',        // Subtle outline

  // Semantic colors
  success: '#4CAF50',               // Success green
  error: '#F44336',                 // Error red
  warning: '#FFC107',               // Warning amber
  activeNav: '#2A1D14',             // Active nav background

  // Glassmorphism
  glass: 'rgba(26, 18, 12, 0.85)',  // Semi-transparent dark
  glassBorder: 'rgba(245, 230, 211, 0.1)', // Subtle light border
};

// Heritage Chic Light Theme - Warm creams and whites
export const lightColors: ThemeColors = {
  // Background layers
  bg: '#FFF8F0',                    // Warm off-white - gallery floor
  surface: '#FFFFFF',               // Pure white - primary surface
  surfaceAlt: '#FFF3DC',            // Warm cream - elevated surface
  surfaceContainerLowest: '#FFFFFF', // Purest white
  surfaceContainerLow: '#F9F3EB',   // Nested low - soft cream
  surfaceContainer: '#FFF8F0',      // Default container
  surfaceContainerHigh: '#FFF3E6',  // High elevation
  surfaceContainerHighest: '#E8E1DA', // Highest elevation
  sidebar: '#FFF8F0',               // Sidebar - warm off-white

  // Primary colors (signature orange gradient)
  primary: '#FFB59A',               // Gradient start - soft peach orange
  primaryContainer: '#FF6B2C',      // Gradient end - vibrant orange
  onPrimary: '#FFFFFF',             // White text on primary
  onPrimaryContainer: '#FFFFFF',    // White text on primary container
  orange: '#FF6B2C',                // Primary orange - vibrant red-orange
  orangeBtn: '#E55A1F',             // Orange hover/pressed state
  orangeGlow: 'rgba(255,107,44,0.12)', // Orange glow overlay

  // Text colors
  text: '#2C1810',                  // Primary text - deep brown
  textSub: '#5C4A38',               // Secondary text - medium brown
  textMuted: '#8B7355',             // Tertiary text - warm gray
  onSurface: '#2C1810',             // On surface - same as text
  onSurfaceVariant: '#5C4A38',      // On surface variant - same as textSub

  // Border/outline colors
  border: '#E8D7C3',                // Primary border - soft tan
  borderLight: '#F5EBE0',           // Light border - very subtle
  outline: '#8B7355',               // Standard outline
  outlineVariant: '#E8D7C3',        // Subtle outline

  // Semantic colors
  success: '#2E7D32',               // Success green
  error: '#C62828',                 // Error red
  warning: '#F57C00',               // Warning orange
  activeNav: '#FFF3DC',             // Active nav background - warm cream

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.85)', // Semi-transparent light
  glassBorder: 'rgba(44, 24, 16, 0.1)', // Subtle dark border
};

// Kept for backwards-compat during migration — new code should use useTheme()
export const C = darkColors;

// Design system spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Design system border radius scale
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Gradient definitions for use with LinearGradient
export const gradients = {
  primary: ['#FFB59A', '#FF6B2C'] as const,
  primaryReverse: ['#FF6B2C', '#FFB59A'] as const,
  sunset: ['#FFB59A', '#FF8C5A', '#FF6B2C'] as const,
};
