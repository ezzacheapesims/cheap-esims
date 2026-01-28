/**
 * Cheap eSIMs Mobile Design Tokens
 * Bright, cheerful, brutalist theme - budget-friendly and accessible
 * System fonts only, mobile-first readability
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Primary - Lime Green (matching web)
  primary: {
    main: '#98DE00',        // Lime green - Cheap eSIMs brand
    dark: '#7AB300',        // Darker variant for pressed states
    light: '#B5F533',       // Lighter variant for highlights
    muted: 'rgba(152, 222, 0, 0.15)',  // Subtle tints
    border: 'rgba(152, 222, 0, 0.40)', // Border variants
  },

  // Backgrounds - Light and clean
  background: {
    main: '#FFFFFF',        // Pure white background
    light: '#F5F5F5',       // Light grey for secondary surfaces
    elevated: '#FFFFFF',    // Cards stay white
    hover: '#EBEBEB',       // Hover states - slightly darker grey
  },

  // Card backgrounds - Clean white cards
  card: {
    default: '#FFFFFF',     // White cards
    elevated: '#F5F5F5',    // Slight grey for elevation
    overlay: 'rgba(255, 255, 255, 0.95)', // Modal overlays
  },

  // Text hierarchy - High contrast black text
  text: {
    primary: '#000000',     // Pure black for maximum readability
    secondary: '#666666',   // Medium grey for secondary text
    muted: '#999999',       // Light grey for disabled/muted text
    inverse: '#FFFFFF',     // White text on dark backgrounds
    onPrimary: '#000000',   // Black text on lime green
  },

  // Borders - Bold, high-contrast borders
  border: {
    default: '#1a1a1a',     // Near-black borders (softer than pure black)
    light: '#D4D4D4',       // Light grey borders
    muted: '#E8E8E8',       // Very subtle borders
    primary: '#98DE00',     // Primary color borders
    accent: '#000000',      // Pure black for emphasis
  },

  // Status colors (bright and clear)
  status: {
    success: {
      main: '#22C55E',
      soft: '#4ADE80',
      background: 'rgba(34, 197, 94, 0.10)',
      border: '#22C55E',
    },
    warning: {
      main: '#FFCC00',      // Yellow accent color
      soft: '#FFD633',
      background: 'rgba(255, 204, 0, 0.10)',
      border: '#FFCC00',
    },
    error: {
      main: '#EF4444',
      soft: '#F87171',
      background: 'rgba(239, 68, 68, 0.10)',
      border: '#EF4444',
    },
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    grey50: '#F5F5F5',
    grey100: '#EBEBEB',
    grey300: '#CCCCCC',
    grey500: '#999999',
    grey700: '#666666',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  xxs: 2,   // 2px - Minimal gaps
  xs: 4,    // 4px - Tight spacing (badges, icons)
  sm: 8,    // 8px - Small gaps
  md: 12,   // 12px - Compact spacing
  base: 16, // 16px - Standard spacing
  lg: 20,   // 20px - Large spacing (compact for efficiency)
  xl: 28,   // 28px - Extra large spacing (more compact)
  xxl: 36,  // 36px - Section spacing (more compact)
  xxxl: 44, // 44px - Page-level spacing (more compact)
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  // Font sizes
  size: {
    title: 28,      // Page titles
    heading: 22,    // Section headings
    body: 16,       // Body text
    caption: 14,    // Captions, secondary text
    small: 12,      // Meta info, labels
    tiny: 11,       // Badges, tags
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (minimum 1.4 for readability)
  lineHeight: {
    tight: 1.2,     // Headings only
    normal: 1.5,    // Body text
    relaxed: 1.6,   // Long-form content
  },

  // Typography presets
  styles: {
    title: {
      fontSize: 28,
      fontWeight: '700' as const, // Bolder for better readability
      lineHeight: 34,
      letterSpacing: -0.3,
      color: colors.text.primary,
      fontFamily: 'Inter_700Bold',
    },
    h1: { // Adding h1 alias for title
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.3,
      color: colors.text.primary,
      fontFamily: 'Inter_700Bold',
    },
    heading: {
      fontSize: 22,
      fontWeight: '700' as const, // Bolder
      lineHeight: 28,
      letterSpacing: -0.2,
      color: colors.text.primary,
      fontFamily: 'Inter_700Bold',
    },
    h2: { // Adding h2 alias for heading
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
      color: colors.text.primary,
      fontFamily: 'Inter_700Bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: -0.1,
      color: colors.text.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
      color: colors.text.primary,
      fontFamily: 'Inter_400Regular',
    },
    bodyMedium: { // Kept for compatibility but refined
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: 0,
      color: colors.text.primary,
      fontFamily: 'Inter_500Medium',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: colors.text.secondary,
      fontFamily: 'Inter_400Regular',
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      color: colors.text.secondary,
      fontFamily: 'Inter_400Regular',
    },
    tiny: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
      color: colors.text.muted,
      fontFamily: 'Inter_500Medium',
    },
  },
} as const;

// ============================================================================
// RADIUS TOKENS - Flatter, more geometric
// ============================================================================

export const radius = {
  none: 0,
  xs: 2,      // Very minimal - badges
  sm: 4,      // Small elements - more angular
  md: 8,      // Buttons, inputs - less round
  lg: 8,      // Cards - flat and geometric
  xl: 12,     // Large containers - still structured
  round: 9999,
  full: 9999, // Alias for round (for avatars/pills only)
} as const;
