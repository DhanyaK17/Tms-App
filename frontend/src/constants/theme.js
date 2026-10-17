export const DARK_COLORS = {
  // Backgrounds
  background: '#080c14',
  surface: '#0d1524',
  surfaceLight: '#141e33',
  surfaceCard: '#111b2e',
  surfaceHover: '#1a2742',

  // Borders
  border: 'rgba(0, 229, 255, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderActive: '#00e5ff',

  // Core Accents
  primary: '#00e5ff',
  primaryDark: '#00b4cc',
  primaryGlow: 'rgba(0, 229, 255, 0.25)',
  secondary: '#7928ca',
  secondaryGlow: 'rgba(121, 40, 202, 0.25)',

  // Status Colors
  cyan: '#00e5ff',
  amber: '#f59e0b',
  violet: '#a855f7',
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',

  // Status mapping
  statusPending: '#f59e0b',
  statusAssigned: '#a855f7',
  statusProgress: '#00e5ff',
  statusOnhold: '#f97316',
  statusCompleted: '#10b981',

  // Text
  text: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDark: '#0a0f18',

  // Overlays & Inputs
  inputBg: 'rgba(255, 255, 255, 0.03)',
  overlay: 'rgba(4, 8, 16, 0.85)',
  cardShadow: 'rgba(0, 0, 0, 0.35)',
  headerBg: '#080c14',
  floatingBarBg: 'rgba(13, 21, 36, 0.95)',
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const LIGHT_COLORS = {
  // Backgrounds
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceLight: '#f8fafc',
  surfaceCard: '#ffffff',
  surfaceHover: '#e2e8f0',

  // Borders
  border: 'rgba(0, 131, 158, 0.2)',
  borderLight: '#e2e8f0',
  borderActive: '#00839e',

  // Core Accents
  primary: '#00839e',
  primaryDark: '#00667a',
  primaryGlow: 'rgba(0, 131, 158, 0.2)',
  secondary: '#7928ca',
  secondaryGlow: 'rgba(121, 40, 202, 0.2)',

  // Status Colors
  cyan: '#00839e',
  amber: '#d97706',
  violet: '#7e22ce',
  green: '#059669',
  red: '#dc2626',
  blue: '#2563eb',

  // Status mapping
  statusPending: '#d97706',
  statusAssigned: '#7e22ce',
  statusProgress: '#0284c7',
  statusOnhold: '#ea580c',
  statusCompleted: '#059669',

  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textDark: '#ffffff',

  // Overlays & Inputs
  inputBg: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.65)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  headerBg: '#ffffff',
  floatingBarBg: 'rgba(255, 255, 255, 0.98)',
  divider: '#e2e8f0',
};

export const getColors = (theme = 'dark') => {
  return theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
};

// Default export COLORS for backward compatibility
export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'monospace',
};

export const TYPOGRAPHY = {
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
};

export default { COLORS, DARK_COLORS, LIGHT_COLORS, getColors, SPACING, RADIUS, FONTS, TYPOGRAPHY, SHADOWS };
