export const COLORS = {
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

  // Overlays
  overlay: 'rgba(4, 8, 16, 0.85)',
};

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
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.text,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
};

export default { COLORS, SPACING, RADIUS, FONTS, TYPOGRAPHY, SHADOWS };
