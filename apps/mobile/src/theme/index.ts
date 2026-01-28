/**
 * Cheap eSIMs Mobile Theme
 * Bright, cheerful, brutalist design system
 */

import { colors, spacing, typography, radius } from './tokens';

export const theme = {
  colors: {
    // Primary - Lime Green
    primary: colors.primary.main,
    primaryDark: colors.primary.dark,
    primaryLight: colors.primary.light,
    primaryMuted: colors.primary.muted,
    primaryBorder: colors.primary.border,
    
    // Backgrounds - Light and clean
    background: colors.background.main,
    backgroundLight: colors.background.light,
    card: colors.card.default,
    cardHover: colors.card.elevated,
    
    // Text - High contrast
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    textInverse: colors.text.inverse,
    textOnPrimary: colors.text.onPrimary,
    
    // Borders - Bold black
    border: colors.border.default,
    borderLight: colors.border.light,
    borderMuted: colors.border.muted,
    borderPrimary: colors.border.primary,
    borderAccent: colors.border.accent,
    
    // Status
    success: colors.status.success.main,
    successSoft: colors.status.success.soft,
    successBackground: colors.status.success.background,
    successBorder: colors.status.success.border,
    
    warning: colors.status.warning.main,
    warningSoft: colors.status.warning.soft,
    warningBackground: colors.status.warning.background,
    warningBorder: colors.status.warning.border,
    
    error: colors.status.error.main,
    errorSoft: colors.status.error.soft,
    errorBackground: colors.status.error.background,
    errorBorder: colors.status.error.border,
    
    // Neutral
    white: colors.neutral.white,
    black: colors.neutral.black,
    grey50: colors.neutral.grey50,
    grey100: colors.neutral.grey100,
    grey300: colors.neutral.grey300,
    grey500: colors.neutral.grey500,
    grey700: colors.neutral.grey700,
    overlay: colors.neutral.overlay,
    overlayLight: colors.neutral.overlayLight,
    
    // Legacy badge colors (remapped to new theme)
    blue: colors.primary.main,       // Now lime green
    blueBackground: colors.primary.muted,
    blueBorder: colors.primary.border,
    
    orange: colors.status.warning.main,  // Yellow
    orangeBackground: colors.status.warning.background,
    orangeBorder: colors.status.warning.border,
    
    gray: colors.text.muted,
    grayBackground: 'rgba(153, 153, 153, 0.10)',
    grayBorder: '#CCCCCC',
  },
  
  spacing,
  borderRadius: radius,
  typography: typography.styles,
  
  // Flat design - minimal shadows, rely on borders
  shadows: {
    none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    // Very subtle shadow for depth
    hard: { 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.08, 
      shadowRadius: 2,
      elevation: 1 
    },
    // Card shadow - subtle
    hardMd: { 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 4,
      elevation: 2 
    },
    // Modal shadow
    hardLg: { 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 8,
      elevation: 4 
    },
    // Soft shadow for buttons
    soft: { 
      shadowColor: '#000000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2, 
      elevation: 1 
    },
    // Legacy aliases (for backward compatibility)
    background: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
    // Primary button glow - lime green accent
    primaryGlow: { 
      shadowColor: '#98DE00', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.3, 
      shadowRadius: 4, 
      elevation: 2 
    },
  },
  
  // Button presets - Bold, flat, geometric
  buttons: {
    lg: {
      height: 54,
      paddingHorizontal: 28,
      fontSize: 17,
      fontWeight: '700' as const,
      borderRadius: radius.md,
      borderWidth: 0,              // No border for primary buttons (flat design)
      fontFamily: 'Inter_700Bold',
    },
    md: {
      height: 46,
      paddingHorizontal: 24,
      fontSize: 16,
      fontWeight: '600' as const,
      borderRadius: radius.md,
      borderWidth: 0,
      fontFamily: 'Inter_600SemiBold',
    },
    sm: {
      height: 38,
      paddingHorizontal: 18,
      fontSize: 14,
      fontWeight: '600' as const,
      borderRadius: radius.sm,
      borderWidth: 0,
      fontFamily: 'Inter_600SemiBold',
    },
  },
  
  // Input presets - Clean, structured
  inputs: {
    md: {
      height: 52,
      paddingHorizontal: spacing.base,
      fontSize: 16,
      borderRadius: radius.md,
      borderWidth: 1.5,            // Medium border
      fontFamily: 'Inter_400Regular',
    },
    lg: {
      height: 56,
      paddingHorizontal: 20,
      fontSize: 17,
      borderRadius: radius.lg,
      borderWidth: 1.5,            // Medium border
      fontFamily: 'Inter_400Regular',
    },
  },
  
  // List item presets (more compact)
  listItem: {
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
  },
  
  // Card presets - Flat, clean, structured
  cards: {
    default: {
      borderRadius: radius.lg,
      padding: spacing.base,
      borderWidth: 1,              // Subtle border
    },
    minimal: {
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
    },
    compact: {
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
    },
    highlighted: {
      borderRadius: radius.lg,
      padding: spacing.base,
      borderWidth: 2,              // Thicker border for emphasis
    },
  },
};

// Export design tokens directly
export { colors, spacing, typography, radius };

// Type exports
export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors;

// Default export for compatibility
export default theme;
